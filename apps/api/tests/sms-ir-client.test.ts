import assert from "node:assert/strict";
import test from "node:test";
import { createSmsIrOtpDelivery, SmsIrClient, SmsIrError } from "../src/modules/notifications/otp-delivery";

test("SmsIrClient sends the documented URL parameters and parses a successful response", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const client = new SmsIrClient({
    username: "account-user",
    apiKey: "private-api-key",
    lineNumber: "30001234567890",
    fetcher: async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return Response.json({
        status: 1,
        message: "موفق",
        data: { messageId: 89545112, cost: 1.5 },
      });
    },
  });

  const result = await client.sendMessage("09121234567", "پیام آزمایشی رادیکار");
  const url = new URL(requestUrl);

  assert.equal(url.origin + url.pathname, "https://api.sms.ir/v1/send");
  assert.equal(url.searchParams.get("username"), "account-user");
  assert.equal(url.searchParams.get("password"), "private-api-key");
  assert.equal(url.searchParams.get("line"), "30001234567890");
  assert.equal(url.searchParams.get("mobile"), "09121234567");
  assert.equal(url.searchParams.get("text"), "پیام آزمایشی رادیکار");
  assert.equal(requestInit?.method, "GET");
  assert.equal(result.messageId, 89545112);
  assert.equal(result.cost, 1.5);
});

test("SmsIrClient rejects provider failures and malformed responses without exposing credentials", async () => {
  for (const response of [
    new Response("unavailable", { status: 503 }),
    Response.json({ status: 0, message: "ناموفق", data: null }),
    Response.json({ status: 1, message: "موفق", data: {} }),
  ]) {
    const client = new SmsIrClient({
      username: "account-user",
      apiKey: "private-api-key",
      lineNumber: "30001234567890",
      fetcher: async () => response.clone(),
    });
    await assert.rejects(
      () => client.sendMessage("09121234567", "پیام"),
      (error: unknown) =>
        error instanceof SmsIrError &&
        !error.message.includes("private-api-key") &&
        !error.message.includes("account-user"),
    );
  }
});

test("SMS.ir OTP delivery uses a branded message with the configured expiry", async () => {
  let message = "";
  const client = new SmsIrClient({
    username: "account-user",
    apiKey: "private-api-key",
    lineNumber: "30001234567890",
    fetcher: async (input) => {
      message = new URL(String(input)).searchParams.get("text") ?? "";
      return Response.json({ status: 1, data: { messageId: 1, cost: 1 } });
    },
  });

  await createSmsIrOtpDelivery(client)({
    phone: "09121234567",
    code: "123456",
    purpose: "login",
    expiresInSeconds: 180,
  });

  assert.match(message, /رادیکار/);
  assert.match(message, /123456/);
  assert.match(message, /3 دقیقه/);
  assert.match(message, /در اختیار دیگران قرار ندهید/);
});
