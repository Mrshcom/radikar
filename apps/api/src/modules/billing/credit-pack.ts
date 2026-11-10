import { randomUUID } from "node:crypto";
import { and, asc, eq, isNotNull, lt, sql } from "drizzle-orm";
import { creditPackOrders, membershipEvents, userMemberships, type Database } from "@radikar/database";
import { RadicoinError, type RadicoinService } from "../radicoin/service";
import {
  activePaymentGateway,
  isRetryablePaymentError,
  paymentGatewayFor,
  PaymentGatewayError,
  type PaymentGatewayOptions,
} from "./payment-gateway";
import type { PaymentGateway } from "./payment-gateway-types";

export const interviewPack = {
  id: "interview-3",
  name: "بسته ۳ جلسه مصاحبه آزمایشی",
  amountRials: 390_000,
  radicoinCost: 100,
  interviewCredits: 3,
  aiCredits: 15,
} as const;

export class CreditPackError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

type CreditPackOptions = PaymentGatewayOptions & {
  apiPublicUrl: string;
  webAppUrl: string;
  radicoinService?: RadicoinService;
};

type DbExecutor = Pick<Database, "select" | "insert" | "update" | "execute">;

export class CreditPackService {
  private readonly gateway: PaymentGateway;
  private readonly activeGatewayId: string;

  constructor(
    private readonly database: Database,
    private readonly options: CreditPackOptions,
  ) {
    this.gateway = activePaymentGateway(options);
    this.activeGatewayId = this.gateway.id;
  }

  private gatewayFor(provider: string) {
    return provider === this.activeGatewayId ? this.gateway : paymentGatewayFor(provider, this.options);
  }

  catalog() {
    return [interviewPack];
  }

  private async eligibleMembership(userId: string, executor: DbExecutor = this.database) {
    const [membership] = await executor
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (!membership || membership.status !== "active" || membership.expiresAt <= new Date())
      throw new CreditPackError(409, "برای خرید بسته، ابتدا پلن حرفه‌ای فعال داشته باش.");
    if (membership.planId !== "professional")
      throw new CreditPackError(409, "این بستهٔ آزمایشی فعلاً برای کاربران پلن حرفه‌ای است.");
    if (membership.interviewCreditsRemaining > 0)
      throw new CreditPackError(409, "هنوز اعتبار مصاحبه داری؛ بعد از اتمام آن می‌توانی بسته بخری.");
    return membership;
  }

