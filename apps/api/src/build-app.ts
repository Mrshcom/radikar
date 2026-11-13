import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import { randomBytes, randomUUID } from "node:crypto";
import Fastify, { type FastifyServerOptions } from "fastify";
import { normalizeDigitsDeep } from "@radikar/validators";
import { ZodError } from "zod";
import { registerDataRoutes } from "./modules/data/routes";
import { registerAiRoutes } from "./modules/ai/routes";
import type { RecordRepository } from "./modules/data/record-repository";
import { registerHealthRoutes } from "./modules/health/routes";
import { registerImportRoutes } from "./modules/imports/routes";
import { registerJobPoolRoutes } from "./modules/job-pool/routes";
import type { JobPoolService } from "./modules/job-pool/service";
import { handleAuthError, registerAuthRoutes, type AuthServicePort } from "./modules/auth/routes";
import { handleBillingError, registerBillingRoutes } from "./modules/billing/routes";
import type { BillingService } from "./modules/billing/service";
import { handleRadicoinError, registerRadicoinRoutes } from "./modules/radicoin/routes";
import type { RadicoinService } from "./modules/radicoin/service";
import type { Database } from "@radikar/database";
import type { ProductEventService } from "./modules/analytics/service";
import { handleProductTimelineError, registerProductTimelineRoutes } from "./modules/product-timeline/routes";
import { ProductTimelineService } from "./modules/product-timeline/service";
import type { InterviewAgentClient } from "./modules/ai/interview-agent";
import { registerEmployerRoutes } from "./modules/employer/routes";
import { registerSupportRoutes } from "./modules/support/routes";
import { registerNotificationRoutes } from "./modules/notifications/routes";
import type { InterviewInvitationDelivery } from "./modules/notifications/otp-delivery";

type BuildAppOptions = {
  fastifyFactory?: typeof Fastify;
  repository: RecordRepository;
  readinessCheck: () => Promise<void>;
  corsOrigins: string[];
  logger?: FastifyServerOptions["logger"];
  authService: AuthServicePort;
  sessionCookieName: string;
  secureCookies: boolean;
  sessionTtlDays: number;
  webAppUrl?: string;
  maxUploadSizeBytes?: number;
  apifyApiToken?: string;
  apifyLinkedInActorId?: string;
  billingService?: BillingService;
  radicoinService?: RadicoinService;
  database?: Database;
  jobPoolService?: JobPoolService;
  productEvents?: ProductEventService;
  exposeReversedOtp?: boolean;
  interviewAgent?: InterviewAgentClient;
  interviewChatSecret?: string;
  deliverInterviewInvitation?: InterviewInvitationDelivery;
};

const fallbackInterviewChatSecret = randomBytes(32).toString("hex");

const employerResumeBatchSizeBytes = 40 * 1024 * 1024;
const multipartFileLimit = 100;

