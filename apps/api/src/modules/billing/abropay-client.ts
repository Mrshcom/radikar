import { z } from "zod";
import { PaymentGatewayError, type PaymentGateway, type PaymentRequest } from "./payment-gateway-types";

const transactionSchema = z.object({
  id: z.uuid(),
  status: z.enum([
    "created",
    "ready_to_pay",
    "paying",
    "verifying",
    "verified",
    "verifying_failed",
    "canceled",
    "failed",
  ]),
  amount: z.number().int(),
  clientReference: z.string().nullable().optional(),
  redirectUrl: z.url().nullable().optional(),
  paidAt: z.string().nullable().optional(),
});

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: transactionSchema.nullable().optional(),
});

export class AbropayClient implements PaymentGateway {
  readonly id: "abropay_sandbox" | "abropay_live";
  private readonly baseUrl: string;
  private readonly pathPrefix: string;
  private readonly environment: "sandbox" | "live";

  constructor(
    baseUrl: string,
    private readonly secretKey: string,
    environment: "sandbox" | "live",
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.environment = environment;
    this.pathPrefix = environment === "sandbox" ? "/sendbox" : "";
    this.id = `abropay_${environment}`;
  }

  private isTrustedRedirectUrl(url: URL) {
    if (url.protocol === "https:") return true;

    // Abropay's current sandbox returns this documented test route over HTTP.
    // It is accepted only for test keys and Abropay's own fixed host; live
    // transactions and any other HTTP destination remain rejected.
    return (
      this.environment === "sandbox" &&
      url.protocol === "http:" &&
      url.hostname === "pay.abrotech.ir" &&
      /^\/test\/payments\/[0-9a-f-]+\/redirect$/i.test(url.pathname)
    );
  }

  private async call(path: string, init?: RequestInit) {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${this.pathPrefix}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${this.secretKey}`,
          accept: "application/json",
          "content-type": "application/json",
        },
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new PaymentGatewayError("ارتباط با درگاه پرداخت ناموفق بود.");
    }
    const parsed = responseSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) throw new PaymentGatewayError("درگاه پاسخ معتبر نداد.");
    if (!response.ok || !parsed.data.success || !parsed.data.data) {
      throw new PaymentGatewayError(
        parsed.data.message || "درگاه درخواست پرداخت را نپذیرفت.",
        response.status,
        response.status !== 422,
      );
    }
    return parsed.data.data;
  }

  async requestPayment(input: PaymentRequest) {
    const transaction = await this.call("/payments/request", {
      method: "POST",
      body: JSON.stringify({
        amount: input.amountRials,
        return_url: input.callbackUrl,
        client_reference: input.clientReference,
      }),
    });
    if (transaction.amount !== input.amountRials || transaction.clientReference !== input.clientReference) {
      throw new PaymentGatewayError("مبلغ یا شناسهٔ سفارش در پاسخ درگاه مطابقت ندارد.");
    }
    if (transaction.status !== "ready_to_pay" || !transaction.redirectUrl) {
      throw new PaymentGatewayError("درگاه درخواست پرداخت را نپذیرفت.", 422, false);
    }
    const url = new URL(transaction.redirectUrl);
    if (!this.isTrustedRedirectUrl(url)) throw new PaymentGatewayError("آدرس هدایت درگاه امن نیست.");
    return {
      authority: transaction.id,
      paymentUrl: url.toString(),
      providerData: transaction,
    };
  }

  async verifyPayment(input: { authority: string; amountRials: number; clientReference?: string }) {
    const transaction = await this.call(`/payments/${encodeURIComponent(input.authority)}/verify`);
    if (
      transaction.id !== input.authority ||
      transaction.amount !== input.amountRials ||
      (input.clientReference && transaction.clientReference !== input.clientReference)
    ) {
      throw new PaymentGatewayError("اطلاعات تراکنش درگاه با سفارش مطابقت ندارد.");
    }
    if (["canceled", "failed", "verifying_failed"].includes(transaction.status)) {
      throw new PaymentGatewayError("پرداخت در درگاه تکمیل نشد.", 400, false, transaction.status === "canceled");
    }
    if (transaction.status !== "verified") {
      throw new PaymentGatewayError("نتیجهٔ پرداخت هنوز قطعی نیست.");
    }
    return {
      code: 200,
      refId: transaction.id,
      cardPan: null,
      cardHash: null,
      providerData: transaction,
    };
  }

  paymentUrl(_authority: string, storedUrl?: string | null) {
    if (!storedUrl) throw new PaymentGatewayError("لینک پرداخت این سفارش در دسترس نیست.");
    return storedUrl;
  }
}
