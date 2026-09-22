import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { promisify } from "node:util";
import { createDatabase } from "@radikar/database";
import postgres from "postgres";
import { buildApp } from "../src/build-app";
import { getMatchAnalyzeConfig } from "../src/modules/ai/routes";

const user = { id: "11111111-1111-4111-8111-111111111111", phone: "09120000000", fullName: "کاربر", role: "user" as const, status: "active" as const, tablePageSize: 20, createdAt: "2026-01-01T00:00:00.000Z", lastLoginAt: null };
const auth: any = { resolveSession: async () => ({ user, sessionId: "session" }), requestOtp: async () => ({}), verifyOtp: async () => ({}), revokeSession: async () => {}, getStats: async () => ({}), getRecentEvents: async () => ({ items: [] }), listUsers: async () => ({}), listAllRecords: async () => ({}), getUserDetails: async () => ({}), updateUser: async () => ({}), updateProfile: async () => ({}), updatePreferences: async () => ({}) };
const repository: any = { list: async () => [], get: async () => null, put: async () => ({}), remove: async () => {}, clear: async () => {} };
const resume = { fullName: "سارا احمدی", jobTitle: "توسعه‌دهنده", summary: "توسعه‌دهنده React", experiences: [], projects: [], educations: [] };
const execFileAsync = promisify(execFile);

function response(value: unknown, status = 200) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } }), { status, headers: { "content-type": "application/json" } });
}

function appWithBilling(events: string[]) {
  const billing: any = {
    refundUsage: async (_id: string, _cost: unknown, operation: string) => events.push(`refund:${operation}`),
    recordModelUsage: async (_id: string, _request: string, operation: string, event: { successful: boolean }) => events.push(`usage:${operation}:${event.successful}`),
    listPlans: async () => [], getMembership: async () => ({}), listUserOrders: async () => ({}), createOrder: async () => ({}), handleCallback: async () => "", consumeUsage: async (_id: string, _cost: unknown, operation: string) => events.push(`consume:${operation}`),
  };
  return buildApp({ repository, readinessCheck: async () => {}, corsOrigins: [], logger: false, authService: auth, sessionCookieName: "radikar_session", secureCookies: false, sessionTtlDays: 30, billingService: billing });
}

test("all six AI routes accept successful provider JSON and record model usage", async () => {
  const previous = globalThis.fetch;
  const outputs = [
    { isJobPosting: true, jobTitle: "React Developer", company: "شرکت", breakdown: [{ value: 80 }, { value: 80 }, { value: 80 }, { value: 80 }], strengths: ["React"], gaps: [] },
    { summary: "خلاصه اختصاصی", skills: ["React"] },
    { summary: "رزومه تولیدشده" },
    { subtitle: "خلاصه", profileScore: 80, heroTitle: "عنوان", heroText: "متن", aiTitle: "هوش", aiText: "راهنما" },
    { title: "جلسه", subtitle: "تمرین", duration: "۱۰ دقیقه", questions: ["سؤال؟"], cards: [{ title: "نکته", text: "متن", tone: "mint" }] },
    { title: "بازخورد", text: "پاسخ خوب بود" },
  ];
  const events: string[] = [];
  try {
    globalThis.fetch = async () => response(outputs.shift());
    const app = appWithBilling(events);
    const cookie = { radikar_session: "token" };
    const requests = [
      app.inject({ method: "POST", url: "/api/match/analyze", cookies: cookie, payload: { resume, jobDescription: "شرکت برای موقعیت توسعه‌دهنده React با سابقه TypeScript و طراحی رابط کاربری نیرو استخدام می‌کند و مسئولیت توسعه محصول را بر عهده دارد." } }),
      app.inject({ method: "POST", url: "/api/match/tailor", cookies: cookie, payload: { resume, jobDescription: "شرکت برای موقعیت توسعه‌دهنده React با سابقه TypeScript و طراحی رابط کاربری نیرو استخدام می‌کند و مسئولیت توسعه محصول را بر عهده دارد." } }),
      app.inject({ method: "POST", url: "/api/resume/generate", cookies: cookie, payload: { resume, knowledge: {} } }),
      app.inject({ method: "POST", url: "/api/panel/dashboard", cookies: cookie, payload: { resume, knowledge: {} } }),
      app.inject({ method: "POST", url: "/api/interview/session", cookies: cookie, payload: { resume, knowledge: {} } }),
      app.inject({ method: "POST", url: "/api/interview/feedback", cookies: cookie, payload: { question: "سؤال", answer: "پاسخ کامل" } }),
    ];
    const results = await Promise.all(requests);
    assert.deepEqual(results.map((item) => item.statusCode), [200, 200, 200, 200, 200, 200]);
    assert.ok(events.includes("consume:match_analyze") && events.includes("consume:interview_session"));
    assert.equal(events.filter((event) => event.startsWith("usage:")).length, 6);
    await app.close();
  } finally { globalThis.fetch = previous; }
});

