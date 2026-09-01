# Graph Report - resumeMaker  (2026-08-30)

## Corpus Check
- 142 files · ~213,402 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1250 nodes · 2672 edges · 66 communities (57 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20f482f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- ai/routes.ts
- knowledge-base/page.tsx
- scripts
- dependencies
- resumes/page.tsx
- loading-skeletons.tsx
- BillingService
- main.ts
- dependencies
- stores.ts
- auth/routes.ts
- dashboard/page.tsx
- useToast
- account/page.tsx
- auth/service.ts
- admin/orders/page.tsx
- devDependencies
- billing.ts
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- memberships/page.tsx
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
- auth.tsx
- admin-stats.ts
- field-direction.ts
- compilerOptions
- interview/page.tsx
- @tanstack/react-query
- zod
- match/page.tsx
- job-url.ts
- AGENTS.md
- job-description-validation.ts
- eslint.config.mjs
- postcss.config.mjs
- config/src/index.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 78 edges
2. `KnowledgeBasePage()` - 37 edges
3. `apiRequest()` - 34 edges
4. `DataCollection` - 34 edges
5. `BillingService` - 29 edges
6. `createRecordId()` - 27 edges
7. `getResumeEducations()` - 25 edges
8. `useAuth()` - 25 edges
9. `useToast()` - 25 edges
10. `getDefaultResumeColor()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `buildApp()` --calls--> `normalizeDigitsDeep()`  [EXTRACTED]
  apps/api/src/app.ts → packages/validators/src/index.ts
- `normalizePhone()` --calls--> `normalizeDigits()`  [EXTRACTED]
  apps/api/src/modules/auth/service.ts → packages/validators/src/index.ts
- `registerKnowledgeImportRoute()` --calls--> `normalizeResumeImportPayload()`  [EXTRACTED]
  apps/api/src/modules/imports/knowledge-import.ts → packages/validators/src/index.ts
- `localizedNumber()` --calls--> `normalizeDigits()`  [EXTRACTED]
  apps/web/app/(panel)/admin/memberships/page.tsx → packages/validators/src/index.ts
- `resumeFromKnowledge()` --calls--> `normalizeResumeImportPayload()`  [EXTRACTED]
  apps/web/app/(panel)/resumes/page.tsx → packages/validators/src/index.ts

## Import Cycles
- None detected.

## Communities (66 total, 9 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.08
Nodes (76): DataTableSkeleton(), Field(), KnowledgeCardsSkeleton(), KnowledgeSectionTabs(), experienceWeight(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences() (+68 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.10
Nodes (39): getFlowContentBottom(), getPageFlows(), getRenderedPageLayout(), getScaledBottomReserve(), PAGE_BOTTOM_RESERVE, DEFAULT_SECTION_ORDER, getResumeFlowSections(), getResumePaginationFlows() (+31 more)

### Community 2 - "ai/routes.ts"
Cohesion: 0.06
Nodes (61): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, Analysis (+53 more)

### Community 3 - "knowledge-base/page.tsx"
Cohesion: 0.05
Nodes (79): CollectionParams, RecordParams, blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume() (+71 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, lucide-react, next, @radicar/shared-types, @radicar/validators (+9 more)

### Community 6 - "resumes/page.tsx"
Cohesion: 0.18
Nodes (18): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+10 more)

### Community 7 - "loading-skeletons.tsx"
Cohesion: 0.09
Nodes (19): ApplicationsPage(), formatUpdateTime(), pipelineStages, ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton() (+11 more)

### Community 8 - "BillingService"
Cohesion: 0.16
Nodes (5): addDays(), addLimit(), BillingService, orderNumber(), orders

### Community 9 - "main.ts"
Cohesion: 0.22
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "stores.ts"
Cohesion: 0.08
Nodes (35): adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems, pageTitles, PanelShell() (+27 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.08
Nodes (34): buildApp(), BuildAppOptions, AuthRouteOptions, AuthServicePort, cookieOptions(), eventListSchema, fastify, FastifyRequest (+26 more)

### Community 13 - "dashboard/page.tsx"
Cohesion: 0.14
Nodes (15): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+7 more)

### Community 14 - "useToast"
Cohesion: 0.15
Nodes (14): ToastContext, ToastNotifier, ToastState, ToastVariant, useToast(), JobCard(), JobCardData, toneStyles (+6 more)

### Community 15 - "account/page.tsx"
Cohesion: 0.22
Nodes (8): AccountPage(), formatDate(), remainingDays(), schema, usageItems, UsageKey, Values, Membership

### Community 16 - "auth/service.ts"
Cohesion: 0.13
Nodes (11): AuthError, AuthService, AuthServiceOptions, normalizePhone(), RequestOtpResult, toAuthUser(), tokenHash(), VerifyOtpResult (+3 more)

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.11
Nodes (26): UserRole, Response, statusOptions, Payment, Response, statusOptions, collectionOptions, RecordRow (+18 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "billing.ts"
Cohesion: 0.21
Nodes (14): OrdersPage(), statusLabel, statusOptions, UpgradePage(), ApiError, billingKeys, formatLimit(), formatTomans() (+6 more)

### Community 21 - "tasks"
Cohesion: 0.11
Nodes (19): nextConfig, ^build, .next/**, dependsOn, outputs, cache, dependsOn, persistent (+11 more)

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

### Community 26 - "memberships/page.tsx"
Cohesion: 0.12
Nodes (16): localizedNumericString, LoginPage(), otpSchema, OtpValues, phoneSchema, PhoneValues, cancelSchema, creditSchema (+8 more)

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
Cohesion: 0.14
Nodes (19): BillingServiceOptions, UsageResource, createDatabase(), Database, database, migrationsFolder, authSessions, dataRecords (+11 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.09
Nodes (14): PostgresRecordRepository, RecordRepository, parseCollection(), registerDataRoutes(), MemoryRecordRepository, ToastProvider(), metadata, Providers() (+6 more)

### Community 41 - "resume-builder.tsx"
Cohesion: 0.16
Nodes (14): DeleteConfirmModal(), Modal(), SectionTitle(), EditableLanguage, normalizeProficiency(), parseEditableLanguages(), proficiencyLabel(), proficiencyOptions (+6 more)

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
Cohesion: 0.64
Nodes (9): useAuth(), MembershipsAdminPage(), AdminOrdersPage(), AdminPaymentsPage(), AdminRecordsPage(), AdminUsersPage(), apiRequest(), buildQueryString() (+1 more)

### Community 48 - "auth.tsx"
Cohesion: 0.23
Nodes (9): AuthGate(), authQueryKey, CurrentUser, useLogout(), PaginationItem, SettingsPage(), AuthResponse, TablePageSize (+1 more)

### Community 49 - "admin-stats.ts"
Cohesion: 0.13
Nodes (22): AdminModelUsagePage(), downloadCsv(), number(), operationLabels, percent(), UsageTable(), usd(), AdminPage() (+14 more)

### Community 50 - "field-direction.ts"
Cohesion: 0.32
Nodes (11): ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField(), refreshFieldDirections() (+3 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "interview/page.tsx"
Cohesion: 0.12
Nodes (19): createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput (+11 more)

### Community 55 - "match/page.tsx"
Cohesion: 0.12
Nodes (22): ImportJobResponse, JobSourceMode, MatchAnalysis, ResumeOption, emptyResumeData, OneColumnPageDraft, ResumeColorId, resumeColorOptions (+14 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

## Knowledge Gaps
- **453 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+448 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `stores.ts`, `knowledge-base/page.tsx`, `auth/routes.ts`, `billing/service.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `cn()` connect `resume-document.tsx` to `knowledge-base/page.tsx`, `resumes/page.tsx`, `loading-skeletons.tsx`, `DataCollection`, `resume-builder.tsx`, `stores.ts`, `useToast`, `auth.tsx`, `admin/orders/page.tsx`, `interview/page.tsx`, `match/page.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `.next/**` connect `tasks` to `DataCollection`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _453 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08037974683544304 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09856035437430787 - nodes in this community are weakly interconnected._