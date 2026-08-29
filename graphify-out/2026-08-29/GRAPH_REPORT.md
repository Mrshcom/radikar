# Graph Report - resumeMaker  (2026-08-29)

## Corpus Check
- 111 files · ~186,025 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1037 nodes · 2002 edges · 56 communities (46 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cc57bfe`
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
- data-routes.test.ts
- main.ts
- dependencies
- formatPersianNumber
- auth/routes.ts
- service.ts
- dashboard/page.tsx
- resume-builder.tsx
- AuthService
- interview/page.tsx
- devDependencies
- stores.ts
- match/page.tsx
- tasks
- @types/node
- compilerOptions
- scripts
- web/package.json
- eslint
- @types/react-dom
- wrangler
- compilerOptions
- رادیکار — Resume Maker
- database/package.json
- compilerOptions
- config/package.json
- compilerOptions
- shared-types/package.json
- validators/package.json
- data/routes.ts
- chatgpt-auth.ts
- model-task-provider.tsx
- worker/index.ts
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- compilerOptions
- job-url.ts
- stage-sites-build.mjs
- AGENTS.md
- job-description-validation.ts
- eslint.config.mjs
- vite
- postcss.config.mjs
- config/src/index.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 69 edges
2. `DataCollection` - 34 edges
3. `KnowledgeBasePage()` - 31 edges
4. `createRecordId()` - 26 edges
5. `getResumeEducations()` - 25 edges
6. `getDefaultResumeColor()` - 23 edges
7. `scripts` - 23 edges
8. `getResumeExperiences()` - 21 edges
9. `formatPersianNumber()` - 21 edges
10. `getResumePresentation()` - 20 edges

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

## Communities (56 total, 10 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (68): getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume(), BannerModernResume() (+60 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.07
Nodes (50): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeDocument(), getFlowContentBottom(), getPageFlows(), getRenderedPageLayout() (+42 more)

### Community 2 - "ai/routes.ts"
Cohesion: 0.08
Nodes (51): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, Analysis (+43 more)

### Community 3 - "knowledge-base/page.tsx"
Cohesion: 0.06
Nodes (63): Job, JobTone, blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume() (+55 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, lucide-react, next, @radicar/shared-types, react (+15 more)

### Community 6 - "DataCollection"
Cohesion: 0.06
Nodes (30): PostgresRecordRepository, MemoryRecordRepository, AuthGate(), authQueryKey, CurrentUser, useAuth(), UserRole, metadata (+22 more)

### Community 7 - "loading-skeletons.tsx"
Cohesion: 0.13
Nodes (11): DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+3 more)

### Community 8 - "data-routes.test.ts"
Cohesion: 0.21
Nodes (11): buildApp(), BuildAppOptions, AuthServicePort, handleAuthError(), registerHealthRoutes(), adminIdentity, authService, createTestApp() (+3 more)

### Community 9 - "main.ts"
Cohesion: 0.24
Nodes (7): app, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "formatPersianNumber"
Cohesion: 0.15
Nodes (19): ApplicationsPage(), formatUpdateTime(), pipelineStages, JobCard(), JobCardData, toneStyles, ApplicationsSkeleton(), JobCardsSkeleton() (+11 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.13
Nodes (18): AuthRouteOptions, cookieOptions(), fastify, FastifyRequest, registerAuthRoutes(), requestOtpSchema, requirePermission(), updateUserSchema (+10 more)

### Community 13 - "service.ts"
Cohesion: 0.16
Nodes (14): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, createDatabase(), Database, database, migrationsFolder, authSessions (+6 more)

### Community 14 - "dashboard/page.tsx"
Cohesion: 0.17
Nodes (13): barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels, statIcons, toneClasses (+5 more)

### Community 15 - "resume-builder.tsx"
Cohesion: 0.10
Nodes (34): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+26 more)

### Community 16 - "AuthService"
Cohesion: 0.18
Nodes (6): AuthService, normalizePhone(), toAuthUser(), tokenHash(), UserRole, UserStatus

### Community 17 - "interview/page.tsx"
Cohesion: 0.29
Nodes (8): Feedback, icons, InterviewPage(), PracticeCard, SessionData, apiUrl(), getLatestResume(), toPersianDigits()

### Community 18 - "devDependencies"
Cohesion: 0.10
Nodes (21): devDependencies, @cloudflare/vite-plugin, eslint-config-next, react-server-dom-webpack, tailwindcss, @tailwindcss/postcss, @types/react, typescript (+13 more)

### Community 19 - "stores.ts"
Cohesion: 0.10
Nodes (30): useLogout(), useModelTasks(), initials(), MenuItem, menuItems, PanelShellContent(), ToastContext, ToastNotifier (+22 more)

### Community 20 - "match/page.tsx"
Cohesion: 0.18
Nodes (12): CircularProgress(), CircularProgressProps, getJobTextDirection(), ImportJobResponse, JobSourceMode, MatchAnalysis, MatchPage(), ResumeOption (+4 more)

### Community 21 - "tasks"
Cohesion: 0.09
Nodes (22): nextConfig, localBindingConfig, ^build, .next/**, .vinext/**, dependsOn, outputs, cache (+14 more)

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
Cohesion: 0.06
Nodes (34): تنظیم Web, قرارداد HTTP, لایه داده Web, API سازگار با OpenAI, dependencyها نامعتبر یا ناقص‌اند, endpoint `/ready` کد 503 می‌دهد, Proxy محلی DeepSeek, Web پیام اتصال به Node API می‌دهد (+26 more)

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

### Community 38 - "data/routes.ts"
Cohesion: 0.19
Nodes (10): RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), ApiError, dataCollections, DataRecord (+2 more)

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "model-task-provider.tsx"
Cohesion: 0.25
Nodes (8): createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput

### Community 41 - "worker/index.ts"
Cohesion: 0.25
Nodes (3): Env, ExecutionContext, worker

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

### Community 59 - "stage-sites-build.mjs"
Cohesion: 0.50
Nodes (3): repositoryRoot, sitesBuild, webBuild

## Knowledge Gaps
- **397 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+392 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `knowledge-base/page.tsx`, `data/routes.ts`, `data-routes.test.ts`, `service.ts`, `stores.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `cn()` connect `resume-document.tsx` to `knowledge-base/page.tsx`, `loading-skeletons.tsx`, `formatPersianNumber`, `resume-builder.tsx`, `stores.ts`, `match/page.tsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `.next/**` connect `tasks` to `DataCollection`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _397 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09350547730829421 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07138535995160314 - nodes in this community are weakly interconnected._