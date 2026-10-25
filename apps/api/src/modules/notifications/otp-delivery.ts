export type OtpDeliveryPayload = {
  phone: string;
  code: string;
  purpose: "login";
  expiresInSeconds: number;
};

export type OtpDelivery = (payload: OtpDeliveryPayload) => Promise<void>;

type VerifyTemplateResponse = {
  return?: {
    status?: number;
    message?: string;
  };
  entries?: Array<{
    messageid?: number;
    cost?: number;
  }>;
};

export type OtpProviderName = "kavenegar";

export type OtpProviderClientOptions = {
  provider: OtpProviderName;
  apiKey: string;
  template: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

export type OtpProviderSendResult = {
  messageId: number;
  cost: number | null;
};

export class OtpProviderError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "OtpProviderError";
  }
}

export class OtpProviderClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: OtpProviderClientOptions) {
    this.baseUrl = (options.baseUrl ?? "https://api.kavenegar.com/v1").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.fetcher = options.fetcher ?? fetch;
  }

  async sendVerifyCode(mobile: string, code: string): Promise<OtpProviderSendResult> {
    let response: Response;
    try {
      response = await this.fetcher(this.buildVerifyUrl(), {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({ receptor: mobile, token: code, template: this.options.template }),
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new OtpProviderError("OTP provider is unavailable");
    }

    let body: VerifyTemplateResponse;
    try {
      body = (await response.json()) as VerifyTemplateResponse;
    } catch {
      throw new OtpProviderError("OTP provider returned an invalid response", response.status);
    }

    const entry = body?.entries?.[0];
    const messageId = entry?.messageid;
    if (!response.ok || body?.return?.status !== 200 || typeof messageId !== "number" || !Number.isInteger(messageId)) {
      throw new OtpProviderError(body?.return?.message?.trim() || "OTP provider rejected the message", response.status);
    }

    return {
      messageId,
      cost: typeof entry?.cost === "number" ? entry.cost : null,
    };
  }

  private buildVerifyUrl() {
    switch (this.options.provider) {
      case "kavenegar":
        return `${this.baseUrl}/${encodeURIComponent(this.options.apiKey)}/verify/lookup.json`;
    }
  }
}

export function createProviderOtpDelivery(client: OtpProviderClient): OtpDelivery {
  return async ({ phone, code }) => {
    await client.sendVerifyCode(phone, code);
  };
}
