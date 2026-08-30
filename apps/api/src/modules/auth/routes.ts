import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { normalizeDigits } from "@radicar/validators";
import { z } from "zod";
import { AuthError, AuthService } from "./service";
import { can, type AuthUser, type Permission, type SessionIdentity } from "./types";

declare module "fastify" {
  interface FastifyRequest {
    auth: SessionIdentity | null;
  }
}

const requestOtpSchema = z.object({ phone: z.string().min(1).max(32) });
const verifyOtpSchema = requestOtpSchema.extend({
  challengeId: z.uuid(),
  code: z.string().transform(normalizeDigits).pipe(z.string().regex(/^\d{6}$/)),
});
const optionalQueryValue = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => value === "" ? undefined : value, schema.optional());
const userListSchema = z.object({
  search: z.string().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  role: optionalQueryValue(z.enum(["user", "admin", "superadmin"])),
  status: optionalQueryValue(z.enum(["active", "suspended"])),
});
const recordListSchema = userListSchema.pick({ search: true, page: true, pageSize: true }).extend({
  collection: optionalQueryValue(z.string().max(50)),
});
const userParamsSchema = z.object({ id: z.uuid() });
const eventListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
const updateUserSchema = z
  .object({
    role: z.enum(["user", "admin", "superadmin"]).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((value) => value.role || value.status, "حداقل یک تغییر لازم است.");
const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
});
const updatePreferencesSchema = z.object({
  tablePageSize: z.union([
    z.literal(10),
    z.literal(20),
    z.literal(50),
    z.literal(100),
    z.literal(200),
  ]),
});

export type AuthRouteOptions = {
  authService: AuthServicePort;
  sessionCookieName: string;
  secureCookies: boolean;
  sessionTtlDays: number;
};

export type AuthServicePort = Pick<
  AuthService,
  | "requestOtp"
  | "verifyOtp"
  | "resolveSession"
  | "revokeSession"
  | "getStats"
  | "getRecentEvents"
  | "listUsers"
  | "listAllRecords"
  | "getUserDetails"
  | "updateUser"
  | "updateProfile"
  | "updatePreferences"
>;

function cookieOptions(options: AuthRouteOptions) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: options.secureCookies,
    maxAge: options.sessionTtlDays * 86_400,
  };
}

export function requirePermission(request: FastifyRequest, reply: FastifyReply, permission: Permission) {
  if (!request.auth) {
    reply.code(401).send({ error: "برای ادامه وارد حساب کاربری شو.", requestId: request.id });
    return false;
  }
  if (!can(request.auth.user.role, permission)) {
    reply.code(403).send({ error: "اجازه دسترسی به این بخش را نداری.", requestId: request.id });
    return false;
  }
  return true;
}

export function registerAuthRoutes(app: FastifyInstance, options: AuthRouteOptions) {
  const { authService } = options;
  app.decorateRequest("auth", null);

  app.addHook("onRequest", async (request) => {
    request.auth = await authService.resolveSession(request.cookies[options.sessionCookieName]);
  });

  app.post("/api/auth/request-otp", async (request, reply) => {
    const input = requestOtpSchema.parse(request.body);
    return reply.code(201).send(await authService.requestOtp(input.phone));
  });

  app.post("/api/auth/verify-otp", async (request, reply) => {
    const input = verifyOtpSchema.parse(request.body);
    const result = await authService.verifyOtp(input.challengeId, input.phone, input.code);
    reply.setCookie(options.sessionCookieName, result.sessionToken, cookieOptions(options));
    return { user: result.user, expiresAt: result.sessionExpiresAt.toISOString() };
  });

  app.get("/api/auth/me", async (request, reply) => {
    if (!request.auth) return reply.code(401).send({ error: "نشست فعال نیست.", requestId: request.id });
    return { user: request.auth.user };
  });

  app.patch("/api/account", async (request) => {
    const input = updateProfileSchema.parse(request.body);
    return { user: await authService.updateProfile(request.auth!.user.id, input) };
  });

  app.patch("/api/account/preferences", async (request, reply) => {
    if (!request.auth) {
      return reply.code(401).send({ error: "نشست فعال نیست.", requestId: request.id });
    }
    const input = updatePreferencesSchema.parse(request.body);
    return { user: await authService.updatePreferences(request.auth.user.id, input) };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    if (request.auth) await authService.revokeSession(request.auth.sessionId);
    reply.clearCookie(options.sessionCookieName, { path: "/" });
    return reply.code(204).send();
  });

  app.get("/api/admin/stats", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    return authService.getStats();
  });

  app.get("/api/admin/events", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const query = eventListSchema.parse(request.query);
    return authService.getRecentEvents(query.limit);
  });

  app.get("/api/admin/users", async (request, reply) => {
    if (!requirePermission(request, reply, "users:read:any")) return;
    const query = userListSchema.parse(request.query);
    return authService.listUsers(query.search, query.page, query.pageSize, query.role, query.status);
  });

  app.get("/api/admin/records", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const query = recordListSchema.parse(request.query);
    return authService.listAllRecords(query.page, query.pageSize, query.search, query.collection);
  });

  app.get<{ Params: { id: string } }>("/api/admin/users/:id", async (request, reply) => {
    if (!requirePermission(request, reply, "users:read:any")) return;
    return authService.getUserDetails(userParamsSchema.parse(request.params).id);
  });

  app.patch<{ Params: { id: string } }>("/api/admin/users/:id", async (request, reply) => {
    const userId = userParamsSchema.parse(request.params).id;
    const input = updateUserSchema.parse(request.body);
    if (input.role) {
      if (!requirePermission(request, reply, "users:read:any")) return;
    } else if (!requirePermission(request, reply, "memberships:manage:any")) {
      return;
    }
    if (request.auth?.user.id === userId) {
      return reply.code(400).send({ error: "نقش یا وضعیت حساب خودت را از این بخش تغییر نده.", requestId: request.id });
    }
    if (request.auth?.user.role === "admin") {
      const target = await authService.getUserDetails(userId);
      if (target.role !== "user") {
        return reply.code(403).send({
          error: "ادمین فقط می‌تواند حساب کاربران عادی را تعلیق یا فعال کند.",
          requestId: request.id,
        });
      }
    }
    return authService.updateUser(userId, input);
  });
}

export function handleAuthError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (!(error instanceof AuthError)) return false;
  reply.code(error.statusCode).send({ error: error.message, requestId: request.id });
  return true;
}

export type { AuthUser };
