# Graph Report - resumeMaker  (2026-09-17)

## Corpus Check
- 183 files · ~641,778 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1517 nodes · 3285 edges · 94 communities (81 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e2cf8fdc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- use-rendered-resume-pagination.ts
- data-routes.test.ts
- jobs/page.tsx
- scripts
- dependencies
- resumes/page.tsx
- loading-skeletons.tsx
- BillingService
- app.ts
- dependencies
- normalizeImportedText
- auth/routes.ts
- useAuth
- Database
- dashboard/page.tsx
- AuthService
- admin/orders/page.tsx
- devDependencies
- match-analysis.ts
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- table-page-size.ts
- react-dom
- stores.ts
- compilerOptions
- رادیکار — Resume Maker
- database/package.json
- compilerOptions
- config/package.json
- compilerOptions
- shared-types/package.json
- validators/package.json
- billing/service.ts
- ZarinpalClient
- chatgpt-auth.ts
- DataCollection
- knowledge-base/page.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- job-import.ts
- apiRequest
- model-usage/page.tsx
- model-task-provider.tsx
- compilerOptions
- ai/routes.ts
- react
- memberships/page.tsx
- validators/src/index.ts
- job-url.ts
- marketing-sections.tsx
- toast.tsx
- AGENTS.md
- job-description-validation.ts
- @radikar/shared-types
- panel-shell.tsx
- eslint.config.mjs
- api/[...path]/route.ts
- Radikar — Project Knowledge Base
- @hookform/resolvers
- field-direction.ts
- postcss.config.mjs
- config/src/index.ts
- jalali-date-picker.tsx
- scheduleFieldDirectionRefresh
- استقرار Production رادیکار
- @fontsource-variable/vazirmatn
- backup-postgres.sh
- vercel.json
- web/AGENTS.md
- job-application-filter.ts
- resume-section-flow.ts
- account/page.tsx
- match/page.tsx
- build-app.ts
- رفع خطاهای رایج
- check-knowledge-base.mjs
- راه‌اندازی سریع پیشنهادی
- لایه داده Web
- تنظیم مدل هوش مصنوعی
- commit-msg

## God Nodes (most connected - your core abstractions)
1. `cn()` - 87 edges
2. `apiRequest()` - 43 edges
3. `KnowledgeBasePage()` - 36 edges
4. `DataCollection` - 35 edges
5. `normalizeImportedText()` - 32 edges
6. `BillingService` - 29 edges
7. `useAuth()` - 27 edges
8. `useToast()` - 27 edges
9. `createRecordId()` - 27 edges
10. `registerAiRoutes()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `buildApp()` --calls--> `normalizeDigitsDeep()`  [EXTRACTED]
  apps/api/src/build-app.ts → packages/validators/src/index.ts
- `serializeResumeSkills()` --calls--> `normalizeImportedText()`  [EXTRACTED]
  apps/api/src/modules/ai/helpers.ts → packages/validators/src/index.ts
- `textOf()` --calls--> `normalizeImportedText()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts
- `stringArray()` --calls--> `normalizeImportedTextArray()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts
- `normalizeAnalysis()` --calls--> `normalizeImportedBoolean()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts

## Import Cycles
- None detected.

## Communities (94 total, 13 thin omitted)

### Community 0 - "cn"
Cohesion: 0.09
Nodes (73): DataTableSkeleton(), experienceWeight(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), paginateOneColumnResume(), paginateResumeData() (+65 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.08
Nodes (48): getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve(), PAGE_BOTTOM_RESERVE, PAGE_TOP_RESERVE, DEFAULT_SECTION_ORDER, getResumeFlowSections() (+40 more)

### Community 2 - "data-routes.test.ts"
Cohesion: 0.14
Nodes (24): isStandaloneTechnicalToken(), serializeResumeSkills(), AuthServicePort, applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks() (+16 more)

### Community 3 - "jobs/page.tsx"
Cohesion: 0.13
Nodes (24): ApplicationsPage(), formatUpdateTime(), readApplicationBoard(), JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), JobLogo() (+16 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (38): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+30 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, lucide-react, next, nuqs, @radikar/validators, react-hook-form, @tanstack/react-query (+9 more)

### Community 6 - "resumes/page.tsx"
Cohesion: 0.09
Nodes (41): DeleteConfirmModal(), categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab (+33 more)

### Community 7 - "loading-skeletons.tsx"
Cohesion: 0.13
Nodes (12): ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton() (+4 more)

### Community 8 - "BillingService"
Cohesion: 0.20
Nodes (4): addDays(), addLimit(), BillingService, orderNumber()

### Community 9 - "app.ts"
Cohesion: 0.20
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (48): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radikar/ai (+40 more)

### Community 11 - "normalizeImportedText"
Cohesion: 0.55
Nodes (11): canonicalDates(), canonicalExperience(), canonicalId(), canonicalLanguage(), canonicalProject(), canonicalQualification(), normalizeDataRecordForStorage(), normalizeImportedBoolean() (+3 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (20): AuthRouteOptions, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, registerAuthRoutes(), requestOtpSchema (+12 more)

### Community 13 - "useAuth"
Cohesion: 0.32
Nodes (9): AuthGate(), useAuth(), useLogout(), AdminPage(), collectionLabels, formatNumber(), SettingsPage(), useAdminBillingStats() (+1 more)

### Community 14 - "Database"
Cohesion: 0.20
Nodes (7): createDatabase(), Database, database, migrationsFolder, database, now, timestamp

### Community 15 - "dashboard/page.tsx"
Cohesion: 0.14
Nodes (15): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+7 more)

### Community 16 - "AuthService"
Cohesion: 0.16
Nodes (7): AuthService, normalizePhone(), toAuthUser(), tokenHash(), AuthUser, UserRole, UserStatus

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.09
Nodes (33): UserRole, orderFilterParsers, Response, statusOptions, Payment, paymentFilterParsers, Response, statusOptions (+25 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "match-analysis.ts"
Cohesion: 0.43
Nodes (6): boundedScore(), defaultBreakdownLabels, MatchAnalysis, normalizeMatchAnalysisInput(), objectOf(), normalizeImportedTextArray()

### Community 21 - "tasks"
Cohesion: 0.10
Nodes (21): apiProxyOrigin, monorepoRoot, nextConfig, ^build, .next/**, dependsOn, outputs, cache (+13 more)

### Community 22 - "billing/routes.ts"
Cohesion: 0.11
Nodes (16): adjustCreditSchema, adminListSchema, callbackSchema, cancelSchema, createOrderSchema, extendSchema, grantPlanSchema, membershipListSchema (+8 more)

### Community 23 - "compilerOptions"
Cohesion: 0.06
Nodes (30): compilerOptions, allowImportingTsExtensions, allowJs, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 24 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 25 - "web/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 26 - "table-page-size.ts"
Cohesion: 0.36
Nodes (6): AuthResponse, useTablePageSize(), positivePageParser, TablePageSize, tablePageSizes, tablePaginationParsers

### Community 28 - "stores.ts"
Cohesion: 0.11
Nodes (22): Job, JobTone, AppProfileRecord, InterviewFeedbackRecord, InterviewSessionRecord, KnowledgeExperience, KnowledgeLanguage, KnowledgeQualification (+14 more)

### Community 29 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 30 - "رادیکار — Resume Maker"
Cohesion: 0.14
Nodes (14): اجرای PostgreSQL و API داخل Docker, اجرای Web و API در terminalهای جدا, اجرای خروجی Build روی سیستم محلی, الزامات Production, تست و کنترل کیفیت, رادیکار — Resume Maker, ساختار Monorepo, فرمان‌های مهم Monorepo (+6 more)

### Community 31 - "database/package.json"
Cohesion: 0.07
Nodes (26): drizzle-kit, dependencies, drizzle-orm, postgres, @radikar/shared-types, tsx, devDependencies, drizzle-kit (+18 more)

### Community 32 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+2 more)

### Community 33 - "config/package.json"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, @types/node, typescript, exports, ./server, @types/node (+10 more)

### Community 34 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+2 more)

### Community 35 - "shared-types/package.json"
Cohesion: 0.15
Nodes (12): devDependencies, typescript, exports, typescript, name, private, scripts, build (+4 more)

### Community 36 - "validators/package.json"
Cohesion: 0.11
Nodes (17): dependencies, @radikar/shared-types, zod, devDependencies, typescript, exports, @radikar/shared-types, typescript (+9 more)

### Community 37 - "billing/service.ts"
Cohesion: 0.17
Nodes (18): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, UsageResource, usageResourceLabels, aiSettings, authSessions (+10 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.08
Nodes (19): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+11 more)

### Community 41 - "knowledge-base/page.tsx"
Cohesion: 0.12
Nodes (37): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+29 more)

### Community 42 - "ai/package.json"
Cohesion: 0.14
Nodes (13): devDependencies, typescript, exports, typescript, name, private, scripts, build (+5 more)

### Community 43 - "shared-types/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 44 - "validators/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 45 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, resolveJsonModule, skipLibCheck, strict, target

### Community 47 - "job-import.ts"
Cohesion: 0.26
Nodes (15): allowedHostSuffixes, decodeEntities(), extractAttribute(), extractCompanyLogoUrl(), extractJobText(), extractMetaContent(), getLinkedInJobId(), isAllowedHost() (+7 more)

### Community 48 - "apiRequest"
Cohesion: 0.16
Nodes (26): AccountPage(), MembershipsAdminPage(), AdminOrdersPage(), AdminPaymentsPage(), AdminRecordsPage(), collectionOptions, recordFilterParsers, RecordRow (+18 more)

### Community 49 - "model-usage/page.tsx"
Cohesion: 0.10
Nodes (27): AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number(), operationLabels, percent(), RecentModelRequest (+19 more)

### Community 50 - "model-task-provider.tsx"
Cohesion: 0.20
Nodes (10): createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider() (+2 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "ai/routes.ts"
Cohesion: 0.07
Nodes (59): asObject(), hasResumeContent(), JsonObject, validateJobDescription(), ValidationResult, aiSettingsSchema, Analysis, bodyOf() (+51 more)

### Community 54 - "memberships/page.tsx"
Cohesion: 0.14
Nodes (16): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, membershipFilterParsers (+8 more)

### Community 55 - "validators/src/index.ts"
Cohesion: 0.09
Nodes (32): LoginPage(), localizedNumber(), aliasedObjectInput(), baseRecordSchema, boundedImportedArray(), collectionInput(), collectionWrapperKeys, firstDefined() (+24 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "marketing-sections.tsx"
Cohesion: 0.09
Nodes (22): AnimatedNumber(), BorderBeam(), DotPattern(), MagicCard(), Marquee(), Meteors(), DemoSection(), faqs (+14 more)

### Community 58 - "toast.tsx"
Cohesion: 0.16
Nodes (13): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, ApiError, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage() (+5 more)

### Community 64 - "panel-shell.tsx"
Cohesion: 0.13
Nodes (23): useToast(), useModelTasks(), adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems (+15 more)

### Community 66 - "api/[...path]/route.ts"
Cohesion: 0.13
Nodes (16): DELETE, GET, OPTIONS, PATCH, POST, proxy(), PUT, DELETE (+8 more)

### Community 67 - "Radikar — Project Knowledge Base"
Cohesion: 0.17
Nodes (12): Radikar — Project Knowledge Base, اجرای محلی, استقرار, تضمین به‌روزرسانی knowledge base, تنظیمات محیطی و امنیت, دیتابیس، داده و پلن‌ها, ساختار سریع repository, نقاط ورود و مسیرهای مهم (+4 more)

### Community 69 - "field-direction.ts"
Cohesion: 0.35
Nodes (10): ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField(), refreshFieldDirections() (+2 more)

### Community 73 - "jalali-date-picker.tsx"
Cohesion: 0.15
Nodes (21): JalaliDatePicker(), JalaliDatePickerProps, weekDays, addCalendarDays(), atNoon(), formatPersianCalendarDate(), formatPersianCalendarMonth(), getPersianDateParts() (+13 more)

### Community 74 - "scheduleFieldDirectionRefresh"
Cohesion: 0.39
Nodes (6): MultiSkillAutocomplete(), parseSkills(), scheduleFieldDirectionRefresh(), isStandaloneTechnicalToken(), parseResumeSkills(), serializeResumeSkills()

### Community 75 - "استقرار Production رادیکار"
Cohesion: 0.25
Nodes (7): DeepSeek محلی, آماده‌سازی, اجرا, استقرار Production رادیکار, انتشار نسخه جدید, پشتیبان‌گیری PostgreSQL, پیش‌نیاز

### Community 79 - "vercel.json"
Cohesion: 0.50
Nodes (3): regions, $schema, fra1

### Community 82 - "job-application-filter.ts"
Cohesion: 0.16
Nodes (15): JobsPage(), DatedApplication, hasJobActivityInDateRange(), isTimeInRange(), JobIdentity, normalizedIdentity(), normalizedPart(), rangeBoundary() (+7 more)

### Community 83 - "resume-section-flow.ts"
Cohesion: 0.24
Nodes (7): ResumeEducation, createContinuationResumePage(), enforceResumeSectionFlow(), hasResumeSectionFlowViolation(), hasWorkContent(), projectRoot, repositoryRoot

### Community 84 - "account/page.tsx"
Cohesion: 0.13
Nodes (16): authQueryKey, CurrentUser, localizedNumericString, otpSchema, OtpValues, phoneSchema, PhoneValues, schema (+8 more)

### Community 85 - "match/page.tsx"
Cohesion: 0.21
Nodes (12): getJobTextDirection(), ImportJobResponse, isMatchAnalysisTaskContext(), JobSourceMode, MatchAnalysisTaskContext, MatchPage(), ResumeOption, scoreWidth() (+4 more)

### Community 86 - "build-app.ts"
Cohesion: 0.43
Nodes (6): buildApp(), BuildAppOptions, handleAuthError(), handleBillingError(), registerHealthRoutes(), registerImportRoutes()

### Community 87 - "رفع خطاهای رایج"
Cohesion: 0.25
Nodes (8): dependencyها نامعتبر یا ناقص‌اند, endpoint `/ready` کد 503 می‌دهد, Web پیام اتصال به Node API می‌دهد, خطای CORS دیده می‌شود, رفع خطاهای رایج, قابلیت‌های AI خطای provider می‌دهند, کد OTP در توسعه نمایش داده نمی‌شود, یکی از پورت‌ها اشغال است

### Community 88 - "check-knowledge-base.mjs"
Cohesion: 0.25
Nodes (7): hasKnowledgeBaseUpdate, hasNotApplicableReview, ignoredPaths, requiresKnowledgeBaseUpdate, stagedFiles, watchedPrefixes, watchedRootFiles

### Community 89 - "راه‌اندازی سریع پیشنهادی"
Cohesion: 0.29
Nodes (7): راه‌اندازی سریع پیشنهادی, ۱. نصب dependencyها, ۲. ساخت فایل‌های تنظیمات محلی, ۳. بالا آوردن PostgreSQL, ۴. اجرای migrationها, ۵. ایجاد داده اولیه, ۶. اجرای هم‌زمان Web و API

### Community 90 - "لایه داده Web"
Cohesion: 0.33
Nodes (3): تنظیم Web, قرارداد HTTP, لایه داده Web

### Community 91 - "تنظیم مدل هوش مصنوعی"
Cohesion: 0.67
Nodes (3): API سازگار با OpenAI, Proxy محلی DeepSeek, تنظیم مدل هوش مصنوعی

## Knowledge Gaps
- **536 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+531 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `panel-shell.tsx`, `jobs/page.tsx`, `resumes/page.tsx`, `loading-skeletons.tsx`, `jalali-date-picker.tsx`, `knowledge-base/page.tsx`, `scheduleFieldDirectionRefresh`, `admin/orders/page.tsx`, `match/page.tsx`, `marketing-sections.tsx`, `toast.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `DataCollection` connect `DataCollection` to `data-routes.test.ts`, `stores.ts`, `billing/service.ts`, `validators/src/index.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `BillingService` connect `BillingService` to `data-routes.test.ts`, `billing/service.ts`, `ZarinpalClient`, `DataCollection`, `app.ts`, `Database`, `job-import.ts`, `ai/routes.ts`, `build-app.ts`, `billing/routes.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _536 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.08578263841421736 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.083710407239819 - nodes in this community are weakly interconnected._