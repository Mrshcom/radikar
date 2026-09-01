import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import Fastify, { type FastifyServerOptions } from "fastify";
import { normalizeDigitsDeep } from "@radicar/validators";
import { ZodError } from "zod";
import { registerDataRoutes } from "./modules/data/routes";
import { registerAiRoutes } from "./modules/ai/routes";
import type { RecordRepository } from "./modules/data/record-repository";
import { registerHealthRoutes } from "./modules/health/routes";
import { registerImportRoutes } from "./modules/imports/routes";
import { handleAuthError, registerAuthRoutes, type AuthServicePort } from "./modules/auth/routes";
import { handleBillingError, registerBillingRoutes } from "./modules/billing/routes";
import type { BillingService } from "./modules/billing/service";

type BuildAppOptions = {
  repository: RecordRepository;
  readinessCheck: () => Promise<void>;
  corsOrigins: string[];
  logger?: FastifyServerOptions["logger"];
  authService: AuthServicePort;
  sessionCookieName: string;
  secureCookies: boolean;
  sessionTtlDays: number;
  billingService?: BillingService;
};

export function buildApp({
  repository,
  readinessCheck,
  corsOrigins,
  logger = true,
  authService,
  sessionCookieName,
  secureCookies,
  sessionTtlDays,
  billingService,
}: BuildAppOptions) {
  const app = Fastify({
    logger,
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024,
    requestIdHeader: "x-request-id",
  });

  app.register(cors, {
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
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
    limits: { files: 1, fileSize: 8 * 1024 * 1024 },
  });

  registerHealthRoutes(app, readinessCheck);
  registerAuthRoutes(app, { authService, sessionCookieName, secureCookies, sessionTtlDays });
  app.addHook("preHandler", async (request, reply) => {
    const publicPaths = new Set([
      "/health",
      "/ready",
      "/api/auth/request-otp",
      "/api/auth/verify-otp",
      "/api/auth/logout",
      "/api/billing/callback",
    ]);
    if (request.method === "OPTIONS" || publicPaths.has(request.url.split("?")[0])) return;
    if (!request.auth) {
      return reply.code(401).send({
        error: "برای ادامه وارد حساب کاربری شو.",
        requestId: request.id,
      });
    }
  });
  registerDataRoutes(app, repository, billingService);
  if (billingService) registerBillingRoutes(app, billingService);
  registerAiRoutes(app, billingService);
  registerImportRoutes(app, billingService);

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: "مسیر درخواستی پیدا نشد.",
      requestId: request.id,
    }),
  );

  app.setErrorHandler((error, request, reply) => {
    if (handleAuthError(error, request, reply)) return;
    if (handleBillingError(error, request, reply)) return;
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "داده ورودی معتبر نیست.",
        issues: error.issues,
        requestId: request.id,
      });
    }

    request.log.error(error);
    return reply.code(500).send({
      error: "خطای داخلی سرویس رخ داد.",
      requestId: request.id,
    });
  });

  return app;
}
