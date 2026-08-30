# Graph Report - resumeMaker  (2026-08-30)

## Corpus Check
- 134 files · ~206,798 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1185 nodes · 2466 edges · 68 communities (57 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.62)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2815b7e8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- ai/routes.ts
- knowledge-base/page.tsx
- scripts
- dependencies
- data/routes.ts
- parseResumeSkills
- BillingService
- main.ts
- dependencies
- stores.ts
- auth/routes.ts
- dashboard/page.tsx
- useToast
- account/page.tsx
- auth/service.ts
- payments/page.tsx
- devDependencies
- memberships/page.tsx
- repository.ts
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- auth.tsx
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
- resume-builder.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- apiRequest
- interview/page.tsx
- admin-stats.ts
- field-direction.ts
- compilerOptions
- loading-skeletons.tsx
- lucide-react
- zod
- resumes/page.tsx
- job-url.ts
- admin/orders/page.tsx
- app.ts
- AGENTS.md
- Database
- job-description-validation.ts
- orders
- eslint.config.mjs
- postcss.config.mjs
- config/src/index.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 78 edges
2. `DataCollection` - 34 edges
3. `apiRequest()` - 33 edges
4. `KnowledgeBasePage()` - 31 edges
5. `createRecordId()` - 26 edges
6. `BillingService` - 25 edges
7. `getResumeEducations()` - 25 edges
8. `useToast()` - 25 edges
9. `getDefaultResumeColor()` - 23 edges
10. `useAuth()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `normalizePhone()` --calls--> `normalizeDigits()`  [EXTRACTED]
  apps/api/src/modules/auth/service.ts → packages/validators/src/index.ts
- `localizedNumber()` --calls--> `normalizeDigits()`  [EXTRACTED]
  apps/web/app/(panel)/admin/memberships/page.tsx → packages/validators/src/index.ts
- `buildApp()` --calls--> `normalizeDigitsDeep()`  [EXTRACTED]
  apps/api/src/app.ts → packages/validators/src/index.ts
- `registerAiRoutes()` --calls--> `getAnalyzeConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts
- `registerAiRoutes()` --calls--> `getWriteConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts

## Import Cycles
- None detected.

## Communities (68 total, 11 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (68): getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume(), BannerModernResume() (+60 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.07
Nodes (50): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeDocument(), getFlowContentBottom(), getPageFlows(), getRenderedPageLayout() (+42 more)

### Community 2 - "ai/routes.ts"
Cohesion: 0.07
Nodes (54): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, Analysis (+46 more)

### Community 3 - "knowledge-base/page.tsx"
Cohesion: 0.11
Nodes (36): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+28 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, next, @radicar/shared-types, @radicar/validators, react (+9 more)

### Community 6 - "data/routes.ts"
Cohesion: 0.18
Nodes (10): RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), ApiError, dataCollections, DataRecord (+2 more)

### Community 7 - "parseResumeSkills"
Cohesion: 0.80
Nodes (3): isStandaloneTechnicalToken(), parseResumeSkills(), serializeResumeSkills()

### Community 8 - "BillingService"
Cohesion: 0.22
Nodes (4): addDays(), addLimit(), BillingService, orderNumber()

### Community 9 - "main.ts"
Cohesion: 0.22
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "stores.ts"
Cohesion: 0.09
Nodes (34): adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems, pageTitles, PanelShellContent() (+26 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.11
Nodes (21): AuthRouteOptions, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, registerAuthRoutes(), requestOtpSchema (+13 more)

### Community 13 - "dashboard/page.tsx"
Cohesion: 0.14
Nodes (15): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+7 more)

### Community 14 - "useToast"
Cohesion: 0.12
Nodes (22): ToastContext, ToastNotifier, ToastState, ToastVariant, useToast(), ApplicationsPage(), formatUpdateTime(), pipelineStages (+14 more)

### Community 15 - "account/page.tsx"
Cohesion: 0.22
Nodes (8): AccountPage(), formatDate(), remainingDays(), schema, usageItems, UsageKey, Values, Membership

### Community 16 - "auth/service.ts"
Cohesion: 0.14
Nodes (10): AuthError, AuthService, AuthServiceOptions, normalizePhone(), RequestOtpResult, toAuthUser(), tokenHash(), VerifyOtpResult (+2 more)

### Community 17 - "payments/page.tsx"
Cohesion: 0.11
Nodes (24): Payment, Response, statusOptions, collectionOptions, RecordRow, RecordsResponse, DataTable(), DataTableColumn (+16 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "memberships/page.tsx"
Cohesion: 0.20
Nodes (8): cancelSchema, creditSchema, extendSchema, grantSchema, MembershipUser, PendingMembershipAction, Response, QueryParameter

### Community 20 - "repository.ts"
Cohesion: 0.23
Nodes (6): ToastProvider(), metadata, Providers(), HttpDataRepository, createQueryClient(), getBrowserQueryClient()

### Community 21 - "tasks"
Cohesion: 0.11
Nodes (19): nextConfig, ^build, .next/**, dependsOn, outputs, cache, dependsOn, persistent (+11 more)

### Community 22 - "billing/routes.ts"
Cohesion: 0.13
Nodes (14): adjustCreditSchema, adminListSchema, callbackSchema, cancelSchema, createOrderSchema, extendSchema, grantPlanSchema, membershipListSchema (+6 more)

### Community 23 - "compilerOptions"
Cohesion: 0.06
Nodes (30): compilerOptions, allowImportingTsExtensions, allowJs, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 24 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 25 - "web/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 26 - "auth.tsx"
Cohesion: 0.13
Nodes (15): AuthGate(), authQueryKey, CurrentUser, useLogout(), localizedNumericString, LoginPage(), otpSchema, OtpValues (+7 more)

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
Cohesion: 0.15
Nodes (18): BillingError, BillingServiceOptions, UsageResource, createDatabase(), database, migrationsFolder, authSessions, dataRecords (+10 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.19
Nodes (4): PostgresRecordRepository, MemoryRecordRepository, DataRepository, DataCollection

### Community 41 - "resume-builder.tsx"
Cohesion: 0.08
Nodes (38): getJobTextDirection(), ImportJobResponse, JobSourceMode, MatchAnalysis, MatchPage(), ResumeOption, scoreWidth(), EditableLanguage (+30 more)

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

### Community 47 - "apiRequest"
Cohesion: 0.31
Nodes (14): useAuth(), MembershipsAdminPage(), AdminOrdersPage(), AdminPaymentsPage(), AdminRecordsPage(), AdminUser, AdminUsersPage(), PendingUserAction (+6 more)

### Community 48 - "interview/page.tsx"
Cohesion: 0.14
Nodes (17): createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput (+9 more)

### Community 49 - "admin-stats.ts"
Cohesion: 0.20
Nodes (12): UserRole, AdminPage(), collectionLabels, formatNumber(), AdminBillingStats, adminBillingStatsQueryKey, AdminEvent, adminEventsQueryKey (+4 more)

### Community 50 - "field-direction.ts"
Cohesion: 0.35
Nodes (10): ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField(), refreshFieldDirections() (+2 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "loading-skeletons.tsx"
Cohesion: 0.12
Nodes (13): ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton() (+5 more)

### Community 55 - "resumes/page.tsx"
Cohesion: 0.20
Nodes (14): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+6 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "admin/orders/page.tsx"
Cohesion: 0.23
Nodes (13): Response, statusOptions, UpgradePage(), ApiError, billingKeys, formatLimit(), formatTomans(), Order (+5 more)

### Community 58 - "app.ts"
Cohesion: 0.18
Nodes (14): buildApp(), BuildAppOptions, AuthServicePort, handleAuthError(), handleBillingError(), registerHealthRoutes(), adminIdentity, authService (+6 more)

## Knowledge Gaps
- **441 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+436 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `app.ts`, `stores.ts`, `repository.ts`, `data/routes.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `cn()` connect `resume-document.tsx` to `knowledge-base/page.tsx`, `resume-builder.tsx`, `stores.ts`, `useToast`, `payments/page.tsx`, `repository.ts`, `loading-skeletons.tsx`, `resumes/page.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `BillingService` connect `BillingService` to `ai/routes.ts`, `billing/service.ts`, `ZarinpalClient`, `data/routes.ts`, `main.ts`, `billing/routes.ts`, `app.ts`, `Database`, `orders`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _441 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09350547730829421 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07138535995160314 - nodes in this community are weakly interconnected._