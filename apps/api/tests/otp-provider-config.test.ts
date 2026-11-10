import assert from "node:assert/strict";
import test from "node:test";
import { readConfig } from "@radikar/config/server";

test("every environment rejects partial OTP provider credentials", () => {
  const production = {
    NODE_ENV: "production",
    AUTH_SECRET: "a-production-secret-that-is-longer-than-32-characters",
  };
  for (const environment of [production, { NODE_ENV: "development" }, { NODE_ENV: "test" }]) {
    assert.throws(
      () => readConfig({ ...environment, OTP_PROVIDER: "kavenegar" }),
      /OTP_PROVIDER, OTP_PROVIDER_API_KEY and OTP_PROVIDER_TEMPLATE must be configured together/,
    );
    assert.throws(
      () => readConfig({ ...environment, OTP_PROVIDER: "kavenegar", OTP_PROVIDER_API_KEY: "private-api-key" }),
      /OTP_PROVIDER, OTP_PROVIDER_API_KEY and OTP_PROVIDER_TEMPLATE must be configured together/,
    );
    assert.equal(readConfig(environment).OTP_DELIVERY_MODE, "console");
    assert.throws(
      () => readConfig({ ...environment, OTP_DELIVERY_MODE: "provider" }),
      /OTP provider credentials are required in provider delivery mode/,
    );
  }
});

test("development accepts a complete OTP provider configuration", () => {
  const config = readConfig({
    OTP_PROVIDER: "kavenegar",
    OTP_PROVIDER_API_KEY: "private-api-key",
    OTP_PROVIDER_TEMPLATE: "radikarlogin",
  });
  assert.equal(config.OTP_PROVIDER, "kavenegar");
  assert.equal(config.OTP_PROVIDER_API_KEY, "private-api-key");
  assert.equal(config.OTP_PROVIDER_TEMPLATE, "radikarlogin");
  assert.equal(config.OTP_DELIVERY_MODE, "console");
  assert.equal(config.OTP_LOG_REVERSED_CODE, true);
});

test("production accepts a complete OTP provider configuration in console mode", () => {
  const config = readConfig({
    NODE_ENV: "production",
    AUTH_SECRET: "a-production-secret-that-is-longer-than-32-characters",
    OTP_PROVIDER: "kavenegar",
    OTP_PROVIDER_API_KEY: "private-api-key",
    OTP_PROVIDER_TEMPLATE: "radikarlogin",
  });

  assert.equal(config.OTP_PROVIDER, "kavenegar");
  assert.equal(config.OTP_PROVIDER_TEMPLATE, "radikarlogin");
  assert.equal(config.OTP_DELIVERY_MODE, "console");
  assert.equal(config.OTP_LOG_REVERSED_CODE, true);
});

test("reversed OTP logging can be disabled without changing delivery settings", () => {
  const config = readConfig({
    OTP_PROVIDER: "kavenegar",
    OTP_PROVIDER_API_KEY: "private-api-key",
    OTP_PROVIDER_TEMPLATE: "radikarlogin",
    OTP_DELIVERY_MODE: "provider",
    OTP_LOG_REVERSED_CODE: "false",
  });

  assert.equal(config.OTP_LOG_REVERSED_CODE, false);
  assert.equal(config.OTP_DELIVERY_MODE, "provider");
  assert.equal(config.OTP_PROVIDER, "kavenegar");
});

test("console delivery mode requires logging so the user can enter the code", () => {
  assert.throws(
    () =>
      readConfig({
        OTP_PROVIDER: "kavenegar",
        OTP_PROVIDER_API_KEY: "private-api-key",
        OTP_PROVIDER_TEMPLATE: "radikarlogin",
        OTP_LOG_REVERSED_CODE: "false",
      }),
    /OTP_LOG_REVERSED_CODE must stay enabled in console delivery mode/,
  );
});

test("OTP provider accepts an approved Verify template name", () => {
  const config = readConfig({
    OTP_PROVIDER: "kavenegar",
    OTP_PROVIDER_API_KEY: "private-api-key",
    OTP_PROVIDER_TEMPLATE: "radikarlogin",
  });

  assert.equal(config.OTP_PROVIDER_TEMPLATE, "radikarlogin");
});

