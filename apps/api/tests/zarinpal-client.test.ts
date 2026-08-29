import assert from "node:assert/strict";
import test from "node:test";
import { ZarinpalClient } from "../src/modules/billing/zarinpal-client";

test("creates a sandbox payment request with rial amount and callback", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedBody: Record<string, unknown> = {};
  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(
      JSON.stringify({ data: { code: 100, authority: "S000000000000000000000000000001" }, errors: [] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  try {
    const client = new ZarinpalClient(
      "https://sandbox.zarinpal.com",
      "00000000-0000-4000-8000-000000000000",
    );
    const result = await client.requestPayment({
      amountRials: 4_990_000,
      callbackUrl: "http://localhost:3162/api/billing/callback",
      description: "سفارش تست",
    });
    assert.equal(capturedUrl, "https://sandbox.zarinpal.com/pg/v4/payment/request.json");
    assert.equal(capturedBody.amount, 4_990_000);
    assert.equal(capturedBody.callback_url, "http://localhost:3162/api/billing/callback");
    assert.equal(result.authority.startsWith("S"), true);
    assert.equal(
      result.paymentUrl,
      "https://sandbox.zarinpal.com/pg/StartPay/S000000000000000000000000000001",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("accepts Zarinpal verification codes 100 and 101 idempotently", async () => {
  const originalFetch = globalThis.fetch;
  for (const code of [100, 101]) {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ data: { code, ref_id: 12345, card_pan: "000000******0000" }, errors: [] }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    const client = new ZarinpalClient(
      "https://sandbox.zarinpal.com",
      "00000000-0000-4000-8000-000000000000",
    );
    const result = await client.verifyPayment({ amountRials: 4_990_000, authority: "S-test" });
    assert.equal(result.code, code);
    assert.equal(result.refId, "12345");
  }
  globalThis.fetch = originalFetch;
});
