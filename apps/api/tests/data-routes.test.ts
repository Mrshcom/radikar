import assert from "node:assert/strict";
import test from "node:test";
import type { DataCollection, DataRecord } from "@radicar/shared-types";
import { buildApp } from "../src/app";
import type { RecordRepository } from "../src/modules/data/record-repository";
import type { AuthServicePort } from "../src/modules/auth/routes";
import type { AuthUser, SessionIdentity } from "../src/modules/auth/types";

class MemoryRecordRepository implements RecordRepository {
  private readonly records = new Map<string, DataRecord>();

  private key(ownerUserId: string, collection: DataCollection, id: string) {
    return `${ownerUserId}:${collection}:${id}`;
  }

  async list(ownerUserId: string, collection: DataCollection) {
    return [...this.records.entries()]
      .filter(([key]) => key.startsWith(`${ownerUserId}:${collection}:`))
      .map(([, record]) => record);
  }

  async get(ownerUserId: string, collection: DataCollection, id: string) {
    return this.records.get(this.key(ownerUserId, collection, id)) ?? null;
  }

  async put(ownerUserId: string, collection: DataCollection, record: DataRecord) {
    this.records.set(this.key(ownerUserId, collection, record.id), record);
    return record;
  }

  async remove(ownerUserId: string, collection: DataCollection, id: string) {
    this.records.delete(this.key(ownerUserId, collection, id));
  }

  async clear(ownerUserId: string, collection: DataCollection) {
    for (const key of this.records.keys()) {
      if (key.startsWith(`${ownerUserId}:${collection}:`)) this.records.delete(key);
    }
  }
}

const testUser: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  phone: "09120000000",
  fullName: "کاربر تست",
  role: "superadmin",
  status: "active",
  createdAt: "2026-08-27T10:00:00.000Z",
  lastLoginAt: "2026-08-27T10:00:00.000Z",
};
const testIdentity: SessionIdentity = { user: testUser, sessionId: "session-test" };
const otherIdentity: SessionIdentity = {
  user: { ...testUser, id: "33333333-3333-4333-8333-333333333333", phone: "09121111111", role: "user" },
  sessionId: "session-other",
};
const adminIdentity: SessionIdentity = {
  user: { ...testUser, id: "44444444-4444-4444-8444-444444444444", phone: "09122222222", role: "admin" },
  sessionId: "session-admin",
};

const authService: AuthServicePort = {
  requestOtp: async () => ({ challengeId: "22222222-2222-4222-8222-222222222222", expiresInSeconds: 180 }),
  verifyOtp: async () => ({ user: testUser, sessionToken: "test-token", sessionExpiresAt: new Date("2026-09-27") }),
  resolveSession: async (token) =>
    token === "test-token"
      ? testIdentity
      : token === "other-token"
        ? otherIdentity
        : token === "admin-token"
          ? adminIdentity
          : null,
  revokeSession: async () => undefined,
  getStats: async () => ({ users: { total: 1, active: 1 }, records: { total: 0, byCollection: [] }, usersByRole: [{ role: "superadmin", total: 1 }] }),
  listUsers: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  listAllRecords: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  getUserDetails: async () => ({ ...testUser, records: [] }),
  updateUser: async () => testUser,
  updateProfile: async () => testUser,
};

function createTestApp() {
  return buildApp({
    repository: new MemoryRecordRepository(),
    readinessCheck: async () => undefined,
    corsOrigins: ["http://localhost:3161"],
    logger: false,
    authService,
    sessionCookieName: "radicar_session",
    secureCookies: false,
    sessionTtlDays: 30,
  });
}

