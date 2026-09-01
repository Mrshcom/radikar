# Graph Report - resumeMaker  (2026-09-01)

## Corpus Check
- 145 files · ~220,968 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1319 nodes · 2908 edges · 71 communities (62 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20f482f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- ai/routes.ts
- panel-shell.tsx
- scripts
- dependencies
- resumes/page.tsx
- loading-skeletons.tsx
- BillingService
- main.ts
- dependencies
- stores.ts
- auth/routes.ts
- field-direction.ts
- knowledge-base/page.tsx
- api-client.ts
- AuthService
- admin/orders/page.tsx
- devDependencies
- billing.ts
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- interview/page.tsx
- react-dom
- react-hook-form
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
- dashboard/page.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- Database
- memberships/page.tsx
- admin-stats.ts
- match/page.tsx
- compilerOptions
- data-routes.test.ts
- @tanstack/react-query
- zod
- model-task-provider.tsx
- job-url.ts
- model-usage/page.tsx
- job-import.ts
- AGENTS.md
- job-description-validation.ts
- apiRequest
- eslint.config.mjs
- app.ts
- toast.tsx
- postcss.config.mjs
- config/src/index.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 78 edges
2. `apiRequest()` - 40 edges
3. `KnowledgeBasePage()` - 36 edges
4. `DataCollection` - 35 edges
5. `normalizeImportedText()` - 32 edges
6. `BillingService` - 29 edges
7. `createRecordId()` - 27 edges
8. `getResumeEducations()` - 26 edges
9. `useAuth()` - 25 edges
10. `useToast()` - 25 edges

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

## Communities (71 total, 9 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (69): DataTableSkeleton(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume() (+61 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.06
Nodes (64): emptyResumeData, experienceWeight(), OneColumnPageDraft, paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeEducation, ResumeExperience (+56 more)

### Community 2 - "ai/routes.ts"
Cohesion: 0.08
Nodes (52): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, Analysis (+44 more)

### Community 3 - "panel-shell.tsx"
Cohesion: 0.19
Nodes (15): adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems, pageTitles, PanelShellContent() (+7 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, lucide-react, next, @radicar/shared-types, @radicar/validators (+9 more)

### Community 6 - "resumes/page.tsx"
Cohesion: 0.10
Nodes (35): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+27 more)

### Community 7 - "loading-skeletons.tsx"
Cohesion: 0.14
Nodes (11): DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+3 more)

### Community 8 - "BillingService"
Cohesion: 0.22
Nodes (3): addDays(), addLimit(), BillingService

### Community 9 - "main.ts"
Cohesion: 0.22
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "stores.ts"
Cohesion: 0.11
Nodes (23): Job, JobTone, BaseRecord, DashboardSnapshotRecord, InterviewFeedbackRecord, InterviewSessionRecord, KnowledgeExperience, KnowledgeLanguage (+15 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (21): AuthRouteOptions, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, registerAuthRoutes(), requestOtpSchema (+13 more)

### Community 13 - "field-direction.ts"
Cohesion: 0.32
Nodes (11): ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField(), refreshFieldDirections() (+3 more)

### Community 14 - "knowledge-base/page.tsx"
Cohesion: 0.05
Nodes (89): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+81 more)

### Community 15 - "api-client.ts"
Cohesion: 0.11
Nodes (18): AuthGate(), authQueryKey, CurrentUser, useLogout(), localizedNumericString, otpSchema, OtpValues, phoneSchema (+10 more)

