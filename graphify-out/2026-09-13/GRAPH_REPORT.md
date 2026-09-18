# Graph Report - radikar  (2026-09-13)

## Corpus Check
- 179 files · ~230,234 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1490 nodes · 3266 edges · 84 communities (72 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6528c7e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
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
- normalizeImportedText
- auth/routes.ts
- apiRequest
- toast.tsx
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
- TablePagination
- react-dom
- stores.ts
- compilerOptions
- رادیکار
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
- model-usage/page.tsx
- compilerOptions
- ai/routes.ts
- react
- memberships/page.tsx
- validators/src/index.ts
- job-url.ts
- marketing-sections.tsx
- @fontsource-variable/vazirmatn
- AGENTS.md
- job-description-validation.ts
- @radikar/shared-types
- panel-shell.tsx
- eslint.config.mjs
- api/[...path]/route.ts
- build-app.ts
- @hookform/resolvers
- field-direction.ts
- postcss.config.mjs
- config/src/index.ts
- jalali-date-picker.tsx
- parseResumeSkills
- استقرار Production رادیکار
- Database
- backup-postgres.sh
- vercel.json
- web/AGENTS.md
- job-application-filter.ts
- resume-import.test.mjs
- api-client.ts
- match/page.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 89 edges
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

## Communities (84 total, 12 thin omitted)

### Community 0 - "cn"
Cohesion: 0.09
Nodes (72): DataTableSkeleton(), Field(), KnowledgeCardsSkeleton(), KnowledgeSectionTabs(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects() (+64 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.06
Nodes (58): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve() (+50 more)

### Community 2 - "data-routes.test.ts"
Cohesion: 0.14
Nodes (24): isStandaloneTechnicalToken(), serializeResumeSkills(), AuthServicePort, applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks() (+16 more)

### Community 3 - "applications/page.tsx"
Cohesion: 0.15
Nodes (21): ApplicationsPage(), formatUpdateTime(), readApplicationBoard(), JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), JobLogo() (+13 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, lucide-react, next, nuqs, @radikar/validators, react-hook-form, @tanstack/react-query (+9 more)

### Community 6 - "resumes/page.tsx"
Cohesion: 0.10
Nodes (40): useToast(), categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab (+32 more)

### Community 7 - "loading-skeletons.tsx"
Cohesion: 0.12
Nodes (13): ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton() (+5 more)

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
Cohesion: 0.35
Nodes (15): canonicalDates(), canonicalExperience(), canonicalId(), canonicalLanguage(), canonicalProject(), canonicalQualification(), normalizeDataRecordForStorage(), normalizeImportedBoolean() (+7 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (19): AuthRouteOptions, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, requestOtpSchema, updatePreferencesSchema (+11 more)

### Community 13 - "apiRequest"
Cohesion: 0.23
Nodes (19): useAuth(), AccountPage(), MembershipsAdminPage(), AdminOrdersPage(), AdminPage(), collectionLabels, formatNumber(), AdminPaymentsPage() (+11 more)

### Community 14 - "toast.tsx"
Cohesion: 0.22
Nodes (9): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage(), PLAN_UPGRADE_REQUIRED_EVENT (+1 more)

### Community 15 - "dashboard/page.tsx"
Cohesion: 0.11
Nodes (21): useModelTasks(), barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels, statIcons (+13 more)

### Community 16 - "AuthService"
Cohesion: 0.16
Nodes (7): AuthService, normalizePhone(), toAuthUser(), tokenHash(), AuthUser, UserRole, UserStatus

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.09
Nodes (35): UserRole, orderFilterParsers, Response, statusOptions, Payment, paymentFilterParsers, Response, statusOptions (+27 more)

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
Nodes (15): adjustCreditSchema, adminListSchema, callbackSchema, cancelSchema, createOrderSchema, extendSchema, grantPlanSchema, membershipListSchema (+7 more)

### Community 23 - "compilerOptions"
Cohesion: 0.06
Nodes (30): compilerOptions, allowImportingTsExtensions, allowJs, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 24 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 25 - "web/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 26 - "TablePagination"
Cohesion: 0.24
Nodes (8): PaginationItem, paginationItems(), TablePagination(), positivePageParser, TablePageSize, tablePageSizes, tablePaginationParsers, modelUsageDaysParser

### Community 28 - "stores.ts"
Cohesion: 0.08
Nodes (34): SectionTitle(), Job, JobTone, Feedback, icons, PracticeCard, SessionData, AppProfileRecord (+26 more)

### Community 29 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 30 - "رادیکار"
Cohesion: 0.05
Nodes (35): تنظیم Web, قرارداد HTTP, لایه داده Web, API سازگار با OpenAI, dependencyها نامعتبر یا ناقص‌اند, endpoint `/ready` کد 503 می‌دهد, Proxy محلی DeepSeek, Web پیام اتصال به Node API می‌دهد (+27 more)

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
Nodes (19): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, UsageCosts, UsageResource, usageResourceLabels, aiSettings (+11 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.10
Nodes (12): PostgresRecordRepository, RecordRepository, parseCollection(), registerDataRoutes(), MemoryRecordRepository, metadata, Providers(), DataRepository (+4 more)

### Community 41 - "knowledge-base/page.tsx"
Cohesion: 0.13
Nodes (35): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), FieldProps, ImportResult (+27 more)

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

### Community 49 - "model-usage/page.tsx"
Cohesion: 0.10
Nodes (27): AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number(), operationLabels, percent(), RecentModelRequest (+19 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "ai/routes.ts"
Cohesion: 0.07
Nodes (57): asObject(), hasResumeContent(), JsonObject, validateJobDescription(), ValidationResult, aiSettingsSchema, Analysis, bodyOf() (+49 more)

### Community 54 - "memberships/page.tsx"
Cohesion: 0.10
Nodes (30): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, membershipFilterParsers (+22 more)

### Community 55 - "validators/src/index.ts"
Cohesion: 0.09
Nodes (29): CollectionParams, RecordParams, ApiError, dataCollections, DataRecord, aliasedObjectInput(), baseRecordSchema, boundedImportedArray() (+21 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "marketing-sections.tsx"
Cohesion: 0.11
Nodes (24): AnimatedNumber(), BorderBeam(), DotPattern(), MagicCard(), Marquee(), Meteors(), ShimmerButton(), ShineBorder() (+16 more)

### Community 64 - "panel-shell.tsx"
Cohesion: 0.27
Nodes (12): adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems, pageTitles, PanelShellContent() (+4 more)

### Community 66 - "api/[...path]/route.ts"
Cohesion: 0.13
Nodes (16): DELETE, GET, OPTIONS, PATCH, POST, proxy(), PUT, DELETE (+8 more)

### Community 67 - "build-app.ts"
Cohesion: 0.30
Nodes (10): buildApp(), BuildAppOptions, handleAuthError(), registerAuthRoutes(), requirePermission(), handleBillingError(), registerBillingRoutes(), registerHealthRoutes() (+2 more)

### Community 69 - "field-direction.ts"
Cohesion: 0.32
Nodes (11): ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField(), refreshFieldDirections() (+3 more)

### Community 73 - "jalali-date-picker.tsx"
Cohesion: 0.17
Nodes (20): JalaliDatePicker(), JalaliDatePickerProps, weekDays, addCalendarDays(), atNoon(), formatPersianCalendarDate(), formatPersianCalendarMonth(), getPersianDateParts() (+12 more)

### Community 74 - "parseResumeSkills"
Cohesion: 0.48
Nodes (5): MultiSkillAutocomplete(), parseSkills(), isStandaloneTechnicalToken(), parseResumeSkills(), serializeResumeSkills()

### Community 75 - "استقرار Production رادیکار"
Cohesion: 0.25
Nodes (7): DeepSeek محلی, آماده‌سازی, اجرا, استقرار Production رادیکار, انتشار نسخه جدید, پشتیبان‌گیری PostgreSQL, پیش‌نیاز

### Community 76 - "Database"
Cohesion: 0.18
Nodes (7): createDatabase(), Database, database, migrationsFolder, database, now, timestamp

### Community 79 - "vercel.json"
Cohesion: 0.50
Nodes (3): regions, $schema, fra1

### Community 82 - "job-application-filter.ts"
Cohesion: 0.27
Nodes (9): DatedApplication, hasJobActivityInDateRange(), isTimeInRange(), JobIdentity, normalizedIdentity(), normalizedPart(), rangeBoundary(), applications (+1 more)

### Community 83 - "resume-import.test.mjs"
Cohesion: 0.48
Nodes (5): calculateKnowledgeCompletion(), isSeededKnowledgeSampleProject(), KnowledgeCompletionData, normalizeImportedResumeData(), normalizeResumeImportPayload()

### Community 84 - "api-client.ts"
Cohesion: 0.09
Nodes (21): AuthGate(), authQueryKey, CurrentUser, useLogout(), localizedNumericString, LoginPage(), otpSchema, OtpValues (+13 more)

### Community 85 - "match/page.tsx"
Cohesion: 0.10
Nodes (22): CircularProgress(), CircularProgressProps, createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue (+14 more)

## Knowledge Gaps
- **516 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+511 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `panel-shell.tsx`, `applications/page.tsx`, `resumes/page.tsx`, `loading-skeletons.tsx`, `jalali-date-picker.tsx`, `knowledge-base/page.tsx`, `parseResumeSkills`, `toast.tsx`, `admin/orders/page.tsx`, `match/page.tsx`, `marketing-sections.tsx`, `TablePagination`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `panel-shell.tsx`, `resumes/page.tsx`, `DataCollection`, `knowledge-base/page.tsx`, `dashboard/page.tsx`, `admin/orders/page.tsx`, `model-usage/page.tsx`, `api-client.ts`, `match/page.tsx`, `memberships/page.tsx`, `stores.ts`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `BillingService` connect `BillingService` to `data-routes.test.ts`, `build-app.ts`, `billing/service.ts`, `ZarinpalClient`, `app.ts`, `Database`, `ai/routes.ts`, `billing/routes.ts`, `validators/src/index.ts`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.08526315789473685 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06386946386946386 - nodes in this community are weakly interconnected._