# Graph Report - resumeMaker  (2026-09-09)

## Corpus Check
- 172 files · ~229,634 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1453 nodes · 3212 edges · 74 communities (63 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e2a1b6e`
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
- loading-skeletons.tsx
- BillingService
- app.ts
- dependencies
- stores.ts
- auth/routes.ts
- useAuth
- toast.tsx
- jobs/page.tsx
- AuthService
- users/page.tsx
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
- match/page.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- job-import.ts
- account/page.tsx
- useToast
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
- eslint.config.mjs
- panel-shell.tsx
- field-direction.ts
- postcss.config.mjs
- config/src/index.ts
- model-task-provider.tsx
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

## Communities (74 total, 11 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (71): DataTableSkeleton(), Field(), KnowledgeCardsSkeleton(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation() (+63 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.06
Nodes (58): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve() (+50 more)

### Community 2 - "data-routes.test.ts"
Cohesion: 0.16
Nodes (21): applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks(), ExtractedFileContent, extractExperienceHeadingFallbacks(), extractFileContent() (+13 more)

### Community 3 - "applications/page.tsx"
Cohesion: 0.15
Nodes (21): ApplicationsPage(), formatUpdateTime(), readApplicationBoard(), JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), toneStyles (+13 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, lucide-react, next, nuqs, @radicar/validators, react-hook-form, @tanstack/react-query (+9 more)

### Community 6 - "resumes/page.tsx"
Cohesion: 0.09
Nodes (40): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+32 more)

### Community 7 - "loading-skeletons.tsx"
Cohesion: 0.13
Nodes (11): ApplicationsSkeleton(), DashboardSkeleton(), GenerationShimmer(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+3 more)

### Community 8 - "BillingService"
Cohesion: 0.16
Nodes (4): addDays(), addLimit(), BillingService, orderNumber()

### Community 9 - "app.ts"
Cohesion: 0.20
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "stores.ts"
Cohesion: 0.08
Nodes (32): FeedbackSkeleton(), InterviewSkeleton(), Job, JobTone, Feedback, icons, PracticeCard, SessionData (+24 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (20): AuthRouteOptions, AuthServicePort, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, requestOtpSchema (+12 more)

### Community 13 - "useAuth"
Cohesion: 0.32
Nodes (9): AuthGate(), useAuth(), useLogout(), AdminPage(), collectionLabels, formatNumber(), SettingsPage(), useAdminBillingStats() (+1 more)

### Community 14 - "toast.tsx"
Cohesion: 0.16
Nodes (13): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, ApiError, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage() (+5 more)

### Community 15 - "jobs/page.tsx"
Cohesion: 0.08
Nodes (39): JalaliDatePicker(), JalaliDatePickerProps, weekDays, categoryOptions, JobsPage(), applicationStore, addCalendarDays(), atNoon() (+31 more)

### Community 16 - "AuthService"
Cohesion: 0.15
Nodes (7): AuthService, normalizePhone(), toAuthUser(), tokenHash(), AuthUser, UserRole, UserStatus

### Community 17 - "users/page.tsx"
Cohesion: 0.09
Nodes (33): UserRole, Payment, paymentFilterParsers, Response, statusOptions, collectionOptions, recordFilterParsers, RecordRow (+25 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "apiRequest"
Cohesion: 0.19
Nodes (23): AccountPage(), MembershipsAdminPage(), AdminOrdersPage(), orderFilterParsers, Response, statusOptions, AdminPaymentsPage(), AdminRecordsPage() (+15 more)

### Community 21 - "tasks"
Cohesion: 0.10
Nodes (21): apiProxyOrigin, monorepoRoot, nextConfig, ^build, .next/**, dependsOn, outputs, cache (+13 more)

### Community 22 - "build-app.ts"
Cohesion: 0.10
Nodes (24): buildApp(), BuildAppOptions, handleAuthError(), registerAuthRoutes(), requirePermission(), adjustCreditSchema, adminListSchema, callbackSchema (+16 more)

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
Cohesion: 0.26
Nodes (9): PaginationItem, paginationItems(), TablePagination(), AuthResponse, useTablePageSize(), positivePageParser, TablePageSize, tablePageSizes (+1 more)

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
Nodes (25): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, UsageResource, usageResourceLabels, createDatabase(), Database (+17 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.08
Nodes (18): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+10 more)

### Community 41 - "match/page.tsx"
Cohesion: 0.20
Nodes (12): CircularProgress(), CircularProgressProps, getJobTextDirection(), ImportJobResponse, isMatchAnalysisTaskContext(), JobSourceMode, MatchAnalysisTaskContext, MatchPage() (+4 more)

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
Cohesion: 0.24
Nodes (17): allowedHostSuffixes, decodeEntities(), extractAttribute(), extractCompanyLogoUrl(), extractJobText(), extractMetaContent(), getLinkedInJobId(), isAllowedHost() (+9 more)

### Community 48 - "account/page.tsx"
Cohesion: 0.11
Nodes (19): authQueryKey, CurrentUser, localizedNumericString, LoginPage(), otpSchema, OtpValues, phoneSchema, PhoneValues (+11 more)

### Community 49 - "useToast"
Cohesion: 0.10
Nodes (28): useToast(), AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number(), operationLabels, percent() (+20 more)

### Community 50 - "dashboard/page.tsx"
Cohesion: 0.19
Nodes (12): barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels, statIcons, toneClasses (+4 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "ai/routes.ts"
Cohesion: 0.07
Nodes (60): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, aiSettingsSchema (+52 more)

### Community 54 - "memberships/page.tsx"
Cohesion: 0.14
Nodes (15): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, membershipFilterParsers (+7 more)

### Community 55 - "knowledge-base/page.tsx"
Cohesion: 0.05
Nodes (90): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), FieldProps, ImportResult (+82 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "marketing-sections.tsx"
Cohesion: 0.14
Nodes (16): DemoSection(), faqs, FaqSection(), features, FeaturesSection(), FinalCta(), HeroSection(), MarketingFooter() (+8 more)

### Community 67 - "panel-shell.tsx"
Cohesion: 0.20
Nodes (14): useModelTasks(), adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems, pageTitles (+6 more)

### Community 69 - "field-direction.ts"
Cohesion: 0.32
Nodes (11): ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField(), refreshFieldDirections() (+3 more)

### Community 74 - "model-task-provider.tsx"
Cohesion: 0.20
Nodes (10): createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider() (+2 more)

### Community 75 - "استقرار Production رادیکار"
Cohesion: 0.25
Nodes (7): DeepSeek محلی, آماده‌سازی, اجرا, استقرار Production رادیکار, انتشار نسخه جدید, پشتیبان‌گیری PostgreSQL, پیش‌نیاز

## Knowledge Gaps
- **499 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+494 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `resume-document.tsx` to `applications/page.tsx`, `panel-shell.tsx`, `resumes/page.tsx`, `loading-skeletons.tsx`, `match/page.tsx`, `stores.ts`, `toast.tsx`, `job-import.ts`, `jobs/page.tsx`, `users/page.tsx`, `knowledge-base/page.tsx`, `table-page-size.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `DataCollection` connect `DataCollection` to `data-routes.test.ts`, `stores.ts`, `billing/service.ts`, `knowledge-base/page.tsx`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `panel-shell.tsx`, `resumes/page.tsx`, `DataCollection`, `match/page.tsx`, `stores.ts`, `useAuth`, `toast.tsx`, `account/page.tsx`, `users/page.tsx`, `dashboard/page.tsx`, `useToast`, `memberships/page.tsx`, `knowledge-base/page.tsx`, `table-page-size.ts`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _499 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0872072072072072 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06386946386946386 - nodes in this community are weakly interconnected._