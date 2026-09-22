import { expect, test } from "@playwright/test";
import { mockSession } from "./fixtures/session";

const paidPlan = {
  id: "job-search",
  name: "جست‌وجوی حرفه‌ای",
  description: "پلن آزمایشی قابل خرید",
  priceRials: 990000,
  durationDays: 30,
  resumeLimit: 10,
  pdfDownloadLimit: 10,
  aiCredits: 30,
  matchCredits: 10,
  interviewCredits: 10,
  isFree: false,
  isPurchasable: true,
  sortOrder: 2,
};

test.describe("خرید و نتیجه پرداخت", () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page);
  });

  test("پیش‌فاکتور پلن قابل خرید باز و بسته می‌شود", async ({ page }) => {
    await page.route("**/api/billing/plans", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify([paidPlan]),
      });
    });
    await page.goto("/upgrade");
    await page.getByRole("button", { name: "ارتقا و فعال‌سازی" }).click();

    await expect(page.getByRole("heading", { name: "پیش‌فاکتور خرید بسته" })).toBeVisible();
    await expect(
      page.getByRole("dialog", { name: "پیش‌فاکتور خرید بسته" }).getByText("جست‌وجوی حرفه‌ای"),
    ).toBeVisible();
    await page.getByRole("button", { name: "انصراف" }).click();
    await expect(page.getByRole("heading", { name: "پیش‌فاکتور خرید بسته" })).toBeHidden();
  });

  test("خطای ساخت سفارش داخل پیش‌فاکتور باقی می‌ماند و قابل تلاش مجدد است", async ({ page }) => {
    let attempts = 0;
    await page.route("**/api/billing/plans", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify([paidPlan]) });
    });
    await page.route("**/api/billing/orders", async (route) => {
      attempts += 1;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "ایجاد سفارش ناموفق بود" }) });
    });
    await page.goto("/upgrade");
    await page.getByRole("button", { name: "ارتقا و فعال‌سازی" }).click();
    await page.getByRole("button", { name: "تأیید و انتقال به درگاه" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "ایجاد سفارش ناموفق بود" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "پیش‌فاکتور خرید بسته" })).toBeVisible();
    await page.getByRole("button", { name: "تأیید و انتقال به درگاه" }).click();
    await expect.poll(() => attempts).toBe(2);
  });

  test("نتیجه موفق پرداخت مسیر سفارش‌ها را پیشنهاد می‌کند", async ({ page }) => {
    await page.goto("/billing/result?status=success");
    await expect(page.getByRole("heading", { name: "پرداخت با موفقیت تأیید شد" })).toBeVisible();
    await page.getByRole("link", { name: "مشاهده سفارش‌ها" }).click();
    await expect(page).toHaveURL("/orders");
  });

  test("نتیجه ناموفق پرداخت بازگشت به پنل را پیشنهاد می‌کند", async ({ page }) => {
    await page.goto("/billing/result?status=failed");
    await expect(page.getByRole("heading", { name: "پرداخت تکمیل نشد" })).toBeVisible();
    await page.getByRole("link", { name: "بازگشت به پنل" }).click();
    await expect(page).toHaveURL("/dashboard");
  });
});
