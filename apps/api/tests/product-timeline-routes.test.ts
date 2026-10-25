import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { ZodError } from "zod";
import type { ProductTimelineEntry, ProductTimelineInput } from "@radikar/shared-types";
import type { AuthUser, SessionIdentity } from "../src/modules/auth/types";
import { registerProductTimelineRoutes } from "../src/modules/product-timeline/routes";
import type { ProductTimelineService } from "../src/modules/product-timeline/service";

const baseUser: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  phone: "09120000000",
  email: null,
  fullName: "کاربر",
  role: "user",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
  tablePageSize: 20,
  onboardingState: { version: 1, status: "not_started", completedSteps: [] },
};
const entry: ProductTimelineEntry = {
  id: "22222222-2222-4222-8222-222222222222",
  kind: "phase",
  phaseId: null,
  title: "فاز آزمایشی",
  summary: "شرح فاز آزمایشی",
  status: "planned",
  sortOrder: 0,
  storySlides: [],
  publishedAt: null,
  createdAt: "2026-10-10T00:00:00.000Z",
  updatedAt: "2026-10-10T00:00:00.000Z",
};

function createApp() {
  const app = Fastify({ logger: false });
  const calls: ProductTimelineInput[] = [];
  const service = {
    listPublished: async () => [{ ...entry, publishedAt: entry.createdAt }],
    listAdmin: async () => [entry],
    create: async (input: ProductTimelineInput) => {
      calls.push(input);
      return entry;
    },
    update: async () => entry,
    publish: async () => ({ ...entry, publishedAt: entry.createdAt }),
    unpublish: async () => entry,
    remove: async () => undefined,
  } as unknown as ProductTimelineService;
  app.decorateRequest("auth", null);
  app.addHook("onRequest", async (request) => {
    const role = request.headers["x-test-role"] as AuthUser["role"] | undefined;
    request.auth = role ? ({ user: { ...baseUser, role }, sessionId: "test-session" } as SessionIdentity) : null;
  });
  registerProductTimelineRoutes(app, service);
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) return reply.code(400).send({ error: "داده ورودی معتبر نیست." });
    return reply.code(500).send({ error: "خطای داخلی" });
  });
  return { app, calls };
}

test("published timeline is readable by users while management is admin-only", async () => {
  const { app } = createApp();
  const publicResponse = await app.inject({
    method: "GET",
    url: "/api/product-timeline",
    headers: { "x-test-role": "user" },
  });
  assert.equal(publicResponse.statusCode, 200);
  assert.equal(publicResponse.json().items.length, 1);

  const forbidden = await app.inject({
    method: "GET",
    url: "/api/admin/product-timeline",
    headers: { "x-test-role": "user" },
  });
  assert.equal(forbidden.statusCode, 403);
  const adminResponse = await app.inject({
    method: "GET",
    url: "/api/admin/product-timeline",
    headers: { "x-test-role": "admin" },
  });
  assert.equal(adminResponse.statusCode, 200);
  await app.close();
});

test("admin input rejects external story links before saving", async () => {
  const { app, calls } = createApp();
  const payload = {
    kind: "feature",
    phaseId: entry.id,
    title: "قابلیت آزمایشی",
    summary: "این یک قابلیت آزمایشی است.",
    status: "completed",
    sortOrder: 1,
    storySlides: [
      {
        title: "دیدن قابلیت",
        body: "توضیح کوتاه دربارهٔ قابلیت",
        ctaLabel: "برو به دمو",
        ctaHref: "https://example.com",
      },
    ],
  };
  const invalid = await app.inject({
    method: "POST",
    url: "/api/admin/product-timeline",
    headers: { "x-test-role": "admin" },
    payload,
  });
  assert.equal(invalid.statusCode, 400);
  assert.equal(calls.length, 0);
  const valid = await app.inject({
    method: "POST",
    url: "/api/admin/product-timeline",
    headers: { "x-test-role": "admin" },
    payload: { ...payload, storySlides: [{ ...payload.storySlides[0], ctaHref: "/resumes" }] },
  });
  assert.equal(valid.statusCode, 201);
  assert.equal(calls.length, 1);
  await app.close();
});
