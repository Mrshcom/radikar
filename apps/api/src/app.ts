import { sql } from "drizzle-orm";
import Fastify from "fastify";
import { createDatabase } from "@radikar/database";
import { buildApp } from "./build-app";
import { loadLocalEnvironment, readConfig } from "@radikar/config/server";
import { PostgresRecordRepository } from "./modules/data/record-repository";
import { AuthService } from "./modules/auth/service";
import { BillingService } from "./modules/billing/service";
import { setAnalyzeProvider } from "@radikar/ai";
import { aiSettings } from "@radikar/database";
import { eq } from "drizzle-orm";
import { JobPoolService } from "./modules/job-pool/service";
import { RadicoinService } from "./modules/radicoin/service";
import {
  createSmsIrOtpDelivery,
  createWebhookOtpDelivery,
  SmsIrClient,
} from "./modules/notifications/otp-delivery";

loadLocalEnvironment();
const config = readConfig();
const database = createDatabase(
  config.DATABASE_URL,
  config.DATABASE_MAX_CONNECTIONS,
);
const [savedAiSettings] = await database.db.select().from(aiSettings).where(eq(aiSettings.id, "analysis-provider")).limit(1);
if (savedAiSettings) setAnalyzeProvider(savedAiSettings.provider as Parameters<typeof setAnalyzeProvider>[0], savedAiSettings.model);
const radicoinService = new RadicoinService(database.db);
const deliverOtp = config.SMSIR_USERNAME && config.SMSIR_API_KEY && config.SMSIR_LINE_NUMBER
  ? createSmsIrOtpDelivery(new SmsIrClient({
      username: config.SMSIR_USERNAME,
      apiKey: config.SMSIR_API_KEY,
      lineNumber: config.SMSIR_LINE_NUMBER,
      baseUrl: config.SMSIR_BASE_URL,
      timeoutMs: config.SMSIR_TIMEOUT_MS,
    }))
  : config.OTP_WEBHOOK_URL
    ? createWebhookOtpDelivery(config.OTP_WEBHOOK_URL, config.OTP_WEBHOOK_TOKEN)
    : undefined;
const billingService = new BillingService(database.db, {
  apiPublicUrl: config.API_PUBLIC_URL,
  webAppUrl: config.WEB_APP_URL,
  zarinpalBaseUrl: config.ZARINPAL_BASE_URL,
  zarinpalMerchantId: config.ZARINPAL_MERCHANT_ID,
  radicoinService,
});
const jobPoolService = new JobPoolService(database.db, {
  enabled: config.JOB_POOL_ENABLED,
  apifyApiToken: config.APIFY_API_TOKEN,
  actorId: config.APIFY_LINKEDIN_JOBS_ACTOR_ID,
  dailyLimit: config.JOB_POOL_DAILY_LIMIT,
  intervalHours: config.JOB_POOL_INTERVAL_HOURS,
  locations: config.JOB_POOL_LOCATIONS.split(",").map((location) => location.trim()).filter(Boolean),
  publishedAt: config.JOB_POOL_PUBLISHED_AT,
  costPerThousandUsdMicros: config.JOB_POOL_COST_PER_1000_USD_MICROS,
  actorStartCostUsdMicros: config.JOB_POOL_ACTOR_START_COST_USD_MICROS,
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
    exposeOtpDeliveryError: config.NODE_ENV !== "production",
    deliverOtp,
    googleClientId: config.GOOGLE_CLIENT_ID,
    googleClientSecret: config.GOOGLE_CLIENT_SECRET,
    googleRedirectUri:
      config.GOOGLE_OAUTH_REDIRECT_URI ??
      `${config.WEB_APP_URL}/api/auth/google/callback`,
    grantSignupMembership: (userId) => billingService.ensureSignupMembership(userId),
    radicoinService,
  }),
  billingService,
  radicoinService,
  jobPoolService,
  database: database.db,
      sessionCookieName:
        config.NODE_ENV === "production" ? "__Host-radikar_session" : "radikar_session",
      secureCookies: config.NODE_ENV === "production",
  sessionTtlDays: config.SESSION_TTL_DAYS,
  webAppUrl: config.WEB_APP_URL,
  maxUploadSizeBytes: config.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  apifyApiToken: config.APIFY_API_TOKEN,
  apifyLinkedInActorId: config.APIFY_LINKEDIN_ACTOR_ID,
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
