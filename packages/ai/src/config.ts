export type ProviderName =
  | "freeDeepseekAPI"
  | "openai-compatible"
  | "local"
  | "gapgpt";

export type ProviderConfig = {
  provider: ProviderName;
  model: string;
  apiKey: string;
  baseUrl: string;
  inputPricePerMillionUsd: number;
  outputPricePerMillionUsd: number;
  apiStyle?: "chat" | "responses";
};

let analyzeProviderOverride: { provider: ProviderName; model?: string } | undefined;

const gapGptPricing: Record<string, readonly [number, number]> = {
  "gapgpt-qwen-3.6": [0.25, 2],
  "gapgpt-qwen-3.6-thinking": [0.25, 2],
  "gapgpt-qwen-3.8": [0.25, 2],
  "gpt-5.6-sol": [2.5, 15],
  "gpt-5.6-luna": [0.2, 1.2],
  "gpt-5.6-terra": [2, 12],
  "gpt-5.5": [5, 30],
  "gpt-5.4": [2.5, 15],
  "gpt-5.2-pro": [21, 126],
  "gpt-5.3-codex-spark": [1.75, 14],
  "claude-fable-5": [10, 50],
  "claude-sonnet-5": [2, 10],
  "claude-opus-5": [5, 25],
  "gemini-3.1-pro-preview": [2, 12],
  "gemini-3.5-flash": [1.5, 9],
  "gemini-3.1-flash-lite": [0.25, 1.5],
  "gemini-3.1-flash-lite-preview": [0.25, 1.5],
  "gemini-3-flash-preview": [0.5, 3],
  "grok-4.3": [1.25, 2.5],
  "grok-4": [3, 15],
};

function gapGptPrices(model: string) {
  const prices = gapGptPricing[model] ?? gapGptPricing["gapgpt-qwen-3.6"];
  return {
    inputPricePerMillionUsd: getNonNegativeNumber("LLM", "INPUT_PRICE_PER_MILLION_USD") || prices[0],
    outputPricePerMillionUsd: getNonNegativeNumber("LLM", "OUTPUT_PRICE_PER_MILLION_USD") || prices[1],
  };
}

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
    baseUrl:
      process.env.FREE_DEEPSEEK_BASE_URL ??
      `http://localhost:${port}/v1`,
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

function buildGapGptConfig(): ProviderConfig {
  const model = process.env.GAPGPT_MODEL || "gapgpt-qwen-3.6";
  return {
    provider: "gapgpt",
    model,
    apiKey: process.env.GAPGPT_API_KEY || "",
    baseUrl: process.env.GAPGPT_BASE_URL || "https://api.gapgpt.app/v1",
    ...gapGptPrices(model),
    apiStyle: "responses",
  };
}

export type AnalyzeProviderSettings = {
  provider: ProviderName;
  model: string;
  configured: boolean;
};

export function getAnalyzeProviderSettings(): AnalyzeProviderSettings {
  const config = getAnalyzeConfig();
  return { provider: config.provider, model: config.model, configured: Boolean(config.apiKey && config.baseUrl) };
}

export function setAnalyzeProvider(provider: ProviderName, model?: string) {
  analyzeProviderOverride = { provider, model: model?.trim() || undefined };
}

export function getAnalyzeConfig(): ProviderConfig {
  const provider = analyzeProviderOverride?.provider ?? process.env.LLM_PROVIDER ?? "";

  switch (provider) {
    case "freeDeepseekAPI":
      return buildFreeDeepseekAPIConfig("LLM");
    case "openai-compatible":
    case "local":
      return buildOpenAICompatibleConfig("LLM");
    case "gapgpt": {
      const config = buildGapGptConfig();
      if (!analyzeProviderOverride?.model) return config;
      return { ...config, model: analyzeProviderOverride.model, ...gapGptPrices(analyzeProviderOverride.model) };
    }
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
