# Graph Report - resumeMaker  (2026-09-05)

## Corpus Check
- 164 files · ~226,280 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1415 nodes · 3153 edges · 79 communities (69 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c0339cb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- data-routes.test.ts
- applications/page.tsx
- scripts
- dependencies
- match/page.tsx
- knowledge-base/page.tsx
- BillingService
- main.ts
- dependencies
- stores.ts
- auth/routes.ts
- validators/src/index.ts
- toast.tsx
- useAuth
- AuthService
- admin/orders/page.tsx
- devDependencies
- apiRequest
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- panel-shell.tsx
- react-dom
- @fontsource-variable/vazirmatn
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
- job-import.ts
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- loading-skeletons.tsx
- memberships/page.tsx
- admin-stats.ts
- dashboard/page.tsx
- compilerOptions
- ai/routes.ts
- formatPersianNumber
- @hookform/resolvers
- normalizeImportedText
- job-url.ts
- Database
- jalali-date-picker.tsx
- AGENTS.md
- job-description-validation.ts
- table-page-size.ts
- eslint.config.mjs
- job-application-filter.ts
- app.ts
- resume-import.test.mjs
- field-direction.ts
- postcss.config.mjs
- config/src/index.ts
- @radicar/shared-types
- react
- parseResumeSkills
- job-category.ts
- match-analysis.ts
- model-task-provider.tsx

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
- `buildApp()` --calls--> `normalizeDigitsDeep()`  [EXTRACTED]
  apps/api/src/app.ts → packages/validators/src/index.ts
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

## Communities (79 total, 10 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (69): DataTableSkeleton(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume() (+61 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.06
Nodes (58): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve() (+50 more)

### Community 2 - "data-routes.test.ts"
Cohesion: 0.14
Nodes (24): isStandaloneTechnicalToken(), serializeResumeSkills(), AuthServicePort, applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks() (+16 more)

### Community 3 - "applications/page.tsx"
Cohesion: 0.22
Nodes (13): ApplicationsPage(), formatUpdateTime(), readApplicationBoard(), DeleteConfirmModal(), Modal(), SectionTitle(), applicationPipelineStages, createSavedApplicationForJob() (+5 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, lucide-react, next, nuqs, @radicar/validators, react-hook-form, @tanstack/react-query (+9 more)

### Community 6 - "match/page.tsx"
Cohesion: 0.08
Nodes (48): getJobTextDirection(), ImportJobResponse, isMatchAnalysisTaskContext(), JobSourceMode, MatchAnalysisTaskContext, MatchPage(), ResumeOption, scoreWidth() (+40 more)

### Community 7 - "knowledge-base/page.tsx"
Cohesion: 0.11
Nodes (39): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+31 more)

### Community 8 - "BillingService"
Cohesion: 0.18
Nodes (4): addDays(), addLimit(), BillingService, ModelUsageEvent

### Community 9 - "main.ts"
Cohesion: 0.22
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "stores.ts"
Cohesion: 0.08
Nodes (33): FeedbackSkeleton(), InterviewSkeleton(), Feedback, icons, PracticeCard, SessionData, ResumeProject, AppProfileRecord (+25 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (20): AuthRouteOptions, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, registerAuthRoutes(), requestOtpSchema (+12 more)

### Community 13 - "validators/src/index.ts"
Cohesion: 0.09
Nodes (29): CollectionParams, RecordParams, ApiError, dataCollections, DataRecord, aliasedObjectInput(), baseRecordSchema, boundedImportedArray() (+21 more)

### Community 14 - "toast.tsx"
Cohesion: 0.24
Nodes (9): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage(), PLAN_UPGRADE_REQUIRED_EVENT (+1 more)

### Community 15 - "useAuth"
Cohesion: 0.12
Nodes (20): AuthGate(), authQueryKey, CurrentUser, useAuth(), useLogout(), localizedNumericString, otpSchema, OtpValues (+12 more)

### Community 16 - "AuthService"
Cohesion: 0.16
Nodes (7): AuthService, normalizePhone(), toAuthUser(), tokenHash(), AuthUser, UserRole, UserStatus

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.09
Nodes (43): UserRole, AdminOrdersPage(), orderFilterParsers, Response, statusOptions, AdminPaymentsPage(), Payment, paymentFilterParsers (+35 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "apiRequest"
Cohesion: 0.15
Nodes (19): AccountPage(), MembershipsAdminPage(), UpgradePage(), ApiError, apiRequest(), notifyPlanUpgradeRequired(), apiUrl(), AdminMembershipDetails (+11 more)

### Community 21 - "tasks"
Cohesion: 0.11
Nodes (19): nextConfig, ^build, .next/**, dependsOn, outputs, cache, dependsOn, persistent (+11 more)

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

### Community 26 - "panel-shell.tsx"
Cohesion: 0.27
Nodes (12): adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems, pageTitles, PanelShellContent() (+4 more)

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
Cohesion: 0.16
Nodes (19): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, orderNumber(), UsageCosts, UsageResource, usageResourceLabels (+11 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.10
Nodes (12): PostgresRecordRepository, RecordRepository, parseCollection(), registerDataRoutes(), MemoryRecordRepository, metadata, Providers(), DataRepository (+4 more)

### Community 41 - "job-import.ts"
Cohesion: 0.26
Nodes (15): allowedHostSuffixes, decodeEntities(), extractAttribute(), extractCompanyLogoUrl(), extractJobText(), extractMetaContent(), getLinkedInJobId(), isAllowedHost() (+7 more)

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

### Community 47 - "loading-skeletons.tsx"
Cohesion: 0.14
Nodes (11): ApplicationsSkeleton(), DashboardSkeleton(), GenerationShimmer(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+3 more)

### Community 48 - "memberships/page.tsx"
Cohesion: 0.10
Nodes (23): LoginPage(), cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema (+15 more)

### Community 49 - "admin-stats.ts"
Cohesion: 0.10
Nodes (27): AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number(), operationLabels, percent(), RecentModelRequest (+19 more)

### Community 50 - "dashboard/page.tsx"
Cohesion: 0.10
Nodes (24): useToast(), CircularProgress(), CircularProgressProps, useModelTasks(), barHeightClass(), DashboardPage(), DashboardState, dashboardTitle() (+16 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "ai/routes.ts"
Cohesion: 0.08
Nodes (55): asObject(), hasResumeContent(), JsonObject, validateJobDescription(), ValidationResult, aiSettingsSchema, Analysis, bodyOf() (+47 more)

### Community 53 - "formatPersianNumber"
Cohesion: 0.21
Nodes (11): JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), JobLogo(), toneStyles, Job, JobTone (+3 more)

### Community 55 - "normalizeImportedText"
Cohesion: 0.37
Nodes (14): canonicalDates(), canonicalExperience(), canonicalId(), canonicalLanguage(), canonicalProject(), canonicalQualification(), normalizeDataRecordForStorage(), normalizeImportedText() (+6 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "Database"
Cohesion: 0.18
Nodes (7): createDatabase(), Database, database, migrationsFolder, database, now, timestamp

### Community 58 - "jalali-date-picker.tsx"
Cohesion: 0.27
Nodes (15): JalaliDatePicker(), JalaliDatePickerProps, weekDays, addCalendarDays(), atNoon(), formatPersianCalendarDate(), formatPersianCalendarMonth(), getPersianDateParts() (+7 more)

### Community 63 - "table-page-size.ts"
Cohesion: 0.26
Nodes (9): PaginationItem, paginationItems(), TablePagination(), AuthResponse, useTablePageSize(), positivePageParser, TablePageSize, tablePageSizes (+1 more)

### Community 66 - "job-application-filter.ts"
Cohesion: 0.27
Nodes (9): DatedApplication, hasJobActivityInDateRange(), isTimeInRange(), JobIdentity, normalizedIdentity(), normalizedPart(), rangeBoundary(), applications (+1 more)

### Community 67 - "app.ts"
Cohesion: 0.43
Nodes (6): buildApp(), BuildAppOptions, handleAuthError(), handleBillingError(), registerHealthRoutes(), registerImportRoutes()

### Community 68 - "resume-import.test.mjs"
Cohesion: 0.39
Nodes (6): KnowledgeProfileRecord, calculateKnowledgeCompletion(), isSeededKnowledgeSampleProject(), KnowledgeCompletionData, normalizeImportedResumeData(), normalizeResumeImportPayload()

### Community 69 - "field-direction.ts"
Cohesion: 0.32
Nodes (11): ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField(), refreshFieldDirections() (+3 more)

### Community 75 - "parseResumeSkills"
Cohesion: 0.48
Nodes (5): MultiSkillAutocomplete(), parseSkills(), isStandaloneTechnicalToken(), parseResumeSkills(), serializeResumeSkills()

### Community 76 - "job-category.ts"
Cohesion: 0.48
Nodes (5): ClassifiableJob, inferJobCategories(), JobCategory, matchesJobCategory(), normalized()

### Community 77 - "match-analysis.ts"
Cohesion: 0.43
Nodes (6): boundedScore(), defaultBreakdownLabels, MatchAnalysis, normalizeMatchAnalysisInput(), objectOf(), normalizeImportedTextArray()

### Community 78 - "model-task-provider.tsx"
Cohesion: 0.20
Nodes (10): createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider() (+2 more)

## Knowledge Gaps
- **484 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+479 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `resume-document.tsx` to `panel-shell.tsx`, `match/page.tsx`, `knowledge-base/page.tsx`, `stores.ts`, `parseResumeSkills`, `toast.tsx`, `loading-skeletons.tsx`, `admin/orders/page.tsx`, `formatPersianNumber`, `jalali-date-picker.tsx`, `table-page-size.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `DataCollection` connect `DataCollection` to `data-routes.test.ts`, `stores.ts`, `validators/src/index.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `match/page.tsx`, `knowledge-base/page.tsx`, `DataCollection`, `stores.ts`, `useAuth`, `memberships/page.tsx`, `admin/orders/page.tsx`, `dashboard/page.tsx`, `admin-stats.ts`, `panel-shell.tsx`, `table-page-size.ts`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _484 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.091324200913242 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06386946386946386 - nodes in this community are weakly interconnected._