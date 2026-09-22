import { expect, test } from "@playwright/test";
import { mockSession } from "./fixtures/session";

const order = {
  id: "order-1",
  orderNumber: "RK-1001",
  amountRials: 990000,
  status: "paid",
  gateway: "zarinpal",
  refId: "REF-1",
  failureMessage: null,
  paidAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};
const plan = {
  id: "starter", name: "شروع", description: "", priceRials: 0, durationDays: 30,
  resumeLimit: 3, pdfDownloadLimit: 3, aiCredits: 10, matchCredits: 3, interviewCredits: 3,
  isFree: true, isPurchasable: true, sortOrder: 1,
};

test.describe("حالت‌های مهم پنل کاربر", () => {
  test("ذخیره پایگاه دانش هر دو رکورد پروفایل را از مسیر دادهٔ مشترک ثبت می‌کند", async ({ page }) => {
    await mockSession(page);
    const savedCollections: string[] = [];
    await page.route("**/v1/data/**", async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (route.request().method() === "GET") {
        const isSingleRecord = pathname.split("/").length >= 5;
        await route.fulfill({ contentType: "application/json", body: isSingleRecord ? "null" : "[]" });
        return;
      }
      if (route.request().method() === "PUT") {
        savedCollections.push(pathname.split("/")[3] ?? "");
        await route.fulfill({ contentType: "application/json", body: route.request().postData() ?? "{}" });
        return;
      }
      await route.fulfill({ status: 204 });
    });
    await page.goto("/knowledge-base");
    await page.getByRole("button", { name: "ذخیره پروفایل مسیر شغلی" }).click();
    await expect(page.getByText("پایگاه دانش ذخیره شد و برای ابزارهای رادیکار آماده است.")).toBeVisible();
    await expect.poll(() => savedCollections).toEqual(
      expect.arrayContaining(["knowledgeProfiles", "userProfiles"]),
    );
  });

  test("سفارش‌ها جست‌وجو، فیلتر و صفحه‌بندی را در URL نگه می‌دارند", async ({ page }) => {
    await mockSession(page);
    await page.route("**/api/billing/orders**", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [{ order, plan }], total: 31, page: 1, pageSize: 10 }) });
    });
    await page.goto("/orders");
    await expect(page.getByText("RK-1001")).toBeVisible();
    await page.getByPlaceholder("شماره سفارش").fill("RK-1001");
    await page.getByRole("button", { name: "جست‌وجو", exact: true }).click();
    await expect(page).toHaveURL(/q=RK-1001/);
    await page.getByRole("button", { name: "فیلتر پیشرفته" }).click();
    await page.getByLabel("وضعیت سفارش").selectOption("paid");
    await expect(page).toHaveURL(/status=paid/);
    await page.getByRole("button", { name: "صفحه بعد" }).click();
    await expect(page).toHaveURL(/page=2/);
  });

  test("حالت بدون رزومه مصاحبه، مسیر تکمیل پروفایل را پیشنهاد می‌کند", async ({ page }) => {
    await mockSession(page);
    await page.goto("/interview");
    await expect(page.getByRole("heading", { name: "اطلاعاتی برای تمرین وجود ندارد" })).toBeVisible();
    await page.getByRole("link", { name: "تکمیل پروفایل مسیر شغلی" }).click();
    await expect(page).toHaveURL("/knowledge-base");
  });

  test("خروج از حساب نشست را پاک و کاربر را به ورود می‌فرستد", async ({ page }) => {
    await mockSession(page);
    await page.goto("/settings");
    await page.getByRole("button", { name: "خروج از حساب روی این دستگاه" }).click();
    await expect(page).toHaveURL("/login");
  });
});
