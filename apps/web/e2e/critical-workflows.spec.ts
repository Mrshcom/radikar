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

test.describe("جریان‌های بحرانی داده‌های پنل", () => {
  test.beforeEach(async ({ page }) => {
    await mockSession(page);
  });

  test("فرصت شغلی ذخیره و دوباره از ذخیره‌ها خارج می‌شود", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      jobs: [{
        id: "job-1", company: "رادیکار", role: "توسعه‌دهنده React", match: 91,
        place: "دورکاری", age: "امروز", tone: "green", letter: "ر", reason: "تطابق مهارت‌ها",
        description: "React و TypeScript", saved: false, createdAt: now, updatedAt: now,
      }],
      applications: [],
    });
    await page.goto("/jobs");
    await page.getByRole("button", { name: "ذخیره فرصت" }).click();
    await expect(page.getByText("فرصت شغلی ذخیره شد")).toBeVisible();
    await expect.poll(() => repository.get("jobs", "job-1")?.saved).toBe(true);
    await page.getByRole("button", { name: "حذف از ذخیره‌ها" }).click();
    await expect.poll(() => repository.get("jobs", "job-1")?.saved).toBe(false);
  });

  test("اپلای بین مراحل جابه‌جا و از برد حذف می‌شود", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      jobs: [{
        id: "job-1", company: "رادیکار", role: "توسعه‌دهنده React", match: 91,
        place: "تهران", age: "امروز", tone: "green", letter: "ر", description: "React",
        saved: true, createdAt: now, updatedAt: now,
      }],
      applications: [{
        id: "application-1", jobId: "job-1", company: "رادیکار", role: "توسعه‌دهنده React",
        stage: "saved", match: 91, createdAt: now, updatedAt: now,
      }],
    });
    await page.goto("/applications");
    const card = page.getByRole("button", { name: "توسعه‌دهنده React در رادیکار" });
    await card.getByRole("button", { name: "انتقال به مرحله بعد" }).click();
    await expect.poll(() => repository.get("applications", "application-1")?.stage).toBe("applied");
    await expect(page.getByText(/مرحله «ارسال‌شده»/)).toBeVisible();
    await card.getByRole("button", { name: "بازگشت به مرحله قبل" }).click();
    await expect.poll(() => repository.get("applications", "application-1")?.stage).toBe("saved");
    await card.getByRole("button", { name: "حذف فرصت اپلای‌نشده از برد" }).click();
    await page.getByRole("button", { name: "بله، حذف شود" }).click();
    await expect.poll(() => repository.get("applications", "application-1")).toBeUndefined();
  });

  test("رزومه نشان‌دار و سپس با تأیید حذف می‌شود", async ({ page }) => {
    const repository = await mockDataCollections(page, { resumes: [resume] });
    await page.goto("/resumes");
    const pin = page.getByRole("button", { name: "نشان کردن رزومه فرانت‌اند" });
    await pin.click();
    await expect(page.getByRole("button", { name: "برداشتن نشان از رزومه فرانت‌اند" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => repository.get("resumes", "resume-1")?.pinnedAt).toBeTruthy();
    await page.getByRole("button", { name: "حذف رزومه فرانت‌اند" }).click();
    await page.getByRole("button", { name: "بله، حذف شود" }).click();
    await expect(page.getByText("رزومه حذف شد")).toBeVisible();
    await expect.poll(() => repository.get("resumes", "resume-1")).toBeUndefined();
  });

  test("ویرایش، تکمیل AI و درخواست PDF رزومه به‌ترتیب ذخیره می‌شوند", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      resumes: [resume],
      knowledgeProfiles: [{
        id: "profile-default", resumeData, experiences: [], qualifications: [], projects: [], skills: resumeData.skills,
        languages: resumeData.languages, languageItems: [], careerGoals: "", preferredRoles: "", preferredIndustries: "",
        workPreferences: "remote", interviewContext: "", interviewChallenges: "", createdAt: now, updatedAt: now,
      }],
    });
    let pdfUsage = 0;
    await page.addInitScript(() => { window.print = () => undefined; });
    await page.route("**/api/resume/generate", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ resume: { ...resumeData, summary: "خلاصه تکمیل‌شده توسط مدل" } }) });
    });
    await page.route("**/api/billing/usage/pdf", async (route) => {
      pdfUsage += 1;
      await route.fulfill({ status: 204 });
    });
    await page.goto("/resumes");
    await page.getByRole("button", { name: /مشاهده و ویرایش رزومه فرانت‌اند/ }).click();
    await page.getByLabel("نام رزومه").fill("رزومه ارشد فرانت‌اند");
    await page.getByRole("button", { name: "ذخیره رزومه", exact: true }).first().click();
    await expect.poll(() => repository.get("resumes", "resume-1")?.name).toBe("رزومه ارشد فرانت‌اند");

    await page.getByRole("button", { name: /تکمیل رزومه با AI/ }).click();
    await page.getByRole("button", { name: "بله، ادامه بده" }).click();
    await page.getByRole("button", { name: /رزومه فارسی/ }).click();
    await expect(page.getByText("رزومه با مدل ساخته و ذخیره شد.")).toBeVisible();
    await expect.poll(() => {
      const stored = repository.get("resumes", "resume-1") as { data?: { summary?: string } } | undefined;
      return stored?.data?.summary;
    }).toBe("خلاصه تکمیل‌شده توسط مدل");

    await page.getByRole("button", { name: "دانلود PDF" }).click();
    await expect.poll(() => pdfUsage).toBe(1);
  });

  test("تحلیل تطبیق موفق، نتیجه و رکوردهای وابسته را ذخیره می‌کند", async ({ page }) => {
    const repository = await mockDataCollections(page, { resumes: [resume], jobs: [], applications: [], matchAnalyses: [] });
    await page.route("**/api/match/analyze", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        score: 88, jobTitle: "توسعه‌دهنده React", company: "رادیکار",
        breakdown: [{ label: "مهارت", value: 90 }], strengths: ["React"], gaps: ["Testing"],
      }) });
    });
    await page.goto("/match");
    await page.getByRole("radio", { name: /وارد کردن متن آگهی/ }).click();
    await page.locator("#job-description").fill("توسعه‌دهنده مسلط به React و TypeScript");
    await page.getByRole("button", { name: /انتخاب رزومه مبنا/ }).click();
    await page.getByRole("option", { name: /کاربر آزمایشی/ }).click();
    await page.getByRole("button", { name: "تحلیل تطابق متن" }).click();
    await expect(page.getByLabel("تطابق رزومه ۸۸ درصد")).toBeVisible();
    await expect(page.getByText("React", { exact: true })).toBeVisible();
    await expect.poll(() => repository.list("matchAnalyses").length).toBe(1);
    await expect.poll(() => repository.list("jobs").length).toBe(1);
  });

  test("پایگاه دانش افزودن/حذف تجربه و اعتبارسنجی تصویر را ذخیره می‌کند", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      knowledgeProfiles: [{
        id: "profile-default", resumeData, skills: resumeData.skills, languages: resumeData.languages,
        experiences: [{ id: "experience-1", jobTitle: "برنامه‌نویس", company: "شرکت اول", location: "تهران", startDate: "1402/01", endDate: "", isCurrent: true, description: "", technologies: "React" }],
        qualifications: [], projects: [], languageItems: [{ id: "language-1", name: "فارسی", proficiency: "زبان مادری" }],
        careerGoals: "", preferredRoles: "", preferredIndustries: "", workPreferences: "remote",
        interviewContext: "", interviewChallenges: "", createdAt: now, updatedAt: now,
      }],
    });
    await page.goto("/knowledge-base");
    await page.getByRole("tab", { name: /تجربه حرفه‌ای/ }).click();
    await page.getByRole("button", { name: "افزودن تجربه" }).click();
    await page.getByLabel("عنوان شغلی").fill("مهندس ارشد فرانت‌اند");
    await page.getByLabel("شرکت یا سازمان").fill("رادیکار");
    await page.getByRole("button", { name: "حذف تجربه ۲" }).click();
    await page.getByRole("button", { name: "بله، حذف شود" }).click();

    await page.getByRole("tab", { name: /اطلاعات فردی/ }).click();
    const photoInput = page.locator('input[accept="image/*"]');
    await photoInput.setInputFiles({ name: "not-image.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
    await expect(page.getByText("فایل انتخاب‌شده باید تصویر باشد.")).toBeVisible();
    await page.getByRole("button", { name: "ذخیره پروفایل مسیر شغلی" }).click();
    await expect.poll(() => {
      const profile = repository.get("knowledgeProfiles", "profile-default") as { experiences?: unknown[] } | undefined;
      return profile?.experiences?.length;
    }).toBe(1);
  });

  test("خطای تحلیل تطبیق بدون ذخیره داده نمایش داده می‌شود", async ({ page }) => {
    const repository = await mockDataCollections(page, { resumes: [resume], jobs: [], applications: [], matchAnalyses: [] });
    await page.route("**/api/match/analyze", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "مدل در دسترس نیست" }) });
    });
    await page.goto("/match");
    await page.getByRole("radio", { name: /وارد کردن متن آگهی/ }).click();
    await page.locator("#job-description").fill("متن آگهی آزمایشی");
    await page.getByRole("button", { name: /انتخاب رزومه مبنا/ }).click();
    await page.getByRole("option", { name: /کاربر آزمایشی/ }).click();
    await page.getByRole("button", { name: "تحلیل تطابق متن" }).click();
    await expect(page.getByText("تحلیل انجام نشد")).toBeVisible();
    await expect(repository.list("matchAnalyses")).toHaveLength(0);
  });

  test("جلسه مصاحبه ذخیره‌شده باز می‌شود و بازخورد پاسخ ذخیره می‌گردد", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      resumes: [resume],
      interviewSessions: [{
        id: "interview-1", title: "مصاحبه فرانت‌اند", subtitle: "تمرین React", duration: "۲۰ دقیقه",
        mode: "مصاحبه شخصی‌سازی‌شده", questions: ["React چیست؟", "TypeScript چیست؟"],
        cards: [], feedbacks: [], createdAt: now, updatedAt: now,
      }],
    });
    await page.route("**/api/interview/feedback", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({ title: "پاسخ خوب", text: "مثال عملی بیشتری اضافه کن." }) });
    });
    await page.goto("/interview");
    await page.getByRole("button", { name: /شروع مصاحبه آزمایشی/ }).click();
    await expect(page.getByText("React چیست؟")).toBeVisible();
    await page.getByPlaceholder("پاسخ خودت را وارد کن...").fill("React یک کتابخانه رابط کاربری است.");
    await page.getByRole("button", { name: "دریافت بازخورد" }).click();
    await expect(page.getByText("پاسخ خوب")).toBeVisible();
    await expect.poll(() => {
      const session = repository.get("interviewSessions", "interview-1") as { feedbacks?: unknown[] } | undefined;
      return session?.feedbacks?.length;
    }).toBe(1);
    await page.getByRole("button", { name: /سؤال بعدی/ }).click();
    await expect(page.getByText("TypeScript چیست؟")).toBeVisible();
  });

  test("داشبورد تحلیل تازه را نمایش می‌دهد و برای مراجعه بعدی ذخیره می‌کند", async ({ page }) => {
    const repository = await mockDataCollections(page, {
      resumes: [resume], jobs: [], applications: [], dashboardSnapshots: [], knowledgeProfiles: [],
    });
    await page.route("**/api/panel/dashboard", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        greeting: "سلام کاربر آزمایشی",
        subtitle: "وضعیت مسیر شغلی شما",
        profileScore: 82,
        heroTitle: "پروفایل شما آماده فرصت‌های بهتر است",
        heroText: "رزومه را برای نقش‌های ارشد هدفمند کن.",
        aiTitle: "یک پروژه TypeScript اضافه کن",
        aiText: "این تغییر تطابق رزومه را بهتر می‌کند.",
      }) });
    });
    await page.goto("/dashboard");
    await expect(page.getByText("پروفایل شما آماده فرصت‌های بهتر است")).toBeVisible();
    await expect(page.getByLabel("امتیاز رزومه ۸۲ از ۱۰۰")).toBeVisible();
    await expect(page.getByText("یک پروژه TypeScript اضافه کن")).toBeVisible();
    await expect.poll(() => repository.list("dashboardSnapshots").length).toBe(1);
    await expect.poll(() => repository.get("dashboardSnapshots", "dashboard-resume-resume-1")?.sourceUpdatedAt).toBe(now);
  });

  test("داشبورد از snapshot معتبر استفاده می‌کند و دوباره مدل را فراخوانی نمی‌کند", async ({ page }) => {
    let modelRequests = 0;
    await mockDataCollections(page, {
      resumes: [resume], jobs: [], applications: [], knowledgeProfiles: [],
      dashboardSnapshots: [{
        id: "dashboard-resume-resume-1", resumeId: "resume-1", sourceId: "resume-1",
        sourceType: "resume", sourceUpdatedAt: now, greeting: "سلام",
        subtitle: "خلاصه کش‌شده", profileScore: 75, heroTitle: "تحلیل کش‌شده داشبورد",
        heroText: "بدون درخواست مجدد", aiTitle: "پیشنهاد کش‌شده", aiText: "متن پیشنهاد",
        createdAt: now, updatedAt: now,
      }],
    });
    await page.route("**/api/panel/dashboard", async (route) => {
      modelRequests += 1;
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "نباید فراخوانی شود" }) });
    });
    await page.goto("/dashboard");
    await expect(page.getByText("تحلیل کش‌شده داشبورد")).toBeVisible();
    await expect.poll(() => modelRequests).toBe(0);
  });

  test("خطای ساخت داشبورد حالت خطا و امکان تلاش دوباره را نشان می‌دهد", async ({ page }) => {
    await mockDataCollections(page, {
      resumes: [resume], jobs: [], applications: [], dashboardSnapshots: [], knowledgeProfiles: [],
    });
    await page.route("**/api/panel/dashboard", async (route) => {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "سرویس تحلیل در دسترس نیست" }) });
    });
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "ساخت داشبورد ناموفق بود" })).toBeVisible();
    await expect(page.getByRole("paragraph").filter({ hasText: "سرویس تحلیل در دسترس نیست" })).toBeVisible();
    await expect(page.getByRole("button", { name: "تلاش دوباره" })).toBeVisible();
  });

  test("ورود فایل رزومه، داده استخراج‌شده را در پایگاه دانش ذخیره می‌کند", async ({ page }) => {
    const repository = await mockDataCollections(page, { knowledgeProfiles: [] });
    await page.route("**/api/knowledge/import", async (route) => {
      await route.fulfill({ contentType: "application/json", body: JSON.stringify({
        fileName: "resume.txt",
        resumeData: { ...resumeData, fullName: "کاربر واردشده", summary: "خلاصه استخراج‌شده" },
        skills: "React، Playwright",
        experiences: [], qualifications: [], projects: [], languageItems: [],
      }) });
    });
    await page.goto("/knowledge-base");
    await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
      name: "resume.txt", mimeType: "text/plain", buffer: Buffer.from("sample resume"),
    });
    await expect(page.getByText(/اطلاعات «resume\.txt» آماده بازبینی است/)).toBeVisible();
    await expect.poll(() => {
      const profile = repository.list("knowledgeProfiles")[0] as { resumeData?: { fullName?: string }; skills?: string } | undefined;
      return `${profile?.resumeData?.fullName}|${profile?.skills}`;
    }).toBe("کاربر واردشده|React، Playwright");
  });

  test("خطای ورود فایل رزومه نمایش داده می‌شود و داده ناقص ذخیره نمی‌شود", async ({ page }) => {
    const repository = await mockDataCollections(page, { knowledgeProfiles: [] });
    await page.route("**/api/knowledge/import", async (route) => {
      await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ error: "متن رزومه قابل استخراج نیست" }) });
    });
    await page.goto("/knowledge-base");
    await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
      name: "broken.txt", mimeType: "text/plain", buffer: Buffer.from("broken"),
    });
    await expect(page.getByText("متن رزومه قابل استخراج نیست", { exact: true }).first()).toBeVisible();
    await expect(repository.list("knowledgeProfiles")).toHaveLength(0);
  });
});
