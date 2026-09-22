import { expect, test } from "@playwright/test";
import { mockSession } from "./fixtures/session";

test.describe("تعامل‌های اصلی پنل کاربر", () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page);
  });

  test("فیلترها و دسته‌بندی‌های فرصت‌های شغلی قابل استفاده‌اند", async ({ page }) => {
    await page.goto("/jobs");

    const filterButton = page.getByRole("button", { name: "فیلترها" });
    await filterButton.click();
    await expect(filterButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("فیلترهای پیشرفته")).toBeVisible();
    await expect(page.getByRole("slider", { name: "حداقل تطابق" })).toBeVisible();

    await page.getByLabel("جست‌وجوی فرصت شغلی").fill("فرصت ناموجود");
    await expect(page.getByText("هنوز فرصت شغلی وارد نکرده‌ای")).toBeVisible();
    await expect(page.getByRole("link", { name: "وارد کردن آگهی شغلی" })).toBeVisible();
  });

  test("ثبت اپلای جدید، مودال و ذخیره در برد را پوشش می‌دهد", async ({ page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: "افزودن اپلای" }).click();

    await expect(page.getByRole("heading", { name: "افزودن اپلای" })).toBeVisible();
    const submit = page.getByRole("button", { name: "افزودن به برد" });
    await expect(submit).toBeDisabled();
    await page.getByPlaceholder("عنوان موقعیت").fill("مهندس فرانت‌اند");
    await page.getByPlaceholder("نام شرکت").fill("رادیکار");
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByText("اپلای جدید ذخیره شد")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "مهندس فرانت‌اند در رادیکار" }),
    ).toBeVisible();
  });

  test("تب‌های پایگاه دانش با همان کنترل تب به‌روزرسانی می‌شوند", async ({ page }) => {
    await page.goto("/knowledge-base");
    const professionalExperience = page.getByRole("tab", {
      name: /تجربه حرفه‌ای/,
    });

    await professionalExperience.click();
    await expect(professionalExperience).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("سوابق شغلی، مسئولیت‌ها و دستاوردها")).toBeVisible();
  });

  test("ساخت رزومه از قالب، الزام تکمیل پایگاه دانش را نشان می‌دهد", async ({ page }) => {
    await page.goto("/resumes");
    await page.getByRole("tab", { name: "قالب‌های آماده رزومه" }).click();
    await expect(page.getByText("فیلتر قالب‌ها")).toBeVisible();
    await page.getByRole("button", { name: "استفاده از قالب" }).first().click();

    await expect(
      page.getByRole("heading", { name: "پایگاه دانش هنوز کامل نیست" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "تکمیل پایگاه دانش" })).toBeVisible();
  });

  test("ورود متن آگهی و الزام انتخاب رزومه مبنا را پوشش می‌دهد", async ({ page }) => {
    await page.goto("/match");
    const textMode = page.getByRole("radio", { name: /وارد کردن متن آگهی/ });
    await textMode.click();
    await expect(textMode).toHaveAttribute("aria-checked", "true");

    await page.locator("#job-description").fill("تسلط به React و TypeScript");
    await expect(page.getByText(/نویسه$/)).toBeVisible();
    await expect(page.getByText("برای تحلیل تطابق، انتخاب رزومه مبنا الزامی است.")).toBeVisible();
    await expect(page.getByRole("button", { name: "تحلیل تطابق متن" })).toBeDisabled();
  });

  test("فرم حساب، اعتبارسنجی و ذخیره اطلاعات را پوشش می‌دهد", async ({ page }) => {
    await page.goto("/account");
    const nameInput = page.getByLabel("نام و نام خانوادگی");
    await nameInput.fill("ا");
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText("نام باید حداقل دو حرف باشد.")).toBeVisible();

    await nameInput.fill("کاربر آزمایشی جدید");
    await page.getByRole("button", { name: "ذخیره تغییرات" }).click();
    await expect(page.getByText("اطلاعات فردی با موفقیت ذخیره شد.")).toBeVisible();
  });

  test("خطای دریافت وضعیت پلن در حساب نمایش داده می‌شود", async ({ page }) => {
    await page.route("**/api/billing/membership", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "temporary error" }),
      });
    });
    await page.goto("/account");
    await expect(page.getByText("دریافت وضعیت پلن ممکن نشد")).toBeVisible();
  });
});