test("stores, reads and removes a data record", async () => {
  const app = createTestApp();
  const record = {
    id: "job-1",
    profileId: "profile-default",
    role: "Frontend Engineer",
    createdAt: "2026-08-27T10:00:00.000Z",
    updatedAt: "2026-08-27T10:00:00.000Z",
  };

  const saved = await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/job-1",
    payload: record,
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(saved.statusCode, 200);
  assert.deepEqual(saved.json(), record);

  const listed = await app.inject({ method: "GET", url: "/v1/data/jobs", cookies: { radicar_session: "test-token" } });
  assert.deepEqual(listed.json(), [record]);

  const removed = await app.inject({
    method: "DELETE",
    url: "/v1/data/jobs/job-1",
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(removed.statusCode, 204);
  await app.close();
});

test("rejects unknown collections and mismatched ids", async () => {
  const app = createTestApp();
  const unknown = await app.inject({ method: "GET", url: "/v1/data/unknown", cookies: { radicar_session: "test-token" } });
  assert.equal(unknown.statusCode, 400);

  const mismatch = await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/job-1",
    payload: {
      id: "job-2",
      createdAt: "2026-08-27T10:00:00.000Z",
      updatedAt: "2026-08-27T10:00:00.000Z",
    },
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(mismatch.statusCode, 400);
  await app.close();
});

test("requires a session and isolates records by authenticated owner", async () => {
  const app = createTestApp();
  const unauthorized = await app.inject({ method: "GET", url: "/v1/data/jobs" });
  assert.equal(unauthorized.statusCode, 401);

  const record = {
    id: "private-job",
    createdAt: "2026-08-27T10:00:00.000Z",
    updatedAt: "2026-08-27T10:00:00.000Z",
  };
  await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/private-job",
    payload: record,
    cookies: { radicar_session: "test-token" },
  });
  const otherUsersRecords = await app.inject({
    method: "GET",
    url: "/v1/data/jobs",
    cookies: { radicar_session: "other-token" },
  });
  assert.deepEqual(otherUsersRecords.json(), []);
  await app.close();
});

test("logout is idempotent and clears an expired or missing session cookie", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/logout",
  });

  assert.equal(response.statusCode, 204);
  const setCookie = response.headers["set-cookie"];
  const cookieHeader = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie || "";
  assert.match(cookieHeader, /radicar_session=;/);
  assert.match(cookieHeader, /Max-Age=0/);
  await app.close();
});

test("allows only superadmins to access system reports", async () => {
  const app = createTestApp();
  const admin = await app.inject({
    method: "GET",
    url: "/api/admin/stats",
    cookies: { radicar_session: "admin-token" },
  });
  const superadmin = await app.inject({
    method: "GET",
    url: "/api/admin/stats",
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(admin.statusCode, 403);
  assert.equal(superadmin.statusCode, 200);
  await app.close();
});

test("rejects state-changing browser requests from untrusted origins", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "PUT",
    url: "/v1/data/jobs/csrf-attempt",
    headers: { origin: "https://attacker.example" },
    cookies: { radicar_session: "test-token" },
    payload: {
      id: "csrf-attempt",
      createdAt: "2026-08-27T10:00:00.000Z",
      updatedAt: "2026-08-27T10:00:00.000Z",
    },
  });
  assert.equal(response.statusCode, 403);
  await app.close();
});

test("reports liveness and readiness", async () => {
  const app = createTestApp();
  const health = await app.inject({ method: "GET", url: "/health" });
  const ready = await app.inject({ method: "GET", url: "/ready" });
  assert.equal(health.statusCode, 200);
  assert.equal(ready.statusCode, 200);
  await app.close();
});

test("registers AI routes with validation before model execution", async () => {
  const app = createTestApp();
  const analysis = await app.inject({
    method: "POST",
    url: "/api/match/analyze",
    payload: { jobDescription: "کوتاه", resume: {} },
    cookies: { radicar_session: "test-token" },
  });
  const feedback = await app.inject({
    method: "POST",
    url: "/api/interview/feedback",
    payload: { question: "خودت را معرفی کن", answer: "" },
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(analysis.statusCode, 422);
  assert.equal(feedback.statusCode, 400);
  await app.close();
});

test("job import rejects local targets before performing a fetch", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/job-import",
    payload: { url: "http://127.0.0.1/private" },
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(response.statusCode, 400);
  await app.close();
});

test("knowledge import requires a multipart resume file", async () => {
  const app = createTestApp();
  const response = await app.inject({
    method: "POST",
    url: "/api/knowledge/import",
    cookies: { radicar_session: "test-token" },
  });
  assert.equal(response.statusCode, 400);
  await app.close();
});
