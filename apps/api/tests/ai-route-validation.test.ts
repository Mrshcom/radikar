import assert from "node:assert/strict";
import test from "node:test";
import type { DataCollection, DataRecord } from "@radikar/shared-types";
import { buildApp } from "../src/build-app";
import type { AuthServicePort } from "../src/modules/auth/routes";
import type { AuthUser, SessionIdentity } from "../src/modules/auth/types";
import type { RecordRepository } from "../src/modules/data/record-repository";

const user: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111", phone: "09120000000", fullName: "کاربر",
  role: "user", status: "active", tablePageSize: 20, createdAt: "2026-01-01T00:00:00.000Z", lastLoginAt: null,
};
const identity: SessionIdentity = { user, sessionId: "session" };
const authService: AuthServicePort = {
  requestOtp: async () => ({ challengeId: crypto.randomUUID(), expiresInSeconds: 180 }),
  verifyOtp: async () => ({ user, sessionToken: "user-token", sessionExpiresAt: new Date("2027-01-01") }),
  resolveSession: async (token) => token === "user-token" ? identity : null,
  revokeSession: async () => undefined,
  getStats: async () => ({ users: { total: 0, active: 0, registeredToday: 0, activeToday: 0 }, records: { total: 0, resumes: 0, resumesToday: 0, byCollection: [] }, usersByRole: [] }),
  getRecentEvents: async () => ({ items: [] }), listUsers: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  listAllRecords: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }), getUserDetails: async () => ({ ...user, records: [] }),
  updateUser: async () => user, updateProfile: async () => user, updatePreferences: async () => user,
};
const repository: RecordRepository = {
  list: async () => [], get: async () => null,
  put: async (_owner: string, _collection: DataCollection, record: DataRecord) => record,
  remove: async () => undefined, clear: async () => undefined,
};

function createApp() {
  return buildApp({ repository, readinessCheck: async () => undefined, corsOrigins: ["http://localhost:3161"], logger: false,
    authService, sessionCookieName: "radikar_session", secureCookies: false, sessionTtlDays: 30 });
}

test("AI routes reject incomplete inputs before invoking a model", async () => {
  const app = createApp();
  const cookies = { radikar_session: "user-token" };
  const requests = await Promise.all([
    app.inject({ method: "POST", url: "/api/match/analyze", cookies, payload: { jobDescription: "", resume: {} } }),
    app.inject({ method: "POST", url: "/api/match/tailor", cookies, payload: { jobDescription: "", resume: {} } }),
    app.inject({ method: "POST", url: "/api/resume/generate", cookies, payload: { resume: {} } }),
    app.inject({ method: "POST", url: "/api/panel/dashboard", cookies, payload: { resume: {} } }),
    app.inject({ method: "POST", url: "/api/interview/session", cookies, payload: { resume: {} } }),
    app.inject({ method: "POST", url: "/api/interview/feedback", cookies, payload: { question: "سؤال", answer: "" } }),
  ]);
  assert.deepEqual(requests.map((response) => response.statusCode), [422, 422, 422, 422, 422, 400]);
  await app.close();
});

test("AI settings are protected from customer accounts", async () => {
  const app = createApp();
  const response = await app.inject({ method: "PATCH", url: "/api/admin/ai-settings", cookies: { radikar_session: "user-token" }, payload: { provider: "gapgpt", model: "x" } });
  assert.equal(response.statusCode, 403);
  await app.close();
});