### Community 16 - "AuthService"
Cohesion: 0.16
Nodes (7): AuthService, normalizePhone(), toAuthUser(), tokenHash(), AuthUser, UserRole, UserStatus

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.11
Nodes (26): UserRole, Response, statusOptions, Payment, Response, statusOptions, collectionOptions, RecordRow (+18 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "billing.ts"
Cohesion: 0.12
Nodes (23): schema, Values, formatDate(), MembershipSummary(), MembershipSummarySkeleton(), remainingDays(), usageItems, UsageKey (+15 more)

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

### Community 26 - "interview/page.tsx"
Cohesion: 0.11
Nodes (25): useToast(), ApplicationsPage(), formatUpdateTime(), pipelineStages, JobCard(), JobCardData, toneStyles, ApplicationsSkeleton() (+17 more)

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
Cohesion: 0.17
Nodes (18): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, orderNumber(), UsageResource, usageResourceLabels, authSessions (+10 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.08
Nodes (18): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+10 more)

### Community 41 - "dashboard/page.tsx"
Cohesion: 0.19
Nodes (12): CircularProgress(), CircularProgressProps, useModelTasks(), barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate() (+4 more)

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

### Community 47 - "Database"
Cohesion: 0.20
Nodes (7): createDatabase(), Database, database, migrationsFolder, database, now, timestamp

### Community 48 - "memberships/page.tsx"
Cohesion: 0.16
Nodes (14): LoginPage(), cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema (+6 more)

### Community 49 - "admin-stats.ts"
Cohesion: 0.18
Nodes (13): AdminPage(), collectionLabels, formatNumber(), AdminBillingStats, adminBillingStatsQueryKey, adminEventsQueryKey, adminModelUsageQueryKey, AdminModelUsageStats (+5 more)

### Community 50 - "match/page.tsx"
Cohesion: 0.15
Nodes (15): getJobTextDirection(), ImportJobResponse, isMatchAnalysisTaskContext(), JobSourceMode, MatchAnalysisTaskContext, MatchPage(), ResumeOption, scoreWidth() (+7 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "data-routes.test.ts"
Cohesion: 0.16
Nodes (22): AuthServicePort, applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks(), ExtractedFileContent, extractExperienceHeadingFallbacks() (+14 more)

### Community 55 - "model-task-provider.tsx"
Cohesion: 0.20
Nodes (10): createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider() (+2 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "model-usage/page.tsx"
Cohesion: 0.33
Nodes (10): AdminModelUsagePage(), dateTime(), downloadCsv(), number(), operationLabels, percent(), RecentModelRequest, UsageTable() (+2 more)

### Community 58 - "job-import.ts"
Cohesion: 0.26
Nodes (15): allowedHostSuffixes, decodeEntities(), extractAttribute(), extractCompanyLogoUrl(), extractJobText(), extractMetaContent(), getLinkedInJobId(), isAllowedHost() (+7 more)

### Community 63 - "apiRequest"
Cohesion: 0.45
Nodes (12): useAuth(), AccountPage(), MembershipsAdminPage(), AdminOrdersPage(), AdminPaymentsPage(), AdminRecordsPage(), AdminUsersPage(), apiRequest() (+4 more)

### Community 66 - "app.ts"
Cohesion: 0.39
Nodes (7): buildApp(), BuildAppOptions, handleAuthError(), handleBillingError(), registerHealthRoutes(), registerImportRoutes(), normalizeDigitsDeep()

### Community 67 - "toast.tsx"
Cohesion: 0.24
Nodes (9): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage(), PLAN_UPGRADE_REQUIRED_EVENT (+1 more)

## Knowledge Gaps
- **455 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `resume-document.tsx` to `panel-shell.tsx`, `toast.tsx`, `resumes/page.tsx`, `loading-skeletons.tsx`, `knowledge-base/page.tsx`, `api-client.ts`, `admin/orders/page.tsx`, `match/page.tsx`, `interview/page.tsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `DataCollection` connect `DataCollection` to `stores.ts`, `data-routes.test.ts`, `billing/service.ts`, `knowledge-base/page.tsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `panel-shell.tsx`, `resumes/page.tsx`, `DataCollection`, `dashboard/page.tsx`, `stores.ts`, `knowledge-base/page.tsx`, `api-client.ts`, `memberships/page.tsx`, `admin/orders/page.tsx`, `match/page.tsx`, `billing.ts`, `admin-stats.ts`, `model-usage/page.tsx`, `interview/page.tsx`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.091324200913242 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0593607305936073 - nodes in this community are weakly interconnected._