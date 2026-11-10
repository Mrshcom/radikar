import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { radicoinPackOrders, type Database } from "@radikar/database";
import type { RadicoinService } from "../radicoin/service";
import {
  activePaymentGateway,
  isRetryablePaymentError,
  paymentGatewayFor,
  PaymentGatewayError,
  type PaymentGatewayOptions,
} from "./payment-gateway";
import type { PaymentGateway } from "./payment-gateway-types";

export const radicoinPacks = [
  { id: "radicoin-100", name: "بسته شروع", coins: 100, amountRials: 599_000 },
  { id: "radicoin-500", name: "بسته رشد", coins: 500, amountRials: 2_690_000 },
  { id: "radicoin-1000", name: "بسته حرفه‌ای", coins: 1_000, amountRials: 4_990_000 },
] as const;

export class RadicoinPackError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = PaymentGatewayOptions & {
  apiPublicUrl: string;
  webAppUrl: string;
  radicoinService?: RadicoinService;
};

export class RadicoinPackService {
  private readonly gateway: PaymentGateway;
  private readonly activeGatewayId: string;

  constructor(
    private readonly database: Database,
    private readonly options: Options,
  ) {
    this.gateway = activePaymentGateway(options);
    this.activeGatewayId = this.gateway.id;
  }

  catalog() {
    return radicoinPacks;
  }

  private pack(packId: string) {
    const pack = radicoinPacks.find((item) => item.id === packId);
    if (!pack) throw new RadicoinPackError(404, "بستهٔ رادیکوین پیدا نشد.");
    return pack;
  }

  async createOrder(userId: string, phone: string | null, packId: string, checkoutKey: string) {
    const [existing] = await this.database
      .select()
      .from(radicoinPackOrders)
      .where(and(eq(radicoinPackOrders.userId, userId), eq(radicoinPackOrders.checkoutKey, checkoutKey)))
      .limit(1);
    if (existing) {
      if (existing.packId !== packId) throw new RadicoinPackError(409, "شناسهٔ خرید برای بستهٔ دیگری استفاده شده است.");
      if (existing.status === "paid") return { checkout: "activated" as const, orderId: existing.id };
      if (existing.status === "pending" && existing.authority)
        return {
          checkout: "gateway" as const,
          orderId: existing.id,
          paymentUrl: paymentGatewayFor(existing.provider, this.options).paymentUrl(
            existing.authority,
            existing.redirectUrl,
          ),
        };
      throw new RadicoinPackError(409, "این درخواست خرید قبلاً ثبت شده است.");
    }

    const pack = this.pack(packId);
    const now = new Date();
    const [order] = await this.database
      .insert(radicoinPackOrders)
      .values({
        id: randomUUID(),
        userId,
        checkoutKey,
        packId: pack.id,
        amountRials: pack.amountRials,
        coins: pack.coins,
        provider: this.activeGatewayId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning();
    if (!order) throw new RadicoinPackError(409, "این خرید در حال پردازش است.");

    try {
      const payment = await this.gateway.requestPayment({
        amountRials: order.amountRials,
        callbackUrl: `${this.options.apiPublicUrl}/api/billing/radicoin-packs/callback`,
        description: `خرید ${pack.coins.toLocaleString("fa-IR")} رادیکوین`,
        mobile: phone ?? undefined,
        clientReference: order.id,
      });
      await this.database
        .update(radicoinPackOrders)
        .set({ authority: payment.authority, redirectUrl: payment.paymentUrl, updatedAt: new Date() })
        .where(eq(radicoinPackOrders.id, order.id));
      return { checkout: "gateway" as const, orderId: order.id, paymentUrl: payment.paymentUrl };
    } catch (error) {
      await this.database
        .update(radicoinPackOrders)
        .set({
          status: "failed",
          failureMessage: error instanceof Error ? error.message : "درگاه پاسخ نداد.",
          updatedAt: new Date(),
        })
        .where(eq(radicoinPackOrders.id, order.id));
      throw new RadicoinPackError(502, error instanceof Error ? error.message : "درگاه پاسخ نداد.");
    }
  }

  async listOrders(userId: string) {
    return this.database
      .select()
      .from(radicoinPackOrders)
      .where(eq(radicoinPackOrders.userId, userId))
      .orderBy(desc(radicoinPackOrders.createdAt))
      .limit(20);
  }

  async handleCallback(authority: string) {
    const [order] = await this.database
      .select()
      .from(radicoinPackOrders)
      .where(eq(radicoinPackOrders.authority, authority))
      .limit(1);
    if (!order) throw new RadicoinPackError(404, "سفارش رادیکوین پیدا نشد.");
    const resultUrl = new URL("/billing/result", this.options.webAppUrl);
    resultUrl.searchParams.set("radicoinOrder", order.id);
    if (order.status === "paid") {
      resultUrl.searchParams.set("status", "success");
      return resultUrl.toString();
    }
    if (order.status === "failed" || order.status === "canceled") {
      resultUrl.searchParams.set("status", order.status);
      return resultUrl.toString();
    }

    try {
      const verification = await paymentGatewayFor(order.provider, this.options).verifyPayment({
        authority,
        amountRials: order.amountRials,
        clientReference: order.id,
      });
      await this.database.transaction(async (tx) => {
        await tx.execute(sql`select id from radicoin_pack_orders where id = ${order.id} for update`);
        const [current] = await tx
          .select()
          .from(radicoinPackOrders)
          .where(eq(radicoinPackOrders.id, order.id))
          .limit(1);
        if (!current || current.status !== "pending") return;
        if (!this.options.radicoinService) throw new RadicoinPackError(503, "کیف پول رادیکوین در دسترس نیست.");
        const now = new Date();
        await this.options.radicoinService.grantPurchasedPackInTransaction(
          tx,
          current.userId,
          current.id,
          current.coins,
          current.packId,
          now,
        );
        await tx
          .update(radicoinPackOrders)
          .set({ status: "paid", refId: verification.refId, paidAt: now, updatedAt: now })
          .where(eq(radicoinPackOrders.id, current.id));
      });
      resultUrl.searchParams.set("status", "success");
    } catch (error) {
      const retryable = isRetryablePaymentError(error);
      const canceled = error instanceof PaymentGatewayError && error.canceled;
      if (!retryable) {
        await this.database
          .update(radicoinPackOrders)
          .set({
            status: canceled ? "canceled" : "failed",
            failureMessage: error instanceof Error ? error.message : "پرداخت تأیید نشد.",
            updatedAt: new Date(),
          })
          .where(and(eq(radicoinPackOrders.id, order.id), eq(radicoinPackOrders.status, "pending")));
      }
      resultUrl.searchParams.set("status", retryable ? "pending" : canceled ? "canceled" : "failed");
    }
    return resultUrl.toString();
  }
}
