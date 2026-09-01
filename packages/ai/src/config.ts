export type ProviderName = "freeDeepseekAPI" | "openai-compatible" | "local";

export type ProviderConfig = {
  provider: ProviderName;
  model: string;
  apiKey: string;
  baseUrl: string;
  inputPricePerMillionUsd: number;
  outputPricePerMillionUsd: number;
};

function getEnv(prefix: "LLM" | "LLM_WRITE", key: string) {
  return process.env[`${prefix}_${key}`] ?? process.env[`LLM_${key}`] ?? "";
}

function getNonNegativeNumber(
  prefix: "LLM" | "LLM_WRITE",
  key: string,
) {
  const value = Number(getEnv(prefix, key));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function buildFreeDeepseekAPIConfig(
  prefix: "LLM" | "LLM_WRITE",
): ProviderConfig {
  const port = process.env.FREE_DEEPSEEK_PORT ?? "9655";

  return {
    provider: "freeDeepseekAPI",
    model: getEnv(prefix, "MODEL") || "deepseek-chat",
    apiKey: "localproxy",
    baseUrl: `http://localhost:${port}/v1`,
    inputPricePerMillionUsd: 0,
    outputPricePerMillionUsd: 0,
  };
}

function buildOpenAICompatibleConfig(
  prefix: "LLM" | "LLM_WRITE",
): ProviderConfig {
  return {
    provider: (getEnv(prefix, "PROVIDER") ||
      "openai-compatible") as ProviderName,
    model: getEnv(prefix, "MODEL"),
    apiKey: getEnv(prefix, "API_KEY"),
    baseUrl: getEnv(prefix, "BASE_URL"),
    inputPricePerMillionUsd: getNonNegativeNumber(
      prefix,
      "INPUT_PRICE_PER_MILLION_USD",
    ),
    outputPricePerMillionUsd: getNonNegativeNumber(
      prefix,
      "OUTPUT_PRICE_PER_MILLION_USD",
    ),
  };
}

export function getAnalyzeConfig(): ProviderConfig {
  const provider = process.env.LLM_PROVIDER ?? "";

  switch (provider) {
    case "freeDeepseekAPI":
      return buildFreeDeepseekAPIConfig("LLM");
    case "openai-compatible":
    case "local":
      return buildOpenAICompatibleConfig("LLM");
    default:
      throw new Error(`Unknown LLM provider: ${provider || "not configured"}`);
  }
}

export function getWriteConfig(): ProviderConfig {
  const provider =
    process.env.LLM_WRITE_PROVIDER ?? process.env.LLM_PROVIDER ?? "";

  switch (provider) {
    case "freeDeepseekAPI":
      return buildFreeDeepseekAPIConfig("LLM_WRITE");
    case "openai-compatible":
    case "local":
      return buildOpenAICompatibleConfig("LLM_WRITE");
    default:
      throw new Error(
        `Unknown LLM write provider: ${provider || "not configured"}`,
      );
  }
}
