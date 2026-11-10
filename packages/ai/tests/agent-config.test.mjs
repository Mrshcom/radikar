import assert from "node:assert/strict";
import test from "node:test";
import { getAnalyzeConfig, getWriteConfig } from "../src/config.ts";

test("agent mode keeps the general model configuration separate", () => {
  const keys = [
    "LLM_PROVIDER",
    "LLM_API_KEY",
    "LLM_BASE_URL",
    "LLM_GENERAL_PROVIDER",
    "LLM_GENERAL_MODEL",
    "LLM_GENERAL_API_KEY",
    "LLM_GENERAL_BASE_URL",
    "LLM_WRITE_PROVIDER",
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.LLM_PROVIDER = "agent";
    process.env.LLM_API_KEY = "agent-secret";
    process.env.LLM_BASE_URL = "https://agents.example.test";
    process.env.LLM_GENERAL_PROVIDER = "openai-compatible";
    process.env.LLM_GENERAL_MODEL = "general-model";
    process.env.LLM_GENERAL_API_KEY = "general-secret";
    process.env.LLM_GENERAL_BASE_URL = "https://general.example.test/v1";
    delete process.env.LLM_WRITE_PROVIDER;
    for (const config of [getAnalyzeConfig(), getWriteConfig()]) {
      assert.equal(config.provider, "openai-compatible");
      assert.equal(config.model, "general-model");
      assert.equal(config.apiKey, "general-secret");
      assert.equal(config.baseUrl, "https://general.example.test/v1");
    }
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
