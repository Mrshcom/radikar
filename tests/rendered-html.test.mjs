import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function request(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${pathname}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const url = new URL(
        `${entry.name}${entry.isDirectory() ? "/" : ""}`,
        directory,
      );
      if (entry.isDirectory()) return sourceFiles(url);
      return /\.(?:ts|tsx)$/.test(entry.name) ? [url] : [];
    }),
  );
  return nested.flat();
}

test("home redirects to the dynamic dashboard", async () => {
  const response = await request("/");
  assert.ok([307, 308].includes(response.status));
  assert.equal(
    new URL(response.headers.get("location"), "http://localhost").pathname,
    "/dashboard",
  );
});

test("login page uses a two-step validated mobile OTP flow and routes successful login to dashboard", async () => {
  const loginPage = await readFile(
    new URL("app/login/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(loginPage, /useForm<PhoneValues>/);
  assert.match(loginPage, /useForm<OtpValues>/);
  assert.match(loginPage, /zodResolver\(phoneSchema\)/);
  assert.match(loginPage, /zodResolver\(otpSchema\)/);
  assert.match(loginPage, /autoComplete="tel"/);
  assert.match(loginPage, /\^09\\d\{9\}\$/);
  assert.match(
    loginPage,
    /autoComplete=\{index === 0 \? "one-time-code" : "off"\}/,
  );
  assert.match(loginPage, /Array\.from\(\{ length: 6 \}/);
  assert.match(loginPage, /grid grid-cols-6 gap-2 sm:gap-3/);
  assert.match(loginPage, /handleOtpPaste/);
  assert.match(loginPage, /handleOtpKeyDown/);
  assert.match(loginPage, /shouldValidate: false/);
  assert.match(
    loginPage,
    /completedCode\.length === 6[\s\S]*?handleOtpSubmit\(verifyOtp\)\(\)/,
  );
  assert.doesNotMatch(loginPage, /shouldValidate: true/);
  assert.match(loginPage, /دریافت کد ورود/);
  assert.match(loginPage, /تأیید و ورود/);
  assert.doesNotMatch(loginPage, /type="password"/);
  assert.match(loginPage, /router\.push\("\/dashboard"\)/);
  assert.match(loginPage, /ورود به حساب کاربری/);
  assert.match(loginPage, /src="\/logo\.svg"/);
});

test("dashboard expandable text starts collapsed without a mount animation", async () => {
  const dashboard = await readFile(
    new URL("app/(panel)/dashboard/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    dashboard,
    /const \[hasInteracted, setHasInteracted\] = useState\(false\)/,
  );
  assert.match(
    dashboard,
    /const \[collapsedHeight, setCollapsedHeight\] = useState\(57\)/,
  );
  assert.match(
    dashboard,
    /const \[expandedHeight, setExpandedHeight\] = useState\(57\)/,
  );
  assert.match(
    dashboard,
    /hasInteracted \? "transition-\[max-height\] duration-300 ease-in-out" : ""/,
  );
  assert.match(
    dashboard,
    /maxHeight: `\$\{expanded \? expandedHeight : collapsedHeight\}px`/,
  );
  assert.match(dashboard, /setHasInteracted\(true\);\s+onToggle\(\);/);
  assert.match(
    dashboard,
    /className="mt-auto w-full pt-4"[\s\S]*?شروع تطبیق هوشمند/,
  );
});

test("sidebar menu starts directly with navigation items", async () => {
  const panelShell = await readFile(
    new URL("app/(panel)/_components/panel-shell.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    panelShell,
    /<nav className="flex flex-col gap-\[5px\]" aria-label="منوی اصلی">\s*\{menuItems\.map/,
  );
});

test("knowledge base about section uses the large textarea size", async () => {
  const knowledgeBase = await readFile(
    new URL("app/(panel)/knowledge-base/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    knowledgeBase,
    /<Field\s+textarea\s+textareaSize="large"\s+label="درباره من"/,
  );
  assert.match(
    knowledgeBase,
    /textareaSize === "large" \? "!min-h-44" : "!min-h-28"/,
  );
});

test("production CSS preserves the large textarea height override", async () => {
  const assetDirectory = new URL("dist/client/assets/", projectRoot);
  const cssFiles = (await readdir(assetDirectory)).filter((file) =>
    file.endsWith(".css"),
  );
  const productionCss = (
    await Promise.all(
      cssFiles.map((file) => readFile(new URL(file, assetDirectory), "utf8")),
    )
  ).join("\n");
  const selectorIndex = productionCss.indexOf(".\\!min-h-44");

  assert.notEqual(selectorIndex, -1);
  const ruleEnd = productionCss.indexOf("}", selectorIndex);
  const largeHeightRule = productionCss.slice(selectorIndex, ruleEnd + 1);
  assert.match(largeHeightRule, /min-height:[^}]+!important/);
});

test("skill autocomplete is left aligned while its placeholder stays right aligned", async () => {
  const knowledgeBase = await readFile(
    new URL("app/(panel)/knowledge-base/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    knowledgeBase,
    /className="min-h-7 min-w-\[150px\][^"]*text-left[^"]*placeholder:text-right"\s+dir="ltr"/,
  );
  assert.match(
    knowledgeBase,
    /role="listbox"[\s\S]*?className="flex w-full[^"]*text-left/,
  );
});

test("uses an IndexedDB repository with a swappable HTTP adapter", async () => {
  const [repository, stores, models] = await Promise.all([
    readFile(new URL("lib/data/repository.ts", projectRoot), "utf8"),
    readFile(new URL("lib/data/stores.ts", projectRoot), "utf8"),
    readFile(new URL("lib/data/models.ts", projectRoot), "utf8"),
  ]);

  assert.match(repository, /class IndexedDbRepository/);
  assert.match(repository, /class HttpDataRepository/);
  assert.match(repository, /NEXT_PUBLIC_DATA_SOURCE/);
  assert.match(repository, /NEXT_PUBLIC_DATA_API_BASE_URL/);
  assert.match(stores, /userProfileStore/);
  assert.match(stores, /resumeStore/);
  assert.match(stores, /jobStore/);
  assert.match(stores, /applicationStore/);
  assert.match(stores, /interviewSessionStore/);
  assert.match(stores, /matchAnalysisStore/);
  assert.match(models, /dashboardSnapshots/);
});

test("starts with empty user data and does not use browser string storage", async () => {
  const resumeData = await readFile(
    new URL("app/(panel)/resumes/resume-data.ts", projectRoot),
    "utf8",
  );
  const files = [
    ...(await sourceFiles(new URL("app/", projectRoot))),
    ...(await sourceFiles(new URL("lib/", projectRoot))),
  ];
  const source = (
    await Promise.all(files.map((file) => readFile(file, "utf8")))
  ).join("\n");

  assert.match(resumeData, /export const emptyResumeData/);
  assert.doesNotMatch(source, /\blocalStorage\b|\bsessionStorage\b/);
  assert.doesNotMatch(
    source,
    /سینا احمدی|شرکت پیشنهادی|موقعیت مرتبط|Product Lead/,
  );
});

test("resume import retries empty LLM responses with a stable JSON model", async () => {
  const [llmClient, importRoute] = await Promise.all([
    readFile(new URL("lib/llm-client.ts", projectRoot), "utf8"),
    readFile(
      new URL("app/api/knowledge/import/route.ts", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(llmClient, /MAX_EMPTY_RESPONSE_ATTEMPTS = 3/);
  assert.match(llmClient, /reasoning_content/);
  assert.match(llmClient, /findResponseJson/);
  assert.match(llmClient, /choice\?\.delta\?\.content/);
  assert.match(llmClient, /rawResponse/);
  assert.match(llmClient, /!\("choices" in payload\)/);
  assert.match(
    llmClient,
    /مدل پاسخی برای استخراج اطلاعات نداد\. لطفاً دوباره تلاش کن\./,
  );
  assert.match(importRoute, /model: "deepseek-chat"/);
  assert.match(importRoute, /"languageName":string/);
  assert.match(
    importRoute,
    /name: language\.languageName \?\? language\.name \?\? ""/,
  );
});

test("resume picker exposes seven selectable layouts including both supplied references", async () => {
  const resumeData = await readFile(
    new URL("app/(panel)/resumes/resume-data.ts", projectRoot),
    "utf8",
  );
  const selectableBlock = resumeData.match(
    /const selectableTemplateIds = new Set\(\[([\s\S]*?)\]\);/,
  )?.[1];
  const selectableIds = [
    ...(selectableBlock || "").matchAll(/"([^"]+)"/g),
  ].map((match) => match[1]);

  assert.deepEqual(selectableIds, [
    "simple-one-column",
    "timeline-classic",
    "banner-modern",
    "red-administrative",
    "orange-pill",
    "editorial-sidebar",
    "sector-yellow",
  ]);
  assert.match(resumeData, /name: "حرفه‌ای چندتمی"/);
  assert.match(resumeData, /۹ رنگ‌بندی قابل انتخاب/);
  assert.match(resumeData, /name: "اداری قرمز"/);
  assert.match(resumeData, /name: "مینیمال نارنجی"/);
  assert.match(
    resumeData,
    /return \[\s*"simple-one-column",\s*"timeline-classic"/,
  );
});

test("every resume template preview uses complete multi-entry sample data", async () => {
  const previewData = await readFile(
    new URL("app/(panel)/resumes/template-preview-data.ts", projectRoot),
    "utf8",
  );

  assert.equal(
    [...previewData.matchAll(/id: "preview-experience-\d+"/g)].length,
    3,
  );
  assert.equal(
    [...previewData.matchAll(/id: "preview-education-\d+"/g)].length,
    2,
  );
  for (const field of [
    "fullName",
    "jobTitle",
    "photoUrl",
    "email",
    "phone",
    "location",
    "website",
    "summary",
    "skills",
    "languages",
  ]) {
    assert.match(previewData, new RegExp(`${field}:\\s*"[^"]+"`));
  }
});

test("long resumes paginate consistently in previews and printable documents", async () => {
  const [resumeData, resumeDocument, scaledPreview, renderedPagination] = await Promise.all([
    readFile(new URL("app/(panel)/resumes/resume-data.ts", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/resumes/scaled-resume-preview.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL(
        "app/(panel)/resumes/use-rendered-resume-pagination.ts",
        projectRoot,
      ),
      "utf8",
    ),
  ]);

  assert.match(resumeData, /export function paginateResumeData/);
  assert.match(resumeData, /experienceWeight/);
  assert.match(
    resumeData,
    /function paginateOneColumnResume[\s\S]*?const firstPageCapacity = 26[\s\S]*?const continuationPageCapacity = 34/,
  );
  assert.match(
    resumeData,
    /if \(isOneColumnTemplate\) return paginateOneColumnResume\(data\)/,
  );
  assert.match(resumeData, /reserveBlock/);
  assert.match(resumeData, /usesIndependentSidebar/);
  assert.match(resumeData, /firstEducationCount/);
  assert.match(resumeData, /lastPageBaseWeight \+ trailingContentWeight/);
  assert.match(
    resumeDocument,
    /useRenderedResumePagination\([\s\S]*?props\.data,[\s\S]*?props\.templateId/,
  );
  assert.match(scaledPreview, /useRenderedResumePagination/);
  assert.match(resumeDocument, /data-resume-pagination-probe/);
  assert.match(scaledPreview, /data-resume-pagination-probe/);
  assert.match(renderedPagination, /PAGE_BOTTOM_RESERVE = 36/);
  assert.match(renderedPagination, /moveFirstBlockBack/);
  assert.match(renderedPagination, /getBoundingClientRect/);
  assert.match(renderedPagination, /contentBottom <= pageRect\.bottom - PAGE_BOTTOM_RESERVE/);
  assert.match(resumeDocument, /print:break-after-page/);
  assert.match(scaledPreview, /ResumeDocumentPage/);
  assert.match(scaledPreview, /pages\.slice\(0, 1\)/);
});

test("PDF printing waits for the shared rendered pagination and keeps its probe measurable", async () => {
  const [resumeBuilder, resumeDocument] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(resumeBuilder, /const \[printReady, setPrintReady\]/);
  assert.match(resumeBuilder, /await document\.fonts\.ready/);
  assert.match(resumeBuilder, /if \(!printView \|\| !printReady\) return/);
  assert.match(resumeBuilder, /onPaginationReady=\{\(\) => setPrintReady\(true\)\}/);
  assert.match(resumeBuilder, /fixed left-\[-10000px\][^\n]*print:static/);
  assert.doesNotMatch(resumeBuilder, /relative hidden w-\[210mm\][^\n]*print:block/);
  assert.match(resumeDocument, /if \(!candidate\) onPaginationReady\?\.\(\)/);
});

test("the one-column template preview keeps trailing content inside padded pages", async () => {
  const { paginateResumeData } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const { templatePreviewData } = await import(
    "../app/(panel)/resumes/template-preview-data.ts"
  );

  const pages = paginateResumeData(templatePreviewData, "simple-one-column");

  assert.equal(pages.length, 2);
  assert.equal(pages[0].experiences.length, 3);
  assert.equal(pages[0].educations.length, 2);
  assert.equal(pages[0].skills, "");
  assert.equal(pages[1].experiences.length, 0);
  assert.equal(pages[1].educations.length, 0);
  assert.equal(pages[1].skills, templatePreviewData.skills);
  assert.equal(pages[1].languages, templatePreviewData.languages);
});

test("the one-column template renders languages with a standalone section title", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const oneColumnTemplate = resumeDocument.slice(
    resumeDocument.indexOf("function OneColumnResume"),
    resumeDocument.indexOf("function TimelineClassicResume"),
  );

  assert.match(
    oneColumnTemplate,
    /data\.languages[\s\S]*?<SectionHeading theme=\{theme\}>[\s\S]*?presentation\.labels\.languages[\s\S]*?<\/SectionHeading>/,
  );
  assert.doesNotMatch(
    oneColumnTemplate,
    /<strong[^>]*>[\s\S]*?presentation\.labels\.languages/,
  );
});

test("continuation pages stay ordered and use their capacity before page three", async () => {
  const { emptyResumeData, paginateResumeData } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const longDescription = "x".repeat(181);
  const weights = [4, 5, 5, 5, 4, 5, 3, 3, 3, 3];
  const experiences = weights.map((weight, index) => ({
    id: `experience-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: `Company ${index + 1}`,
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: weight >= 4 ? longDescription : "",
    technologies: weight === 5 || weight === 3 ? "React" : "",
  }));
  const educations = [1, 2].map((item) => ({
    id: `education-${item}`,
    institution: `University ${item}`,
    credential: `Degree ${item}`,
    startDate: "",
    endDate: "",
    isCurrent: false,
  }));

  const pages = paginateResumeData(
    {
      ...emptyResumeData,
      summary: "x".repeat(351),
      experiences,
      educations,
      skills: "React, TypeScript",
      languages: "Persian, English",
    },
    "sector-yellow",
  );

  assert.equal(pages.length, 2);
  assert.deepEqual(
    pages.map((page) => page.experiences.length),
    [3, 7],
  );
  assert.equal(pages[0].educations.length, 0);
  assert.equal(pages[1].educations.length, 2);
  assert.equal(pages[0].experiences.at(-1).id, "experience-2");
  assert.equal(pages[1].experiences[0].id, "experience-3");
  assert.equal(pages[1].summary, "");
});

test("the one-column resume with ten jobs keeps trailing sections on page two", async () => {
  const { emptyResumeData, paginateResumeData } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const longDescription = "x".repeat(181);
  const weights = [4, 5, 5, 5, 4, 5, 3, 3, 3, 3];
  const experiences = weights.map((weight, index) => ({
    id: `pdf-experience-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: `Company ${index + 1}`,
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: weight >= 4 ? longDescription : "",
    technologies: weight === 5 || weight === 3 ? "React" : "",
  }));
  const educations = [1, 2].map((item) => ({
    id: `pdf-education-${item}`,
    institution: `University ${item}`,
    credential: `Degree ${item}`,
    startDate: "",
    endDate: "",
    isCurrent: false,
  }));

  const pages = paginateResumeData(
    {
      ...emptyResumeData,
      summary: "x".repeat(351),
      experiences,
      educations,
      skills: "React, Next.js, TypeScript, Node.js",
      languages: "Persian, English",
    },
    "simple-one-column",
  );

  assert.equal(pages.length, 2);
  assert.deepEqual(
    pages.map((page) => page.experiences.length),
    [4, 6],
  );
  assert.equal(pages[0].educations.length, 0);
  assert.equal(pages[0].skills, "");
  assert.equal(pages[1].educations.length, 2);
  assert.equal(pages[1].skills, "React, Next.js, TypeScript, Node.js");
  assert.equal(pages[1].languages, "Persian, English");
});

test("timeline classic fills page one before creating its continuation page", async () => {
  const { emptyResumeData, paginateResumeData } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const weights = [4, 5, 5, 5, 4, 5, 3, 3, 3, 3];
  const experiences = weights.map((weight, index) => ({
    id: `timeline-experience-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: `Company ${index + 1}`,
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: weight >= 4 ? "x".repeat(181) : "",
    technologies: weight === 5 || weight === 3 ? "React" : "",
  }));

  const pages = paginateResumeData(
    {
      ...emptyResumeData,
      summary: "x".repeat(671),
      experiences,
      educations: [
        {
          id: "timeline-education-1",
          institution: "University 1",
          credential: "Degree 1",
          startDate: "",
          endDate: "",
          isCurrent: false,
        },
        {
          id: "timeline-education-2",
          institution: "University 2",
          credential: "Degree 2",
          startDate: "",
          endDate: "",
          isCurrent: false,
        },
      ],
      skills: "React, TypeScript",
      languages: "Persian, English",
    },
    "timeline-classic",
  );

  assert.equal(pages.length, 2);
  assert.deepEqual(
    pages.map((page) => page.experiences.length),
    [5, 5],
  );
  assert.equal(pages[0].experiences.at(-1).id, "timeline-experience-4");
  assert.equal(pages[1].experiences[0].id, "timeline-experience-5");
});

test("the editorial resume fills page one and keeps its own continuation layout", async () => {
  const { emptyResumeData, paginateResumeData } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const longDescription = "x".repeat(181);
  const weights = [4, 5, 5, 5, 4, 5, 3, 3, 3, 3];
  const experiences = weights.map((weight, index) => ({
    id: `editorial-experience-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: `Company ${index + 1}`,
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: weight >= 4 ? longDescription : "",
    technologies: weight === 5 || weight === 3 ? "React" : "",
  }));

  const pages = paginateResumeData(
    {
      ...emptyResumeData,
      summary: "x".repeat(351),
      experiences,
      educations: [
        {
          id: "editorial-education",
          institution: "University",
          credential: "Degree",
          startDate: "",
          endDate: "",
          isCurrent: false,
        },
      ],
      skills: "React, TypeScript",
      languages: "Persian, English",
    },
    "editorial-sidebar",
  );

  assert.equal(pages.length, 2);
  assert.deepEqual(
    pages.map((page) => page.experiences.length),
    [5, 5],
  );
  assert.equal(pages[0].skills, "React, TypeScript");
  assert.equal(pages[1].skills, "");
  assert.equal(pages[1].educations.length, 1);
  assert.match(
    resumeDocument,
    /props\.templateId === "editorial-sidebar"[\s\S]*?return <EditorialSidebarResume \{\.\.\.props\} \/>/,
  );
  assert.match(resumeDocument, /\{!continuation && \([\s\S]*?<header/);
  assert.match(
    resumeDocument,
    /grid-cols-\[1fr_26%\] gap-\[5%\] px-\[7%\] py-\[5\.5%\]/,
  );
});

test("clicking a resume template preview opens a sample modal", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumesPage,
    /aria-label={`پیش‌نمایش قالب \$\{template\.name\}`}/,
  );
  assert.match(resumesPage, /setTemplatePreview/);
  assert.match(
    resumesPage,
    /data=\{templatePreviewData\}[\s\S]*?showAllPages/,
  );
  assert.match(resumesPage, /onClick=\{\(\) => openBuilder\(template\.id\)\}/);
});

test("template preview modal follows the A4 document width instead of the wide builder width", async () => {
  const page = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );
  const ui = await readFile(
    new URL("app/(panel)/_components/ui.tsx", projectRoot),
    "utf8",
  );

  assert.match(page, /\{templatePreview && \([\s\S]*?<Modal\s+document/);
  assert.match(ui, /w-\[min\(804px,calc\(100vw-32px\)\)\] max-w-\[804px\]/);
});

test("resume builder header owns model, save and PDF actions", async () => {
  const [builder, resumesPage, modalUi] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/_components/ui.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(modalUi, /headerActions\?: ReactNode/);
  assert.match(builder, /title=\{selected\?\.name \|\| "قالب رزومه"\}/);
  assert.match(
    builder,
    /headerActions=\{[\s\S]*?تکمیل رزومه با AI[\s\S]*?ذخیره رزومه[\s\S]*?دانلود PDF/,
  );
  assert.match(builder, /setModelOverwriteConfirmOpen\(true\)/);
  assert.match(
    builder,
    /اطلاعات فعلی این رزومه توسط مدل تغییر می‌کند\. آیا مطمئن هستی؟/,
  );
  assert.match(
    builder,
    /setModelOverwriteConfirmOpen\(false\);\s*setGenerationLanguagePickerOpen\(true\);/,
  );
  assert.match(builder, /رنگ‌بندی قالب/);
  assert.match(builder, /data-resume-builder-scroll/);
  assert.match(builder, /data-resume-builder-footer/);
  assert.match(builder, /className="flex shrink-0 justify-between[^\n]*py-\[18px\]"/);
  assert.doesNotMatch(builder, /sticky bottom-3/);
  assert.doesNotMatch(builder, /selectableResumeTemplates|onTemplateChange/);
  assert.doesNotMatch(
    builder,
    /رزومه‌ساز رادیکار|پیش‌نمایش زنده|قالب انتخاب‌شده/,
  );
  assert.doesNotMatch(
    resumesPage,
    /onTemplateChange=\{setSelectedTemplate\}/,
  );
  assert.match(resumesPage, /notify\("رزومه در فضای محلی امن ذخیره شد"\)/);
});

test("saved resume preview opens the view and edit modal", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumesPage,
    /<button\s+className="grid h-\[260px\] w-full[\s\S]*?aria-label={`مشاهده و ویرایش \$\{resume\.name\}`}\s+onClick=\{\(\) => openSavedResume\(resume\)\}/,
  );
  assert.doesNotMatch(
    resumesPage,
    /savedDraft|پیش‌نویس ذخیره‌شده|ادامه ویرایش|CheckCircle2/,
  );
});

test("resume photo actions are icon buttons aligned in the photo row", async () => {
  const builder = await readFile(
    new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
    "utf8",
  );

  assert.match(builder, /<ImagePlus size=\{16\} \/>/);
  assert.match(builder, /aria-label=\{data\.photoUrl \? "جایگزینی عکس" : "افزودن عکس"\}/);
  assert.match(
    builder,
    /className="flex shrink-0 items-center gap-1\.5"[\s\S]*?aria-label="حذف عکس"[\s\S]*?<Trash2 size=\{16\} \/>/,
  );
  assert.doesNotMatch(builder, />\s*\{data\.photoUrl \? "جایگزینی" : "افزودن عکس"\}\s*</);
});

test("resume builder gives the editing panel more horizontal space", async () => {
  const builder = await readFile(
    new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    builder,
    /min-\[821px\]:grid-cols-\[minmax\(0,1fr\)_430px\]/,
  );
  assert.match(
    builder,
    /min-\[1121px\]:grid-cols-\[minmax\(0,1fr\)_520px\]/,
  );
});

test("resume color controls sit above a segmented step tab bar", async () => {
  const builder = await readFile(
    new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
    "utf8",
  );
  const paletteIndex = builder.indexOf("رنگ‌بندی قالب");
  const tabListIndex = builder.indexOf('role="tablist"');

  assert.notEqual(paletteIndex, -1);
  assert.notEqual(tabListIndex, -1);
  assert.ok(paletteIndex < tabListIndex);
  assert.match(
    builder,
    /role="tablist"[\s\S]*?role="tab"[\s\S]*?aria-selected=\{state === "active"\}/,
  );
  assert.match(
    builder,
    /bg-\[#f0f4f1\][\s\S]*?state === "active"[\s\S]*?bg-white[\s\S]*?shadow-/,
  );
});

test("every resume template renders one language per line", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumeDocument,
    /const LANGUAGE_SEPARATOR_PATTERN = \/\\r\?\\n\|\[\|،,؛;\]\//,
  );
  assert.match(resumeDocument, /function LanguageList/);
  assert.equal([...resumeDocument.matchAll(/<LanguageList/g)].length, 8);
  assert.doesNotMatch(resumeDocument, />\s*\{data\.languages\}\s*</);
  assert.match(
    resumeDocument,
    /<li dir="auto" key=\{`\$\{language\}-\$\{index\}`\}>/,
  );
});

test("LTR resumes translate knowledge-base proficiency labels in every template", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumeDocument,
    /"توانایی کاری حرفه‌ای": "Professional working proficiency"/,
  );
  assert.match(
    resumeDocument,
    /"زبان مادری یا دوزبانه": "Native or bilingual proficiency"/,
  );
  assert.match(resumeDocument, /if \(direction === "rtl"\) return language/);
  assert.equal(
    [
      ...resumeDocument.matchAll(
        /<LanguageList\s+languages=\{data\.languages\}\s+direction=\{presentation\.dir\}/g,
      ),
    ].length,
    8,
  );
});

test("only phone number text becomes LTR without changing contact row layout", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumeDocument,
    /<span>[\s\S]*?<Phone size="1\.1em" \/>[\s\S]*?<bdi dir="ltr" className="text-left">[\s\S]*?\{data\.phone\}/,
  );
  assert.match(resumeDocument, /<bdi dir="ltr">\{data\.phone\}<\/bdi>/);
  assert.match(
    resumeDocument,
    /<span>[\s\S]*?<bdi dir="ltr" className="text-left">[\s\S]*?\{data\.phone\}/,
  );
  assert.match(
    resumeDocument,
    /<span className="flex min-w-0 items-center gap-\[\.7em\] truncate">[\s\S]*?<Phone[\s\S]*?<bdi dir="ltr" className="text-left">[\s\S]*?\{data\.phone\}/,
  );
  assert.doesNotMatch(resumeDocument, /<span[^>]*dir="ltr"[^>]*>[\s\S]*?<Phone/);
});

test("all resume templates keep their own layout on continuation pages", async () => {
  const [resumeDocument, scaledPreview] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/resumes/scaled-resume-preview.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(
    scaledPreview,
    /const visiblePages = showAllPages \? pages : pages\.slice\(0, 1\)/,
  );
  assert.match(
    scaledPreview,
    /setScale\(Math\.min\(root\.clientWidth \/ DOCUMENT_WIDTH, 1\)\)/,
  );
  assert.match(scaledPreview, /transform: `scale\(\$\{scale\}\)`/);
  assert.match(resumeDocument, /continuation=\{index > 0\}/);
  assert.doesNotMatch(resumeDocument, /function ContinuationResume/);
  assert.doesNotMatch(
    resumeDocument,
    /if \(props\.continuation\) return/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "timeline-classic"[\s\S]*?<TimelineClassicResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "banner-modern"[\s\S]*?<BannerModernResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "red-administrative"[\s\S]*?<RedAdministrativeResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "orange-pill"[\s\S]*?<OrangePillResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "editorial-sidebar"[\s\S]*?<EditorialSidebarResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "simple-one-column"[\s\S]*?<OneColumnResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /twoColumnTemplates\.has\(props\.templateId\)[\s\S]*?<TwoColumnResume \{\.\.\.props\} \/>[\s\S]*?<StandardResume \{\.\.\.props\} \/>/,
  );
  assert.equal(
    [...resumeDocument.matchAll(/\n  continuation,\n/g)].length,
    8,
  );
  assert.equal(
    [...resumeDocument.matchAll(/hideTitle=\{continuation\}/g)].length,
    4,
  );
  assert.match(
    resumeDocument,
    /\{!continuation && <h2[\s\S]*?BriefcaseBusiness/,
  );
});

test("the red administrative template matches the supplied header, contact and skill-bar structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function RedAdministrativeResume"),
    resumeDocument.indexOf("function BannerModernResume"),
  );

  assert.match(template, /palette\.background/);
  assert.match(template, /palette\.text/);
  assert.match(template, /grid-cols-\[72%_28%\]/);
  assert.match(template, /Employment History/);
  assert.match(template, /-skew-x-\[18deg\]/);
  assert.match(template, /border-\[#dfdfdf\]/);
  assert.match(template, /pb-\[6%\]/);
});

test("the banner modern header text stays white for every color palette", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function BannerModernResume"),
    resumeDocument.indexOf("function EditorialSidebarResume"),
  );

  assert.match(
    template,
    /flex min-w-0 flex-col justify-center px-\[8%\] text-white[\s\S]*?palette\.background/,
  );
});

test("the orange pill template matches the supplied capsule and ruled-section structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function OrangePillResume"),
    resumeDocument.indexOf("function RedAdministrativeResume"),
  );

  assert.match(template, /rounded-l-full[\s\S]*?palette\.background/);
  assert.match(template, /-mr-\[3\.65%\]/);
  assert.doesNotMatch(template, /-ml-\[3\.65%\]/);
  assert.doesNotMatch(template, /palette\.text/);
  assert.match(template, /Professional Experience/);
  assert.match(template, /<OrangeLineHeading palette=\{palette\}>/);
  assert.match(
    template,
    /<LanguageList[\s\S]*?className="mt-\[1\.1em\] grid-cols-2/,
  );
  assert.match(template, /grid-cols-2/);
  assert.match(template, /pb-\[7%\]/);
});

test("both supplied reference templates expose all shared color schemes", async () => {
  const resumeData = await readFile(
    new URL("app/(panel)/resumes/resume-data.ts", projectRoot),
    "utf8",
  );

  assert.match(
    resumeData,
    /"banner-modern",[\s\S]*?"red-administrative",[\s\S]*?"orange-pill",[\s\S]*?"editorial-sidebar"/,
  );
  assert.match(
    resumeData,
    /templateId === "red-administrative"\) return "coral"/,
  );
  assert.match(
    resumeData,
    /templateId === "orange-pill"\) return "sand"/,
  );
});

