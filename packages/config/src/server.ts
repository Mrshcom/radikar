import { z } from "zod";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

export function loadLocalEnvironment() {
  const environmentFiles = [
    new URL("../../../.env.local", import.meta.url),
    new URL("../../../apps/api/.env", import.meta.url),
  ];

  for (const environmentFile of environmentFiles) {
    try {
      loadEnvFile(fileURLToPath(environmentFile));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_HOST: z.string().default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3162),
  DATABASE_URL: z
    .url()
    .default("postgresql://radicar:radicar@localhost:5433/radicar"),
  DATABASE_MAX_CONNECTIONS: z.coerce.number().int().min(1).max(50).default(10),
  CORS_ORIGINS: z.string().default("http://localhost:3161"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  AUTH_SECRET: z.string().min(32).default("development-only-secret-change-before-production"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  OTP_TTL_SECONDS: z.coerce.number().int().min(60).max(600).default(180),
  OTP_WEBHOOK_URL: z.url().optional(),
  OTP_WEBHOOK_TOKEN: z.string().optional(),
  BOOTSTRAP_SUPERADMIN_PHONE: z.string().regex(/^09\d{9}$/).optional(),
  ALLOW_FIRST_USER_SUPERADMIN: z.stringbool().default(false),
  EXPOSE_DEVELOPMENT_OTP: z.stringbool().default(true),
  API_PUBLIC_URL: z.url().default("http://127.0.0.1:3162"),
  WEB_APP_URL: z.url().default("http://localhost:3161"),
  ZARINPAL_BASE_URL: z.url().default("https://sandbox.zarinpal.com"),
  ZARINPAL_MERCHANT_ID: z
    .uuid()
    .default("00000000-0000-4000-8000-000000000000"),
}).superRefine((config, context) => {
  if (config.NODE_ENV !== "production") return;
  if (config.AUTH_SECRET === "development-only-secret-change-before-production") {
    context.addIssue({ code: "custom", path: ["AUTH_SECRET"], message: "AUTH_SECRET must be changed in production" });
  }
  if (!config.OTP_WEBHOOK_URL) {
    context.addIssue({ code: "custom", path: ["OTP_WEBHOOK_URL"], message: "OTP_WEBHOOK_URL is required in production" });
  }
  if (config.EXPOSE_DEVELOPMENT_OTP) {
    context.addIssue({ code: "custom", path: ["EXPOSE_DEVELOPMENT_OTP"], message: "Development OTP exposure must be disabled in production" });
  }
});

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  const config = environmentSchema.parse(environment);
  return {
    ...config,
    corsOrigins: config.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

export type ApiConfig = ReturnType<typeof readConfig>;
