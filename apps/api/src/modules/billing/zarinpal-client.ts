type ZarinpalData = {
  code?: number;
  message?: string;
  authority?: string;
  ref_id?: number;
  card_pan?: string;
  card_hash?: string;
  fee_type?: string;
  fee?: number;
};

type ZarinpalResponse = {
  data?: ZarinpalData;
  errors?: Array<{ code?: number; message?: string }> | Record<string, unknown>;
};

export class ZarinpalError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly response?: ZarinpalResponse,
  ) {
    super(message);
  }
}

export class ZarinpalClient {
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly merchantId: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async post(path: string, body: Record<string, unknown>) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    const payload = (await response.json().catch(() => ({}))) as ZarinpalResponse;
    if (!response.ok) {
      throw new ZarinpalError("ارتباط با درگاه پرداخت ناموفق بود.", response.status, payload);
    }
    return payload;
  }

  async requestPayment(input: {
    amountRials: number;
    callbackUrl: string;
    description: string;
    mobile?: string;
  }) {
    const response = await this.post("/pg/v4/payment/request.json", {
      merchant_id: this.merchantId,
      amount: input.amountRials,
      callback_url: input.callbackUrl,
      description: input.description,
      metadata: input.mobile ? { mobile: input.mobile } : {},
    });
    if (response.data?.code !== 100 || !response.data.authority) {
      const error = Array.isArray(response.errors) ? response.errors[0] : undefined;
      throw new ZarinpalError(
        error?.message ?? response.data?.message ?? "درگاه درخواست پرداخت را نپذیرفت.",
        error?.code ?? response.data?.code,
        response,
      );
    }
    return {
      authority: response.data.authority,
      paymentUrl: `${this.baseUrl}/pg/StartPay/${response.data.authority}`,
      providerData: response.data,
    };
  }

  async verifyPayment(input: { amountRials: number; authority: string }) {
    const response = await this.post("/pg/v4/payment/verify.json", {
      merchant_id: this.merchantId,
      amount: input.amountRials,
      authority: input.authority,
    });
    const code = response.data?.code;
    if (code !== 100 && code !== 101) {
      const error = Array.isArray(response.errors) ? response.errors[0] : undefined;
      throw new ZarinpalError(
        error?.message ?? response.data?.message ?? "تأیید پرداخت ناموفق بود.",
        error?.code ?? code,
        response,
      );
    }
    return {
      code,
      refId: response.data?.ref_id ? String(response.data.ref_id) : null,
      cardPan: response.data?.card_pan ?? null,
      cardHash: response.data?.card_hash ?? null,
      providerData: response.data ?? {},
    };
  }
}
