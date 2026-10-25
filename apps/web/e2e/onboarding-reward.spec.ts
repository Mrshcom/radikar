import { expect, test } from "@playwright/test";
import { mockSession } from "./fixtures/session";

test("تا دریافت وضعیت، راهنما اسکلتون دارد و پاداش اشتباه نشان نمی‌دهد", async ({ page }) => {
  await mockSession(page, "user", true);
  let release: () => void = () => {};
  const responseReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/radicoin/onboarding-reward", async (route) => {
    await responseReady;
    await route.fulfill({
      json: {
        amount: 100,
        eligible: true,
        claimed: true,
        completedSteps: ["profile", "match", "resume", "application", "referral", "interview"],
      },
    });
  });
  await page.goto("/interview");
  await page.getByRole("button", { name: "باز کردن راهنمای رادیکار" }).click();
  const loading = page.getByRole("status", { name: "در حال دریافت اطلاعات راهنما" });
  await expect(loading).toBeVisible();
  await expect(page.getByText("+۱۰۰", { exact: true })).toHaveCount(0);
  await expect(page.getByText("پاداش دریافت شد", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "دریافت ۱۰۰ رادیکوین" })).toHaveCount(0);
  release();
  await expect(loading).toHaveCount(0);
  await expect(page.getByText("پاداش دریافت شد", { exact: true })).toBeVisible();
});

test("پاداش مسیر فقط با کلیک دریافت می‌شود و پس از خطا قابل تلاش مجدد است", async ({ page }) => {
  await mockSession(page, "user", true);
  let claimed = false;
  let attempts = 0;
  let balance = 17;
  const steps = ["profile", "match", "resume", "application", "referral", "interview"];
  await page.route("**/api/radicoin/onboarding-reward", (route) =>
    route.fulfill({ json: { amount: 100, eligible: true, claimed, completedSteps: steps } }),
  );
  await page.route("**/api/radicoin/wallet**", (route) =>
    route.fulfill({
      json: {
        wallet: {
          userId: "e2e-user-user",
          availableCoins: balance,
          pendingCoins: 0,
          lifetimeEarnedCoins: balance,
          lifetimeSpentCoins: 0,
        },
        transactions: [],
      },
    }),
  );
  await page.route("**/api/radicoin/transactions**", (route) =>
    route.fulfill({ json: { items: [], nextCursor: null } }),
  );
  await page.route("**/api/radicoin/onboarding-reward/claim", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, json: { error: "دریافت پاداش انجام نشد؛ دوباره تلاش کن." } });
      return;
    }
    const credited = !claimed;
    if (credited) balance += 100;
    claimed = true;
    await route.fulfill({ json: { amount: 100, eligible: true, claimed, credited, completedSteps: steps } });
  });
  await page.goto("/radicoins");
  await page.getByRole("button", { name: "باز کردن راهنمای رادیکار" }).click();
  const button = page.getByRole("button", { name: "دریافت ۱۰۰ رادیکوین" });
  await expect(button).toBeVisible();
  expect(attempts).toBe(0);
  expect(balance).toBe(17);
  await button.click();
  await expect(page.getByText("دریافت پاداش انجام نشد؛ دوباره تلاش کن.", { exact: true }).first()).toBeVisible();
  await expect(button).toBeEnabled();
  expect(balance).toBe(17);
  await button.click();
  await expect(page.getByText("پاداش دریافت شد", { exact: true })).toBeVisible();
  await expect(button).toHaveCount(0);
  expect(balance).toBe(117);
  await page.screenshot({ path: test.info().outputPath("onboarding-reward-claimed.png") });
  await page.getByRole("button", { name: "بستن راهنما", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "باز کردن راهنمای رادیکار" }).click();
  await expect(page.getByText("پاداش دریافت شد", { exact: true })).toBeVisible();
  await expect(button).toHaveCount(0);
  expect(attempts).toBe(2);
  expect(balance).toBe(117);
});

test("مسیر ناقص دکمه دریافت پاداش ندارد", async ({ page }) => {
  await mockSession(page, "user", true);
  await page.route("**/api/radicoin/onboarding-reward", (route) =>
    route.fulfill({ json: { amount: 100, eligible: false, claimed: false, completedSteps: ["profile"] } }),
  );
  await page.goto("/interview");
  await page.getByRole("button", { name: "باز کردن راهنمای رادیکار" }).click();
  await expect(page.getByRole("heading", { name: "مسیر حرفه‌ای‌ات را قدم‌به‌قدم بساز" })).toBeVisible();
  await expect(page.getByRole("button", { name: "دریافت ۱۰۰ رادیکوین" })).toHaveCount(0);
});
