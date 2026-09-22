import { expect, test } from "@playwright/test";
import { expectPanelRoute, mockSession } from "./fixtures/session";

const adminRoutes = [
  ["/admin", "داشبورد مدیریتی سامانه"],
  ["/admin/users", "کاربران و سطح دسترسی"],
  ["/admin/memberships", "عضویت و اعتبار کاربران"],
  ["/admin/orders", "سفارش‌ها و پیگیری وضعیت"],
  ["/admin/payments", "واریزی‌ها و تراکنش‌های درگاه"],
  ["/admin/records", "همه اطلاعات ثبت‌شده در سامانه"],
  ["/admin/model-usage", "مصرف و هزینه"],
  ["/admin/settings", "تنظیمات"],
] as const;

test.describe("پنل مدیریت", () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page, "superadmin");
  });

  for (const [route, title] of adminRoutes) {
    test(`${route} برای سوپرادمین قابل نمایش است`, async ({ page }) => {
      await expectPanelRoute(page, route, title);
    });
  }

  test("ادمین معمولی ابزارهای مختص سوپرادمین را در منو نمی‌بیند", async ({ page }) => {
    await mockSession(page, "admin");
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "عضویت و اعتبار" })).toBeVisible();
    await expect(page.getByRole("link", { name: "کاربران و دسترسی‌ها" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "داده‌های سامانه" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "تنظیمات" })).toHaveCount(0);
  });

  test("صفحه کاربران برای ادمین معمولی محتوای مدیریتی افشا نمی‌کند", async ({ page }) => {
    await mockSession(page, "admin");
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "کاربران و سطح دسترسی" })).toHaveCount(0);
  });
});
