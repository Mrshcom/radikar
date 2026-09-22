import { expect, test } from "@playwright/test";
import { expectPanelRoute, mockSession } from "./fixtures/session";

const userRoutes = [
  ["/dashboard", "نمای کلی مسیر شغلی"],
  ["/knowledge-base", "پروفایل"],
  ["/jobs", "فرصت"],
  ["/match", "تطابق"],
  ["/resumes", "رزومه"],
  ["/applications", "اپلای"],
  ["/interview", "مصاحبه"],
  ["/account", "اطلاعات حساب"],
  ["/settings", "امنیت و ورود"],
  ["/orders", "سفارش"],
  ["/upgrade", "پلن"],
] as const;

test.describe("پنل کاربر", () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page);
  });

  for (const [route, title] of userRoutes) {
    test(`${route} برای کاربر واردشده قابل نمایش است`, async ({ page }) => {
      await expectPanelRoute(page, route, title);
    });
  }

  test("منوی دسکتاپ مسیرهای اصلی را جابه‌جا می‌کند", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "فرصت‌های مناسب من" }).click();
    await expect(page).toHaveURL("/jobs");
  });

  test("کاربر عادی با ورود به پنل مدیریت به داشبورد بازمی‌گردد", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/dashboard");
  });
});