test("the former yellow color option uses the project primary green", async () => {
  const [resumeData, resumeDocument] = await Promise.all([
    readFile(new URL("app/(panel)/resumes/resume-data.ts", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(
    resumeData,
    /id: "yellow", label: "سبز اصلی", swatch: "bg-\[#0f7b62\]"/,
  );
  assert.match(
    resumeDocument,
    /yellow: \{[\s\S]*?text: "text-\[#0f7b62\]"[\s\S]*?background: "bg-\[#0f7b62\]"/,
  );
  assert.doesNotMatch(resumeData, /label: "زرد"/);
});

test("resume card previews preserve the exact A4 alignment and aspect ratio", async () => {
  const [resumeDocument, resumesPage, scaledPreview] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/scaled-resume-preview.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(resumeDocument, /bg-white text-start text-\[#31413e\]/);
  assert.match(resumesPage, /max-w-\[166px\][\s\S]*?<ScaledResumePreview/);
  assert.match(scaledPreview, /DOCUMENT_HEIGHT = DOCUMENT_WIDTH \* \(297 \/ 210\)/);
  assert.match(scaledPreview, /transform: `scale\(\$\{scale\}\)`/);
});

test("every registered template paginates long content through the shared page pipeline", async () => {
  const { emptyResumeData, paginateResumeData, resumeTemplates } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const experiences = Array.from({ length: 10 }, (_, index) => ({
    id: `all-template-experience-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: `Company ${index + 1}`,
    location: "Tehran",
    startDate: "2020",
    endDate: "2024",
    isCurrent: false,
    description: "x".repeat(360),
    technologies: "React, TypeScript",
  }));
  const data = {
    ...emptyResumeData,
    fullName: "Ali Mohammadi",
    jobTitle: "Product Designer",
    summary: "x".repeat(500),
    experiences,
    educations: [
      {
        id: "all-template-education",
        institution: "University",
        credential: "Degree",
        startDate: "2014",
        endDate: "2018",
        isCurrent: false,
      },
    ],
    skills: "React, TypeScript, Product Design",
    languages: "Persian, English",
  };

  for (const template of resumeTemplates) {
    const pages = paginateResumeData(data, template.id);
    assert.ok(
      pages.length > 1,
      `${template.id} should create a continuation page`,
    );
    assert.equal(pages[0].summary, data.summary);
    assert.ok(pages.slice(1).every((page) => page.summary === ""));
    assert.deepEqual(
      pages.flatMap((page) => page.experiences.map((item) => item.id)),
      experiences.map((item) => item.id),
    );
  }
});

test("timeline classic mirrors its divider and timeline rails in LTR", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumeDocument,
    /presentation\.dir === "rtl"[\s\S]*?"border-l pl-\[10%\]"[\s\S]*?: "border-r pr-\[10%\]"/,
  );
  assert.match(
    resumeDocument,
    /presentation\.dir === "rtl"[\s\S]*?"border-r pr-\[2em\]"[\s\S]*?: "border-l pl-\[2em\]"/,
  );
  assert.match(
    resumeDocument,
    /presentation\.dir === "rtl"[\s\S]*?"-right-\[\.45em\]"[\s\S]*?: "-left-\[\.45em\]"/,
  );
});

test("resume modals scale complete A4 pages instead of squeezing their layout", async () => {
  const [builder, resumesPage, scaledPreview] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/scaled-resume-preview.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(
    builder,
    /<ScaledResumePreview[\s\S]*?colorId=\{selectedColor\}[\s\S]*?showAllPages/,
  );
  assert.match(
    resumesPage,
    /<ScaledResumePreview[\s\S]*?data=\{templatePreviewData\}[\s\S]*?showAllPages/,
  );
  assert.match(scaledPreview, /data-resume-scale-container/);
  assert.match(scaledPreview, /width: scale \? DOCUMENT_WIDTH \* scale : 0/);
  assert.match(scaledPreview, /height: scale \? pageStackHeight \* scale : 0/);
  assert.match(scaledPreview, /continuation=\{index > 0\}/);
});
