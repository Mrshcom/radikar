import { expect, test } from "@playwright/test";

test.describe("ورود با کد یک‌بارمصرف", () => {
  test("شماره نامعتبر را بدون ارسال درخواست رد می‌کند", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("09123456789").fill("0912");
    await page.getByRole("button", { name: "دریافت کد ورود" }).click();
    await expect(page.getByText("شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد.")).toBeVisible();
  });

  test("کاربر با کد توسعه وارد داشبورد می‌شود", async ({ page }) => {
    const phone = `091${String(Date.now()).slice(-8)}`;
    await page.goto("/login");
    await page.getByPlaceholder("09123456789").fill(phone);
    await page.getByRole("button", { name: "دریافت کد ورود" }).click();

    const developmentCode = page.getByText("کد محیط توسعه:").locator("..").locator("strong");
    await expect(developmentCode).toBeVisible();
    const code = await developmentCode.textContent();
    expect(code).toMatch(/^\d{6}$/);

    for (const [index, digit] of [...(code ?? "")].entries()) {
      await page.getByLabel(`رقم ${index + 1} کد یک‌بارمصرف`).fill(digit);
    }

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("داشبورد هنوز داده‌ای ندارد")).toBeVisible();
  });

  test("کد اشتباه را نمایش می‌دهد و ارسال مجدد، چالش تازه دریافت می‌کند", async ({ page }) => {
    let otpRequests = 0;
    await page.route("**/api/auth/request-otp", async (route) => {
      otpRequests += 1;
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
        challengeId: `challenge-${otpRequests}`,
        expiresInSeconds: 180,
        developmentCode: "123456",
      }) });
    });
    await page.route("**/api/auth/verify-otp", async (route) => {
      await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "کد ورود نادرست یا منقضی شده است" }) });
    });
    await page.goto("/login");
    await page.getByPlaceholder("09123456789").fill("09121234567");
    await page.getByRole("button", { name: "دریافت کد ورود" }).click();
    for (const [index, digit] of [..."000000"].entries()) {
      await page.getByLabel(`رقم ${index + 1} کد یک‌بارمصرف`).fill(digit);
    }
    await expect(page.getByText("کد ورود نادرست یا منقضی شده است", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "ارسال مجدد کد" }).click();
    await expect.poll(() => otpRequests).toBe(2);
    await expect(page.getByLabel("رقم 1 کد یک‌بارمصرف")).toHaveValue("");
  });

  test("خطای سرویس دریافت کد در همان مرحلهٔ شماره همراه باقی می‌ماند", async ({ page }) => {
    await page.route("**/api/auth/request-otp", async (route) => {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "سرویس پیامک موقتاً در دسترس نیست" }) });
    });
    await page.goto("/login");
    await page.getByPlaceholder("09123456789").fill("09121234567");
    await page.getByRole("button", { name: "دریافت کد ورود" }).click();
    await expect(page.getByText("سرویس پیامک موقتاً در دسترس نیست", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("09123456789")).toBeVisible();
  });
});
