import assert from "node:assert/strict";
import test from "node:test";
import type { DataCollection, DataRecord } from "@radikar/shared-types";
import { buildApp } from "../src/build-app";
import type { AuthServicePort } from "../src/modules/auth/routes";
import type { AuthUser, SessionIdentity } from "../src/modules/auth/types";
import type { BillingService } from "../src/modules/billing/service";
import type { RecordRepository } from "../src/modules/data/record-repository";

const user: AuthUser = { id: "11111111-1111-4111-8111-111111111111", phone: "09120000000", email: null, fullName: "کاربر", role: "user", status: "active", tablePageSize: 20, createdAt: "2026-01-01T00:00:00.000Z", lastLoginAt: null };
const admin: AuthUser = { ...user, id: "22222222-2222-4222-8222-222222222222", phone: "09121111111", role: "admin" };
const superadmin: AuthUser = { ...user, id: "33333333-3333-4333-8333-333333333333", phone: "09122222222", role: "superadmin" };
const identities: Record<string, SessionIdentity> = {
  "user-token": { user, sessionId: "user-session" },
  "admin-token": { user: admin, sessionId: "admin-session" },
  "super-token": { user: superadmin, sessionId: "super-session" },
};

const authService: AuthServicePort = {
  requestOtp: async () => ({ challengeId: crypto.randomUUID(), expiresInSeconds: 180 }),
  verifyOtp: async () => ({ user, sessionToken: "user-token", sessionExpiresAt: new Date("2027-01-01") }),
  resolveSession: async (token) => (token ? identities[token] ?? null : null),
  revokeSession: async () => undefined,
  getStats: async () => ({ users: { total: 0, active: 0, registeredToday: 0, activeToday: 0 }, records: { total: 0, resumes: 0, resumesToday: 0, byCollection: [] }, usersByRole: [] }),
  getRecentEvents: async () => ({ items: [] }),
  listUsers: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  listAllRecords: async () => ({ items: [], total: 0, page: 1, pageSize: 20 }),
  getUserDetails: async () => ({ ...user, records: [] }),
  updateUser: async () => user,
  updateProfile: async () => user,
  updatePreferences: async () => user,
};

const repository: RecordRepository = {
  list: async () => [],
  get: async () => null,
  put: async (_owner: string, _collection: DataCollection, record: DataRecord) => record,
  remove: async () => undefined,
  clear: async () => undefined,
};

function createApp(overrides: Partial<Record<keyof BillingService, unknown>> = {}) {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const method = (name: string, result: unknown = {}) => async (...args: unknown[]) => {
    calls.push({ name, args });
    return result;
  };
  const billing = {
    listPlans: method("listPlans", []), getMembership: method("getMembership"), listUserOrders: method("listUserOrders", { items: [], total: 0 }),
    createOrder: method("createOrder", { orderId: "order-1", orderNumber: "RK-1", paymentUrl: "https://pay.test" }),
    consumeUsage: method("consumeUsage"), handleCallback: method("handleCallback", "http://localhost:3161/billing/result?status=success"),
    listAdminOrders: method("listAdminOrders", { items: [], total: 0 }), getBillingStats: method("getBillingStats", {}),
    getModelUsageStats: method("getModelUsageStats", {}), listAdminPayments: method("listAdminPayments", { items: [], total: 0 }),
    listMembershipUsers: method("listMembershipUsers", { items: [], total: 0 }), getAdminMembership: method("getAdminMembership", {}),
    adminGrantPlan: method("adminGrantPlan"), adminExtendMembership: method("adminExtendMembership"),
    adminAdjustCredit: method("adminAdjustCredit"), adminCancelMembership: method("adminCancelMembership"),
    recordModelUsage: method("recordModelUsage"), refundUsage: method("refundUsage"),
    ...overrides,
  } as unknown as BillingService;
  const app = buildApp({ repository, readinessCheck: async () => undefined, corsOrigins: ["http://localhost:3161"], logger: false, authService, sessionCookieName: "radikar_session", secureCookies: false, sessionTtlDays: 30, billingService: billing });
  return { app, calls };
}

test("billing routes require a session and reject customer operations for managers", async () => {
  const { app } = createApp();
  const anonymous = await app.inject({ method: "GET", url: "/api/billing/membership" });
  assert.equal(anonymous.statusCode, 401);
  const manager = await app.inject({ method: "GET", url: "/api/billing/membership", cookies: { radikar_session: "admin-token" } });
  assert.equal(manager.statusCode, 403);
  await app.close();
});

test("customer order creation forwards the authenticated identity and returns 201", async () => {
  const { app, calls } = createApp();
  const response = await app.inject({ method: "POST", url: "/api/billing/orders", cookies: { radikar_session: "user-token" }, payload: { planId: "job-search" } });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(calls.find((call) => call.name === "createOrder")?.args, [user.id, user.phone, "job-search"]);
  assert.equal(response.json().paymentUrl, "https://pay.test");
  await app.close();
});

