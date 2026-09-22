import { expect, test } from "@playwright/test";
import { mockSession } from "./fixtures/session";

test.describe("ناوبری موبایل پنل", () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page);
  });

  test("دکمه داشبورد پس از کلیک کدر نمی‌ماند و مسیر فعال را نشان می‌دهد", async ({ page }) => {
    await page.goto("/jobs");
    const dashboard = page.getByRole("link", { name: "نمای کلی مسیر شغلی" });
    await dashboard.click();
    await expect(page).toHaveURL("/dashboard");
    await expect(dashboard).toHaveCSS("opacity", "1");
  });

  test("مسیر فرصت‌های شغلی از منوی پایین قابل انتخاب است", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "فرصت‌های مناسب من" }).last().click();
    await expect(page).toHaveURL("/jobs");
  });

  for (const route of ["/knowledge-base", "/resumes", "/applications", "/match", "/account"] as const) {
    test(`${route} در عرض موبایل اسکرول افقی صفحه ایجاد نمی‌کند`, async ({ page }) => {
      await page.goto(route);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }

  test("مودال افزودن اپلای در موبایل قابل تکمیل و بستن است", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: "افزودن اپلای" }).click();
    const dialog = page.getByRole("dialog", { name: "افزودن اپلای" });
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("عنوان موقعیت").fill("توسعه‌دهنده موبایل");
    await dialog.getByPlaceholder("نام شرکت").fill("رادیکار");
    await dialog.getByRole("button", { name: "افزودن به برد" }).click();
    await expect(dialog).toBeHidden();
  });
});

test.describe("پنل مدیریت در موبایل", () => {
  test("جدول کاربران به کارت‌های خوانا تبدیل می‌شود", async ({ page }) => {
    await mockSession(page, "superadmin");
    await page.route("**/api/admin/users**", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        items: [{ id: "mobile-user", phone: "09121112222", fullName: "کاربر موبایل", role: "user", status: "active", createdAt: "2026-01-01T00:00:00.000Z", lastLoginAt: null, recordsCount: 1 }],
        total: 1, page: 1, pageSize: 10,
      }) });
    });
    await page.goto("/admin/users");
    await expect(page.getByRole("listitem")).toContainText("کاربر موبایل");
    await expect(page.getByRole("table")).toHaveCount(0);
  });
});
