import { expect, type Page } from "@playwright/test";

type StoredRecord = { id: string; [key: string]: unknown };
export type TestDataCollections = Record<string, StoredRecord[]>;

export const apiBaseUrl = "http://localhost:3162";

type TestRole = "user" | "admin" | "superadmin";

const testUser = (role: TestRole) => ({
  id: `e2e-${role}-user`,
  phone: "09120000000",
  fullName: role === "user" ? "کاربر آزمایشی" : "مدیر آزمایشی",
  role,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: "2026-01-01T00:00:00.000Z",
  tablePageSize: 10,
  onboardingState: { version: 1, status: "not_started", completedSteps: [] },
});

const plans = [{
  id: "starter",
  name: "شروع",
  description: "پلن آزمایشی",
  priceRials: 0,
  durationDays: 30,
  resumeLimit: 3,
  pdfDownloadLimit: 3,
  aiCredits: 10,
  matchCredits: 3,
  interviewCredits: 3,
  isFree: true,
  isPurchasable: true,
  sortOrder: 1,
}];

const membership = {
  id: "e2e-membership",
  planId: "starter",
  status: "active",
  startsAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-12-31T00:00:00.000Z",
  resumesRemaining: 3,
  pdfDownloadsRemaining: 3,
  aiCreditsRemaining: 10,
  matchCreditsRemaining: 3,
  interviewCreditsRemaining: 3,
  plan: plans[0],
  usage: {
    resume: { used: 0, remaining: 3, total: 3 },
    pdf: { used: 0, remaining: 3, total: 3 },
    ai: { used: 0, remaining: 10, total: 10 },
    match: { used: 0, remaining: 3, total: 3 },
    interview: { used: 0, remaining: 3, total: 3 },
  },
};

const adminStats = {
  users: { total: 12, active: 12, registeredToday: 1, activeToday: 2 },
  records: { total: 8, resumes: 2, resumesToday: 0, byCollection: [] },
  usersByRole: [],
};

const billingStats = {
  paidOrdersToday: 0,
  ordersToday: 0,
  revenueTodayRials: 0,
  paidOrders: 0,
  revenueRials: 0,
  pendingOrders: 0,
  totalOrders: 0,
};

const modelUsage = {
  periodDays: 30,
  totals: { requests: 0, successfulRequests: 0, failedRequests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostMicros: 0, providerReportedRequests: 0, estimatedRequests: 0, averageDurationMs: 0 },
  today: { requests: 0, successfulRequests: 0, failedRequests: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostMicros: 0 },
  byModel: [],
  byOperation: [],
  daily: [],
  recentRequests: { items: [], total: 0, page: 1, pageSize: 20 },
};

const aiSettings = {
  current: { provider: "gapgpt", model: "gpt-4.1-mini", configured: true, dollarRateRials: 0 },
  providers: [
    { id: "gapgpt", label: "GapGPT", defaultModel: "gpt-4.1-mini", models: [] },
    { id: "freeDeepseekAPI", label: "DeepSeek", defaultModel: "deepseek-chat", models: [] },
  ],
};

export async function mockSession(page: Page, role: TestRole = "user") {
  const user = testUser(role);

  await page.route("**/v1/data/**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      const segments = new URL(route.request().url()).pathname.split("/");
      const isSingleRecord = segments.length >= 5;
      await route.fulfill({
        contentType: "application/json",
        body: isSingleRecord ? "null" : "[]",
      });
      return;
    }
    if (method === "PUT") {
      await route.fulfill({
        contentType: "application/json",
        body: route.request().postData() ?? "{}",
      });
      return;
    }
    await route.fulfill({ status: 204 });
  });

  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;
    const method = route.request().method();
    let body: unknown = {};

    if (pathname === "/api/auth/me") body = { user };
    else if (pathname === "/api/auth/logout") body = {};
    else if (pathname === "/api/billing/plans") body = plans;
    else if (pathname === "/api/billing/membership") {
      body = membership;
    } else if (pathname === "/api/admin/stats") body = adminStats;
    else if (pathname === "/api/admin/billing-stats") body = billingStats;
    else if (pathname === "/api/admin/events") body = { items: [] };
    else if (pathname === "/api/admin/model-usage") body = modelUsage;
    else if (pathname === "/api/admin/ai-settings") body = aiSettings;
    else if (pathname.startsWith("/api/admin/")) body = { items: [], total: 0, page: 1, pageSize: 10 };
    else if (pathname === "/api/account") body = { user };
    else if (pathname === "/api/account/preferences") body = { user };
    else if (pathname === "/api/panel/dashboard") body = { analysis: null };
    else if (method === "POST" || method === "PATCH" || method === "DELETE") body = {};

    await route.fulfill({
      status: pathname === "/api/auth/logout" ? 204 : 200,
      contentType: "application/json",
      body: pathname === "/api/auth/logout" ? undefined : JSON.stringify(body),
    });
  });
}

export async function mockDataCollections(
  page: Page,
  initial: TestDataCollections = {},
) {
  const collections = new Map(
    Object.entries(initial).map(([name, records]) => [
      name,
      new Map(records.map((record) => [record.id, structuredClone(record)])),
    ]),
  );

  await page.route("**/v1/data/**", async (route) => {
    const request = route.request();
    const segments = new URL(request.url()).pathname.split("/").filter(Boolean);
    const collectionName = segments[2] ?? "";
    const recordId = segments[3] ? decodeURIComponent(segments[3]) : undefined;
    const collection = collections.get(collectionName) ?? new Map<string, StoredRecord>();
    collections.set(collectionName, collection);

    if (request.method() === "GET") {
      const body = recordId
        ? collection.get(recordId) ?? null
        : [...collection.values()];
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
      return;
    }
    if (request.method() === "PUT" && recordId) {
      const record = request.postDataJSON() as StoredRecord;
      collection.set(recordId, structuredClone(record));
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(record) });
      return;
    }
    if (request.method() === "DELETE") {
      if (recordId) collection.delete(recordId);
      else collection.clear();
      await route.fulfill({ status: 204 });
      return;
    }
    await route.fulfill({ status: 405 });
  });

  return {
    list: (collection: string) => [...(collections.get(collection)?.values() ?? [])],
    get: (collection: string, id: string) => collections.get(collection)?.get(id),
  };
}

export async function expectPanelRoute(page: Page, route: string, title: string) {
  await page.goto(route);
  await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`));
  await expect(page.getByText(title, { exact: false }).first()).toBeVisible();
}