test("admin credit mutation forwards the resource, units, reason and actor", async () => {
  const { app, calls } = createApp();
  const response = await app.inject({ method: "POST", url: `/api/admin/users/${user.id}/membership/credits`, cookies: { radikar_session: "super-token" }, payload: { resource: "ai", units: 12, reason: "آزمایش" } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(calls.find((call) => call.name === "adminAdjustCredit")?.args, [user.id, "ai", 12, superadmin.id, "آزمایش"]);
  await app.close();
});

test("payment callback is public and redirects to the web result", async () => {
  const { app, calls } = createApp();
  const response = await app.inject({ method: "GET", url: "/api/billing/callback?Authority=A0001&Status=OK" });
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.location, "http://localhost:3161/billing/result?status=success");
  assert.deepEqual(calls.find((call) => call.name === "handleCallback")?.args, ["A0001", "OK"]);
  await app.close();
});

test("customer billing reads and PDF usage forward pagination, filters and usage metadata", async () => {
  const { app, calls } = createApp();
  const cookies = { radikar_session: "user-token" };
  const plans = await app.inject({ method: "GET", url: "/api/billing/plans", cookies });
  const membership = await app.inject({ method: "GET", url: "/api/billing/membership", cookies });
  const orders = await app.inject({ method: "GET", url: "/api/billing/orders?page=2&pageSize=10&search=RK&status=paid", cookies });
  const pdf = await app.inject({ method: "POST", url: "/api/billing/usage/pdf", cookies });
  assert.equal(plans.statusCode, 200);
  assert.equal(membership.statusCode, 200);
  assert.equal(orders.statusCode, 200);
  assert.equal(pdf.statusCode, 204);
  assert.deepEqual(calls.find((call) => call.name === "getMembership")?.args, [user.id]);
  assert.deepEqual(calls.find((call) => call.name === "listUserOrders")?.args, [user.id, 2, 10, "RK", "paid"]);
  const pdfUsage = calls.find((call) => call.name === "consumeUsage")?.args;
  assert.deepEqual(pdfUsage?.slice(0, 3), [user.id, { pdf: 1 }, "resume_pdf_export"]);
  assert.match(String(pdfUsage?.[3]), /^[0-9a-f-]{36}$/i);
  await app.close();
});

test("superadmin billing lists and membership mutations forward validated input", async () => {
  const { app, calls } = createApp();
  const cookies = { radikar_session: "super-token" };
  const targetId = user.id;
  const orders = await app.inject({ method: "GET", url: "/api/admin/orders?search=RK&page=2&pageSize=10&status=paid&planId=starter", cookies });
  const payments = await app.inject({ method: "GET", url: "/api/admin/payments?search=REF&status=verified", cookies });
  const usage = await app.inject({ method: "GET", url: "/api/admin/model-usage?days=7&page=2&pageSize=10&provider=gapgpt", cookies });
  const members = await app.inject({ method: "GET", url: "/api/admin/memberships?search=کاربر&planId=starter&membershipStatus=active&userStatus=active", cookies });
  const detail = await app.inject({ method: "GET", url: `/api/admin/users/${targetId}/membership`, cookies });
  const grant = await app.inject({ method: "POST", url: `/api/admin/users/${targetId}/membership/grant`, cookies, payload: { planId: "starter" } });
  const extend = await app.inject({ method: "POST", url: `/api/admin/users/${targetId}/membership/extend`, cookies, payload: { days: 14 } });
  const cancel = await app.inject({ method: "POST", url: `/api/admin/users/${targetId}/membership/cancel`, cookies, payload: { reason: "درخواست کاربر" } });
  for (const response of [orders, payments, usage, members, detail, grant, extend, cancel]) assert.equal(response.statusCode, 200);
  assert.deepEqual(calls.find((call) => call.name === "listAdminOrders")?.args, ["RK", 2, 10, "paid", "starter"]);
  assert.deepEqual(calls.find((call) => call.name === "listAdminPayments")?.args, [1, 20, "REF", "verified"]);
  assert.deepEqual(calls.find((call) => call.name === "getModelUsageStats")?.args, [7, 2, 10, "gapgpt"]);
  assert.deepEqual(calls.find((call) => call.name === "listMembershipUsers")?.args, ["کاربر", 1, 20, "starter", "active", "active"]);
  assert.deepEqual(calls.find((call) => call.name === "getAdminMembership")?.args, [targetId]);
  assert.deepEqual(calls.find((call) => call.name === "adminGrantPlan")?.args, [targetId, "starter", superadmin.id]);
  assert.deepEqual(calls.find((call) => call.name === "adminExtendMembership")?.args, [targetId, 14, superadmin.id]);
  assert.deepEqual(calls.find((call) => call.name === "adminCancelMembership")?.args, [targetId, superadmin.id, "درخواست کاربر"]);
  await app.close();
});

test("billing routes reject malformed mutations and unauthorized admin access", async () => {
  const { app, calls } = createApp();
  const malformedOrder = await app.inject({ method: "POST", url: "/api/billing/orders", cookies: { radikar_session: "user-token" }, payload: { planId: "" } });
  const malformedCredit = await app.inject({ method: "POST", url: `/api/admin/users/${user.id}/membership/credits`, cookies: { radikar_session: "super-token" }, payload: { resource: "ai", units: 0 } });
  const userAdminRead = await app.inject({ method: "GET", url: "/api/admin/orders", cookies: { radikar_session: "user-token" } });
  const userMembershipMutation = await app.inject({ method: "POST", url: `/api/admin/users/${user.id}/membership/grant`, cookies: { radikar_session: "user-token" }, payload: { planId: "starter" } });
  assert.equal(malformedOrder.statusCode, 400);
  assert.equal(malformedCredit.statusCode, 400);
  assert.equal(userAdminRead.statusCode, 403);
  assert.equal(userMembershipMutation.statusCode, 403);
  assert.equal(calls.some((call) => call.name === "createOrder" || call.name === "adminAdjustCredit" || call.name === "adminGrantPlan"), false);
  await app.close();
});
