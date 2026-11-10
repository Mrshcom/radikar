import assert from "node:assert/strict";
import test from "node:test";
import { AbropayClient } from "../src/modules/billing/abropay-client";
import { PaymentGatewayError } from "../src/modules/billing/payment-gateway";

const id = "019f7fe7-6d3e-72e3-b563-6745ca0081df";
const reference = "11111111-1111-4111-8111-111111111111";
const transaction = {
  id,
  status: "ready_to_pay",
  amount: 390_000,
  clientReference: reference,
  redirectUrl: `https://pay.abrotech.ir/payments/${id}/redirect`,
  paidAt: null,
};

test("Abropay sandbox requests rial payment with bearer secret and stores the returned redirect", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return Response.json({ success: true, data: transaction, message: "", errors: {} }, { status: 201 });
  };
  try {
    const client = new AbropayClient("https://pay.abrotech.ir", "sk_test_private", "sandbox");
    const result = await client.requestPayment({
      amountRials: 390_000,
      callbackUrl: "https://api.example.com/api/billing/callback",
      description: "بسته مصاحبه",
      clientReference: reference,
    });
    assert.equal(capturedUrl, "https://pay.abrotech.ir/sendbox/payments/request");
    assert.equal((capturedInit?.headers as Record<string, string>).authorization, "Bearer sk_test_private");
    assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
      amount: 390_000,
      return_url: "https://api.example.com/api/billing/callback",
      client_reference: reference,
    });
    assert.equal(result.authority, id);
    assert.equal(result.paymentUrl, transaction.redirectUrl);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Abropay accepts only its fixed HTTP test redirect in sandbox", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      success: true,
      data: { ...transaction, redirectUrl: `http://pay.abrotech.ir/test/payments/${id}/redirect` },
    });
  try {
    const client = new AbropayClient("https://pay.abrotech.ir", "sk_test_private", "sandbox");
    const result = await client.requestPayment({
      amountRials: 390_000,
      callbackUrl: "https://api.example.com/api/billing/callback",
      description: "بسته مصاحبه",
      clientReference: reference,
    });
    assert.equal(result.paymentUrl, `http://pay.abrotech.ir/test/payments/${id}/redirect`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Abropay rejects HTTP redirects outside its sandbox test route", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ success: true, data: { ...transaction, redirectUrl: `http://pay.abrotech.ir/payments/${id}/redirect` } });
  try {
    const client = new AbropayClient("https://pay.abrotech.ir", "sk_test_private", "sandbox");
    await assert.rejects(
      () =>
        client.requestPayment({
          amountRials: 390_000,
          callbackUrl: "https://api.example.com/api/billing/callback",
          description: "بسته مصاحبه",
          clientReference: reference,
        }),
      /آدرس هدایت درگاه امن نیست/,
    );
    const productionClient = new AbropayClient("https://pay.abrotech.ir", "sk_live_private", "live");
    await assert.rejects(
      () =>
        productionClient.requestPayment({
          amountRials: 390_000,
          callbackUrl: "https://api.example.com/api/billing/callback",
          description: "بسته مصاحبه",
          clientReference: reference,
        }),
      /آدرس هدایت درگاه امن نیست/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Abropay verifies only exact paid transactions, not browser callback status", async () => {
  const originalFetch = globalThis.fetch;
  let status = "verified";
  let amount = 390_000;
  let clientReference = reference;
  let capturedUrl = "";
  globalThis.fetch = async (input) => {
    capturedUrl = String(input);
    return Response.json({ success: true, data: { ...transaction, status, amount, clientReference } });
  };
  try {
    const client = new AbropayClient("https://pay.abrotech.ir", "sk_live_private", "live");
    const input = { authority: id, amountRials: 390_000, clientReference: reference };
    const paid = await client.verifyPayment(input);
    assert.equal(capturedUrl, `https://pay.abrotech.ir/payments/${id}/verify`);
    assert.equal(paid.refId, id);
    status = "paying";
    await assert.rejects(
      () => client.verifyPayment(input),
      (error: unknown) => error instanceof PaymentGatewayError && error.retryable,
    );
    status = "canceled";
    await assert.rejects(
      () => client.verifyPayment(input),
      (error: unknown) => error instanceof PaymentGatewayError && !error.retryable && error.canceled,
    );
    status = "verified";
    amount = 1_000;
    await assert.rejects(() => client.verifyPayment(input), /مطابقت ندارد/);
    amount = 390_000;
    clientReference = "other-order";
    await assert.rejects(() => client.verifyPayment(input), /مطابقت ندارد/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Abropay rejects a 201 failed transaction without redirect", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ success: true, data: { ...transaction, status: "failed", redirectUrl: null } }, { status: 201 });
  try {
    const client = new AbropayClient("https://pay.abrotech.ir", "sk_test_private", "sandbox");
    await assert.rejects(
      () =>
        client.requestPayment({
          amountRials: 390_000,
          callbackUrl: "https://example.com/return",
          description: "",
          clientReference: reference,
        }),
      (error: unknown) => error instanceof PaymentGatewayError && !error.retryable,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
