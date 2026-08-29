import { sql } from "drizzle-orm";
import { createDatabase } from "@radicar/database";
import { buildApp } from "./app";
import { loadLocalEnvironment, readConfig } from "@radicar/config/server";
import { PostgresRecordRepository } from "./modules/data/record-repository";
import { AuthService } from "./modules/auth/service";
import { BillingService } from "./modules/billing/service";

loadLocalEnvironment();
const config = readConfig();
const database = createDatabase(
  config.DATABASE_URL,
  config.DATABASE_MAX_CONNECTIONS,
);
const billingService = new BillingService(database.db, {
  apiPublicUrl: config.API_PUBLIC_URL,
  webAppUrl: config.WEB_APP_URL,
  zarinpalBaseUrl: config.ZARINPAL_BASE_URL,
  zarinpalMerchantId: config.ZARINPAL_MERCHANT_ID,
});
const app = buildApp({
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
    exposeDevelopmentOtp: config.NODE_ENV !== "production" && config.EXPOSE_DEVELOPMENT_OTP,
    otpWebhookUrl: config.OTP_WEBHOOK_URL,
    otpWebhookToken: config.OTP_WEBHOOK_TOKEN,
    grantSignupMembership: (userId) => billingService.ensureSignupMembership(userId),
  }),
  billingService,
  sessionCookieName: config.NODE_ENV === "production" ? "__Host-radicar_session" : "radicar_session",
  secureCookies: config.NODE_ENV === "production",
  sessionTtlDays: config.SESSION_TTL_DAYS,
});

async function shutdown(signal: string) {
  app.log.info({ signal }, "Shutting down API");
  await app.close();
  await database.close();
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  await database.close();
  process.exit(1);
}
