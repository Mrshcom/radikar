import { AbropayClient } from "./abropay-client";
import { ZarinpalClient } from "./zarinpal-client";
import { PaymentGatewayError, type PaymentGateway } from "./payment-gateway-types";

export { PaymentGatewayError } from "./payment-gateway-types";

export type PaymentGatewayOptions = {
  paymentProvider?: "zarinpal" | "abropay";
  paymentProviderBaseUrl?: string;
  paymentProviderSecretKey?: string;
  paymentProviderEnvironment?: "sandbox" | "live";
  zarinpalBaseUrl: string;
  zarinpalMerchantId: string;
};

export function paymentGatewayFor(id: string, options: PaymentGatewayOptions): PaymentGateway {
  const provider = id.split("+")[0];
  if (provider === "abropay_sandbox" || provider === "abropay_live") {
    if (!options.paymentProviderSecretKey) throw new PaymentGatewayError("کلید درگاه ابروپی تنظیم نشده است.");
    return new AbropayClient(
      options.paymentProviderBaseUrl ?? "https://pay.abrotech.ir",
      options.paymentProviderSecretKey,
      provider === "abropay_sandbox" ? "sandbox" : "live",
    );
  }
  if (provider !== "zarinpal_sandbox") throw new PaymentGatewayError("درگاه ثبت‌شده برای سفارش شناخته نشد.");
  return new ZarinpalClient(options.zarinpalBaseUrl, options.zarinpalMerchantId);
}

export function activePaymentGateway(options: PaymentGatewayOptions): PaymentGateway {
  const id =
    options.paymentProvider === "abropay"
      ? `abropay_${options.paymentProviderEnvironment ?? "sandbox"}`
      : "zarinpal_sandbox";
  return paymentGatewayFor(id, options);
}

export function isRetryablePaymentError(error: unknown) {
  if (error instanceof PaymentGatewayError) return error.retryable;
  return true;
}
