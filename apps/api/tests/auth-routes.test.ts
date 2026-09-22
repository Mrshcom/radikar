import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/build-app";
import type { AuthServicePort } from "../src/modules/auth/routes";
import type { AuthUser, SessionIdentity } from "../src/modules/auth/types";
import type { RecordRepository } from "../src/modules/data/record-repository";

const user: AuthUser = { id: "11111111-1111-4111-8111-111111111111", phone: "09120000000", fullName: "کاربر", role: "user", status: "active", tablePageSize: 20, createdAt: "2026-01-01T00:00:00.000Z", lastLoginAt: null };
const admin: AuthUser = { ...user, id: "22222222-2222-4222-8222-222222222222", role: "admin" };
const superadmin: AuthUser = { ...user, id: "33333333-3333-4333-8333-333333333333", role: "superadmin" };
const identities: Record<string, SessionIdentity> = { user: { user, sessionId: "session-user" }, admin: { user: admin, sessionId: "session-admin" }, superadmin: { user: superadmin, sessionId: "session-superadmin" } };

function createApp() {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const authService: AuthServicePort = {
    requestOtp: async (phone) => { calls.push({ name: "requestOtp", args: [phone] }); return { challengeId: "11111111-1111-4111-8111-111111111111", expiresInSeconds: 180 }; },
    verifyOtp: async (...args) => { calls.push({ name: "verifyOtp", args }); return { user, sessionToken: "user", sessionExpiresAt: new Date("2027-01-01") }; },
    resolveSession: async (token) => token ? identities[token] ?? null : null,
    revokeSession: async (...args) => { calls.push({ name: "revokeSession", args }); },
    getStats: async () => ({ users: { total: 1, active: 1, registeredToday: 0, activeToday: 0 }, records: { total: 0, resumes: 0, resumesToday: 0, byCollection: [] }, usersByRole: [] }),
    getRecentEvents: async (...args) => { calls.push({ name: "getRecentEvents", args }); return { items: [] }; },
    listUsers: async (...args) => { calls.push({ name: "listUsers", args }); return { items: [], total: 0, page: 2, pageSize: 10 }; },
    listAllRecords: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
    getUserDetails: async () => ({ ...user, records: [] }),
    updateUser: async (...args) => { calls.push({ name: "updateUser", args }); return user; },
    updateProfile: async (...args) => { calls.push({ name: "updateProfile", args }); return { ...user, fullName: "نام جدید" }; },
    updatePreferences: async (...args) => { calls.push({ name: "updatePreferences", args }); return { ...user, tablePageSize: 50 }; },
  };
  const repository: RecordRepository = { list: async () => [], get: async () => null, put: async (_o, _c, record) => record, remove: async () => undefined, clear: async () => undefined };
  const app = buildApp({ repository, readinessCheck: async () => undefined, corsOrigins: ["http://localhost:3161"], logger: false, authService, sessionCookieName: "radikar_session", secureCookies: false, sessionTtlDays: 30 });
  return { app, calls };
}

test("auth request and verify routes normalize input, set a cookie and expose the session", async () => {
  const { app, calls } = createApp();
  const requested = await app.inject({ method: "POST", url: "/api/auth/request-otp", payload: { phone: "۰۹۱۲۱۲۳۴۵۶۷" } });
  assert.equal(requested.statusCode, 201);
  assert.deepEqual(calls.find((call) => call.name === "requestOtp")?.args, ["09121234567"]);
  const verified = await app.inject({ method: "POST", url: "/api/auth/verify-otp", payload: { phone: "09120000000", challengeId: "11111111-1111-4111-8111-111111111111", code: "۱۲۳۴۵۶" } });
  assert.equal(verified.statusCode, 200);
  assert.match(String(verified.headers["set-cookie"]), /radikar_session=user/);
  assert.deepEqual(calls.find((call) => call.name === "verifyOtp")?.args, ["11111111-1111-4111-8111-111111111111", "09120000000", "123456"]);
  const me = await app.inject({ method: "GET", url: "/api/auth/me", cookies: { radikar_session: "user" } });
  assert.equal(me.statusCode, 200);
  assert.equal(me.json().user.id, user.id);
  await app.close();
});

test("account preferences, admin filters and permission boundaries are enforced", async () => {
  const { app, calls } = createApp();
  const prefs = await app.inject({ method: "PATCH", url: "/api/account/preferences", cookies: { radikar_session: "user" }, payload: { tablePageSize: 50 } });
  assert.equal(prefs.statusCode, 200);
  assert.deepEqual(calls.find((call) => call.name === "updatePreferences")?.args, [user.id, { tablePageSize: 50 }]);
  const users = await app.inject({ method: "GET", url: "/api/admin/users?search=ali&page=2&pageSize=10&role=user&status=active", cookies: { radikar_session: "superadmin" } });
  assert.equal(users.statusCode, 200);
  assert.deepEqual(calls.find((call) => call.name === "listUsers")?.args, ["ali", 2, 10, "user", "active"]);
  const forbidden = await app.inject({ method: "GET", url: "/api/admin/users", cookies: { radikar_session: "user" } });
  assert.equal(forbidden.statusCode, 403);
  const malformed = await app.inject({ method: "PATCH", url: "/api/account/preferences", cookies: { radikar_session: "user" }, payload: { tablePageSize: 25 } });
  assert.equal(malformed.statusCode, 400);
  await app.close();
});
