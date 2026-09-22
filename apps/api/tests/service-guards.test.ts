import assert from "node:assert/strict";
import test from "node:test";
import type { DataRecord } from "@radikar/shared-types";
import { AuthError, AuthService } from "../src/modules/auth/service";
import { BillingError, BillingService } from "../src/modules/billing/service";
import { PostgresRecordRepository } from "../src/modules/data/record-repository";

function chain<T>(value: T) {
  const result = Promise.resolve(value);
  const fluent: Record<string, unknown> = {
    from: () => fluent, innerJoin: () => fluent, leftJoin: () => fluent, where: () => fluent, orderBy: () => fluent, limit: () => result,
    set: () => fluent, values: () => fluent, onConflictDoNothing: () => fluent,
    onConflictDoUpdate: () => fluent, returning: () => result,
    then: result.then.bind(result), catch: result.catch.bind(result), finally: result.finally.bind(result),
  };
  return fluent;
}

function queuedDatabase(selects: unknown[][]) {
  const writes: Array<{ kind: string; value?: unknown }> = [];
  const db: any = {
    select: () => chain(selects.shift() ?? []),
    insert: () => ({ values: (value: unknown) => { writes.push({ kind: "insert", value }); return chain([{ id: "saved" }]); } }),
    update: () => ({ set: (value: unknown) => { writes.push({ kind: "update", value }); return chain([]); } }),
    delete: () => ({ where: () => { writes.push({ kind: "delete" }); return Promise.resolve(); } }),
    execute: async () => undefined,
    transaction: async (fn: (tx: typeof db) => unknown) => fn(db),
  };
  return { db, writes };
}

const authOptions = { secret: "test-secret", otpTtlSeconds: 180, sessionTtlDays: 30, allowFirstUserSuperadmin: false, exposeDevelopmentOtp: true };

test("AuthService validates phones, rate limits OTP and records a safe challenge", async () => {
  const invalid = new AuthService(queuedDatabase([]).db as never, authOptions);
  await assert.rejects(() => invalid.requestOtp("123"), (error: unknown) => error instanceof AuthError && error.statusCode === 400);
  const limited = new AuthService(queuedDatabase([[{ value: 5 }]]).db as never, authOptions);
  await assert.rejects(() => limited.requestOtp("09121234567"), (error: unknown) => error instanceof AuthError && error.statusCode === 429);
  const { db, writes } = queuedDatabase([[{ value: 0 }]]);
  const service = new AuthService(db as never, authOptions);
  const result = await service.requestOtp("۰۹۱۲۱۲۳۴۵۶۷");
  assert.match(result.challengeId, /^[0-9a-f-]{36}$/i);
  assert.match(String(result.developmentCode), /^\d{6}$/);
  const inserted = writes.find((item) => item.kind === "insert")?.value as { phone: string; codeHash: string; expiresAt: Date };
  assert.equal(inserted.phone, "09121234567");
  assert.notEqual(inserted.codeHash, result.developmentCode);
  assert.ok(inserted.expiresAt > new Date());
});

test("AuthService rejects expired, exhausted and wrong OTP challenges without creating sessions", async () => {
  const now = new Date();
  for (const challenge of [
    { consumed: true, expiresAt: new Date(now.getTime() + 60_000), attempts: 0 },
    { consumed: false, expiresAt: new Date(now.getTime() - 60_000), attempts: 0 },
    { consumed: false, expiresAt: new Date(now.getTime() + 60_000), attempts: 5 },
  ]) {
    const service = new AuthService(queuedDatabase([[{ id: "c", phone: "09121234567", codeHash: "00", ...challenge }]]).db as never, authOptions);
    await assert.rejects(() => service.verifyOtp("11111111-1111-4111-8111-111111111111", "09121234567", "123456"), (error: unknown) => error instanceof AuthError);
  }
  const { db, writes } = queuedDatabase([[{ id: "c", phone: "09121234567", codeHash: "00", consumed: false, expiresAt: new Date(now.getTime() + 60_000), attempts: 0 }]]);
  const service = new AuthService(db as never, authOptions);
  await assert.rejects(() => service.verifyOtp("11111111-1111-4111-8111-111111111111", "09121234567", "123456"), /صحیح نیست/);
  assert.equal(writes.filter((item) => item.kind === "update").length, 1);
});

