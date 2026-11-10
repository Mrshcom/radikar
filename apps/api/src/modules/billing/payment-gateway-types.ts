export type PaymentGatewayId = "zarinpal_sandbox" | "abropay_sandbox" | "abropay_live";

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly retryable = true,
    readonly canceled = false,
  ) {
    super(message);
  }
}

export type PaymentRequest = {
  amountRials: number;
  callbackUrl: string;
  description: string;
  mobile?: string;
  clientReference?: string;
};

export type PaymentVerification = {
  code: number;
  refId: string | null;
  cardPan: string | null;
  cardHash: string | null;
  providerData: Record<string, unknown>;
};

export interface PaymentGateway {
  readonly id: PaymentGatewayId;
  requestPayment(input: PaymentRequest): Promise<{
    authority: string;
    paymentUrl: string;
    providerData: Record<string, unknown>;
  }>;
  verifyPayment(input: {
    authority: string;
    amountRials: number;
    clientReference?: string;
  }): Promise<PaymentVerification>;
  paymentUrl(authority: string, storedUrl?: string | null): string;
}
