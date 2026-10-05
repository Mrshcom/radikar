export type OtpDeliveryPayload = {
  phone: string;
  code: string;
  purpose: "login";
  expiresInSeconds: number;
};

export type OtpDelivery = (payload: OtpDeliveryPayload) => Promise<void>;

type SmsIrResponse = {
  status?: number;
  message?: string;
  data?: {
    messageId?: number;
    cost?: number;
  };
};

export type SmsIrClientOptions = {
  username: string;
  apiKey: string;
  lineNumber: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

export type SmsIrSendResult = {
  messageId: number;
  cost: number | null;
};

export class SmsIrError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "SmsIrError";
  }
}

export class SmsIrClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: SmsIrClientOptions) {
    this.baseUrl = (options.baseUrl ?? "https://api.sms.ir/v1").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.fetcher = options.fetcher ?? fetch;
  }

  async sendMessage(mobile: string, text: string): Promise<SmsIrSendResult> {
    const query = new URLSearchParams({
      username: this.options.username,
      password: this.options.apiKey,
      line: this.options.lineNumber,
      mobile,
      text,
    });

    let response: Response;
    try {
      // SMS.ir's documented Node.js example sends this URL with GET. Keeping
      // credentials in the query is required by this legacy endpoint, so this
      // request must never be logged with its full URL.
      response = await this.fetcher(`${this.baseUrl}/send?${query.toString()}`, {
        method: "GET",
        headers: { accept: "application/json" },
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new SmsIrError("SMS.ir is unavailable");
    }

    let body: SmsIrResponse;
    try {
      body = (await response.json()) as SmsIrResponse;
    } catch {
      throw new SmsIrError("SMS.ir returned an invalid response", response.status);
    }

    const messageId = body.data?.messageId;
    if (!response.ok || body.status !== 1 || typeof messageId !== "number" || !Number.isInteger(messageId)) {
      throw new SmsIrError(body.message?.trim() || "SMS.ir rejected the message", response.status);
    }

    return {
      messageId,
      cost: typeof body.data?.cost === "number" ? body.data.cost : null,
    };
  }
}

function otpMessage(code: string, expiresInSeconds: number) {
  const expiresInMinutes = Math.max(1, Math.ceil(expiresInSeconds / 60));
  return `کد ورود رادیکار: ${code}\nاعتبار کد: ${expiresInMinutes} دقیقه\nاین کد را در اختیار دیگران قرار ندهید.`;
}

export function createSmsIrOtpDelivery(client: SmsIrClient): OtpDelivery {
  return async ({ phone, code, expiresInSeconds }) => {
    await client.sendMessage(phone, otpMessage(code, expiresInSeconds));
  };
}

export function createWebhookOtpDelivery(url: string, token?: string): OtpDelivery {
  return async ({ phone, code, purpose, expiresInSeconds }) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ phone, code, purpose, expiresInSeconds }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error("OTP webhook rejected the request");
  };
}
