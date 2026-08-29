import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const repositoryRoot = new URL("../../", projectRoot);

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

async function filesWithExtension(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const url = new URL(
        `${entry.name}${entry.isDirectory() ? "/" : ""}`,
        directory,
      );
      if (entry.isDirectory()) return filesWithExtension(url, extension);
      return entry.name.endsWith(extension) ? [url] : [];
    }),
  );
  return nested.flat();
}

test("the Web workspace uses the official Next.js CLI with Turbopack", async () => {
  const webPackage = await readFile(new URL("package.json", projectRoot), "utf8");

  assert.match(webPackage, /"dev": "next dev --turbopack -p 3161"/);
  assert.match(webPackage, /"build": "next build --turbopack"/);
  assert.match(webPackage, /"start": "next start -p 3161"/);
  assert.doesNotMatch(webPackage, /vinext|vite|wrangler|cloudflare/i);
});

test("home redirects to the dynamic dashboard", async () => {
  const homePage = await readFile(new URL("app/page.tsx", projectRoot), "utf8");

  assert.match(homePage, /redirect\("\/dashboard"\)/);
});

test("login page uses a two-step validated mobile OTP flow backed by the auth API", async () => {
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
  assert.match(loginPage, /"\/api\/auth\/request-otp"/);
  assert.match(loginPage, /"\/api\/auth\/verify-otp"/);
  assert.match(loginPage, /queryClient\.setQueryData\(authQueryKey/);
  assert.match(
    loginPage,
    /router\.replace\(result\.user\.role === "superadmin" \? "\/admin" : "\/dashboard"\)/,
  );
  assert.match(loginPage, /ورود به حساب کاربری/);
  assert.match(loginPage, /src="\/logo\.svg"/);
});

test("API requests do not label an empty logout request as JSON", async () => {
  const [apiClient, auth, panelShell] = await Promise.all([
    readFile(new URL("lib/api-client.ts", projectRoot), "utf8"),
    readFile(new URL("app/_components/auth.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/_components/panel-shell.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(
    apiClient,
    /const hasJsonBody = init\.body != null && !\(init\.body instanceof FormData\)/,
  );
  assert.match(apiClient, /\.\.\.\(hasJsonBody \? \{ "content-type": "application\/json" \} : \{\}\)/);
  assert.match(auth, /apiRequest<void>\("\/api\/auth\/logout", \{ method: "POST" \}\)/);
  assert.match(panelShell, /void logout\(\)\.catch\(\(\) =>/);
});

test("the web app requires the independent Node API without same-origin fallbacks", async () => {
  const [apiUrlSource, repository] = await Promise.all([
    readFile(new URL("lib/api-url.ts", projectRoot), "utf8"),
    readFile(new URL("lib/data/repository.ts", projectRoot), "utf8"),
  ]);

  assert.match(apiUrlSource, /NEXT_PUBLIC_API_BASE_URL/);
  assert.match(apiUrlSource, /throw new Error/);
  assert.doesNotMatch(apiUrlSource, /return path/);
  assert.match(repository, /apiRequest/);
  assert.doesNotMatch(repository, /fetch\(/);
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
    /<nav className="flex flex-col gap-\[5px\]" aria-label="منوی اصلی">\s*\{visibleMenuItems\.map/,
  );
});

test("sidebar account card contains long workspace and account text", async () => {
  const panelShell = await readFile(
    new URL("app/(panel)/_components/panel-shell.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    panelShell,
    /className="m-0 flex w-0 min-w-0 flex-1 items-center[^\"]*overflow-hidden/,
  );
  assert.match(
    panelShell,
    /className="flex w-0 min-w-0 flex-1 flex-col overflow-hidden"/,
  );
  assert.match(panelShell, /className="block w-full truncate text-\[11px\]"/);
  assert.match(
    panelShell,
    /className="mt-0\.5 block w-full truncate text-\[9px\] text-\[#9aa4a2\]"/,
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

test("knowledge completion progress uses the exact percentage width", async () => {
  const knowledgeBase = await readFile(
    new URL("app/(panel)/knowledge-base/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(knowledgeBase, /role="progressbar"/);
  assert.match(knowledgeBase, /aria-valuenow=\{completion\}/);
  assert.match(
    knowledgeBase,
    /width: `\$\{Math\.min\(100, Math\.max\(0, completion\)\)\}%`/,
  );
  assert.doesNotMatch(knowledgeBase, /completion < 80[\s\S]*?w-full/);
});

test("knowledge base organizes every form section in an accessible responsive tab layout", async () => {
  const knowledgeBase = await readFile(
    new URL("app/(panel)/knowledge-base/page.tsx", projectRoot),
    "utf8",
  );

  for (const tabId of [
    "personal",
    "general",
    "experience",
    "projects",
    "education",
    "career",
  ]) {
    assert.match(knowledgeBase, new RegExp(`id: "${tabId}"`));
    assert.match(knowledgeBase, new RegExp(`tabId="${tabId}"`));
  }
  assert.match(knowledgeBase, /role="tablist"/);
  assert.match(knowledgeBase, /aria-orientation="vertical"/);
  assert.match(
    knowledgeBase,
    /بخش‌های پایگاه دانش[\s\S]*?text-\[9px\][\s\S]*?tab\.description/,
  );
  assert.match(
    knowledgeBase,
    /تکمیل خودکار با رزومه فعلی[\s\S]*?my-1 text-\[9px\][\s\S]*?PDF، DOCX یا TXT/,
  );
  assert.match(
    knowledgeBase,
    /<h2 className="m-0 text-\[12px\]">\{title\}<\/h2>[\s\S]*?text-\[9px\][\s\S]*?\{description\}/,
  );
  assert.match(knowledgeBase, /role="tab"/);
  assert.match(knowledgeBase, /role="tabpanel"/);
  assert.match(knowledgeBase, /hidden=\{!active\}/);
  assert.match(
    knowledgeBase,
    /min-\[1100px\]:grid-cols-\[250px_minmax\(0,1fr\)\]/,
  );
  assert.match(knowledgeBase, /overflow-x-auto/);
});

test("an empty knowledge base starts with four editable English sample projects", async () => {
  const knowledgeBase = await readFile(
    new URL("app/(panel)/knowledge-base/page.tsx", projectRoot),
    "utf8",
  );

  for (const projectName of [
    "Radicar AI Career Platform",
    "Enterprise Design System",
    "Real-Time Analytics Dashboard",
    "Headless Commerce Storefront",
  ]) {
    assert.match(knowledgeBase, new RegExp(`name: "${projectName}"`));
  }
  assert.equal(
    [...knowledgeBase.matchAll(/id: createRecordId\("project-sample"\)/g)]
      .length,
    4,
  );
  assert.equal(
    [...knowledgeBase.matchAll(/sampleKnowledgeProjects\(\)/g)].length,
    2,
  );
  assert.match(
    knowledgeBase,
    /knowledge\.projects\?\.length[\s\S]*?storedResume\.projects\?\.length[\s\S]*?sampleKnowledgeProjects\(\)/,
  );
  assert.match(knowledgeBase, /sampleProjectsSeeded: true/);
  assert.match(
    knowledgeBase,
    /await knowledgeProfileStore\.put\(\{[\s\S]*?projects,[\s\S]*?sampleProjectsSeeded: true/,
  );
});

test("production CSS preserves the large textarea height override", async () => {
  const assetDirectory = new URL(".next/static/", projectRoot);
  const cssFiles = await filesWithExtension(assetDirectory, ".css");
  const productionCss = (
    await Promise.all(cssFiles.map((file) => readFile(file, "utf8")))
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

test("persists domain data only through the Node API and PostgreSQL", async () => {
  const [repository, stores, models] = await Promise.all([
    readFile(new URL("lib/data/repository.ts", projectRoot), "utf8"),
    readFile(new URL("lib/data/stores.ts", projectRoot), "utf8"),
    readFile(new URL("lib/data/models.ts", projectRoot), "utf8"),
  ]);

  assert.match(repository, /class HttpDataRepository/);
  assert.match(repository, /apiRequest<T\[\]>/);
  assert.match(repository, /`\/v1\/data\/\$\{collection\}`/);
  assert.doesNotMatch(repository, /indexedDB|IndexedDbRepository|MigratingHttpDataRepository/);
  assert.match(models, /DataCollection.*from "@radicar\/shared-types"/);
  assert.match(stores, /userProfileStore/);
  assert.match(stores, /resumeStore/);
  assert.match(stores, /jobStore/);
  assert.match(stores, /applicationStore/);
  assert.match(stores, /interviewSessionStore/);
  assert.match(stores, /matchAnalysisStore/);
  assert.match(models, /export type DashboardSnapshotRecord/);
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
  assert.doesNotMatch(source, /\bindexedDB\b/);
  assert.doesNotMatch(
    source,
    /سینا احمدی|شرکت پیشنهادی|موقعیت مرتبط|Product Lead/,
  );
});

test("resume import retries empty LLM responses with a stable JSON model", async () => {
  const [llmClient, importRoute] = await Promise.all([
    readFile(new URL("packages/ai/src/client.ts", repositoryRoot), "utf8"),
    readFile(
      new URL(
        "apps/api/src/modules/imports/knowledge-import.ts",
        repositoryRoot,
      ),
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
  assert.match(importRoute, /"skills":\[string\]/);
  assert.match(importRoute, /serializeResumeSkills\(extracted\.skills\)/);
  assert.match(importRoute, /"languageName":string/);
  assert.match(importRoute, /typeof language\.languageName === "string"/);
  assert.match(importRoute, /typeof language\.name === "string"/);
});

test("resume picker exposes seventeen selectable layouts including the supplied navy reference", async () => {
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
    "matrix-dark",
    "simple-one-column",
    "navy-reference-simple",
    "timeline-classic",
    "banner-modern",
    "red-administrative",
    "orange-pill",
    "editorial-sidebar",
    "profile-band",
    "designer-sidebar",
    "dark-sidebar-timeline",
    "centerline-marketing",
    "pastel-graduate",
    "split-profile",
    "corporate-competencies",
    "angular-technical",
    "sector-yellow",
  ]);
  assert.match(resumeData, /name: "حرفه‌ای چندتمی"/);
  assert.match(resumeData, /۹ رنگ‌بندی قابل انتخاب/);
  assert.match(resumeData, /name: "اداری قرمز"/);
  assert.match(resumeData, /name: "مینیمال نارنجی"/);
  assert.match(resumeData, /name: "ساده سرمه‌ای"/);
  assert.match(
    resumeData,
    /return \[\s*"simple-one-column",\s*"navy-reference-simple",\s*"timeline-classic"/,
  );
});

test("resumes page shows a matching skeleton while saved data is loading", async () => {
  const [resumesPage, skeletons] = await Promise.all([
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/_components/loading-skeletons.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(resumesPage, /const \[loading, setLoading\] = useState\(true\)/);
  assert.match(resumesPage, /if \(loading\) return <ResumesSkeleton \/>/);
  assert.match(resumesPage, /\.finally\(\(\) => \{\s*if \(active\) setLoading\(false\)/);
  assert.match(skeletons, /export function ResumesSkeleton\(\)/);
  assert.match(skeletons, /aria-label="در حال دریافت رزومه‌های ذخیره‌شده"/);
});

test("resume template filters use counted pill buttons with a selected check state", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumesPage,
    /bg-\[linear-gradient\(135deg,#ffffff_0%,#fbfcfb_52%,#f0f7f3_100%\)\][\s\S]*?فیلتر قالب‌ها/,
  );
  assert.match(resumesPage, /aria-pressed=\{active\}/);
  assert.match(
    resumesPage,
    /transition-\[width,margin\] duration-300 ease-in-out[\s\S]*?active \? "ml-\[7px\] w-3" : "ml-0 w-0"[\s\S]*?<Check className="min-w-3"[\s\S]*?\{category\}[\s\S]*?formatPersianNumber\(count\)/,
  );
  assert.match(
    resumesPage,
    /m-px flex size-\[30px\] shrink-0 items-center justify-center self-center rounded-full text-\[10px\] font-bold/,
  );
  assert.doesNotMatch(resumesPage, /self-center border-r text-\[10px\]/);
  assert.match(
    resumesPage,
    /rounded-full border[\s\S]*?linear-gradient\(135deg,#16876b_0%,#0a6956_100%\)[\s\S]*?text-white/,
  );
});

test("deleting one resume preserves and reloads every other saved resume", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(resumesPage, /const resumeId = resumeToDelete\.id/);
  assert.match(
    resumesPage,
    /const expectedRemainingResumes = savedResumes\.filter\([\s\S]*?resume\.id !== resumeId/,
  );
  assert.match(resumesPage, /await resumeStore\.remove\(resumeId\)/);
  assert.match(resumesPage, /unexpectedlyRemovedResumes\.map\(\(resume\) => resumeStore\.put\(resume\)\)/);
  assert.match(
    resumesPage,
    /setSavedResumes\(prioritizePinnedResumes\(storedResumes\)\)/,
  );
});

test("workspace deletion requires a second isolated confirmation", async () => {
  const panelShell = await readFile(
    new URL("app/(panel)/_components/panel-shell.tsx", projectRoot),
    "utf8",
  );

  assert.match(panelShell, /const \[armedWorkspaceDeleteId, setArmedWorkspaceDeleteId\]/);
  assert.match(
    panelShell,
    /if \(armedWorkspaceDeleteId !== workspace\.id\)[\s\S]*?setArmedWorkspaceDeleteId\(workspace\.id\)[\s\S]*?return;/,
  );
  assert.match(
    panelShell,
    /await removeWorkspace\(workspace\.id\)[\s\S]*?setArmedWorkspaceDeleteId\(""\)/,
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
  const [
    resumeData,
    resumeDocument,
    scaledPreview,
    renderedPagination,
    paginationLayout,
    paginationComponents,
  ] = await Promise.all([
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
    readFile(
      new URL(
        "app/(panel)/resumes/resume-pagination-layout.ts",
        projectRoot,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "app/(panel)/resumes/resume-pagination-components.tsx",
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
    /isOneColumnTemplate[\s\S]*?enforceResumeSectionFlow\(paginateOneColumnResume\(data\)\)/,
  );
  assert.match(resumeData, /reserveBlock/);
  assert.match(resumeData, /getResumePaginationProfile/);
  assert.match(resumeData, /getResumeSectionFlow/);
  assert.match(resumeData, /mainSummaryWeight/);
  assert.match(resumeData, /lastPageBaseWeight \+ trailingContentWeight/);
  assert.match(
    resumeDocument,
    /useRenderedResumePagination\([\s\S]*?props\.data,[\s\S]*?props\.templateId/,
  );
  assert.match(scaledPreview, /useRenderedResumePagination/);
  assert.match(resumeDocument, /ResumePaginationProbe/);
  assert.match(scaledPreview, /ResumePaginationProbe/);
  assert.match(paginationComponents, /data-resume-pagination-probe/);
  assert.match(paginationLayout, /PAGE_BOTTOM_RESERVE = 36/);
  assert.match(paginationLayout, /A4_PAGE_HEIGHT_PX/);
  assert.match(
    paginationLayout,
    /CONTENT_SELECTOR =\s*"section,header,h1,h2,h3,p,ul,ol,li,time,strong,img,span"/,
  );
  assert.match(renderedPagination, /moveFirstBlockBack/);
  assert.match(renderedPagination, /moveLastBlockForward/);
  assert.match(renderedPagination, /blockedOverflowFlows/);
  assert.match(renderedPagination, /pagesRef/);
  assert.match(renderedPagination, /getRenderedPageLayout/);
  assert.match(paginationLayout, /getBoundingClientRect/);
  assert.match(paginationLayout, /getScaledBottomReserve/);
  assert.match(paginationLayout, /data-resume-flow/);
  assert.match(paginationLayout, /overflowingFlows/);
  assert.match(renderedPagination, /getRenderedFlow/);
  assert.match(renderedPagination, /blockKey/);
  assert.match(renderedPagination, /getResumeFlowSections/);
  assert.match(renderedPagination, /overflow\.flow/);
  assert.match(renderedPagination, /getPageContentKey/);
  assert.match(renderedPagination, /candidate\.flow/);
  assert.match(renderedPagination, /contentBottom <= candidateLayout\.safeBottom/);
  assert.match(resumeDocument, /data-resume-flow="main"/);
  assert.match(resumeDocument, /data-resume-flow="sidebar"/);
  assert.match(resumeDocument, /print:break-after-page/);
  assert.match(scaledPreview, /ResumeDocumentPage/);
  assert.match(scaledPreview, /pages\.slice\(0, 1\)/);
});

test("every A4 template reserves matching top and bottom safe areas", async () => {
  const [resumeDocument, paginationLayout] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL(
        "app/(panel)/resumes/resume-pagination-layout.ts",
        projectRoot,
      ),
      "utf8",
    ),
  ]);

  const documentClassBlock = resumeDocument.slice(
    resumeDocument.indexOf("function documentClass"),
    resumeDocument.indexOf("function ProfilePhoto"),
  );
  assert.match(documentClassBlock, /!py-\[4\.535%\]/);
  assert.match(documentClassBlock, /print:!py-\[9\.525mm\]/);
  assert.match(paginationLayout, /PAGE_BOTTOM_RESERVE = 36/);
  assert.equal(
    [...resumeDocument.matchAll(/documentClass\(compact\)/g)].length,
    18,
  );
});

test("PDF printing waits for the shared rendered pagination and keeps its probe measurable", async () => {
  const [resumeBuilder, resumeDocument, paginationComponents] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL(
        "app/(panel)/resumes/resume-pagination-components.tsx",
        projectRoot,
      ),
      "utf8",
    ),
  ]);

  assert.match(resumeBuilder, /const \[printReady, setPrintReady\]/);
  assert.match(resumeBuilder, /await document\.fonts\.ready/);
  assert.match(resumeBuilder, /if \(!printView \|\| !printReady\) return/);
  assert.match(resumeBuilder, /onPaginationReady=\{\(\) => setPrintReady\(true\)\}/);
  assert.match(resumeBuilder, /fixed left-\[-10000px\][^\n]*print:static/);
  assert.doesNotMatch(resumeBuilder, /relative hidden w-\[210mm\][^\n]*print:block/);
  assert.match(resumeBuilder, /body > \* \{[\s\S]*?display: none !important/);
  assert.match(
    resumeBuilder,
    /body > \[data-resume-print-root\] \{[\s\S]*?display: block !important/,
  );
  assert.match(resumeBuilder, /background: #fff !important/);
  assert.match(
    resumeBuilder,
    /\[data-resume-print-page\] > div \{[\s\S]*?width: 210mm !important[\s\S]*?height: 297mm !important/,
  );
  assert.doesNotMatch(resumeBuilder, /zoom:|transform: scale|font-size: 11\.023622px/);
  assert.match(resumeDocument, /max-w-\[793\.700787px\] text-\[11\.023622px\]/);
  assert.match(resumeDocument, /ResumePrintPage/);
  assert.match(paginationComponents, /data-resume-template=\{templateId\}/);
  assert.match(
    await readFile(
      new URL("app/(panel)/_components/panel-shell.tsx", projectRoot),
      "utf8",
    ),
    /fixed bottom-6 left-6[^\n]*print:hidden/,
  );
  assert.match(resumeDocument, /if \(!candidate\) onPaginationReady\?\.\(\)/);
});

test("rendered pagination moves structured and legacy education atomically", async () => {
  const paginationHook = await readFile(
    new URL("app/(panel)/resumes/use-rendered-resume-pagination.ts", projectRoot),
    "utf8",
  );

  assert.match(
    paginationHook,
    /nextPage\.educations = currentPage\.educations;[\s\S]*?nextPage\.education = currentPage\.education;[\s\S]*?currentPage\.educations = \[\];[\s\S]*?currentPage\.education = "";/,
  );
  assert.match(
    paginationHook,
    /previousPage\.educations = nextPage\.educations;[\s\S]*?previousPage\.education = nextPage\.education;[\s\S]*?nextPage\.educations = \[\];[\s\S]*?nextPage\.education = "";/,
  );
});

test("rendered pagination moves only the content assigned to an overflowing column", async () => {
  const [paginationHook, paginationProfile] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/use-rendered-resume-pagination.ts", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/resumes/resume-pagination-profile.ts", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(paginationHook, /moveLastBlockForward\([\s\S]*?overflow\.flow/);
  assert.match(paginationHook, /getResumeFlowSections\(profile, flow\)/);
  assert.match(paginationHook, /key: `\$\{pageIndex\}:\$\{flow\}`/);
  assert.match(
    paginationProfile,
    /"angular-technical": \{[\s\S]*?main: \["experiences", "projects", "educations"\],[\s\S]*?sidebar: \["summary", "skills", "languages"\]/,
  );
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
  assert.equal(pages[0].projects.length, 0);
  assert.equal(pages[0].educations.length, 0);
  assert.equal(pages[0].skills, "");
  assert.equal(pages[1].experiences.length, 0);
  assert.equal(pages[1].projects.length, 1);
  assert.equal(pages[1].educations.length, 2);
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
    resumeDocument.indexOf("function NavyReferenceHeading"),
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

test("the navy reference template preserves the supplied header and dated rows without a footer", async () => {
  const [resumeData, resumeDocument] = await Promise.all([
    readFile(new URL("app/(panel)/resumes/resume-data.ts", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
  ]);
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function NavyReferenceResume"),
    resumeDocument.indexOf("function TimelineClassicResume"),
  );

  assert.match(resumeData, /"navy-reference-simple"/);
  assert.match(template, /h-\[19\.2%\][\s\S]*?accent\.background/);
  assert.match(template, /top-\[19\.2%\] pt-\[3\.4%\]/);
  assert.match(template, /w-\[19%\][\s\S]*?formatDateRange\(experience/);
  assert.match(template, /NavyReferenceHeading[\s\S]*?Top Skills/);
  assert.doesNotMatch(template, /<footer/);
  assert.match(
    resumeDocument,
    /props\.templateId === "navy-reference-simple"[\s\S]*?<NavyReferenceResume \{\.\.\.props\} \/>/,
  );
});

test("one-column continuation pages keep balanced vertical A4 padding", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function OneColumnResume"),
    resumeDocument.indexOf("function NavyReferenceHeading"),
  );

  assert.match(template, /continuation \? "py-\[5%\]" : "py-\[1%\]"/);
});

test("continuation pages keep work ordered before the trailing section page", async () => {
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

test("the one-column resume keeps trailing sections after all work pages", async () => {
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

test("editorial preview preserves education as one trailing section", async () => {
  const [{ paginateResumeData }, { templatePreviewData }] = await Promise.all([
    import("../app/(panel)/resumes/resume-data.ts"),
    import("../app/(panel)/resumes/template-preview-data.ts"),
  ]);

  const pages = paginateResumeData(templatePreviewData, "editorial-sidebar");

  assert.equal(pages.length, 2);
  assert.deepEqual(
    pages.flatMap((page) => page.educations.map((education) => education.id)),
    templatePreviewData.educations.map((education) => education.id),
  );
  assert.equal(pages[0].educations.length, 0);
  assert.equal(pages[1].educations.length, 2);
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
  assert.doesNotMatch(
    resumesPage,
    /نمایش قالب با اطلاعات نمونه؛ برای ساخت رزومه/,
  );
  assert.match(resumesPage, /headerActions=\{/);
  assert.match(resumesPage, />\s*استفاده از قالب\s*<\/button>/);
  assert.match(
    resumesPage,
    /setTemplatePreview\(null\);\s*openBuilder\(templateId\)/,
  );
});

test("template usage requires at least ten percent knowledge completion", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );
  const knowledgePage = await readFile(
    new URL("app/(panel)/knowledge-base/page.tsx", projectRoot),
    "utf8",
  );
  const completionHelper = await readFile(
    new URL("lib/knowledge-completion.ts", projectRoot),
    "utf8",
  );

  assert.match(resumesPage, /knowledgeCompletion < 10/);
  assert.match(resumesPage, /setKnowledgeRequirementOpen\(true\)/);
  assert.match(resumesPage, /پایگاه دانش هنوز کامل نیست/);
  assert.match(resumesPage, /حداقل ۱۰٪ تکمیل شده باشد/);
  assert.match(resumesPage, /router\.push\("\/knowledge-base"\)/);
  assert.match(resumesPage, /calculateKnowledgeCompletion\(knowledge\)/);
  assert.match(knowledgePage, /calculateKnowledgeCompletion\(form\)/);
  assert.match(completionHelper, /Math\.round/);
});

test("template type badge sits inside the preview at its bottom-left corner", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumesPage,
    /className="relative grid min-h-\[360px\][\s\S]*?<span className="absolute bottom-3 left-3[^"]*">\s*\{template\.tag\}/,
  );
  const cardDetails = resumesPage.slice(
    resumesPage.indexOf('<div className="grid gap-3 border-t'),
    resumesPage.indexOf("supportsResumeColors", resumesPage.indexOf('<div className="grid gap-3 border-t')),
  );
  assert.doesNotMatch(cardDetails, /template\.tag/);
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
  assert.match(
    page,
    /titleClassName="!mb-0 !text-\[16px\] !leading-\[1\.5\]"/,
  );
  assert.match(page, /headerClassName="pb-\[22px\]"/);
  assert.match(ui, /w-\[min\(804px,calc\(100vw-32px\)\)\] max-w-\[804px\]/);
  assert.match(ui, /titleClassName\?: string/);
  assert.match(ui, /headerClassName\?: string/);
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
    /\{hasBeenSaved && \([\s\S]*?<Download size=\{16\} \/> دانلود PDF[\s\S]*?\)\}/,
  );
  assert.match(
    builder,
    /\) : hasBeenSaved \? \([\s\S]*?دریافت PDF[\s\S]*?: \([\s\S]*?ذخیره رزومه/,
  );
  assert.match(resumesPage, /hasBeenSaved=\{Boolean\(activeResumeId\)\}/);
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
  assert.match(resumesPage, /notify\("رزومه با موفقیت ذخیره شد\."\)/);
});

test("saving a resume confirms successful persistence with a toast", async () => {
  const [resumesPage, panelShell] = await Promise.all([
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/_components/panel-shell.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(
    resumesPage,
    /const saveDraft = async \(\) => \{\s*await persistResume\(data\);\s*notify\("رزومه با موفقیت ذخیره شد\."\)/,
  );
  assert.match(
    panelShell,
    /createPortal\([\s\S]*?toast\.message[\s\S]*?document\.body/,
  );
  assert.match(panelShell, /z-100/);
});

test("resume names combine the first name and template and remain editable in template settings", async () => {
  const [resumesPage, resumeBuilder] = await Promise.all([
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(
    resumesPage,
    /function getDefaultResumeName[\s\S]*?fullNameParts\[0\][\s\S]*?templateName[\s\S]*?return `\$\{ownerName\} — \$\{templateName\}`/,
  );
  assert.match(
    resumesPage,
    /name:\s*resumeName\?\.trim\(\) \|\|\s*getDefaultResumeName\(nextData, selectedTemplate\)/,
  );
  assert.match(resumesPage, /setResumeName\(resume\.name\)/);
  assert.match(resumesPage, /onResumeNameChange=\{setResumeName\}/);
  assert.match(resumeBuilder, /aria-label="تنظیمات قالب"/);
  assert.match(
    resumeBuilder,
    /نام رزومه[\s\S]*?value=\{resumeName\}[\s\S]*?onResumeNameChange\(event\.target\.value\)/,
  );
  assert.match(
    resumesPage,
    /className="grid min-w-0 gap-3[^\"]*text-right"\s*dir="rtl"[\s\S]*?<h3 className="m-0 block w-full[^\"]*text-right/,
  );
});

test("resume editing and template preview opt into the shared modal close button", async () => {
  const [sharedUi, resumeBuilder, resumesPage] = await Promise.all([
    readFile(new URL("app/(panel)/_components/ui.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
  ]);

  assert.match(
    sharedUi,
    /className=\{`mb-\[7px\] mt-0 text-\[20px\] leading-\[1\.5\] \$\{titleClassName/,
  );
  assert.match(sharedUi, /<p className="m-0 text-\[12px\] leading-\[1\.9\]/);
  assert.match(sharedUi, /showCloseButton = false/);
  assert.match(sharedUi, /\{showCloseButton && \(/);
  assert.match(sharedUi, /aria-label="بستن"/);
  assert.match(
    resumeBuilder,
    /<Modal\s+wide\s+showCloseButton\s+title=\{selected\?\.name/,
  );
  assert.match(
    resumesPage,
    /<Modal\s+document\s+showCloseButton\s+title=\{`پیش‌نمایش/,
  );
  assert.doesNotMatch(
    sharedUi,
    /<header className="[^"]*border-b[^"]*"/,
  );
});

test("resume editor exposes the same structured language fields as knowledge base", async () => {
  const resumeBuilder = await readFile(
    new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
    "utf8",
  );

  assert.match(resumeBuilder, /function ResumeLanguageEditor/);
  assert.match(resumeBuilder, /نام زبان/);
  assert.match(resumeBuilder, /سطح تسلط/);
  assert.match(resumeBuilder, /توانایی کاری حرفه‌ای/);
  assert.match(resumeBuilder, /زبان مادری یا دوزبانه/);
  assert.match(resumeBuilder, /serializeLanguages\(nextItems\)/);
  assert.doesNotMatch(
    resumeBuilder,
    /<input value=\{data\.languages\} onChange=\{input\("languages"\)\}/,
  );
});

test("knowledge base and resume editor expose structured projects", async () => {
  const [models, resumeData, knowledgePage, resumeBuilder, importRoute] =
    await Promise.all([
      readFile(new URL("lib/data/models.ts", projectRoot), "utf8"),
      readFile(
        new URL("app/(panel)/resumes/resume-data.ts", projectRoot),
        "utf8",
      ),
      readFile(
        new URL("app/(panel)/knowledge-base/page.tsx", projectRoot),
        "utf8",
      ),
      readFile(
        new URL("app/(panel)/resumes/resume-builder.tsx", projectRoot),
        "utf8",
      ),
      readFile(
        new URL(
          "apps/api/src/modules/imports/knowledge-import.ts",
          repositoryRoot,
        ),
        "utf8",
      ),
    ]);

  assert.match(resumeData, /export type ResumeProject/);
  assert.match(resumeData, /projects: ResumeProject\[\]/);
  assert.match(models, /projects: ResumeProject\[\]/);
  for (const source of [knowledgePage, resumeBuilder]) {
    assert.match(source, /افزودن پروژه/);
    assert.match(source, /نام پروژه/);
    assert.match(source, /نقش، کارفرما یا نوع پروژه/);
    assert.match(source, /لینک پروژه/);
    assert.match(source, /توضیحات و دستاوردها/);
    assert.match(source, /فناوری‌ها و ابزارها/);
  }
  assert.match(knowledgePage, /const projects = knowledge\.projects\?\.length/);
  assert.match(models, /sampleProjectsSeeded\?: boolean/);
  assert.match(resumeBuilder, /const replaceProjects/);
  assert.match(importRoute, /"projects":\[/);
  assert.match(importRoute, /Array\.isArray\(extracted\.projects\)/);
});

test("every resume layout renders the shared project section", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const layoutFunctions = [
    "StandardResume",
    "TwoColumnResume",
    "OneColumnResume",
    "NavyReferenceResume",
    "TimelineClassicResume",
    "OrangePillResume",
    "RedAdministrativeResume",
    "BannerModernResume",
    "EditorialSidebarResume",
    "DesignerSidebarResume",
    "DarkSidebarTimelineResume",
    "CenterlineMarketingResume",
    "PastelGraduateResume",
    "SplitProfileResume",
    "CorporateCompetenciesResume",
    "ProfileBandResume",
  ];

  layoutFunctions.forEach((functionName, index) => {
    const start = resumeDocument.indexOf(`function ${functionName}`);
    const end =
      index === layoutFunctions.length - 1
        ? resumeDocument.indexOf("export function ResumeDocumentPage")
        : resumeDocument.indexOf(`function ${layoutFunctions[index + 1]}`);
    assert.ok(start >= 0, `${functionName} should exist`);
    assert.match(
      resumeDocument.slice(start, end),
      /<ProjectSection/,
      `${functionName} should render projects`,
    );
  });
  assert.match(resumeDocument, /presentation\.labels\.projects/);
  assert.match(resumeDocument, /href=\{getExternalHref\(project\.url\)\}/);
  assert.match(resumeDocument, /target="_blank"/);
});

test("every project section uses its template-specific section heading", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const projectSections = [
    ...resumeDocument.matchAll(/<ProjectSection[\s\S]*?\/>/g),
  ].map((match) => match[0]);
  const sharedProjectSection = resumeDocument.slice(
    resumeDocument.indexOf("function ProjectSection"),
    resumeDocument.indexOf("function StandardResume"),
  );

  assert.equal(projectSections.length, 17);
  assert.ok(projectSections.every((section) => section.includes("heading={")));
  assert.match(sharedProjectSection, /heading: ReactNode/);
  assert.match(sharedProjectSection, /\{heading\}/);
  assert.doesNotMatch(sharedProjectSection, /border-\[#cbcbcb\]/);
});

test("saved resume preview opens the view and edit modal", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumesPage,
    /<button\s+className="[^"]*h-\[260px\] w-full[\s\S]*?aria-label={`مشاهده و ویرایش \$\{resume\.name\}`}\s+onClick=\{\(\) => openSavedResume\(resume\)\}/,
  );
  assert.doesNotMatch(
    resumesPage,
    /savedDraft|پیش‌نویس ذخیره‌شده|ادامه ویرایش|CheckCircle2/,
  );
});

test("saved resumes can be pinned and pinned items are prioritized", async () => {
  const [resumesPage, models] = await Promise.all([
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
    readFile(new URL("lib/data/models.ts", projectRoot), "utf8"),
  ]);

  assert.match(models, /pinnedAt\?: string/);
  assert.match(resumesPage, /function prioritizePinnedResumes/);
  assert.match(
    resumesPage,
    /right\.pinnedAt\.localeCompare\(left\.pinnedAt\)/,
  );
  assert.match(resumesPage, /pinnedAt: previous\?\.pinnedAt/);
  assert.match(resumesPage, /const toggleResumePin = async/);
  assert.match(resumesPage, /await resumeStore\.put\(nextResume\)/);
  assert.match(resumesPage, /aria-pressed=\{Boolean\(resume\.pinnedAt\)\}/);
  assert.match(resumesPage, /<Star[\s\S]*?fill-current/);
  assert.match(resumesPage, /نشان کردن رزومه/);
  assert.match(resumesPage, /برداشتن نشان/);
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
  assert.match(resumeDocument, /emphasizeName = true/);
  assert.match(
    resumeDocument,
    /<strong>\{parts\[1\]\}<\/strong>[\s\S]*?<span>\{parts\[2\]\}<\/span>/,
  );
  assert.equal([...resumeDocument.matchAll(/<LanguageList/g)].length, 17);
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
    17,
  );
});

test("every English resume template uses the bundled Latin resume font", async () => {
  const [layout, resumeDocument, globalStyles, packageJson] = await Promise.all([
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
    readFile(new URL("package.json", projectRoot), "utf8"),
  ]);

  assert.match(layout, /@fontsource\/poppins\/400\.css/);
  assert.match(layout, /@fontsource\/poppins\/700\.css/);
  assert.match(globalStyles, /--font-resume-latin: "Poppins"/);
  assert.match(resumeDocument, /\[&\[dir=ltr\]\]:font-resume-latin/);
  assert.match(packageJson, /"@fontsource\/poppins"/);
});

test("every Persian resume template forces the bundled Vazirmatn font", async () => {
  const [layout, resumeDocument, globalStyles] = await Promise.all([
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
  ]);

  assert.match(layout, /import "@fontsource-variable\/vazirmatn"/);
  assert.match(layout, /<html[^>]*lang="fa" dir="rtl"/);
  assert.match(layout, /font-sans/);
  assert.match(
    globalStyles,
    /--font-resume-rtl: "Vazirmatn Variable", Vazirmatn, Tahoma, Arial/,
  );
  assert.match(
    globalStyles,
    /--font-sans: "Vazirmatn Variable", Vazirmatn, Tahoma, Arial/,
  );
  assert.match(resumeDocument, /\[&\[dir=rtl\]\]:font-resume-rtl/);
  assert.match(
    resumeDocument,
    /function SplitProfileResume[\s\S]*?presentation\.dir === "rtl"[\s\S]*?"!font-resume-rtl"[\s\S]*?"!font-resume-latin"/,
  );
});

test("every plain skill uses a bullet except the navy reference skill chips", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );

  const progressSkillRenderers = [
    ...resumeDocument.matchAll(/skills\.map\(\(skill, index\)/g),
  ];
  const plainSkillRenderers = [
    ...resumeDocument.matchAll(/skills\.map\(\(skill\) =>/g),
  ].length + [...resumeDocument.matchAll(/group\.items\.map\(\(skill\) =>/g)].length;
  const sharedBulletUsages = [
    ...resumeDocument.matchAll(/<ResumeSkillBullet(?:\s|>)/g),
  ];
  const navyTemplate = resumeDocument.slice(
    resumeDocument.indexOf("function NavyReferenceResume"),
    resumeDocument.indexOf("function TimelineClassicResume"),
  );

  assert.equal(progressSkillRenderers.length, 8);
  assert.equal(plainSkillRenderers, 10);
  assert.equal(sharedBulletUsages.length, plainSkillRenderers - 1);
  assert.doesNotMatch(navyTemplate, /<ResumeSkillBullet/);
  assert.match(
    resumeDocument,
    /data-resume-skill-bullet[\s\S]*?size-\[\.42em\] shrink-0 rounded-full bg-current/,
  );
});

test("only phone number text becomes LTR without changing contact row layout", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );

  assert.match(
    resumeDocument,
    /function ResumeContactLink[\s\S]*?dir=\{external \? direction : "ltr"\}/,
  );
  assert.match(resumeDocument, /<Phone size="1\.1em" \/>[\s\S]*?<ResumeContactLink value=\{data\.phone\} type="phone"/);
  assert.match(resumeDocument, /<Phone[\s\S]*?<ResumeContactLink value=\{data\.phone\} type="phone"/);
  assert.doesNotMatch(resumeDocument, /<span[^>]*dir="ltr"[^>]*>\s*<Phone/);
});

test("every resume template keeps phone and website contacts clickable without restyling", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );

  assert.match(resumeDocument, /function ResumeContactLink/);
  assert.match(
    resumeDocument,
    /direction === "ltr" \? "LinkedIn Profile" : "لینک پروفایل لینکدین"/,
  );
  assert.match(
    resumeDocument,
    /\{external \? getLinkedInProfileLabel\(direction\) : value\}/,
  );
  assert.match(resumeDocument, /href=\{external \? getExternalHref\(value\) : getPhoneHref\(value\)\}/);
  assert.match(
    resumeDocument,
    /external && "block min-w-0 flex-1 text-start"/,
  );
  assert.match(
    resumeDocument,
    /data-resume-linkedin=\{external \|\| undefined\}[\s\S]*?dir=\{external \? direction : "ltr"\}/,
  );
  assert.match(
    resumeDocument,
    /external \? "text-start" : "text-left"[\s\S]*?dir=\{external \? presentation\.dir : "ltr"\}/,
  );
  assert.match(resumeDocument, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.doesNotMatch(resumeDocument, /<bdi[^>]*>\s*\{data\.phone\}\s*<\/bdi>/);
  assert.doesNotMatch(resumeDocument, /<span[^>]*>\s*\{data\.website\}\s*<\/span>/);
  assert.equal(
    [...resumeDocument.matchAll(/type="website"[\s\S]{0,100}?direction=\{/g)]
      .length,
    [...resumeDocument.matchAll(/type="website"/g)].length,
  );
  assert.match(
    resumeDocument,
    /external[\s\S]*?getLinkedInProfileLabel\(presentation\.dir\)[\s\S]*?: value/,
  );
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
    /props\.templateId === "matrix-dark"[\s\S]*?<MatrixDarkResume \{\.\.\.props\} \/>/,
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
    /props\.templateId === "profile-band"[\s\S]*?<ProfileBandResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "designer-sidebar"[\s\S]*?<DesignerSidebarResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "dark-sidebar-timeline"[\s\S]*?<DarkSidebarTimelineResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "centerline-marketing"[\s\S]*?<CenterlineMarketingResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "pastel-graduate"[\s\S]*?<PastelGraduateResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "split-profile"[\s\S]*?<SplitProfileResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "corporate-competencies"[\s\S]*?<CorporateCompetenciesResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "angular-technical"[\s\S]*?<AngularTechnicalResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "simple-one-column"[\s\S]*?<OneColumnResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /props\.templateId === "navy-reference-simple"[\s\S]*?<NavyReferenceResume \{\.\.\.props\} \/>/,
  );
  assert.match(
    resumeDocument,
    /twoColumnTemplates\.has\(props\.templateId\)[\s\S]*?<TwoColumnResume \{\.\.\.props\} \/>[\s\S]*?<StandardResume \{\.\.\.props\} \/>/,
  );
  assert.equal(
    [...resumeDocument.matchAll(/\n  continuation,\n/g)].length,
    18,
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

test("every resume template renders the user name two pixels smaller", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const nameHeadingSizes = [
    ...resumeDocument.matchAll(
      /<h1\s+className="[^"]*?text-\[([\d.]+)em\][^"]*"[^>]*>\s*<ResumeFullName/g,
    ),
  ].map((match) => match[1]);

  assert.deepEqual(nameHeadingSizes, [
    "2.2",
    "2.3",
    "2.3",
    "2.35",
    "2.3",
    "2.3",
    "2.3",
    "2.3",
    "2.3",
    "2.3",
    "1.55",
    "2.3",
    "2.3",
    "2.3",
    "2.2",
    "2.3",
  ]);
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

test("red administrative aligns dates with titles and includes LinkedIn", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function RedAdministrativeResume"),
    resumeDocument.indexOf("function BannerModernResume"),
  );

  assert.match(template, /grid-cols-4/);
  assert.match(
    template,
    /<Globe2[\s\S]*?<ResumeContactLink[\s\S]*?value=\{data\.website\}[\s\S]*?type="website"/,
  );
  assert.match(
    template,
    /flex items-start justify-between gap-\[1\.5em\][\s\S]*?<h3[\s\S]*?<time className="shrink-0/,
  );
  assert.match(
    template,
    /educations\.map[\s\S]*?<InlineEducationDetails[\s\S]*?credentialClassName="text-\[1em\]"[\s\S]*?dateClassName="text-\[\.82em\] text-\[#71807b\]"/,
  );
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

test("banner modern skill bars use a fixed whole-pixel height", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function BannerModernResume"),
    resumeDocument.indexOf("function EditorialSidebarResume"),
  );

  assert.match(template, /"h-\[3px\] flex-1 rounded-full"/);
  assert.doesNotMatch(template, /h-\[\.28em\]/);
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

test("all supplied reference templates expose shared color schemes", async () => {
  const resumeData = await readFile(
    new URL("app/(panel)/resumes/resume-data.ts", projectRoot),
    "utf8",
  );

  assert.match(
    resumeData,
    /"banner-modern",[\s\S]*?"red-administrative",[\s\S]*?"orange-pill",[\s\S]*?"editorial-sidebar",[\s\S]*?"profile-band",[\s\S]*?"designer-sidebar",[\s\S]*?"dark-sidebar-timeline",[\s\S]*?"centerline-marketing",[\s\S]*?"pastel-graduate",[\s\S]*?"split-profile",[\s\S]*?"corporate-competencies"/,
  );
  assert.match(
    resumeData,
    /templateId === "matrix-dark"\) return "mint"/,
  );
  assert.match(
    resumeData,
    /templateId === "navy-reference-simple"\) return "blue"/,
  );
  assert.match(
    resumeData,
    /"simple-one-column",\s*"navy-reference-simple",\s*"timeline-classic"/,
  );
  assert.match(
    resumeData,
    /templateId === "red-administrative"\) return "coral"/,
  );
  assert.match(
    resumeData,
    /templateId === "orange-pill"\) return "sand"/,
  );
  assert.match(
    resumeData,
    /templateId === "profile-band"\) return "blue"/,
  );
  assert.match(
    resumeData,
    /templateId === "designer-sidebar"\) return "yellow"/,
  );
  assert.match(
    resumeData,
    /templateId === "dark-sidebar-timeline"\) return "gray"/,
  );
  assert.match(
    resumeData,
    /templateId === "centerline-marketing"\) return "cyan"/,
  );
  assert.match(
    resumeData,
    /templateId === "pastel-graduate"\) return "coral"/,
  );
  assert.match(
    resumeData,
    /templateId === "split-profile"\) return "mint"/,
  );
  assert.match(
    resumeData,
    /templateId === "corporate-competencies"\) return "blue"/,
  );
});

test("matrix dark template matches the supplied terminal card structure and supports colors", async () => {
  const [resumeDocument, resumeData] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/(panel)/resumes/resume-data.ts", projectRoot), "utf8"),
  ]);
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function MatrixDarkResume"),
    resumeDocument.indexOf("function CenterlineHeading"),
  );

  assert.match(resumeData, /id: "matrix-dark"[\s\S]*?name: "ماتریکس دارک"/);
  assert.match(resumeData, /"matrix-dark",[\s\S]*?"simple-one-column"/);
  assert.match(template, /grid-cols-\[29%_71%\]/);
  assert.match(template, /!bg-\[#0e0f16\]/);
  assert.match(template, /\[&\[dir=ltr\]\]:!font-matrix/);
  assert.match(template, /absolute inset-y-0 start-0 w-\[29%\]/);
  assert.match(template, /matrixAccents\[colorId \|\| getDefaultResumeColor\(templateId\)\]/);
  assert.match(template, /<ProfilePhoto/);
  assert.match(template, /<MatrixHeading accent=\{accent\}>/);
  assert.match(template, /border-s-\[\.22em\]/);
  assert.match(template, /grid grid-cols-2 gap-\[\.8em\]/);
  assert.match(template, /bg-\[#1a1b27\]/);
  assert.match(template, /<LanguageList/);
});

test("profile band template matches the supplied identity-band structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function ProfileBandResume"),
    resumeDocument.indexOf("export function ResumeDocumentPage"),
  );

  assert.match(template, /palette\.background/);
  assert.match(template, /rounded-full/);
  assert.match(template, /<ProfilePhoto/);
  assert.match(template, /grid-cols-\[7em_1fr\]/);
  assert.match(template, /<ProfileBandHeading palette=\{palette\}>/);
  assert.match(template, /<LanguageList/);
  assert.match(template, /ps-\[9\.5em\][^\"]*text-balance/);
  assert.match(
    template,
    /grid[^\"]*min-w-0[^\"]*grid-cols-2[^\"]*ps-\[13em\]/,
  );
  assert.match(template, /<ResumeFullName fullName=\{data\.fullName\} \/>/);
  assert.match(template, /<MapPin className=\{cn\("size-\[1\.15em\] shrink-0"/);
  assert.match(template, /<Phone className=\{cn\("size-\[1\.15em\] shrink-0"/);
  assert.match(template, /<Mail className=\{cn\("size-\[1\.15em\] shrink-0"/);
  assert.match(template, /<LinkedInContactIcon[\s\S]*?size-\[1\.15em\] shrink-0/);
  assert.match(template, /text-\[\.78em\] font-normal leading-\[1\.55\]/);
  assert.match(template, /<ProjectSection[\s\S]*?<ProfileBandHeading palette=\{palette\}>/);
  assert.match(
    template,
    /<InlineEducationDetails[\s\S]*?credentialClassName="text-\[1em\]"[\s\S]*?institutionClassName="text-\[1em\]"[\s\S]*?dateClassName="text-\[1em\] text-inherit"/,
  );
  assert.match(
    template,
    /grid list-none grid-cols-2[\s\S]*?<ResumeSkillBullet className="text-\[#171717\]">/,
  );
});

test("every resume template keeps the full resume name visible", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const nameHeadings = [...resumeDocument.matchAll(/<h1[\s\S]*?<\/h1>/g)].filter(
    ([heading]) => heading.includes("<ResumeFullName"),
  );

  assert.equal(nameHeadings.length, 18);
  for (const [heading] of nameHeadings) {
    assert.doesNotMatch(heading, /\b(?:truncate|line-clamp-\d+)\b/);
  }
  assert.match(
    resumeDocument,
    /function ResumeFullName[\s\S]*?characterCount > 34[\s\S]*?text-\[\.68em\][\s\S]*?characterCount > 26[\s\S]*?text-\[\.78em\][\s\S]*?characterCount > 20[\s\S]*?text-\[\.88em\]/,
  );
  assert.match(
    resumeDocument,
    /whitespace-normal text-clip break-words[\s\S]*?\[overflow-wrap:anywhere\]/,
  );
});

test("every education layout adapts to one or two lines while keeping the date opposite", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const inlineEducation = resumeDocument.slice(
    resumeDocument.indexOf("function InlineEducationDetails"),
    resumeDocument.indexOf("function EducationEntries"),
  );

  assert.match(inlineEducation, /grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(
    inlineEducation,
    /@min-\[22rem\]:grid-cols-\[max-content_minmax\(0,1fr\)_auto\]/,
  );
  assert.match(
    inlineEducation,
    /col-span-2 min-w-0 @min-\[22rem\]:col-span-1/,
  );
  assert.match(
    inlineEducation,
    /col-start-1 row-start-2 min-w-0 @min-\[22rem\]:col-start-2 @min-\[22rem\]:row-start-1/,
  );
  assert.match(
    inlineEducation,
    /col-start-2 row-start-2 shrink-0 whitespace-nowrap @min-\[22rem\]:col-start-3 @min-\[22rem\]:row-start-1/,
  );
  assert.equal(
    [...resumeDocument.matchAll(/<InlineEducationDetails(?:\s|>)/g)].length,
    8,
  );
});

test("every project section keeps all entry text neutral and reserves accents for its heading", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const projectEntries = resumeDocument.slice(
    resumeDocument.indexOf("function ProjectEntries"),
    resumeDocument.indexOf("function ProjectSection"),
  );
  const matrixTemplate = resumeDocument.slice(
    resumeDocument.indexOf("function MatrixDarkResume"),
    resumeDocument.indexOf("function CenterlineHeading"),
  );
  const matrixProjects = matrixTemplate.slice(
    matrixTemplate.indexOf("{projects.length > 0 && ("),
    matrixTemplate.indexOf("{educations.length > 0 && ("),
  );

  assert.doesNotMatch(projectEntries, /accentClassName|monochromeDetails/);
  assert.match(projectEntries, /<strong className="block text-\[\.92em\] text-inherit">/);
  assert.match(projectEntries, /block truncate text-\[\.72em\] text-inherit no-underline/);
  assert.match(projectEntries, /text-\[\.7em\] text-inherit leading-\[1\.5\]/);
  assert.doesNotMatch(matrixProjects, /accent\.text|accent\.softBackground/);
  assert.match(matrixProjects, /<MatrixHeading accent=\{accent\}>/);
});

test("designer sidebar template matches the supplied portrait-sidebar structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function DesignerSidebarResume"),
    resumeDocument.indexOf("function ProfileBandResume"),
  );

  assert.match(template, /grid-cols-\[34%_66%\]/);
  assert.match(template, /<ProfilePhoto/);
  assert.match(template, /relative z-1 mx-auto size-\[12em\]/);
  assert.doesNotMatch(template, /absolute (?:left|start)-1\/2/);
  assert.match(template, /mt-\[1\.4em\] grid gap-\[1\.1em\]/);
  assert.doesNotMatch(template, /border-b border-\[#aeb5b1\] pb-\[\.85em\]/);
  assert.match(template, /block h-\[3px\] w-full/);
  assert.match(template, /index % 3 === 1[\s\S]*?w-\[88%\][\s\S]*?w-3\/4/);
  assert.match(template, /rounded-full/);
  assert.match(template, /palette\.softBackground/);
  assert.match(
    template,
    /absolute inset-y-0 start-0 w-\[34%\] border-e border-\[#d9dcda\] bg-white/,
  );
  assert.match(
    template,
    /<aside[\s\S]*?data-resume-flow="sidebar"[\s\S]*?className="relative z-1 px-\[10%\]/,
  );
  assert.match(template, /before:bg-white\/55/);
  assert.match(template, /text-\[2\.3em\]/);
  assert.match(template, /<EducationEntries/);
  assert.match(template, /<LanguageList/);
  assert.match(template, /absolute inset-x-0 bottom-\[1\.5%\]/);
});

test("dark sidebar timeline template matches the supplied split timeline structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function DarkSidebarTimelineResume"),
    resumeDocument.indexOf("function ProfileBandResume"),
  );

  assert.match(template, /grid-cols-\[31%_69%\]/);
  assert.match(template, /bg-\[#414143\]/);
  assert.match(template, /<ProfilePhoto/);
  assert.match(template, /absolute start-0 top-\[\.4em\] bottom-0 border-s/);
  assert.match(template, /absolute -start-\[\.4em\] top-0 size-\[\.8em\]/);
  assert.match(template, /palette\.background/);
  assert.match(template, /skillBarClassName/);
  assert.match(template, /bg-\[#646966\]/);
  assert.match(template, /grid-cols-2/);
  assert.match(template, /absolute inset-y-0 start-0 w-\[31%\] bg-\[#414143\]/);
  assert.match(
    template,
    /data\.website \|\| data\.email \|\| data\.location[\s\S]*?اطلاعات تکمیلی/,
  );
  assert.doesNotMatch(template, /"Links" : "پیوندها"/);
});

test("dark sidebar timeline keeps education atomic in the main flow", async () => {
  const [{ getResumePaginationProfile }, paginationHook] = await Promise.all([
    import("../app/(panel)/resumes/resume-pagination-profile.ts"),
    readFile(
      new URL("app/(panel)/resumes/use-rendered-resume-pagination.ts", projectRoot),
      "utf8",
    ),
  ]);

  assert.deepEqual(getResumePaginationProfile("dark-sidebar-timeline")?.main, [
    "experiences",
    "projects",
    "educations",
    "skills",
  ]);
  assert.match(
    paginationHook,
    /if \(section === "educations"\)[\s\S]*?if \(hasSectionContent\(nextPage, section\)\) return false/,
  );
});

test("angular technical fills its sidebar edges and emphasizes language names", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function AngularTechnicalResume"),
    resumeDocument.indexOf("export function ResumeDocumentPage"),
  );

  assert.match(
    template,
    /absolute inset-y-0 start-0 w-\[38%\] bg-\[#f4f4f4\]/,
  );
  assert.match(
    template,
    /<aside[\s\S]*?data-resume-flow="sidebar"[\s\S]*?className="relative z-1 px-\[12%\] pb-\[7%\] pt-\[5%\]">/,
  );
  assert.doesNotMatch(
    template,
    /<aside className="[^"]*bg-\[#f4f4f4\]/,
  );
  assert.match(template, /\[clip-path:polygon\(0_0,100%_0,0_100%\)\]/);
  assert.match(
    template,
    /<LanguageList[\s\S]*?languages=\{data\.languages\}[\s\S]*?emphasizeName/,
  );
  assert.match(
    resumeDocument,
    /emphasizeName[\s\S]*?<strong>\{parts\[1\]\}<\/strong>/,
  );
});

test("centerline marketing template matches the supplied balanced two-column structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function CenterlineHeading"),
    resumeDocument.indexOf("function ProfileBandResume"),
  );

  assert.match(template, /grid grid-cols-2 gap-\[4em\]/);
  assert.match(template, /after:start-1\/2/);
  assert.match(template, /<ProfilePhoto/);
  assert.match(template, /<CenterlineHeading palette=\{palette\}>/);
  assert.match(template, /<CenterlineHeading markerSide="start" palette=\{palette\}>/);
  assert.match(template, /end-\[calc\(-2em-\.275em-\.5px\)\]/);
  assert.match(template, /start-\[calc\(-2em-\.275em\+\.5px\)\]/);
  assert.match(template, /palette\.background/);
  assert.match(template, /grid-cols-\[1fr_7em_2\.5em\]/);
});

test("pastel graduate template matches the supplied soft sidebar structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function PastelGraduateResume"),
    resumeDocument.indexOf("function ProfileBandResume"),
  );

  assert.match(template, /grid-cols-\[31%_69%\]/);
  assert.match(template, /palette\.softBackground/);
  assert.match(template, /compact \? "!text-\[5\.6px\]" : "!text-\[15\.433071px\]"/);
  assert.match(template, /<ProfilePhoto/);
  assert.match(template, /<PastelBandHeading palette=\{palette\}>/);
  assert.match(template, /<PastelTimelineBlock/);
  assert.match(
    template,
    /absolute start-\[calc\(-5\.7%-\.5px\)\] bottom-\[\.55em\] top-\[\.55em\] w-px/,
  );
  assert.match(resumeDocument, /start-\[calc\(-5\.7%-\.275em\)\]/);
  assert.doesNotMatch(template, /top-\[27%\]/);
  assert.match(template, /bg-white\/55/);
});

test("split profile template matches the supplied asymmetric profile structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function SplitProfileResume"),
    resumeDocument.indexOf("function ProfileBandResume"),
  );

  assert.match(template, /grid-cols-\[61%_39%\]/);
  assert.match(
    template,
    /presentation\.dir === "rtl"[\s\S]*?"!font-resume-rtl"[\s\S]*?: "!font-resume-latin"/,
  );
  assert.match(
    template,
    /absolute inset-y-0 end-0 w-\[39%\][\s\S]*?palette\.softBackground/,
  );
  assert.match(template, /"relative z-1 grid"/);
  assert.match(
    template,
    /<aside[\s\S]*?data-resume-flow="sidebar"[\s\S]*?className="relative z-1 px-\[10%\] pb-\[7%\] pt-\[4%\]"/,
  );
  assert.match(template, /grid-rows-\[auto_1fr\]/);
  assert.match(template, /px-\[7%\] pb-\[5%\] pt-\[8%\]/);
  assert.doesNotMatch(template, /max-w-\[8em\]/);
  assert.match(template, /dir="ltr"/);
  assert.match(template, /compact \? "!text-\[5\.6px\]" : "!text-\[15\.433071px\]"/);
  assert.match(template, /mt-\[1\.5em\] content-start/);
  assert.doesNotMatch(template, /min-h-\[17em\]/);
  assert.match(template, /palette\.softBackground/);
  assert.match(template, /<ProfilePhoto/);
  assert.match(
    template,
    /border-white bg-transparent shadow-none \[&_img\]:rounded-full print:bg-transparent print:shadow-none/,
  );
  assert.match(template, /<SplitProfileHeading>/);
  assert.match(template, /presentation\.labels\.projects/);
  assert.match(template, /palette\.background/);
  assert.match(template, /Icon: Phone/);
  assert.match(template, /Icon: Mail/);
  assert.match(template, /Icon: MapPin/);
  assert.match(template, /Icon: LinkedInContactIcon/);
  assert.match(template, /<ResumeSkillBullet>\{skill\}<\/ResumeSkillBullet>/);
  assert.match(template, /href: data\.phone \? getPhoneHref\(data\.phone\)/);
  assert.match(template, /href: data\.website \? getExternalHref\(data\.website\)/);
  assert.match(template, /text-inherit no-underline/);
});

test("shared pagination hides repeated headings for every resumed section", async () => {
  const [paginationHook, headingVisibility] = await Promise.all([
    readFile(
      new URL("app/(panel)/resumes/use-rendered-resume-pagination.ts", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/resumes/resume-section-heading-visibility.ts", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(
    paginationHook,
    /syncRenderedResumeSectionHeadings\(renderedPages, pages\)/,
  );
  assert.match(
    paginationHook,
    /syncResumeSectionHeadingVisibility\([\s\S]*?candidate\.pages\.slice\(0, candidate\.boundary\)/,
  );
  for (const section of [
    "contact",
    "summary",
    "experiences",
    "projects",
    "educations",
    "skills",
    "languages",
  ]) {
    assert.match(headingVisibility, new RegExp(`\\b${section}:`));
  }
  assert.match(headingVisibility, /querySelectorAll<HTMLElement>\("h2"\)/);
  assert.match(headingVisibility, /heading\.hidden = repeated/);
});

test("corporate competencies template matches the supplied bar-and-panel structure", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function CorporateCompetenciesResume"),
    resumeDocument.indexOf("function ProfileBandResume"),
  );

  assert.match(template, /<CorporateBarHeading palette=\{palette\}>/);
  assert.match(template, /grid-cols-\[1fr_30%\]/);
  assert.match(template, /Core Competencies/);
  assert.match(template, /palette\.softBackground/);
  assert.match(template, /grid min-h-\[10\.5em\] grid-cols-2 gap-\[1\.35em\]/);
  assert.doesNotMatch(template, /border-y border-\[#333\]/);
  assert.doesNotMatch(template, /border-t border-\[#333\]/);
  assert.match(template, /compact \? "!text-\[5\.64px\]" : "!text-\[15\.543307px\]"/);
  assert.match(template, /Design Expertise/);
  assert.match(template, /Software Skills/);
  assert.match(template, /Leadership Strengths/);
  assert.doesNotMatch(template, /<h4 className=\{cn\("m-0 border-b/);
  assert.match(template, /<ResumeSkillBullet>\{skill\}<\/ResumeSkillBullet>/);
  assert.doesNotMatch(template, /block underline underline-offset/);
  assert.match(template, /text-\[\.9em\] font-normal leading-\[1\.55\]/);
  assert.doesNotMatch(template, /mt-\[\.9em\] block border-b border-\[#333\]/);
  assert.match(
    template,
    /className="mt-\[\.8em\] grid-cols-2 text-\[\.85em\] leading-\[1\.5\]"[\s\S]*?emphasizeName/,
  );
  assert.match(template, /\{\(educations\.length > 0 \|\| data\.languages\) && \(/);
  assert.match(template, /grid max-w-\[48em\] grid-cols-2/);
  assert.match(template, /grid size-\[2\.1em\] shrink-0 place-items-center rounded-full border border-\[#4d4d4d\]/);
  assert.match(template, /<MapPin aria-hidden="true" className="size-\[1\.05em\]" \/>/);
  assert.match(template, /<Phone aria-hidden="true" className="size-\[1\.05em\]" \/>/);
  assert.match(template, /<Mail aria-hidden="true" className="size-\[1\.05em\]" \/>/);
  assert.match(template, /<LinkedInContactIcon aria-hidden="true" className="block size-\[1\.05em\] -translate-y-\[\.06em\]" \/>/);
  assert.match(
    template,
    /<ResumeContactLink[\s\S]*?value=\{data\.website\}[\s\S]*?type="website"[\s\S]*?direction=\{presentation\.dir\}[\s\S]*?className="truncate"[\s\S]*?\/>/,
  );
  assert.match(template, /border-b border-\[#cbcbcb\] pb-\[1\.05em\]/);
  assert.match(template, /<section className="border-b border-\[#cbcbcb\] pb-\[1em\] last:border-b-0"/);
  assert.doesNotMatch(template, /border-\[#444\]/);
  assert.match(
    template,
    /grid-cols-\[1fr_30%\][\s\S]*?dir="ltr"[\s\S]*?<aside[\s\S]*?dir=\{presentation\.dir\}/,
  );
  assert.match(
    template,
    /grid min-h-\[10\.5em\] grid-cols-2 gap-\[1\.35em\][^"]*" dir="ltr"/,
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

test("two-column skill bars use the selected template color", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function TwoColumnResume"),
    resumeDocument.indexOf("function OneColumnResume"),
  );

  assert.match(
    template,
    /"block h-full rounded-full",\s*palette\.background/,
  );
  assert.doesNotMatch(template, /"block h-full rounded-full bg-current"/);
});

test("multi-theme professional keeps its compact header, section rhythm, skill fills and full sidebar", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function TwoColumnResume"),
    resumeDocument.indexOf("function OneColumnResume"),
  );

  assert.match(template, /grid-rows-\[15%_85%\]/);
  assert.match(template, /px-\[5%\] py-\[2%\]/);
  assert.match(template, /content-start gap-\[2\.2em\]/);
  assert.match(
    template,
    /templateId === "sector-yellow" \? "top-\[2\.34%\]" : "top-0"/,
  );
  assert.match(
    template,
    /continuation \? "pt-\[1%\]" : "pt-\[2\.2%\]"/,
  );
  assert.match(
    template,
    /absolute inset-y-0 start-0 w-\[34%\][\s\S]*?theme\.side/,
  );
  assert.match(
    template,
    /<span className="block h-\[\.35em\][\s\S]*?<span[\s\S]*?index % 4 === 0[\s\S]*?"w-full"[\s\S]*?"w-4\/5"[\s\S]*?"w-3\/5"[\s\S]*?"w-2\/5"/,
  );
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

  assert.match(
    resumeDocument,
    /bg-white[\s\S]*?!py-\[4\.535%\][\s\S]*?text-start text-\[#31413e\]/,
  );
  assert.match(resumesPage, /max-w-\[166px\][\s\S]*?<ScaledResumePreview/);
  assert.match(scaledPreview, /const DOCUMENT_WIDTH = 793\.700787/);
  assert.match(scaledPreview, /DOCUMENT_HEIGHT = DOCUMENT_WIDTH \* \(297 \/ 210\)/);
  assert.match(scaledPreview, /transform: `scale\(\$\{scale\}\)`/);
});

test("resume thumbnails use an inert transparent cover without disabling full previews", async () => {
  const resumesPage = await readFile(
    new URL("app/(panel)/resumes/page.tsx", projectRoot),
    "utf8",
  );
  const thumbnailCovers = resumesPage.match(
    /className="absolute inset-0 z-10 cursor-pointer"/g,
  );
  const inertThumbnailContents = resumesPage.match(
    /className="pointer-events-none[^\"]*select-none"[\s\S]*?inert[\s\S]*?aria-hidden="true"/g,
  );
  const modalPreview = resumesPage.slice(
    resumesPage.indexOf("{templatePreview && ("),
  );

  assert.equal(thumbnailCovers?.length, 2);
  assert.equal(inertThumbnailContents?.length, 2);
  assert.doesNotMatch(modalPreview, /pointer-events-none[^\"]*select-none/);
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
  const projects = Array.from({ length: 4 }, (_, index) => ({
    id: `all-template-project-${index}`,
    name: `Project ${index + 1}`,
    role: "Open source",
    url: `github.com/example/project-${index + 1}`,
    startDate: "2024",
    endDate: "2025",
    isCurrent: false,
    description: "x".repeat(240),
    technologies: "React, TypeScript",
  }));
  const data = {
    ...emptyResumeData,
    fullName: "Ali Mohammadi",
    jobTitle: "Product Designer",
    summary: "x".repeat(500),
    experiences,
    projects,
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
    assert.deepEqual(
      pages.flatMap((page) => page.projects.map((item) => item.id)),
      projects.map((item) => item.id),
    );
    if (template.id === "corporate-competencies") {
      assert.ok(pages.slice(0, -1).every((page) => page.languages === ""));
      assert.equal(pages.at(-1).languages, data.languages);
      assert.ok(pages.slice(0, -1).every((page) => page.educations.length === 0));
      assert.deepEqual(pages.at(-1).educations, data.educations);
    }
  }
});

test("all selectable templates preserve ordered content across at least four A4 pages", async () => {
  const {
    emptyResumeData,
    paginateResumeData,
    selectableResumeTemplates,
  } = await import("../app/(panel)/resumes/resume-data.ts");
  const { hasResumeSectionFlowViolation } = await import(
    "../app/(panel)/resumes/resume-section-flow.ts"
  );
  const { getResumePaginationProfile, getResumeSectionFlow } = await import(
    "../app/(panel)/resumes/resume-pagination-profile.ts"
  );
  const experiences = Array.from({ length: 24 }, (_, index) => ({
    id: `stress-experience-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: `Company ${index + 1}`,
    location: "Tehran",
    startDate: "2020",
    endDate: "2024",
    isCurrent: false,
    description: "x".repeat(360),
    technologies: "React, TypeScript",
  }));
  const projects = Array.from({ length: 6 }, (_, index) => ({
    id: `stress-project-${index}`,
    name: `Project ${index + 1}`,
    role: "Open source",
    url: `github.com/example/stress-${index + 1}`,
    startDate: "2024",
    endDate: "2025",
    isCurrent: false,
    description: "x".repeat(240),
    technologies: "Next.js, TypeScript",
  }));
  const educations = Array.from({ length: 3 }, (_, index) => ({
    id: `stress-education-${index}`,
    institution: `University ${index + 1}`,
    credential: `Degree ${index + 1}`,
    startDate: "2014",
    endDate: "2018",
    isCurrent: false,
  }));
  const data = {
    ...emptyResumeData,
    fullName: "Ali Mohammadi",
    summary: "x".repeat(500),
    experiences,
    projects,
    educations,
    skills: "React, TypeScript, Next.js",
    languages: "Persian, English",
  };

  for (const template of selectableResumeTemplates) {
    const pages = paginateResumeData(data, template.id);
    assert.ok(pages.length >= 4, `${template.id} should span four A4 pages`);
    assert.deepEqual(
      pages.flatMap((page) => page.experiences.map((item) => item.id)),
      experiences.map((item) => item.id),
    );
    assert.deepEqual(
      pages.flatMap((page) => page.projects.map((item) => item.id)),
      projects.map((item) => item.id),
    );
    assert.deepEqual(
      pages.flatMap((page) => page.educations.map((item) => item.id)),
      educations.map((item) => item.id),
    );
    const profile = getResumePaginationProfile(template.id);
    if (getResumeSectionFlow(profile, "educations") === "main") {
      assert.equal(
        hasResumeSectionFlowViolation(pages),
        false,
        `${template.id} must keep main-column education after the complete work sequence`,
      );
    }
  }
});

test("angular technical summary length never consumes main-column capacity", async () => {
  const { emptyResumeData, paginateResumeData } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const experiences = Array.from({ length: 12 }, (_, index) => ({
    id: `independent-flow-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: "Company",
    location: "Tehran",
    startDate: "2020",
    endDate: "2024",
    isCurrent: false,
    description: "x".repeat(300),
    technologies: "React, TypeScript",
  }));
  const base = {
    ...emptyResumeData,
    experiences,
    skills: "React, Next.js, TypeScript",
    languages: "Persian, English",
  };
  const withoutSummary = paginateResumeData(base, "angular-technical");
  const withLongSummary = paginateResumeData(
    { ...base, summary: "x".repeat(2000) },
    "angular-technical",
  );

  assert.deepEqual(
    withLongSummary.map((page) => page.experiences.map((item) => item.id)),
    withoutSummary.map((page) => page.experiences.map((item) => item.id)),
  );
  assert.equal(withLongSummary[0].summary.length, 2000);
  assert.ok(withLongSummary.slice(1).every((page) => page.summary === ""));
});

test("every selectable template keeps education as one atomic section", async () => {
  const { paginateResumeData, selectableResumeTemplates } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const { templatePreviewData } = await import(
    "../app/(panel)/resumes/template-preview-data.ts"
  );

  for (const template of selectableResumeTemplates) {
    const pages = paginateResumeData(templatePreviewData, template.id);
    const educationPages = pages.filter(
      (page) => page.educations.length > 0 || page.education.trim(),
    );
    assert.equal(
      educationPages.length,
      1,
      `${template.id} must not split or repeat its education section`,
    );
    assert.deepEqual(educationPages[0].educations, templatePreviewData.educations);
  }
});

test("angular technical never places education between experience pages", async () => {
  const { emptyResumeData, paginateResumeData } = await import(
    "../app/(panel)/resumes/resume-data.ts"
  );
  const experiences = Array.from({ length: 12 }, (_, index) => ({
    id: `angular-work-${index}`,
    jobTitle: `Role ${index + 1}`,
    company: `Company ${index + 1}`,
    location: "Tehran",
    startDate: "2020",
    endDate: "2024",
    isCurrent: false,
    description: "x".repeat(260),
    technologies: "React, TypeScript",
  }));
  const educations = Array.from({ length: 2 }, (_, index) => ({
    id: `angular-education-${index}`,
    institution: `University ${index + 1}`,
    credential: `Degree ${index + 1}`,
    startDate: "2014",
    endDate: "2018",
    isCurrent: false,
  }));
  const pages = paginateResumeData(
    {
      ...emptyResumeData,
      summary: "x".repeat(400),
      experiences,
      educations,
    },
    "angular-technical",
  );
  const lastWorkPage = pages.findLastIndex(
    (page) => page.experiences.length > 0 || page.projects.length > 0,
  );
  const firstEducationPage = pages.findIndex(
    (page) => page.educations.length > 0 || page.education.trim(),
  );

  assert.ok(lastWorkPage > 0, "fixture must span multiple work pages");
  assert.equal(firstEducationPage, lastWorkPage);
  assert.ok(firstEducationPage >= 0);
});

test("angular technical renders education after work and projects", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function AngularTechnicalResume"),
    resumeDocument.indexOf("export function ResumeDocumentPage"),
  );

  assert.ok(
    template.indexOf("{experiences.length > 0") <
      template.indexOf("{projects.length > 0"),
  );
  assert.ok(
    template.indexOf("{projects.length > 0") <
      template.indexOf("<AngularTechnicalEducation"),
  );
});

test("rendered rebalancing cannot pull education before later work", async () => {
  const paginationHook = await readFile(
    new URL(
      "app/(panel)/resumes/use-rendered-resume-pagination.ts",
      projectRoot,
    ),
    "utf8",
  );

  assert.match(paginationHook, /normalizeSectionFlow\(nextPages, profile\)/);
  assert.match(
    paginationHook,
    /profile\?\.sidebar\.includes\("educations"\)[\s\S]*?enforceResumeSectionFlow\(pages\)/,
  );
  assert.match(
    paginationHook,
    /visitedLayouts\.has\(orderedLayoutKey\)[\s\S]*?blockedOverflowFlows/,
    "a previously measured overflow layout must be blocked instead of cycling forever",
  );
  assert.match(
    paginationHook,
    /visitedLayouts\.has\(candidateLayoutKey\)[\s\S]*?blockedBoundaries/,
    "a previously measured rebalance layout must be blocked instead of cycling forever",
  );
  assert.match(
    paginationHook,
    /MAX_SYNCHRONOUS_PAGINATION_PASSES = 30[\s\S]*?pagination\.passCount >= MAX_SYNCHRONOUS_PAGINATION_PASSES/,
    "rendered pagination must stop before React's nested update limit",
  );
});

test("rendered rebalancing may fill the final work page with education", async () => {
  const [paginationHook, sectionFlow] = await Promise.all([
    readFile(
      new URL(
        "app/(panel)/resumes/use-rendered-resume-pagination.ts",
        projectRoot,
      ),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/resumes/resume-section-flow.ts", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(paginationHook, /moveSectionBack/);
  assert.match(paginationHook, /normalizeSectionFlow\(nextPages, profile\)/);
  assert.match(sectionFlow, /index < lastWorkPageIndex/);
  assert.doesNotMatch(sectionFlow, /index <= lastWorkPageIndex/);
});

test("pastel graduate keeps education after all work and project blocks", async () => {
  const resumeDocument = await readFile(
    new URL("app/(panel)/resumes/resume-document.tsx", projectRoot),
    "utf8",
  );
  const template = resumeDocument.slice(
    resumeDocument.indexOf("function PastelGraduateResume"),
    resumeDocument.indexOf("function SplitProfileHeading"),
  );

  assert.ok(template.indexOf("experiences.length") >= 0);
  assert.ok(template.indexOf("<ProjectSection") > template.indexOf("experiences.length"));
  assert.ok(template.lastIndexOf("educations.length") > template.indexOf("<ProjectSection"));
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

test("model work stays in the panel shell and exposes completed destinations", async () => {
  const [provider, shell, appProviders] = await Promise.all([
    readFile(
      new URL("app/(panel)/_components/model-task-provider.tsx", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("app/(panel)/_components/panel-shell.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/providers.tsx", projectRoot), "utf8"),
  ]);

  assert.match(appProviders, /QueryClientProvider/);
  assert.match(provider, /status: "running"/);
  assert.match(provider, /status: "completed"/);
  assert.match(provider, /status: "error"/);
  assert.match(provider, /getCompletedHref/);
  assert.match(provider, /runningCountRef\.current >= 2/);
  assert.match(provider, /دو درخواست مدل در حال انجام است/);
  assert.doesNotMatch(provider, /\.slice\(0, 5\)/);
  assert.match(provider, /setTasks\(\(current\) => \[task, \.\.\.current\]\)/);
  assert.match(provider, /if \(task\.status !== "running"\) dismissTask\(task\.id\)/);
  assert.match(shell, /فعالیت‌های مدل/);
  assert.ok(
    shell.indexOf("فعالیت‌های مدل") < shell.indexOf("مدیریت فضاهای کاری"),
  );
});

test("every model-backed panel operation uses the shared background task manager", async () => {
  const files = await Promise.all([
    "app/(panel)/match/page.tsx",
    "app/(panel)/resumes/resume-builder.tsx",
    "app/(panel)/interview/page.tsx",
    "app/(panel)/knowledge-base/page.tsx",
    "app/(panel)/dashboard/page.tsx",
  ].map((path) => readFile(new URL(path, projectRoot), "utf8")));

  const source = files.join("\n");
  for (const key of [
    "match-analysis",
    "match-tailor-resume",
    "resume-generate",
    "interview-session",
    "interview-feedback",
    "knowledge-import",
    "dashboard-analysis-",
  ]) {
    assert.match(source, new RegExp(key));
  }
  assert.ok(files.every((file) => file.includes("runModelTask")));
});

test("a completed tailored resume opens the exact saved resume", async () => {
  const [matchPage, resumesPage] = await Promise.all([
    readFile(new URL("app/(panel)/match/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/(panel)/resumes/page.tsx", projectRoot), "utf8"),
  ]);

  assert.match(
    matchPage,
    /getCompletedHref: \(resume\) => `\/resumes\?openResume=\$\{resume\.id\}`/,
  );
  assert.match(resumesPage, /searchParams\.get\("openResume"\)/);
  assert.match(resumesPage, /item\.id === requestedResumeId/);
  assert.match(resumesPage, /setBuilderOpen\(true\)/);
});

test("a completed match analysis restores the saved report when its task is opened", async () => {
  const [matchPage, models] = await Promise.all([
    readFile(new URL("app/(panel)/match/page.tsx", projectRoot), "utf8"),
    readFile(new URL("lib/data/models.ts", projectRoot), "utf8"),
  ]);

  assert.match(models, /jobId\?: string/);
  assert.match(matchPage, /jobId: jobRecord\.id/);
  assert.match(matchPage, /item\.jobId === selectedJob\.id/);
  assert.match(matchPage, /setAnalysis\(previousAnalysis\?\.analysis \|\| null\)/);
  assert.match(matchPage, /setAnalyzed\(Boolean\(previousAnalysis\)\)/);
});

test("switching match input tabs preserves the visible analysis panel", async () => {
  const matchPage = await readFile(
    new URL("app/(panel)/match/page.tsx", projectRoot),
    "utf8",
  );
  const sourceModeHandler = matchPage.slice(
    matchPage.indexOf("const selectSourceMode"),
    matchPage.indexOf("const copyImportedDescription"),
  );

  assert.match(sourceModeHandler, /setSourceMode\(mode\)/);
  assert.doesNotMatch(sourceModeHandler, /setAnalyzed\(false\)/);
  assert.doesNotMatch(sourceModeHandler, /setAnalysis\(null\)/);
  assert.doesNotMatch(sourceModeHandler, /setTailored\(false\)/);
});
