import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { ZodError } from "zod";
import type { Database } from "@radikar/database";
import type { AuthUser, SessionIdentity } from "../src/modules/auth/types";
import { registerSupportRoutes } from "../src/modules/support/routes";

const user: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  phone: "09120000000",
  email: null,
  fullName: "کاربر",
  role: "user",
  accountType: "candidate",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  tablePageSize: 20,
  onboardingState: { version: 1, status: "not_started", completedSteps: [] },
};

function createApp() {
  const app = Fastify({ logger: false });
  app.decorateRequest("auth", null);
  app.addHook("onRequest", async (request) => {
    const role = request.headers["x-test-role"] as AuthUser["role"] | undefined;
    request.auth = role ? ({ user: { ...user, role }, sessionId: "test" } as SessionIdentity) : null;
  });
  registerSupportRoutes(app, {} as Database);
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) return reply.code(400).send({ error: "داده ورودی معتبر نیست." });
    return reply.code(500).send({ error: "خطای داخلی" });
  });
  return app;
}

test("support routes require authentication and reserve the shared inbox for superadmin", async () => {
  const app = createApp();
  for (const role of [undefined, "user", "admin"] as const) {
    const response = await app.inject({ method: "GET", url: "/api/admin/support/tickets", headers: role ? { "x-test-role": role } : {} });
    assert.equal(response.statusCode, role ? 403 : 401);
  }
  const managementUser = await app.inject({ method: "GET", url: "/api/support/tickets", headers: { "x-test-role": "admin" } });
  assert.equal(managementUser.statusCode, 403);
  await app.close();
});

test("ticket creation rejects incomplete requests before touching storage", async () => {
  const app = createApp();
  const response = await app.inject({ method: "POST", url: "/api/support/tickets", headers: { "x-test-role": "user" }, payload: { subject: "کم", category: "other", message: "کوتاه" } });
  assert.equal(response.statusCode, 400);
  await app.close();
});