export function buildApp({
  fastifyFactory = Fastify,
  repository,
  readinessCheck,
  corsOrigins,
  logger = true,
  authService,
  sessionCookieName,
  secureCookies,
  sessionTtlDays,
  webAppUrl = "http://localhost:3161",
  maxUploadSizeBytes = 8 * 1024 * 1024,
  apifyApiToken,
  apifyLinkedInActorId,
  billingService,
  radicoinService,
  database,
  jobPoolService,
  productEvents,
  exposeReversedOtp = false,
  interviewAgent,
  interviewChatSecret = fallbackInterviewChatSecret,
  deliverInterviewInvitation,
}: BuildAppOptions) {
  const app = fastifyFactory({
    logger,
    trustProxy: true,
    // Employer resume-bank uploads allow up to 100 files with a 40 MB combined cap.
    // The former per-file body limit rejected otherwise valid batches before the route could parse them.
    bodyLimit: Math.max(maxUploadSizeBytes, employerResumeBatchSizeBytes) + 512 * 1024,
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
  });

  app.register(cors, {
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    ...(exposeReversedOtp ? { exposedHeaders: ["x-radikar-otp-reversed"] } : {}),
  });
  app.register(cookie);
  app.addHook("preValidation", async (request) => {
    request.body = normalizeDigitsDeep(request.body);
    request.query = normalizeDigitsDeep(request.query);
    request.params = normalizeDigitsDeep(request.params);
  });
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    const changesState = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    if (changesState && origin && !corsOrigins.includes(origin)) {
      return reply.code(403).send({
        error: "مبدأ درخواست مجاز نیست.",
        requestId: request.id,
      });
    }
  });
  app.register(multipart, {
    // Routes that accept a single document still call request.file(); employer routes
    // explicitly enforce their tighter 5 MB-per-file and 40 MB-per-batch limits.
    limits: { files: multipartFileLimit, fileSize: maxUploadSizeBytes },
  });

  registerHealthRoutes(app, readinessCheck);
  registerAuthRoutes(app, {
    authService,
    sessionCookieName,
    secureCookies,
    sessionTtlDays,
    webAppUrl,
    productEvents,
    exposeReversedOtp,
  });
  app.addHook("preHandler", async (request, reply) => {
    const publicPaths = new Set([
      "/health",
      "/ready",
      "/api/auth/request-otp",
      "/api/auth/verify-otp",
      "/api/auth/logout",
      "/api/auth/providers",
      "/api/auth/google/start",
      "/api/auth/google/callback",
      "/api/referrals/visits",
      "/api/referrals/leaderboard",
      "/api/billing/callback",
      "/api/billing/credit-packs/callback",
      "/api/billing/radicoin-packs/callback",
    ]);
    if (request.method === "OPTIONS" || publicPaths.has(request.url.split("?")[0])) return;
    if (!request.auth) {
      return reply.code(401).send({
        error: "برای ادامه وارد حساب کاربری شو.",
        requestId: request.id,
      });
    }
    const path = request.url.split("?")[0];
    const candidateOnly = [
      "/v1/data/",
      "/api/match/",
      "/api/resume/",
      "/api/interview/",
      "/api/knowledge/",
      "/api/job-import",
      "/api/panel/dashboard",
    ];
    if (
      request.auth.user.role === "user" &&
      request.auth.user.accountType === "employer" &&
      candidateOnly.some((prefix) => path.startsWith(prefix))
    ) {
      return reply.code(403).send({ error: "این بخش برای حساب کارجو است.", requestId: request.id });
    }
  });
  registerDataRoutes(app, repository, billingService, radicoinService, productEvents);
  if (billingService) registerBillingRoutes(app, billingService);
  if (radicoinService) registerRadicoinRoutes(app, radicoinService);
  registerAiRoutes(app, billingService, database, productEvents, interviewAgent, interviewChatSecret);
  registerImportRoutes(app, billingService, maxUploadSizeBytes, {
    apiToken: apifyApiToken,
    linkedInActorId: apifyLinkedInActorId,
  });
  if (jobPoolService) registerJobPoolRoutes(app, jobPoolService);
  if (database) registerProductTimelineRoutes(app, new ProductTimelineService(database));
  if (database) registerSupportRoutes(app, database);
  if (database) registerNotificationRoutes(app, database);
  if (database && radicoinService)
    registerEmployerRoutes(
      app,
      database,
      radicoinService,
      webAppUrl,
      interviewAgent,
      deliverInterviewInvitation,
    );

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: "مسیر درخواستی پیدا نشد.",
      requestId: request.id,
    }),
  );

  app.setErrorHandler((error, request, reply) => {
    if (handleAuthError(error, request, reply)) return;
    if (handleBillingError(error, request, reply)) return;
    if (handleRadicoinError(error, request, reply)) return;
    if (handleProductTimelineError(error, request, reply)) return;
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "داده ورودی معتبر نیست.",
        issues: error.issues,
        requestId: request.id,
      });
    }
    const errorCode = error instanceof Error && "code" in error ? (error as Error & { code?: string }).code : undefined;
    if (errorCode === "FST_FILES_LIMIT")
      return reply.code(413).send({ error: "تعداد فایل‌های ارسالی بیش از حد مجاز است.", requestId: request.id });
    if (errorCode === "FST_REQ_FILE_TOO_LARGE")
      return reply.code(413).send({ error: "حجم یکی از فایل‌های ارسالی بیش از حد مجاز است.", requestId: request.id });
    if (errorCode === "FST_ERR_CTP_BODY_TOO_LARGE")
      return reply.code(413).send({ error: "حجم مجموع فایل‌های ارسالی بیش از حد مجاز است.", requestId: request.id });

    request.log.error(error);
    return reply.code(500).send({
      error: "خطای داخلی سرویس رخ داد.",
      requestId: request.id,
    });
  });

  return app;
}
