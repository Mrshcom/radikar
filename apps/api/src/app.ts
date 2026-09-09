import { sql } from "drizzle-orm";
import Fastify from "fastify";
import { createDatabase } from "@radicar/database";
import { buildApp } from "./build-app";
import { loadLocalEnvironment, readConfig } from "@radicar/config/server";
import { PostgresRecordRepository } from "./modules/data/record-repository";
import { AuthService } from "./modules/auth/service";
import { BillingService } from "./modules/billing/service";
import { setAnalyzeProvider } from "@radicar/ai";
import { aiSettings } from "@radicar/database";
import { eq } from "drizzle-orm";

loadLocalEnvironment();
const config = readConfig();
const database = createDatabase(
  config.DATABASE_URL,
  config.DATABASE_MAX_CONNECTIONS,
);
const [savedAiSettings] = await database.db.select().from(aiSettings).where(eq(aiSettings.id, "analysis-provider")).limit(1);
if (savedAiSettings) setAnalyzeProvider(savedAiSettings.provider as Parameters<typeof setAnalyzeProvider>[0], savedAiSettings.model);
const billingService = new BillingService(database.db, {
  apiPublicUrl: config.API_PUBLIC_URL,
  webAppUrl: config.WEB_APP_URL,
  zarinpalBaseUrl: config.ZARINPAL_BASE_URL,
  zarinpalMerchantId: config.ZARINPAL_MERCHANT_ID,
});
const app = buildApp({
  fastifyFactory: Fastify,
  repository: new PostgresRecordRepository(database.db),
  readinessCheck: async () => {
    await database.db.execute(sql`select 1`);
  },
  corsOrigins: config.corsOrigins,
  logger: { level: config.LOG_LEVEL },
  authService: new AuthService(database.db, {
    secret: config.AUTH_SECRET,
    otpTtlSeconds: config.OTP_TTL_SECONDS,
    sessionTtlDays: config.SESSION_TTL_DAYS,
    bootstrapSuperadminPhone: config.BOOTSTRAP_SUPERADMIN_PHONE,
    allowFirstUserSuperadmin: config.ALLOW_FIRST_USER_SUPERADMIN,
    exposeDevelopmentOtp:
      config.EXPOSE_DEVELOPMENT_OTP &&
      (config.NODE_ENV !== "production" || config.ALLOW_INSECURE_DEMO_OTP),
    otpWebhookUrl: config.OTP_WEBHOOK_URL,
    otpWebhookToken: config.OTP_WEBHOOK_TOKEN,
    grantSignupMembership: (userId) => billingService.ensureSignupMembership(userId),
  }),
  billingService,
  database: database.db,
  sessionCookieName: config.NODE_ENV === "production" ? "__Host-radicar_session" : "radicar_session",
  secureCookies: config.NODE_ENV === "production",
  sessionTtlDays: config.SESSION_TTL_DAYS,
  maxUploadSizeBytes: config.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
});

async function shutdown(signal: string) {
  app.log.info({ signal }, "Shutting down API");
  await app.close();
  await database.close();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

void app.listen({ host: config.API_HOST, port: config.API_PORT }).catch(async (error) => {
  app.log.error(error);
  await database.close();
  process.exit(1);
});
