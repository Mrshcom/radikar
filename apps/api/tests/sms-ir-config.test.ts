import assert from "node:assert/strict";
import test from "node:test";
import { readConfig } from "@radikar/config/server";

test("SMS.ir configuration rejects partial credentials", () => {
  assert.throws(
    () => readConfig({ SMSIR_USERNAME: "account-user" }),
    /SMSIR_USERNAME, SMSIR_API_KEY and SMSIR_LINE_NUMBER must be configured together/,
  );
});

test("production accepts a complete SMS.ir configuration without the legacy webhook", () => {
  const config = readConfig({
    NODE_ENV: "production",
    AUTH_SECRET: "a-production-secret-that-is-longer-than-32-characters",
    SMSIR_USERNAME: "account-user",
    SMSIR_API_KEY: "private-api-key",
    SMSIR_LINE_NUMBER: "30001234567890",
  });

  assert.equal(config.SMSIR_USERNAME, "account-user");
  assert.equal(config.SMSIR_LINE_NUMBER, "30001234567890");
  assert.equal(config.OTP_WEBHOOK_URL, undefined);
});
