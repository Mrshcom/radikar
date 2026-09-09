# Graph Report - resumeMaker  (2026-09-09)

## Corpus Check
- 172 files · ~229,644 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1454 nodes · 3213 edges · 75 communities (64 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3590c354`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- data-routes.test.ts
- applications/page.tsx
- scripts
- dependencies
- resumes/page.tsx
- formatPersianNumber
- BillingService
- app.ts
- dependencies
- stores.ts
- auth/routes.ts
- jalali-date-picker.tsx
- toast.tsx
- jobs/page.tsx
- AuthService
- admin/orders/page.tsx
- devDependencies
- apiRequest
- tasks
- build-app.ts
- compilerOptions
- scripts
- web/package.json
- table-page-size.ts
- react-dom
- @hookform/resolvers
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
- model-usage/page.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- job-import.ts
- useAuth
- admin-stats.ts
- dashboard/page.tsx
- compilerOptions
- ai/routes.ts
- react
- memberships/page.tsx
- knowledge-base/page.tsx
- job-url.ts
- marketing-sections.tsx
- @fontsource-variable/vazirmatn
- AGENTS.md
- job-description-validation.ts
- @radicar/shared-types
- job-application-filter.ts
- eslint.config.mjs
- panel-shell.tsx
- field-direction.ts
- postcss.config.mjs
- config/src/index.ts
- match/page.tsx
- استقرار Production رادیکار
- backup-postgres.sh

## God Nodes (most connected - your core abstractions)
1. `cn()` - 81 edges
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
- `serializeResumeSkills()` --calls--> `normalizeImportedText()`  [EXTRACTED]
  apps/api/src/modules/ai/helpers.ts → packages/validators/src/index.ts
- `textOf()` --calls--> `normalizeImportedText()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts
- `stringArray()` --calls--> `normalizeImportedTextArray()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts
- `normalizeAnalysis()` --calls--> `normalizeImportedBoolean()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts
- `preserveResumeArrays()` --calls--> `normalizeStoredResumeData()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts

## Import Cycles
- None detected.

## Communities (75 total, 11 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.07
Nodes (81): DataTableSkeleton(), ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), LoadingContext(), MatchAnalysisSkeleton() (+73 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.06
Nodes (58): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve() (+50 more)

### Community 2 - "data-routes.test.ts"
Cohesion: 0.16
Nodes (22): isStandaloneTechnicalToken(), serializeResumeSkills(), applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks(), ExtractedFileContent (+14 more)

### Community 3 - "applications/page.tsx"
Cohesion: 0.22
Nodes (13): ApplicationsPage(), formatUpdateTime(), readApplicationBoard(), DeleteConfirmModal(), Modal(), SectionTitle(), applicationPipelineStages, createSavedApplicationForJob() (+5 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, lucide-react, next, nuqs, @radicar/validators, react-hook-form, @tanstack/react-query (+9 more)

### Community 6 - "resumes/page.tsx"
Cohesion: 0.10
Nodes (37): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+29 more)

### Community 7 - "formatPersianNumber"
Cohesion: 0.20
Nodes (11): JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), JobLogo(), toneStyles, Job, JobTone (+3 more)

### Community 8 - "BillingService"
Cohesion: 0.14
Nodes (5): addDays(), addLimit(), BillingService, orderNumber(), ModelUsageEvent

### Community 9 - "app.ts"
Cohesion: 0.20
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (48): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+40 more)

### Community 11 - "stores.ts"
Cohesion: 0.09
Nodes (29): Feedback, icons, PracticeCard, SessionData, AppProfileRecord, BaseRecord, InterviewFeedbackRecord, InterviewSessionRecord (+21 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (21): AuthRouteOptions, AuthServicePort, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, registerAuthRoutes() (+13 more)

### Community 13 - "jalali-date-picker.tsx"
Cohesion: 0.27
Nodes (15): JalaliDatePicker(), JalaliDatePickerProps, weekDays, addCalendarDays(), atNoon(), formatPersianCalendarDate(), formatPersianCalendarMonth(), getPersianDateParts() (+7 more)

### Community 14 - "toast.tsx"
Cohesion: 0.24
Nodes (9): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage(), PLAN_UPGRADE_REQUIRED_EVENT (+1 more)

### Community 15 - "jobs/page.tsx"
Cohesion: 0.13
Nodes (17): JobCardsSkeleton(), categoryOptions, JobsPage(), applicationStore, jobStore, ClassifiableJob, inferJobCategories(), JobCategory (+9 more)

### Community 16 - "AuthService"
Cohesion: 0.15
Nodes (7): AuthService, normalizePhone(), toAuthUser(), tokenHash(), AuthUser, UserRole, UserStatus

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.09
Nodes (35): UserRole, orderFilterParsers, Response, statusOptions, Payment, paymentFilterParsers, Response, statusOptions (+27 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "apiRequest"
Cohesion: 0.14
Nodes (26): LoginPage(), MembershipsAdminPage(), AdminOrdersPage(), AdminPaymentsPage(), AdminRecordsPage(), AdminUsersPage(), OrdersPage(), UpgradePage() (+18 more)

### Community 21 - "tasks"
Cohesion: 0.10
Nodes (21): apiProxyOrigin, monorepoRoot, nextConfig, ^build, .next/**, dependsOn, outputs, cache (+13 more)

### Community 22 - "build-app.ts"
Cohesion: 0.09
Nodes (25): buildApp(), BuildAppOptions, handleAuthError(), requirePermission(), adjustCreditSchema, adminListSchema, callbackSchema, cancelSchema (+17 more)

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
Cohesion: 0.24
Nodes (9): PaginationItem, paginationItems(), TablePagination(), AuthResponse, positivePageParser, TablePageSize, tablePageSizes, tablePaginationParsers (+1 more)

### Community 29 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 30 - "رادیکار — Resume Maker"
Cohesion: 0.05
Nodes (35): تنظیم Web, قرارداد HTTP, لایه داده Web, API سازگار با OpenAI, dependencyها نامعتبر یا ناقص‌اند, endpoint `/ready` کد 503 می‌دهد, Proxy محلی DeepSeek, Web پیام اتصال به Node API می‌دهد (+27 more)

### Community 31 - "database/package.json"
Cohesion: 0.07
Nodes (26): drizzle-kit, dependencies, drizzle-orm, postgres, @radicar/shared-types, tsx, devDependencies, drizzle-kit (+18 more)

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
Nodes (17): dependencies, @radicar/shared-types, zod, devDependencies, typescript, exports, @radicar/shared-types, typescript (+9 more)

### Community 37 - "billing/service.ts"
Cohesion: 0.13
Nodes (26): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, UsageCosts, UsageResource, usageResourceLabels, createDatabase() (+18 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.08
Nodes (18): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+10 more)

### Community 41 - "model-usage/page.tsx"
Cohesion: 0.29
Nodes (11): AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number(), operationLabels, percent(), RecentModelRequest (+3 more)

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
Cohesion: 0.28
Nodes (15): allowedHostSuffixes, decodeEntities(), extractAttribute(), extractCompanyLogoUrl(), extractJobText(), extractMetaContent(), getLinkedInJobId(), isAllowedHost() (+7 more)

### Community 48 - "useAuth"
Cohesion: 0.18
Nodes (14): AuthGate(), authQueryKey, CurrentUser, useAuth(), useLogout(), localizedNumericString, otpSchema, OtpValues (+6 more)

### Community 49 - "admin-stats.ts"
Cohesion: 0.12
Nodes (21): AdminPage(), collectionLabels, formatNumber(), AdminSettingsPage(), FormValues, schema, AdminAiSettings, adminAiSettingsQueryKey (+13 more)

### Community 50 - "dashboard/page.tsx"
Cohesion: 0.15
Nodes (14): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+6 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "ai/routes.ts"
Cohesion: 0.08
Nodes (56): asObject(), hasResumeContent(), JsonObject, validateJobDescription(), ValidationResult, aiSettingsSchema, Analysis, bodyOf() (+48 more)

### Community 54 - "memberships/page.tsx"
Cohesion: 0.10
Nodes (23): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, localizedNumber() (+15 more)

### Community 55 - "knowledge-base/page.tsx"
Cohesion: 0.06
Nodes (85): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+77 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "marketing-sections.tsx"
Cohesion: 0.14
Nodes (16): DemoSection(), faqs, FaqSection(), features, FeaturesSection(), FinalCta(), HeroSection(), MarketingFooter() (+8 more)

### Community 64 - "job-application-filter.ts"
Cohesion: 0.27
Nodes (9): DatedApplication, hasJobActivityInDateRange(), isTimeInRange(), JobIdentity, normalizedIdentity(), normalizedPart(), rangeBoundary(), applications (+1 more)

### Community 67 - "panel-shell.tsx"
Cohesion: 0.18
Nodes (18): useToast(), useModelTasks(), adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems (+10 more)

### Community 69 - "field-direction.ts"
Cohesion: 0.19
Nodes (16): MultiSkillAutocomplete(), parseSkills(), ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES (+8 more)

### Community 74 - "match/page.tsx"
Cohesion: 0.12
Nodes (20): createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider() (+12 more)

### Community 75 - "استقرار Production رادیکار"
Cohesion: 0.25
Nodes (7): DeepSeek محلی, آماده‌سازی, اجرا, استقرار Production رادیکار, انتشار نسخه جدید, پشتیبان‌گیری PostgreSQL, پیش‌نیاز

## Knowledge Gaps
- **500 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+495 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `resume-document.tsx` to `panel-shell.tsx`, `field-direction.ts`, `resumes/page.tsx`, `formatPersianNumber`, `match/page.tsx`, `jalali-date-picker.tsx`, `toast.tsx`, `jobs/page.tsx`, `admin/orders/page.tsx`, `knowledge-base/page.tsx`, `table-page-size.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `panel-shell.tsx`, `resumes/page.tsx`, `DataCollection`, `model-usage/page.tsx`, `match/page.tsx`, `stores.ts`, `useAuth`, `admin/orders/page.tsx`, `dashboard/page.tsx`, `admin-stats.ts`, `memberships/page.tsx`, `knowledge-base/page.tsx`, `table-page-size.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `BillingService` connect `BillingService` to `data-routes.test.ts`, `billing/service.ts`, `ZarinpalClient`, `DataCollection`, `app.ts`, `ai/routes.ts`, `build-app.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _500 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06870428422152561 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06386946386946386 - nodes in this community are weakly interconnected._