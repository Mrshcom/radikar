# Graph Report - resumeMaker  (2026-08-31)

## Corpus Check
- 143 files · ~217,681 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1291 nodes · 2814 edges · 68 communities (59 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `20f482f6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- ai/src/client.ts
- panel-shell.tsx
- scripts
- dependencies
- validators/src/index.ts
- toast.tsx
- BillingService
- main.ts
- dependencies
- stores.ts
- auth/routes.ts
- apiRequest
- knowledge-base/page.tsx
- auth.tsx
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
- dashboard/page.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- Database
- parseResumeSkills
- admin-stats.ts
- resume-builder.tsx
- compilerOptions
- data-routes.test.ts
- @tanstack/react-query
- zod
- resumes/page.tsx
- job-url.ts
- job-import.ts
- AGENTS.md
- job-description-validation.ts
- eslint.config.mjs
- app.ts
- postcss.config.mjs
- config/src/index.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 78 edges
2. `apiRequest()` - 39 edges
3. `KnowledgeBasePage()` - 36 edges
4. `DataCollection` - 35 edges
5. `normalizeImportedText()` - 30 edges
6. `BillingService` - 29 edges
7. `createRecordId()` - 27 edges
8. `getResumeEducations()` - 26 edges
9. `useAuth()` - 25 edges
10. `useToast()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `serializeResumeSkills()` --calls--> `normalizeImportedText()`  [EXTRACTED]
  apps/api/src/modules/ai/helpers.ts → packages/validators/src/index.ts
- `normalizeAnalysis()` --calls--> `normalizeImportedBoolean()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/validators/src/index.ts
- `getTailorWriteConfig()` --calls--> `getWriteConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts
- `registerAiRoutes()` --calls--> `getAnalyzeConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts
- `registerAiRoutes()` --calls--> `getWriteConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts

## Import Cycles
- None detected.

## Communities (68 total, 9 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (69): DataTableSkeleton(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume() (+61 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.06
Nodes (61): experienceWeight(), OneColumnPageDraft, paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeEducation, selectableTemplateIds, getFlowContentBounds() (+53 more)

### Community 2 - "ai/src/client.ts"
Cohesion: 0.16
Nodes (23): ChatCompletionResponse, chatJson(), ChatJsonOptions, ChatMessage, estimatedTokens(), extractJson(), findResponseJson(), isJsonObject() (+15 more)

### Community 3 - "panel-shell.tsx"
Cohesion: 0.09
Nodes (31): createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput (+23 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, lucide-react, next, @radicar/shared-types, @radicar/validators (+9 more)

### Community 6 - "validators/src/index.ts"
Cohesion: 0.07
Nodes (62): asObject(), hasResumeContent(), JsonObject, validateJobDescription(), ValidationResult, Analysis, bodyOf(), breakdownWeights (+54 more)

### Community 7 - "toast.tsx"
Cohesion: 0.19
Nodes (12): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, ApiError, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage() (+4 more)

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
Cohesion: 0.10
Nodes (30): useModelTasks(), Feedback, icons, InterviewPage(), PracticeCard, SessionData, ApplicationStage, AppProfileRecord (+22 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (19): AuthRouteOptions, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, requestOtpSchema, updatePreferencesSchema (+11 more)

### Community 13 - "apiRequest"
Cohesion: 0.49
Nodes (11): useAuth(), MembershipsAdminPage(), AdminOrdersPage(), AdminPaymentsPage(), AdminRecordsPage(), AdminUsersPage(), OrdersPage(), apiRequest() (+3 more)

### Community 14 - "knowledge-base/page.tsx"
Cohesion: 0.11
Nodes (41): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+33 more)

### Community 15 - "auth.tsx"
Cohesion: 0.17
Nodes (13): AuthGate(), authQueryKey, CurrentUser, useLogout(), localizedNumericString, LoginPage(), otpSchema, OtpValues (+5 more)

### Community 16 - "auth/service.ts"
Cohesion: 0.14
Nodes (10): AuthService, AuthServiceOptions, normalizePhone(), RequestOtpResult, toAuthUser(), tokenHash(), VerifyOtpResult, AuthUser (+2 more)

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.12
Nodes (25): Response, statusOptions, Payment, Response, statusOptions, collectionOptions, RecordRow, RecordsResponse (+17 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "billing.ts"
Cohesion: 0.16
Nodes (17): AccountPage(), formatDate(), remainingDays(), schema, usageItems, UsageKey, Values, UpgradePage() (+9 more)

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
Cohesion: 0.13
Nodes (14): cancelSchema, creditSchema, extendSchema, grantSchema, MembershipUser, PendingMembershipAction, Response, AdminUser (+6 more)

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
Cohesion: 0.18
Nodes (15): BillingServiceOptions, orderNumber(), UsageResource, usageResourceLabels, authSessions, dataRecords, membershipEvents, modelUsageEvents (+7 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.08
Nodes (19): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+11 more)

### Community 41 - "dashboard/page.tsx"
Cohesion: 0.06
Nodes (41): useToast(), ApplicationsPage(), formatUpdateTime(), pipelineStages, CircularProgress(), CircularProgressProps, JobCard(), JobCardData (+33 more)

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

### Community 48 - "parseResumeSkills"
Cohesion: 0.80
Nodes (3): isStandaloneTechnicalToken(), parseResumeSkills(), serializeResumeSkills()

### Community 49 - "admin-stats.ts"
Cohesion: 0.12
Nodes (23): UserRole, AdminModelUsagePage(), downloadCsv(), number(), operationLabels, percent(), UsageTable(), usd() (+15 more)

### Community 50 - "resume-builder.tsx"
Cohesion: 0.09
Nodes (30): GenerationShimmer(), MatchAnalysisSkeleton(), DeleteConfirmModal(), getJobTextDirection(), ImportJobResponse, JobSourceMode, MatchAnalysis, MatchPage() (+22 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "data-routes.test.ts"
Cohesion: 0.14
Nodes (24): isStandaloneTechnicalToken(), serializeResumeSkills(), AuthServicePort, applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks() (+16 more)

### Community 55 - "resumes/page.tsx"
Cohesion: 0.13
Nodes (25): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+17 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 58 - "job-import.ts"
Cohesion: 0.33
Nodes (11): allowedHostSuffixes, decodeEntities(), extractJobText(), extractMetaContent(), getLinkedInJobId(), isAllowedHost(), isLinkedInHost(), normalizeWhitespace() (+3 more)

### Community 66 - "app.ts"
Cohesion: 0.28
Nodes (10): buildApp(), BuildAppOptions, handleAuthError(), registerAuthRoutes(), requirePermission(), handleBillingError(), registerBillingRoutes(), registerHealthRoutes() (+2 more)

## Knowledge Gaps
- **452 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+447 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `resume-document.tsx` to `panel-shell.tsx`, `toast.tsx`, `dashboard/page.tsx`, `knowledge-base/page.tsx`, `admin/orders/page.tsx`, `resume-builder.tsx`, `resumes/page.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `DataCollection` connect `DataCollection` to `stores.ts`, `data-routes.test.ts`, `billing/service.ts`, `validators/src/index.ts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `.next/**` connect `tasks` to `DataCollection`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _452 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.091324200913242 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06335403726708075 - nodes in this community are weakly interconnected._