test("LLM agent mode requires separate interviewer and resume ranker names", () => {
  assert.equal(readConfig({}).LLM_PROVIDER, "gapgpt");
  assert.throws(() => readConfig({ LLM_PROVIDER: "agent" }), /LLM_BASE_URL is required/);
  const configured = readConfig({
    LLM_PROVIDER: "agent",
    LLM_BASE_URL: "https://agents.example.test",
    LLM_API_KEY: "12.private-secret",
    LLM_AGENT_RESUME_RANKER: "resume-ranker",
    LLM_AGENT_INTERVIEWER: "interviewer",
  });
  assert.equal(configured.LLM_PROVIDER, "agent");
  assert.equal(configured.LLM_AGENT_RESUME_RANKER, "resume-ranker");
});

test("Abropay provider requires a secret from the selected payment environment", () => {
  assert.equal(readConfig({}).PAYMENT_PROVIDER, "zarinpal");
  assert.throws(() => readConfig({ PAYMENT_PROVIDER: "abropay" }), /sk_test_/);
  assert.throws(
    () =>
      readConfig({
        PAYMENT_PROVIDER: "abropay",
        PAYMENT_PROVIDER_ENVIRONMENT: "live",
        PAYMENT_PROVIDER_SECRET_KEY: "sk_test_private",
      }),
    /sk_live_/,
  );
  const sandbox = readConfig({ PAYMENT_PROVIDER: "abropay", PAYMENT_PROVIDER_SECRET_KEY: "sk_test_private" });
  assert.equal(sandbox.PAYMENT_PROVIDER_ENVIRONMENT, "sandbox");
  assert.equal(sandbox.PAYMENT_PROVIDER_BASE_URL, "https://pay.abrotech.ir");
  assert.throws(
    () =>
      readConfig({
        PAYMENT_PROVIDER: "abropay",
        PAYMENT_PROVIDER_ENVIRONMENT: "live",
        PAYMENT_PROVIDER_SECRET_KEY: "sk_live_private",
      }),
    /public HTTPS API_PUBLIC_URL/,
  );
  assert.equal(
    readConfig({
      PAYMENT_PROVIDER: "abropay",
      PAYMENT_PROVIDER_ENVIRONMENT: "live",
      PAYMENT_PROVIDER_SECRET_KEY: "sk_live_private",
      API_PUBLIC_URL: "https://api.radikar.example",
      WEB_APP_URL: "https://radikar.example",
    }).PAYMENT_PROVIDER_ENVIRONMENT,
    "live",
  );
  const localWeb = readConfig({
    PAYMENT_PROVIDER: "abropay",
    PAYMENT_PROVIDER_ENVIRONMENT: "live",
    PAYMENT_PROVIDER_SECRET_KEY: "sk_live_private",
    API_PUBLIC_URL: "https://api-tunnel.example",
    WEB_APP_URL: "http://localhost:3161",
  });
  assert.equal(localWeb.WEB_APP_URL, "http://localhost:3161");
  assert.throws(
    () =>
      readConfig({
        PAYMENT_PROVIDER: "abropay",
        PAYMENT_PROVIDER_ENVIRONMENT: "live",
        PAYMENT_PROVIDER_SECRET_KEY: "sk_live_private",
        API_PUBLIC_URL: "https://localhost:3162",
        WEB_APP_URL: "http://localhost:3161",
      }),
    /public HTTPS API_PUBLIC_URL/,
  );
  assert.throws(
    () =>
      readConfig({
        PAYMENT_PROVIDER: "abropay",
        PAYMENT_PROVIDER_ENVIRONMENT: "live",
        PAYMENT_PROVIDER_SECRET_KEY: "sk_live_private",
        API_PUBLIC_URL: "https://api-tunnel.example",
        WEB_APP_URL: "http://unsafe.example",
      }),
    /except a loopback WEB_APP_URL/,
  );
  assert.throws(
    () =>
      readConfig({
        NODE_ENV: "production",
        AUTH_SECRET: "a-strong-auth-secret-for-production-123",
        PAYMENT_PROVIDER: "abropay",
        PAYMENT_PROVIDER_ENVIRONMENT: "live",
        PAYMENT_PROVIDER_SECRET_KEY: "sk_live_private",
        API_PUBLIC_URL: "https://api.radikar.example",
        WEB_APP_URL: "http://localhost:3161",
      }),
    /except a loopback WEB_APP_URL/,
  );
});
