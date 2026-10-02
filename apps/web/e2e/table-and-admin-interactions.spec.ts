import { expect, test } from "@playwright/test";
import { mockSession } from "./fixtures/session";

const userRow = {
  id: "managed-user",
  phone: "09123334444",
  fullName: "کاربر قابل مدیریت",
  role: "user",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: "2026-01-02T00:00:00.000Z",
  recordsCount: 2,
};

const membershipMember = {
  user: { id: "member-1", phone: "09124445555", fullName: "کاربر عضویت", status: "active" },
  plan: {
    id: "starter",
    name: "شروع",
    description: "",
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
  },
  membership: {
    id: "membership-1",
    planId: "starter",
    status: "active",
    startsAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-02-01T00:00:00.000Z",
    resumesRemaining: 3,
    pdfDownloadsRemaining: 3,
    aiCreditsRemaining: 10,
    matchCreditsRemaining: 3,
    interviewCreditsRemaining: 3,
    usage: {
      resume: { used: 0, remaining: 3, total: 3 },
      pdf: { used: 0, remaining: 3, total: 3 },
      ai: { used: 0, remaining: 10, total: 10 },
      match: { used: 0, remaining: 3, total: 3 },
      interview: { used: 0, remaining: 3, total: 3 },
    },
  },
};

