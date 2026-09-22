import { expect, test } from "@playwright/test";
import { mockDataCollections, mockSession } from "./fixtures/session";

const now = "2026-01-01T00:00:00.000Z";
const resumeData = {
  fullName: "کاربر آزمایشی",
  jobTitle: "توسعه‌دهنده فرانت‌اند",
  photoUrl: "",
  email: "test@example.com",
  phone: "09120000000",
  location: "تهران",
  website: "",
  summary: "توسعه‌دهنده React",
  experienceTitle: "",
  company: "",
  experienceDate: "",
  experience: "",
  education: "",
  experiences: [],
  educations: [],
  projects: [],
  skills: "React، TypeScript",
  languages: "فارسی",
};
const resume = {
  id: "resume-1",
  name: "رزومه فرانت‌اند",
  templateId: "simple-one-column",
  data: resumeData,
  source: "user",
  createdAt: now,
  updatedAt: now,
};
const analysis = {
  score: 88,
  jobTitle: "توسعه‌دهنده React",
  company: "رادیکار",
  breakdown: [{ label: "مهارت", value: 90 }],
  strengths: ["React"],
  gaps: ["Testing"],
};

test.describe("شاخه‌های باقی‌ماندهٔ جریان‌های بحرانی", () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page);
  });

  test("لینک آگهی خوانده، تحلیل و به‌عنوان دادهٔ قابل پیگیری ذخیره می‌شود", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      resumes: [resume], jobs: [], applications: [], matchAnalyses: [],
    });
    await page.route("**/api/job-import", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        text: "توسعه‌دهنده React مسلط به TypeScript",
        sourceUrl: "https://jobs.example/react",
        logoUrl: "https://cdn.example/logo.png",
      }) });
    });
    await page.route("**/api/match/analyze", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(analysis) });
    });
    await page.goto("/match");
    await page.getByRole("button", { name: /انتخاب رزومه مبنا/ }).click();
    await page.getByRole("option", { name: /کاربر آزمایشی/ }).click();
    await page.locator("#job-url").fill("https://jobs.example/react");
    await page.getByRole("button", { name: "دریافت لینک و تحلیل تطابق" }).click();
    await expect(page.getByLabel("تطابق رزومه ۸۸ درصد")).toBeVisible();
    await page.getByText("مشاهده متن استخراج‌شده از لینک").click();
    await expect(page.getByText("توسعه‌دهنده React مسلط به TypeScript")).toBeVisible();
    await expect.poll(() => repository.list("jobs").length).toBe(1);
    await expect.poll(() => repository.list("matchAnalyses").length).toBe(1);
    expect(repository.list("jobs")[0]?.sourceUrl).toBe("https://jobs.example/react");
  });

  test("خطای خواندن لینک آگهی تحلیل و ذخیره‌سازی را متوقف می‌کند", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      resumes: [resume], jobs: [], applications: [], matchAnalyses: [],
    });
    await page.route("**/api/job-import", async (route) => {
      await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ error: "لینک آگهی قابل خواندن نیست" }) });
    });
    await page.goto("/match");
    await page.getByRole("button", { name: /انتخاب رزومه مبنا/ }).click();
    await page.getByRole("option", { name: /کاربر آزمایشی/ }).click();
    await page.locator("#job-url").fill("https://jobs.example/broken");
    await page.getByRole("button", { name: "دریافت لینک و تحلیل تطابق" }).click();
    await expect(page.getByText("لینک آگهی قابل خواندن نیست", { exact: true }).first()).toBeVisible();
    await expect(repository.list("jobs")).toHaveLength(0);
    await expect(repository.list("matchAnalyses")).toHaveLength(0);
  });

  test("رزومهٔ اختصاصی پس از تحلیل ساخته و با اتصال به فرصت ذخیره می‌شود", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      resumes: [resume], jobs: [], applications: [], matchAnalyses: [],
    });
    await page.route("**/api/match/analyze", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify(analysis) });
    });
    await page.route("**/api/match/tailor", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        resume: { ...resumeData, summary: "خلاصهٔ اختصاصی برای فرصت رادیکار" },
      }) });
    });
    await page.goto("/match");
    await page.getByRole("radio", { name: /وارد کردن متن آگهی/ }).click();
    await page.locator("#job-description").fill("توسعه‌دهنده React و TypeScript");
    await page.getByRole("button", { name: /انتخاب رزومه مبنا/ }).click();
    await page.getByRole("option", { name: /کاربر آزمایشی/ }).click();
    await page.getByRole("button", { name: "تحلیل تطابق متن" }).click();
    await page.getByRole("button", { name: "ساخت رزومه اختصاصی" }).click();
    await expect(page.getByRole("heading", { name: "انتخاب قالب رزومه" })).toBeVisible();
    await page.getByRole("button", { name: "ساخت رزومه فارسی" }).click();
    await expect(page.getByText("نسخه اختصاصی ساخته شد")).toBeVisible();
    await expect.poll(() => repository.list("resumes").length).toBe(2);
    const tailored = repository.list("resumes").find((item) => item.source === "tailored") as { data?: { summary?: string }; targetJobId?: string } | undefined;
    expect(tailored?.data?.summary).toBe("خلاصهٔ اختصاصی برای فرصت رادیکار");
    expect(tailored?.targetJobId).toBeTruthy();
  });

  test("ساخت جلسهٔ تازهٔ مصاحبه، پرسش‌ها را ذخیره و تمرین را آغاز می‌کند", async ({ page }) => {
    const repository = await mockDataCollections(page, { resumes: [resume], interviewSessions: [] });
    await page.route("**/api/interview/session", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        title: "مصاحبه React", subtitle: "تمرین نقش فرانت‌اند", duration: "۲۰ دقیقه",
        questions: ["React چیست؟"], cards: [{ title: "تمرین فنی", text: "تمرین کن", tone: "mint" }],
      }) });
    });
    await page.goto("/interview");
    await page.getByRole("button", { name: "ساخت جلسه مصاحبه" }).click();
    await expect(page.getByRole("heading", { name: "مصاحبه React" })).toBeVisible();
    await expect.poll(() => repository.list("interviewSessions").length).toBe(1);
    await page.getByRole("button", { name: "شروع مصاحبه آزمایشی" }).click();
    await expect(page.getByText("React چیست؟")).toBeVisible();
  });

  test("خطای ساخت جلسهٔ مصاحبه هیچ رکورد ناقصی ذخیره نمی‌کند", async ({ page }) => {
    const repository = await mockDataCollections(page, { resumes: [resume], interviewSessions: [] });
    await page.route("**/api/interview/session", async (route) => {
      await route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ error: "مدل مصاحبه در دسترس نیست" }) });
    });
    await page.goto("/interview");
    await page.getByRole("button", { name: "ساخت جلسه مصاحبه" }).click();
    await expect(page.getByText("ساخت جلسه انجام نشد")).toBeVisible();
    await expect(page.getByText("مدل مصاحبه در دسترس نیست", { exact: true }).first()).toBeVisible();
    await expect(repository.list("interviewSessions")).toHaveLength(0);
  });

  test("رد شدن سهمیهٔ PDF، چاپ را متوقف و خطا را به کاربر اعلام می‌کند", async ({ page }) => {
    await mockDataCollections(page, { resumes: [resume] });
    let printed = false;
    await page.addInitScript(() => { window.print = () => { window.sessionStorage.setItem("print-called", "true"); }; });
    await page.route("**/api/billing/usage/pdf", async (route) => {
      await route.fulfill({ status: 402, contentType: "application/json", body: JSON.stringify({ error: "سهمیه دانلود PDF تمام شده است" }) });
    });
    await page.goto("/resumes");
    await page.getByRole("button", { name: /مشاهده و ویرایش رزومه فرانت‌اند/ }).click();
    await page.getByRole("button", { name: "دانلود PDF" }).click();
    await expect(page.getByText("سهمیه دانلود PDF تمام شده است", { exact: true }).first()).toBeVisible();
    printed = await page.evaluate(() => window.sessionStorage.getItem("print-called") === "true");
    expect(printed).toBe(false);
  });
});
