import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { normalizeDigits } from "@radikar/validators";
import { updateAdminAliasSchema } from "@radikar/validators";
import { z } from "zod";
import { AuthError, AuthService } from "./service";
import { can, type AuthUser, type OnboardingState, type Permission, type SessionIdentity } from "./types";
import type { ProductEventService } from "../analytics/service";

declare module "fastify" {
  interface FastifyRequest {
    auth: SessionIdentity | null;
  }
}

const requestOtpSchema = z.object({ phone: z.string().min(1).max(32) });
const verifyOtpSchema = requestOtpSchema.extend({
  challengeId: z.uuid(),
  code: z.string().transform(normalizeDigits).pipe(z.string().regex(/^\d{6}$/)),
  referralCode: z.string().max(20).optional(),
});
const googleStartSchema = z.object({
  next: z.string().max(500).optional(),
  ref: z.string().max(20).optional(),
});
const referralVisitSchema = z.object({ code: z.string().min(1).max(20) });
const referralSettingsSchema = z.object({
  isActive: z.boolean(),
  referrerPoints: z.number().int().min(0).max(10_000),
  referredPoints: z.number().int().min(0).max(10_000),
});
const referralAdjustmentSchema = z.object({
  points: z.number().int().min(-10_000).max(10_000).refine((value) => value !== 0),
  description: z.string().trim().min(3).max(200),
});
const googleCallbackSchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().max(100).optional(),
});
const optionalQueryValue = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => value === "" ? undefined : value, schema.optional());
const userListSchema = z.object({
  search: z.string().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
  role: optionalQueryValue(z.enum(["user", "admin", "superadmin"])),
  status: optionalQueryValue(z.enum(["active", "suspended"])),
  sortBy: optionalQueryValue(z.string().max(40)),
  sortDirection: optionalQueryValue(z.enum(["asc", "desc"])),
});
const recordListSchema = userListSchema.pick({ search: true, page: true, pageSize: true }).extend({
  collection: optionalQueryValue(z.string().max(50)),
  sortBy: optionalQueryValue(z.string().max(40)),
  sortDirection: optionalQueryValue(z.enum(["asc", "desc"])),
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
const onboardingStateSchema = z.object({
  version: z.literal(1),
  status: z.enum(["not_started", "active", "dismissed", "completed"]),
  completedSteps: z.array(z.enum(["profile", "match", "resume", "application"])).max(4)
    .transform((steps) => [...new Set(steps)]),
}).superRefine((state, context) => {
  if (state.status === "completed" && state.completedSteps.length !== 4) {
    context.addIssue({ code: "custom", message: "راهنما فقط پس از تکمیل همه مراحل کامل می‌شود." });
  }
});

export type AuthRouteOptions = {
  authService: AuthServicePort;
  sessionCookieName: string;
  secureCookies: boolean;
  sessionTtlDays: number;
  webAppUrl: string;
  productEvents?: ProductEventService;
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
  | "updateOnboarding"
> &
  Partial<
    Pick<
      AuthService,
      | "isGoogleLoginEnabled"
      | "beginGoogleLogin"
      | "completeGoogleLogin"
      | "listUserSessions"
      | "revokeUserSession"
      | "getReferralDashboard"
      | "getReferralLeaderboard"
      | "getAdminReferralReport"
      | "recordReferralVisit"
      | "getReferralSettings"
      | "updateReferralSettings"
      | "adjustReferralPoints"
    >
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
  const googleStateCookieName = `${options.sessionCookieName}_google_oauth`;
  app.decorateRequest("auth", null);

  app.addHook("onRequest", async (request) => {
    request.auth = await authService.resolveSession(request.cookies[options.sessionCookieName]);
  });

  app.post("/api/auth/request-otp", async (request, reply) => {
    const input = requestOtpSchema.parse(request.body);
    await options.productEvents?.record("auth_otp_requested", `otp-request:${request.id}`, undefined, { auth_method: "phone" });
    try {
      const result = await authService.requestOtp(input.phone);
      await options.productEvents?.record("auth_otp_delivery_result", `otp-delivery:${request.id}`, undefined, { auth_method: "phone", result: "success" });
      return reply.code(201).send(result);
    } catch (error) {
      await options.productEvents?.record("auth_otp_delivery_result", `otp-delivery:${request.id}`, undefined, { auth_method: "phone", result: "failure" });
      throw error;
    }
  });

  app.post("/api/auth/verify-otp", async (request, reply) => {
    const input = verifyOtpSchema.parse(request.body);
    const result = await authService.verifyOtp(input.challengeId, input.phone, input.code, request.ip, input.referralCode);
    await options.productEvents?.record("auth_signup_completed", `signup:phone:${input.challengeId}`, result.user.id, { auth_method: "phone", referral_present: Boolean(input.referralCode) });
    reply.setCookie(options.sessionCookieName, result.sessionToken, cookieOptions(options));
    return { user: result.user, expiresAt: result.sessionExpiresAt.toISOString() };
  });

  app.get("/api/auth/providers", async () => ({
    google: authService.isGoogleLoginEnabled?.() ?? false,
  }));

  app.get("/api/auth/google/start", async (request, reply) => {
    if (!authService.beginGoogleLogin) {
      return reply.redirect(`${options.webAppUrl}/login?authError=google_unavailable`);
    }
    try {
      const input = googleStartSchema.parse(request.query);
      const result = await authService.beginGoogleLogin(input.next, input.ref);
      reply.setCookie(googleStateCookieName, result.state, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: options.secureCookies,
        maxAge: 10 * 60,
      });
      return reply.redirect(result.authorizationUrl);
    } catch {
      return reply.redirect(`${options.webAppUrl}/login?authError=google_unavailable`);
    }
  });

  app.get("/api/auth/google/callback", async (request, reply) => {
    const input = googleCallbackSchema.parse(request.query);
    if (input.error || !input.code || !input.state || !authService.completeGoogleLogin) {
      reply.clearCookie(googleStateCookieName, { path: "/" });
      return reply.redirect(`${options.webAppUrl}/login?authError=google_denied`);
    }
    try {
      const result = await authService.completeGoogleLogin(
        input.code,
        input.state,
        request.cookies[googleStateCookieName],
        request.ip,
      );
      reply.clearCookie(googleStateCookieName, { path: "/" });
      reply.setCookie(options.sessionCookieName, result.sessionToken, cookieOptions(options));
      return reply.redirect(new URL(result.nextPath, options.webAppUrl).toString());
    } catch (error) {
      request.log.warn({ error }, "Google login callback failed");
      reply.clearCookie(googleStateCookieName, { path: "/" });
      return reply.redirect(`${options.webAppUrl}/login?authError=google_failed`);
    }
  });

  app.get("/api/auth/me", async (request, reply) => {
    if (!request.auth) return reply.code(401).send({ error: "نشست فعال نیست.", requestId: request.id });
    return { user: request.auth.user };
  });

  app.post("/api/referrals/visits", async (request, reply) => {
    const { code } = referralVisitSchema.parse(request.body);
    await authService.recordReferralVisit?.(code, request.ip, request.headers["user-agent"]);
    return reply.code(204).send();
  });

  app.get("/api/referrals/leaderboard", async () => ({
    items: await authService.getReferralLeaderboard?.() ?? [],
  }));

  app.get("/api/referrals/me", async (request, reply) => {
    if (!request.auth) return reply.code(401).send({ error: "نشست فعال نیست.", requestId: request.id });
    return { referral: await authService.getReferralDashboard?.(request.auth.user.id) };
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

  app.patch("/api/account/onboarding", async (request, reply) => {
    if (!request.auth) {
      return reply.code(401).send({ error: "نشست فعال نیست.", requestId: request.id });
    }
    const input = onboardingStateSchema.parse(request.body) as OnboardingState;
    return { user: await authService.updateOnboarding(request.auth.user.id, input) };
  });

  app.get("/api/account/sessions", async (request, reply) => {
    if (!request.auth) {
      return reply.code(401).send({ error: "نشست فعال نیست.", requestId: request.id });
    }
    return {
      sessions: await authService.listUserSessions?.(
        request.auth.user.id,
        request.auth.sessionId,
      ) ?? [],
    };
  });

  app.post("/api/account/sessions/:id/revoke", async (request, reply) => {
    if (!request.auth) {
      return reply.code(401).send({ error: "نشست فعال نیست.", requestId: request.id });
    }
    const { id } = userParamsSchema.parse(request.params);
    if (id === request.auth.sessionId) {
      return reply.code(400).send({ error: "برای خروج از نشست فعلی از گزینه خروج استفاده کن.", requestId: request.id });
    }
    await authService.revokeUserSession?.(request.auth.user.id, id, request.ip);
    return reply.code(204).send();
  });

  app.post("/api/auth/logout", async (request, reply) => {
    if (request.auth) await authService.revokeSession(request.auth.sessionId, request.ip);
    reply.clearCookie(options.sessionCookieName, { path: "/" });
    return reply.code(204).send();
  });

  app.get("/api/admin/stats", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    return authService.getStats();
  });

  app.get("/api/admin/referrals/settings", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    return { settings: await authService.getReferralSettings?.() };
  });

  app.get("/api/admin/referrals", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const { page, pageSize } = userListSchema.pick({ page: true, pageSize: true }).parse(request.query);
    return await authService.getAdminReferralReport?.(page, pageSize) ?? { items: [], total: 0, page, pageSize };
  });

  app.patch("/api/admin/referrals/settings", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const input = referralSettingsSchema.parse(request.body);
    return { settings: await authService.updateReferralSettings?.(input) };
  });

  app.post("/api/admin/referrals/users/:id/adjust", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const { id } = userParamsSchema.parse(request.params);
    const input = referralAdjustmentSchema.parse(request.body);
    return { event: await authService.adjustReferralPoints?.(id, input.points, input.description, request.auth!.user.id) };
  });

  app.get("/api/admin/events", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const query = eventListSchema.parse(request.query);
    return authService.getRecentEvents(query.limit);
  });

  app.get("/api/admin/users", async (request, reply) => {
    if (!requirePermission(request, reply, "users:read:any")) return;
    const query = userListSchema.parse(request.query);
    return query.sortBy || query.sortDirection
      ? authService.listUsers(query.search, query.page, query.pageSize, query.role, query.status, query.sortBy, query.sortDirection)
      : authService.listUsers(query.search, query.page, query.pageSize, query.role, query.status);
  });

  app.get("/api/admin/records", async (request, reply) => {
    if (!requirePermission(request, reply, "reports:read:any")) return;
    const query = recordListSchema.parse(request.query);
    return query.sortBy || query.sortDirection
      ? authService.listAllRecords(query.page, query.pageSize, query.search, query.collection, query.sortBy, query.sortDirection)
      : authService.listAllRecords(query.page, query.pageSize, query.search, query.collection);
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
    return authService.updateUser(userId, input, request.auth!.user.id);
  });

  app.patch<{ Params: { id: string } }>("/api/admin/users/:id/alias", async (request, reply) => {
    if (!requirePermission(request, reply, "users:read:any")) return;
    const userId = userParamsSchema.parse(request.params).id;
    return (authService as AuthService).updateAdminAlias(userId, updateAdminAliasSchema.parse(request.body));
  });
}

export function handleAuthError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  if (!(error instanceof AuthError)) return false;
  reply.code(error.statusCode).send({ error: error.message, requestId: request.id });
  return true;
}

export type { AuthUser };
