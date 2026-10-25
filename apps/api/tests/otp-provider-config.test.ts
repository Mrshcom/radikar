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