  private async grant(executor: DbExecutor, userId: string, order: typeof creditPackOrders.$inferSelect) {
    const now = new Date();
    await executor.execute(sql`select id from user_memberships where user_id = ${userId} for update`);
    const [membership] = await executor
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, userId))
      .limit(1);
    if (!membership) throw new CreditPackError(409, "عضویت کاربر برای افزودن اعتبار پیدا نشد.");
    await executor
      .update(userMemberships)
      .set({
        aiCreditsRemaining: sql`${userMemberships.aiCreditsRemaining} + ${order.aiCredits}`,
        interviewCreditsRemaining: sql`${userMemberships.interviewCreditsRemaining} + ${order.interviewCredits}`,
        updatedAt: now,
      })
      .where(eq(userMemberships.id, membership.id));
    await executor.insert(membershipEvents).values({
      id: randomUUID(),
      userId,
      membershipId: membership.id,
      planId: membership.planId,
      type: "credit_pack",
      details: {
        creditPackOrderId: order.id,
        packId: order.packId,
        interviewCredits: order.interviewCredits,
        aiCredits: order.aiCredits,
        paymentMethod: order.paymentMethod,
      },
      createdAt: now,
    });
  }

  async createOrder(userId: string, phone: string | null, paymentMethod: "gateway" | "radicoin", checkoutKey: string) {
    const [existing] = await this.database
      .select()
      .from(creditPackOrders)
      .where(and(eq(creditPackOrders.userId, userId), eq(creditPackOrders.checkoutKey, checkoutKey)))
      .limit(1);
    if (existing) {
      if (existing.paymentMethod !== paymentMethod)
        throw new CreditPackError(409, "این شناسهٔ خرید قبلاً با روش پرداخت دیگری استفاده شده است.");
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
      throw new CreditPackError(409, "این درخواست خرید قبلاً ثبت شده است.");
    }

    await this.eligibleMembership(userId);
    const now = new Date();
    const order = {
      id: randomUUID(),
      userId,
      checkoutKey,
      packId: interviewPack.id,
      amountRials: interviewPack.amountRials,
      radicoinCost: interviewPack.radicoinCost,
      aiCredits: interviewPack.aiCredits,
      interviewCredits: interviewPack.interviewCredits,
      paymentMethod,
      provider: this.activeGatewayId,
      createdAt: now,
      updatedAt: now,
    } as const;

    if (paymentMethod === "radicoin") {
      if (!this.options.radicoinService) throw new CreditPackError(503, "پرداخت رادیکوینی در دسترس نیست.");
      try {
        return await this.database.transaction(async (tx) => {
          await tx.execute(sql`select id from user_memberships where user_id = ${userId} for update`);
          await this.eligibleMembership(userId, tx);
          const [inserted] = await tx.insert(creditPackOrders).values(order).onConflictDoNothing().returning();
          if (!inserted) throw new CreditPackError(409, "این خرید در حال پردازش است.");
          await this.options.radicoinService!.spendInTransaction(
            tx,
            userId,
            inserted.radicoinCost,
            `credit-pack:${inserted.id}`,
            `خرید ${interviewPack.name}`,
            now,
          );
          await this.grant(tx, userId, inserted);
          await tx
            .update(creditPackOrders)
            .set({ status: "paid", paidAt: now, updatedAt: now })
            .where(eq(creditPackOrders.id, inserted.id));
          return { checkout: "activated" as const, orderId: inserted.id };
        });
      } catch (error) {
        if (error instanceof RadicoinError && error.statusCode === 402)
          throw new CreditPackError(409, "موجودی رادیکوین کافی نیست؛ می‌توانی همین بسته را از درگاه بانکی بخری.");
        throw error;
      }
    }

    const [inserted] = await this.database.insert(creditPackOrders).values(order).onConflictDoNothing().returning();
    if (!inserted) throw new CreditPackError(409, "این خرید در حال پردازش است.");
    try {
      const payment = await this.gateway.requestPayment({
        amountRials: inserted.amountRials,
        callbackUrl: `${this.options.apiPublicUrl}/api/billing/credit-packs/callback`,
        description: `خرید ${interviewPack.name}`,
        mobile: phone ?? undefined,
        clientReference: inserted.id,
      });
      await this.database
        .update(creditPackOrders)
        .set({ authority: payment.authority, redirectUrl: payment.paymentUrl, updatedAt: new Date() })
        .where(eq(creditPackOrders.id, inserted.id));
      return { checkout: "gateway" as const, orderId: inserted.id, paymentUrl: payment.paymentUrl };
    } catch (error) {
      await this.database
        .update(creditPackOrders)
        .set({
          status: "failed",
          failureMessage: error instanceof Error ? error.message : "درگاه پاسخ نداد.",
          updatedAt: new Date(),
        })
        .where(eq(creditPackOrders.id, inserted.id));
      throw new CreditPackError(502, error instanceof Error ? error.message : "درگاه پاسخ نداد.");
    }
  }

  async getOrder(userId: string, orderId: string) {
    const [order] = await this.database
      .select()
      .from(creditPackOrders)
      .where(and(eq(creditPackOrders.id, orderId), eq(creditPackOrders.userId, userId)))
      .limit(1);
    if (!order) throw new CreditPackError(404, "سفارش بسته پیدا نشد.");
    return order;
  }

  async handleCallback(authority: string) {
    const [order] = await this.database
      .select()
      .from(creditPackOrders)
      .where(eq(creditPackOrders.authority, authority))
      .limit(1);
    if (!order) throw new CreditPackError(404, "سفارش بسته پیدا نشد.");
    const resultUrl = new URL("/billing/result", this.options.webAppUrl);
    resultUrl.searchParams.set("packOrder", order.id);
    if (order.status === "paid") {
      resultUrl.searchParams.set("status", "success");
      return resultUrl.toString();
    }
    if (order.status === "failed" || order.status === "canceled") {
      resultUrl.searchParams.set("status", order.status);
      return resultUrl.toString();
    }
    try {
      const verification = await this.gatewayFor(order.provider).verifyPayment({
        authority,
        amountRials: order.amountRials,
        clientReference: order.id,
      });
      const finalStatus = await this.database.transaction(async (tx) => {
        await tx.execute(sql`select id from credit_pack_orders where id = ${order.id} for update`);
        const [current] = await tx.select().from(creditPackOrders).where(eq(creditPackOrders.id, order.id)).limit(1);
        if (!current) throw new CreditPackError(404, "سفارش بسته پیدا نشد.");
        if (current.status !== "pending") return current.status;
        await this.grant(tx, current.userId, current);
        const now = new Date();
        await tx
          .update(creditPackOrders)
          .set({ status: "paid", refId: verification.refId, paidAt: now, updatedAt: now })
          .where(eq(creditPackOrders.id, current.id));
        return "paid";
      });
      resultUrl.searchParams.set("status", finalStatus === "paid" ? "success" : finalStatus);
    } catch (error) {
      const retryable = isRetryablePaymentError(error);
      const canceled = error instanceof PaymentGatewayError && error.canceled;
      if (!retryable) {
        await this.database
          .update(creditPackOrders)
          .set({
            status: canceled ? "canceled" : "failed",
            failureMessage: error instanceof Error ? error.message : "پرداخت تأیید نشد.",
            updatedAt: new Date(),
          })
          .where(and(eq(creditPackOrders.id, order.id), eq(creditPackOrders.status, "pending")));
      }
      resultUrl.searchParams.set("status", retryable ? "pending" : canceled ? "canceled" : "failed");
    }
    return resultUrl.toString();
  }

  async reconcilePendingOrders(now = new Date(), maxAgeMs = 30 * 60_000) {
    const cutoff = new Date(now.getTime() - maxAgeMs);
    const pending = await this.database
      .select({ authority: creditPackOrders.authority })
      .from(creditPackOrders)
      .where(
        and(
          eq(creditPackOrders.status, "pending"),
          isNotNull(creditPackOrders.authority),
          lt(creditPackOrders.createdAt, cutoff),
        ),
      )
      .orderBy(asc(creditPackOrders.createdAt))
      .limit(50);
    for (const order of pending) if (order.authority) await this.handleCallback(order.authority);
    return { scanned: pending.length };
  }
}
