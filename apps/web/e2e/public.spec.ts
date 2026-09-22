import { expect, test } from "@playwright/test";

const publicPages = [
  ["/", "رادیکار"],
  ["/about", "رادیکار"],
  ["/ai-resume-builder", "رزومه"],
  ["/application-tracker", "اپلای"],
  ["/contact", "تماس"],
  ["/guides", "راهنماهای رزومه"],
  ["/interview-practice", "مصاحبه"],
  ["/privacy", "حریم"],
  ["/resume-builder", "رزومه"],
  ["/resume-job-match", "تطابق"],
  ["/terms", "شرایط استفاده"],
] as const;

test.describe("صفحات عمومی", () => {
  for (const [route, content] of publicPages) {
    test(`${route} با محتوای فارسی و بدون خطای سرور نمایش داده می‌شود`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator("html")).toHaveAttribute("lang", "fa");
      await expect(page.locator("body")).toContainText(content);
      const hasHorizontalOverflow = await page.locator("body").evaluate(
        (body) => body.scrollWidth > body.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test("لینک ورود از هدر به صفحه ورود می‌رود", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /ورود|داشبورد کاربری/ }).first().click();
    await expect(page).toHaveURL(/\/(login|dashboard)$/);
  });
});