test("AI routes refund consumed credits after provider, invalid JSON, timeout and abort errors", async () => {
  const previous = globalThis.fetch;
  const events: string[] = [];
  try {
    const app = appWithBilling(events);
    const cookie = { radikar_session: "token" };
    for (const failure of [
      async () => new Response("{broken", { status: 200 }),
      async () => new Response(JSON.stringify({ error: { message: "provider down" } }), { status: 503 }),
      async () => { throw new DOMException("timeout", "TimeoutError"); },
      async () => { throw new DOMException("aborted", "AbortError"); },
    ]) {
      globalThis.fetch = failure;
      const result = await app.inject({ method: "POST", url: "/api/match/tailor", cookies: cookie, payload: { resume, jobDescription: "شرکت برای موقعیت توسعه‌دهنده React با سابقه TypeScript و طراحی رابط کاربری نیرو استخدام می‌کند و مسئولیت توسعه محصول را بر عهده دارد." } });
      assert.equal(result.statusCode, 502);
    }
    assert.equal(events.filter((event) => event === "consume:match_tailor").length, 4);
    assert.equal(events.filter((event) => event === "refund:match_tailor").length, 4);
    assert.ok(events.some((event) => event === "usage:match_tailor:false"));
    await app.close();
  } finally { globalThis.fetch = previous; }
});

test("AI settings persist in real PostgreSQL and normalize a reasoner fallback for match analysis", { timeout: 60_000 }, async () => {
  const name = `radikar_ai_test_${randomUUID().replaceAll("-", "")}`;
  const url = `postgresql://radikar:radikar@localhost:5433/${name}`;
  const admin = postgres("postgresql://radikar:radikar@localhost:5433/postgres", { max: 1 });
  let connection: ReturnType<typeof createDatabase> | undefined;
  let sql: postgres.Sql | undefined;
  try {
    await admin.unsafe(`CREATE DATABASE ${name}`);
    await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], { cwd: new URL("../../../", import.meta.url).pathname, env: { ...process.env, DATABASE_URL: url } });
    connection = createDatabase(url, 1);
    sql = postgres(url, { max: 1 });
    const superadminAuth = { ...auth, resolveSession: async () => ({ user: { ...user, role: "superadmin" as const }, sessionId: "session" }) };
    const app = buildApp({ repository, readinessCheck: async () => {}, corsOrigins: [], logger: false, authService: superadminAuth, sessionCookieName: "radikar_session", secureCookies: false, sessionTtlDays: 30, database: connection.db });
    const saved = await app.inject({ method: "PATCH", url: "/api/admin/ai-settings", cookies: { radikar_session: "token" }, payload: { provider: "freeDeepseekAPI", model: "deepseek-reasoner", dollarRateRials: 123 } });
    assert.equal(saved.statusCode, 200);
    const read = await app.inject({ method: "GET", url: "/api/admin/ai-settings", cookies: { radikar_session: "token" } });
    assert.deepEqual(read.json().current, { provider: "freeDeepseekAPI", model: "deepseek-chat", configured: true, dollarRateRials: 123 });
    assert.equal((await sql`select model from ai_settings where id = 'analysis-provider'`)[0].model, "deepseek-reasoner");
    assert.equal(getMatchAnalyzeConfig().model, "deepseek-chat");
    await app.close();
  } finally {
    await connection?.close();
    await sql?.end({ timeout: 5 });
    await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.end({ timeout: 5 });
  }
});