test("BillingService grants a free plan once and protects usage quotas", async () => {
  const existing = new BillingService(queuedDatabase([[{ id: "membership" }]]).db as never, { apiPublicUrl: "http://api", webAppUrl: "http://web", zarinpalBaseUrl: "http://gateway", zarinpalMerchantId: "merchant" });
  await existing.ensureSignupMembership("11111111-1111-4111-8111-111111111111");
  const freePlan = { id: "free", durationDays: 30, resumeLimit: 1, pdfDownloadLimit: 1, aiCredits: 2, matchCredits: 1, interviewCredits: 1, isActive: true };
  const { db, writes } = queuedDatabase([[], [freePlan]]);
  const service = new BillingService(db as never, { apiPublicUrl: "http://api", webAppUrl: "http://web", zarinpalBaseUrl: "http://gateway", zarinpalMerchantId: "merchant" });
  await service.ensureSignupMembership("11111111-1111-4111-8111-111111111111");
  assert.equal(writes.filter((item) => item.kind === "insert").length, 2);
  const quotaDb = queuedDatabase([[{ id: "membership" }], [{ id: "membership", status: "active", expiresAt: new Date(Date.now() + 60_000), aiCreditsRemaining: 0, resumesRemaining: 1, pdfDownloadsRemaining: 1, matchCreditsRemaining: 1, interviewCreditsRemaining: 1 }]]);
  const quota = new BillingService(quotaDb.db as never, { apiPublicUrl: "http://api", webAppUrl: "http://web", zarinpalBaseUrl: "http://gateway", zarinpalMerchantId: "merchant" });
  await assert.rejects(() => quota.consumeUsage("11111111-1111-4111-8111-111111111111", { ai: 1 }, "test", "req"), (error: unknown) => error instanceof BillingError && error.statusCode === 402);
});

test("BillingService refunds consumed credits and records idempotent model usage", async () => {
  const membership = { id: "membership", aiCreditsRemaining: 2, resumesRemaining: 1, pdfDownloadsRemaining: 1, matchCreditsRemaining: 1, interviewCreditsRemaining: 1 };
  const { db, writes } = queuedDatabase([[membership]]);
  const service = new BillingService(db as never, { apiPublicUrl: "http://api", webAppUrl: "http://web", zarinpalBaseUrl: "http://gateway", zarinpalMerchantId: "merchant" });
  await service.refundUsage("11111111-1111-4111-8111-111111111111", { ai: 3 }, "match", "req");
  const update = writes.find((item) => item.kind === "update")?.value as { aiCreditsRemaining: number };
  assert.equal(update.aiCreditsRemaining, 5);
  await service.recordModelUsage("11111111-1111-4111-8111-111111111111", "model-req", "match", { provider: "gapgpt", model: "test", inputTokens: 1, outputTokens: 2, totalTokens: 3, tokenSource: "provider", estimatedCostMicros: 4, statusCode: 200, successful: true, durationMs: 5, attempt: 1 });
  assert.equal(writes.filter((item) => item.kind === "insert").length, 2);
});

const billingOptions = { apiPublicUrl: "http://api", webAppUrl: "http://web", zarinpalBaseUrl: "http://gateway", zarinpalMerchantId: "merchant" };
const activeMembership = { id: "membership", userId: "11111111-1111-4111-8111-111111111111", planId: "free", status: "active", expiresAt: new Date(Date.now() + 86_400_000), resumesRemaining: 1, pdfDownloadsRemaining: 1, aiCreditsRemaining: 2, matchCreditsRemaining: 1, interviewCreditsRemaining: 1 };

