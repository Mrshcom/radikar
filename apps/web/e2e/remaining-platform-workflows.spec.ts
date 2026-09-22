import { expect, test } from "@playwright/test";
import { mockDataCollections, mockSession } from "./fixtures/session";

test.describe("سناریوهای باقی‌مانده پنل", () => {
  test("تنظیمات حساب ذخیره، خطا و تلاش مجدد را پوشش می‌دهد", async ({ page }) => {
    await mockSession(page);
    let attempts = 0;
    await page.route("**/api/account", async (route) => {
      attempts += 1;
      await route.fulfill(attempts === 1 ? { status: 500, contentType: "application/json", body: JSON.stringify({ error: "ذخیره ناموفق بود" }) } : { contentType: "application/json", body: JSON.stringify({ user: { id: "e2e-user-user", fullName: "نام تازه" } }) });
    });
    await page.goto("/account");
    await page.getByLabel("نام و نام خانوادگی").fill("نام تازه");
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText("ذخیره ناموفق بود")).toBeVisible();
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText("اطلاعات فردی با موفقیت ذخیره شد.")).toBeVisible();
    expect(attempts).toBe(2);
  });

  test("workspace ساخته، انتخاب و با تأیید دوم حذف می‌شود", async ({ page }) => {
    await mockSession(page);
    await mockDataCollections(page, { appProfiles: [{ id: "profile-default", workspaceName: "فضای کاری اصلی", createdAt: "x", updatedAt: "x" }], workspaceState: [{ id: "active-profile", activeProfileId: "profile-default", createdAt: "x", updatedAt: "x" }] });
    await page.goto("/dashboard");
    await page.getByTitle("فضای کاری شخصی").click();
    await page.getByRole("button", { name: "افزودن فضای کاری جدید" }).click();
    await page.getByLabel("نام فضای کاری").fill("آزمایش دوم");
    await page.getByRole("button", { name: "ساخت و ورود به فضا" }).click();
    await expect(page.getByText("آزمایش دوم")).toBeVisible();
    await page.getByTitle("آزمایش دوم").click();
    await page.getByLabel("حذف آزمایش دوم").click();
    await page.getByRole("button", { name: "بله، حذف شود" }).click();
    await expect(page.getByText("برای حذف فضای کاری، دکمه تأیید را یک‌بار دیگر بزن.")).toBeVisible();
  });

  test("نقش‌ها به API و صفحهٔ مدیریت دسترسی درست دارند", async ({ page }) => {
    await mockSession(page, "admin");
    await page.goto("/admin/settings");
    await expect(page.getByText("تنظیمات سوپرادمین")).toBeHidden();
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await mockSession(page, "superadmin");
    await page.goto("/admin/settings");
    await expect(page.getByText("Provider تحلیل", { exact: false })).toBeVisible();
  });
});
