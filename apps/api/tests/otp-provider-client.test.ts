import assert from "node:assert/strict";
import test from "node:test";
import { createProviderOtpDelivery, OtpProviderClient, OtpProviderError } from "../src/modules/notifications/otp-delivery";

test("OTP provider client sends the active adapter's Verify request", async () => {
  let requestUrl = "";
  let requestInit: RequestInit | undefined;
  const client = new OtpProviderClient({
    provider: "kavenegar",
    apiKey: "private-api-key",
    template: "radikarlogin",
    fetcher: async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return Response.json({ return: { status: 200, message: "تایید شد" }, entries: [{ messageid: 89545112, cost: 120 }] });
    },
  });

  const result = await client.sendVerifyCode("09121234567", "123456");
  const url = new URL(requestUrl);

  assert.equal(url.origin + url.pathname, "https://api.kavenegar.com/v1/private-api-key/verify/lookup.json");
  assert.equal(url.search, "");
  assert.equal(requestInit?.method, "POST");
  assert.equal(new Headers(requestInit?.headers).get("content-type"), "application/x-www-form-urlencoded;charset=UTF-8");
  assert.deepEqual(Object.fromEntries(new URLSearchParams(String(requestInit?.body))), {
    receptor: "09121234567",
    token: "123456",
    template: "radikarlogin",
  });
  assert.equal(result.messageId, 89545112);
  assert.equal(result.cost, 120);
});

test("OTP provider client rejects failures without exposing credentials", async () => {
  for (const response of [
    new Response("unavailable", { status: 503 }),
    Response.json(null),
    Response.json({ return: { status: 424, message: "الگو پیدا نشد" }, entries: [] }),
    Response.json({ return: { status: 200, message: "تایید شد" }, entries: [{}] }),
  ]) {
    const client = new OtpProviderClient({
      provider: "kavenegar",
      apiKey: "private-api-key",
      template: "radikarlogin",
      fetcher: async () => response.clone(),
    });
    await assert.rejects(
      () => client.sendVerifyCode("09121234567", "123456"),
      (error: unknown) => error instanceof OtpProviderError && !error.message.includes("private-api-key"),
    );
  }
});

test("OTP provider delivery sends the code as the template token", async () => {
  let requestBody: unknown;
  const client = new OtpProviderClient({
    provider: "kavenegar",
    apiKey: "private-api-key",
    template: "radikarlogin",
    fetcher: async (_input, init) => {
      requestBody = Object.fromEntries(new URLSearchParams(String(init?.body)));
      return Response.json({ return: { status: 200 }, entries: [{ messageid: 1, cost: 120 }] });
    },
  });

  await createProviderOtpDelivery(client)({
    phone: "09121234567",
    code: "123456",
    purpose: "login",
    expiresInSeconds: 180,
  });

  assert.deepEqual(requestBody, {
    receptor: "09121234567",
    token: "123456",
    template: "radikarlogin",
  });
});