test("BillingService creates gateway orders and marks failed gateway requests", async () => {
  const plan = { id: "pro", name: "حرفه‌ای", isActive: true, isPurchasable: true, priceRials: 100_000, sortOrder: 20 };
  const { db, writes } = queuedDatabase([[plan]]);
  const service = new BillingService(db as never, billingOptions);
  (service as any).getMembership = async () => ({ ...activeMembership, plan: { sortOrder: 10 } });
  (service as any).gateway = { requestPayment: async () => ({ authority: "A1", paymentUrl: "https://pay.test/A1", providerData: { code: 100 } }) };
  const created = await service.createOrder(activeMembership.userId, "09121234567", "pro");
  assert.equal(created.paymentUrl, "https://pay.test/A1");
  assert.equal(writes.filter((item) => item.kind === "insert").length, 2);
  const failedDb = queuedDatabase([[plan]]);
  const failed = new BillingService(failedDb.db as never, billingOptions);
  (failed as any).getMembership = async () => ({ ...activeMembership, plan: { sortOrder: 10 } });
  (failed as any).gateway = { requestPayment: async () => { throw new Error("gateway down"); } };
  await assert.rejects(() => failed.createOrder(activeMembership.userId, "09121234567", "pro"), (error: unknown) => error instanceof BillingError && error.statusCode === 502);
  assert.equal(failedDb.writes.some((item) => item.kind === "update"), true);
});

test("BillingService callback returns paid idempotently and cancels rejected payments", async () => {
  const paidRow = { order: { id: "order", status: "paid" }, plan: {} };
  const paid = new BillingService(queuedDatabase([[paidRow]]).db as never, billingOptions);
  assert.match(await paid.handleCallback("A1", "OK"), /status=success/);
  const canceledDb = queuedDatabase([[{ order: { id: "order", status: "pending" }, plan: {} }]]);
  const canceled = new BillingService(canceledDb.db as never, billingOptions);
  assert.match(await canceled.handleCallback("A1", "NOK"), /status=canceled/);
  assert.equal(canceledDb.writes.filter((item) => item.kind === "update").length, 2);
  const missing = new BillingService(queuedDatabase([[]]).db as never, billingOptions);
  await assert.rejects(() => missing.handleCallback("missing", "OK"), (error: unknown) => error instanceof BillingError && error.statusCode === 404);
});

test("BillingService admin membership mutations write the expected membership events", async () => {
  const plan = { id: "pro", isActive: true, durationDays: 30, resumeLimit: 2, pdfDownloadLimit: 3, aiCredits: 4, matchCredits: 5, interviewCredits: 6 };
  const scenarios: Array<[string, (service: BillingService) => Promise<unknown>, unknown[][]]> = [
    ["grant", (service) => service.adminGrantPlan(activeMembership.userId, "pro", "actor"), [[plan], [{ id: "membership" }], [activeMembership]]],
    ["extend", (service) => service.adminExtendMembership(activeMembership.userId, 14, "actor"), [[{ id: "membership" }], [activeMembership]]],
    ["adjust", (service) => service.adminAdjustCredit(activeMembership.userId, "ai", -1, "actor", "reason"), [[{ id: "membership" }], [activeMembership]]],
    ["cancel", (service) => service.adminCancelMembership(activeMembership.userId, "actor", "reason"), [[{ id: "membership" }], [activeMembership]]],
  ];
  for (const [name, run, selects] of scenarios) {
    const fixture = queuedDatabase(selects);
    const service = new BillingService(fixture.db as never, billingOptions);
    (service as any).getMembership = async () => ({ id: "membership" });
    await run(service);
    const inserted = fixture.writes.filter((item) => item.kind === "insert");
    assert.ok(inserted.length >= 1, `${name} must record an event`);
    assert.ok(fixture.writes.some((item) => item.kind === "update"), `${name} must update membership`);
  }
});

test("PostgresRecordRepository normalizes writes and scopes reads to the owner", async () => {
  const record: DataRecord = { id: "job-1", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
  const { db, writes } = queuedDatabase([[{ payload: record }], [{ payload: record }]]);
  const repository = new PostgresRecordRepository(db as never);
  await repository.put("owner-a", "jobs", record);
  assert.equal((writes.find((item) => item.kind === "insert")?.value as { ownerUserId: string }).ownerUserId, "owner-a");
  assert.deepEqual(await repository.get("owner-a", "jobs", "job-1"), record);
  assert.deepEqual(await repository.list("owner-a", "jobs"), [record]);
  await repository.remove("owner-a", "jobs", "job-1");
  await repository.clear("owner-a", "jobs");
  assert.equal(writes.filter((item) => item.kind === "delete").length, 2);
});