test.describe("جدول‌ها و عملیات مدیریتی", () => {
  test("تمدید عضویت فقط پس از تأیید، payload درست را ثبت می‌کند", async ({ page }) => {
    await mockSession(page, "superadmin");
    let request: { url: string; body: unknown } | undefined;
    await page.route("**/api/admin/memberships**", async (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ items: [membershipMember], total: 1, page: 1, pageSize: 10 }),
      }),
    );
    await page.route("**/api/admin/users/member-1/membership/**", async (route) => {
      request = { url: new URL(route.request().url()).pathname, body: route.request().postDataJSON() };
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({}) });
    });
    await page.goto("/admin/memberships");
    await page.getByRole("button", { name: "ویرایش" }).click();
    await page.getByRole("button", { name: "افزودن روز" }).click();
    await expect(page.getByRole("heading", { name: "تأیید تمدید عضویت" })).toBeVisible();
    await page.getByRole("button", { name: "تأیید تمدید" }).click();
    await expect
      .poll(() => request)
      .toEqual({ url: "/api/admin/users/member-1/membership/extend", body: { days: 30 } });
  });

  test("اعطای پلن، تغییر اعتبار، لغو عضویت و تعلیق کاربر payload درست دارند", async ({ page }) => {
    await mockSession(page, "superadmin");
    const requests: Array<{ url: string; method: string; body: unknown }> = [];
    await page.route("**/api/admin/memberships**", async (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ items: [membershipMember], total: 1, page: 1, pageSize: 10 }),
      }),
    );
    await page.route("**/api/admin/users/member-1/membership/**", async (route) => {
      requests.push({
        url: new URL(route.request().url()).pathname,
        method: route.request().method(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({ contentType: "application/json", body: "{}" });
    });
    await page.route("**/api/admin/users/member-1", async (route) => {
      requests.push({
        url: new URL(route.request().url()).pathname,
        method: route.request().method(),
        body: route.request().postDataJSON(),
      });
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(membershipMember.user) });
    });
    await page.goto("/admin/memberships");

    await page.getByRole("button", { name: "ویرایش" }).click();
    await page.getByRole("button", { name: "اعطا و فعال‌سازی" }).click();
    await page.getByRole("button", { name: "اعطا و فعال‌سازی" }).last().click();
    await expect
      .poll(() => requests.at(-1))
      .toEqual({ url: "/api/admin/users/member-1/membership/grant", method: "POST", body: { planId: "job-search" } });

    await page.getByRole("button", { name: "ویرایش" }).click();
    const creditForm = page.locator("form").filter({ hasText: "افزایش یا کاهش اعتبار" });
    await creditForm.getByRole("spinbutton").fill("-5");
    await creditForm.getByPlaceholder("دلیل تغییر (اختیاری)").fill("اصلاح آزمایشی");
    await creditForm.getByRole("button", { name: "ثبت اعتبار" }).click();
    await page.getByRole("button", { name: "ثبت تغییر اعتبار" }).click();
    await expect
      .poll(() => requests.at(-1))
      .toEqual({
        url: "/api/admin/users/member-1/membership/credits",
        method: "POST",
        body: { resource: "ai", units: -5, reason: "اصلاح آزمایشی" },
      });

    await page.getByRole("button", { name: "ویرایش" }).click();
    await page.getByPlaceholder("دلیل لغو (اختیاری)").fill("درخواست کاربر");
    await page.getByRole("button", { name: "لغو فوری و حذف اعتبار باقی‌مانده" }).click();
    await page.getByRole("button", { name: "لغو فوری عضویت" }).click();
    await expect
      .poll(() => requests.at(-1))
      .toEqual({
        url: "/api/admin/users/member-1/membership/cancel",
        method: "POST",
        body: { reason: "درخواست کاربر" },
      });

    await page.getByRole("button", { name: "تعلیق" }).click();
    await page.getByRole("button", { name: "تعلیق کاربر" }).click();
    await expect
      .poll(() => requests.at(-1))
      .toEqual({ url: "/api/admin/users/member-1", method: "PATCH", body: { status: "suspended" } });
  });

  test("جست‌وجو، فیلتر و تأیید تغییر وضعیت کاربر در URL و API منعکس می‌شود", async ({ page }) => {
    await mockSession(page, "superadmin");
    let updateRequest: unknown;
    await page.route("**/api/admin/users**", async (route) => {
      if (route.request().method() === "PATCH") {
        updateRequest = route.request().postDataJSON();
        await route.fulfill({ contentType: "application/json", body: JSON.stringify(userRow) });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ items: [userRow], total: 21, page: 1, pageSize: 10 }),
      });
    });

    await page.goto("/admin/users");
    await page.getByPlaceholder("نام یا شماره همراه").fill("قابل مدیریت");
    await page.getByRole("button", { name: "جست‌وجو" }).click();
    await expect(page).toHaveURL(/q=/);
    await page.getByRole("button", { name: "فیلتر پیشرفته" }).click();
    await page.getByLabel("نقش").selectOption("user");
    await expect(page).toHaveURL(/role=user/);

    await page.getByRole("button", { name: "تعلیق" }).click();
    await expect(page.getByRole("heading", { name: "تأیید تعلیق کاربر" })).toBeVisible();
    await page.getByRole("button", { name: "تعلیق کاربر" }).click();
    await expect.poll(() => updateRequest).toEqual({ status: "suspended" });
  });

  test("خطای API جدول مدیریت با امکان تلاش مجدد نمایش داده می‌شود", async ({ page }) => {
    await mockSession(page, "superadmin");
    await page.route("**/api/admin/orders**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "خطای آزمایشی" }),
      });
    });
    await page.goto("/admin/orders");
    await expect(page.getByRole("alert").filter({ hasText: "خطا در دریافت اطلاعات" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تلاش مجدد" })).toBeVisible();
  });

  test("تنظیمات مدل سوپرادمین، تب نرخ دلار و ذخیره را پوشش می‌دهد", async ({ page }) => {
    await mockSession(page, "superadmin");
    let updateRequest: unknown;
    await page.route("**/api/admin/ai-settings", async (route) => {
      if (route.request().method() === "PATCH") {
        updateRequest = route.request().postDataJSON();
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ provider: "gapgpt", model: "gpt-4.1-mini", dollarRateRials: 120000 }),
        });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          current: { provider: "gapgpt", model: "gpt-4.1-mini", configured: true, dollarRateRials: 0 },
          providers: [{ id: "gapgpt", label: "GapGPT", defaultModel: "gpt-4.1-mini", models: [] }],
        }),
      });
    });
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: /نرخ دلار/ }).click();
    const dollarRate = page.getByLabel("قیمت هر دلار به تومان");
    await dollarRate.fill("120000");
    await page.getByRole("button", { name: "ذخیره تنظیمات" }).click();
    await expect
      .poll(() => updateRequest)
      .toEqual({
        provider: "gapgpt",
        model: "gpt-4.1-mini",
        dollarRateRials: 120000,
      });
    await expect(page.getByText("تنظیمات مدل‌های تحلیلی ذخیره شد.")).toBeVisible();
  });
});
