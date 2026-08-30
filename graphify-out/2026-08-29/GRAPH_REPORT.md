# Graph Report - resumeMaker  (2026-08-29)

## Corpus Check
- 123 files · ~197,675 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1120 nodes · 2234 edges · 55 communities (47 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.59)
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
- DataCollection
- loading-skeletons.tsx
- BillingService
- main.ts
- dependencies
- panel-shell.tsx
- auth/routes.ts
- match/page.tsx
- dashboard/page.tsx
- interview/page.tsx
- auth/service.ts
- apiRequest
- devDependencies
- stores.ts
- resume-builder.tsx
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- lucide-react
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
- model-task-provider.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- compilerOptions
- job-url.ts
- AGENTS.md
- job-description-validation.ts
- eslint.config.mjs
- postcss.config.mjs
- config/src/index.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 71 edges
2. `DataCollection` - 34 edges
3. `KnowledgeBasePage()` - 31 edges
4. `createRecordId()` - 26 edges
5. `BillingService` - 25 edges
6. `getResumeEducations()` - 25 edges
7. `apiRequest()` - 25 edges
8. `getDefaultResumeColor()` - 23 edges
9. `scripts` - 23 edges
10. `getResumeExperiences()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `registerAiRoutes()` --calls--> `getAnalyzeConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts
- `registerAiRoutes()` --calls--> `getWriteConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts
- `registerKnowledgeImportRoute()` --calls--> `getAnalyzeConfig()`  [EXTRACTED]
  apps/api/src/modules/imports/knowledge-import.ts → packages/ai/src/config.ts
- `Shimmer()` --calls--> `cn()`  [EXTRACTED]
  apps/web/app/(panel)/_components/loading-skeletons.tsx → apps/web/lib/cn.ts
- `LoadingContext()` --calls--> `cn()`  [EXTRACTED]
  apps/web/app/(panel)/_components/loading-skeletons.tsx → apps/web/lib/cn.ts

## Import Cycles
- None detected.

## Communities (55 total, 8 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (69): getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume(), BannerModernResume() (+61 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.07
Nodes (50): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeDocument(), getFlowContentBottom(), getPageFlows(), getRenderedPageLayout() (+42 more)

### Community 2 - "ai/routes.ts"
Cohesion: 0.07
Nodes (54): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, Analysis (+46 more)

### Community 3 - "knowledge-base/page.tsx"
Cohesion: 0.07
Nodes (54): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+46 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, next, @radicar/shared-types, react, @tanstack/react-query (+9 more)

### Community 6 - "DataCollection"
Cohesion: 0.08
Nodes (19): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+11 more)

### Community 7 - "loading-skeletons.tsx"
Cohesion: 0.14
Nodes (11): ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+3 more)

### Community 8 - "BillingService"
Cohesion: 0.17
Nodes (4): addDays(), addLimit(), BillingService, orderNumber()

### Community 9 - "main.ts"
Cohesion: 0.22
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "panel-shell.tsx"
Cohesion: 0.10
Nodes (24): JobCard(), JobCardData, toneStyles, JobCardsSkeleton(), initials(), MenuItem, menuItems, pageTitles (+16 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (31): buildApp(), BuildAppOptions, AuthRouteOptions, AuthServicePort, cookieOptions(), fastify, FastifyRequest, handleAuthError() (+23 more)

### Community 13 - "match/page.tsx"
Cohesion: 0.17
Nodes (13): CircularProgress(), CircularProgressProps, getJobTextDirection(), ImportJobResponse, JobSourceMode, MatchAnalysis, MatchPage(), ResumeOption (+5 more)

### Community 14 - "dashboard/page.tsx"
Cohesion: 0.22
Nodes (11): useModelTasks(), barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels, statIcons (+3 more)

### Community 15 - "interview/page.tsx"
Cohesion: 0.15
Nodes (19): ApplicationsPage(), formatUpdateTime(), pipelineStages, InterviewSkeleton(), useToast(), Feedback, icons, InterviewPage() (+11 more)

### Community 16 - "auth/service.ts"
Cohesion: 0.14
Nodes (10): AuthError, AuthService, AuthServiceOptions, normalizePhone(), RequestOtpResult, toAuthUser(), tokenHash(), VerifyOtpResult (+2 more)

### Community 17 - "apiRequest"
Cohesion: 0.06
Nodes (59): AuthGate(), authQueryKey, CurrentUser, useAuth(), useLogout(), UserRole, LoginPage(), otpSchema (+51 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "stores.ts"
Cohesion: 0.11
Nodes (24): ApplicationRecord, ApplicationStage, BaseRecord, DashboardSnapshotRecord, KnowledgeExperience, KnowledgeLanguage, KnowledgeProfileRecord, KnowledgeQualification (+16 more)

### Community 20 - "resume-builder.tsx"
Cohesion: 0.10
Nodes (33): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+25 more)

### Community 21 - "tasks"
Cohesion: 0.11
Nodes (19): nextConfig, ^build, .next/**, dependsOn, outputs, cache, dependsOn, persistent (+11 more)

### Community 22 - "billing/routes.ts"
Cohesion: 0.17
Nodes (10): adjustCreditSchema, adminListSchema, callbackSchema, cancelSchema, createOrderSchema, extendSchema, grantPlanSchema, pageSchema (+2 more)

### Community 23 - "compilerOptions"
Cohesion: 0.06
Nodes (30): compilerOptions, allowImportingTsExtensions, allowJs, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 24 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 25 - "web/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

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
Nodes (19): BillingServiceOptions, UsageResource, createDatabase(), Database, database, migrationsFolder, authSessions, dataRecords (+11 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "model-task-provider.tsx"
Cohesion: 0.25
Nodes (8): createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput

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

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

## Knowledge Gaps
- **418 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+413 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `stores.ts`, `auth/routes.ts`, `billing/service.ts`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `stores.ts`, `resume-builder.tsx`, `dashboard/page.tsx`, `DataCollection`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `BillingService` connect `BillingService` to `ai/routes.ts`, `billing/service.ts`, `ZarinpalClient`, `DataCollection`, `main.ts`, `auth/routes.ts`, `billing/routes.ts`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _418 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.091324200913242 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07138535995160314 - nodes in this community are weakly interconnected._