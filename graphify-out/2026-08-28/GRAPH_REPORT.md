# Graph Report - resumeMaker  (2026-08-28)

## Corpus Check
- 111 files · ~184,412 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1009 nodes · 1974 edges · 48 communities (43 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cc57bfe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- knowledge-base/page.tsx
- use-rendered-resume-pagination.ts
- resume-builder.tsx
- dependencies
- devDependencies
- panel-shell.tsx
- ai/routes.ts
- compilerOptions
- compilerOptions
- auth.tsx
- formatPersianNumber
- match/page.tsx
- stores.ts
- config/package.json
- validators/package.json
- dashboard/page.tsx
- shared-types/package.json
- compilerOptions
- chatgpt-auth.ts
- seed.ts
- DataCollection
- auth/routes.ts
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- worker/index.ts
- tasks
- job-url.ts
- dependencies
- رادیکار — Resume Maker
- database/package.json
- AGENTS.md
- stage-sites-build.mjs
- scripts
- job-description-validation.ts
- compilerOptions
- compilerOptions
- eslint.config.mjs
- ai/package.json
- postcss.config.mjs
- config/src/index.ts
- service.ts
- AuthService
- data-routes.test.ts
- main.ts

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

## Communities (48 total, 5 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (68): getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume(), BannerModernResume() (+60 more)

### Community 1 - "knowledge-base/page.tsx"
Cohesion: 0.06
Nodes (54): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+46 more)

### Community 2 - "use-rendered-resume-pagination.ts"
Cohesion: 0.07
Nodes (49): experienceWeight(), paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeDocument(), getFlowContentBottom(), getPageFlows(), getRenderedPageLayout() (+41 more)

### Community 3 - "resume-builder.tsx"
Cohesion: 0.09
Nodes (40): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+32 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (34): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, lucide-react, next, @radicar/shared-types, react (+26 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (31): devDependencies, @cloudflare/vite-plugin, eslint, eslint-config-next, react-server-dom-webpack, tailwindcss, @tailwindcss/postcss, @types/node (+23 more)

### Community 6 - "panel-shell.tsx"
Cohesion: 0.10
Nodes (27): useLogout(), createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus (+19 more)

### Community 7 - "ai/routes.ts"
Cohesion: 0.08
Nodes (51): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, Analysis (+43 more)

### Community 8 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+2 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (29): compilerOptions, allowJs, incremental, isolatedModules, jsx, lib, module, moduleResolution (+21 more)

### Community 10 - "auth.tsx"
Cohesion: 0.11
Nodes (21): AuthGate(), authQueryKey, CurrentUser, useAuth(), UserRole, LoginPage(), otpSchema, OtpValues (+13 more)

### Community 11 - "formatPersianNumber"
Cohesion: 0.13
Nodes (21): ApplicationsPage(), formatUpdateTime(), pipelineStages, JobCard(), JobCardData, toneStyles, ApplicationsSkeleton(), JobCardsSkeleton() (+13 more)

### Community 12 - "match/page.tsx"
Cohesion: 0.09
Nodes (21): DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+13 more)

### Community 13 - "stores.ts"
Cohesion: 0.11
Nodes (23): AppProfileRecord, BaseRecord, DashboardSnapshotRecord, InterviewFeedbackRecord, InterviewSessionRecord, KnowledgeExperience, KnowledgeLanguage, KnowledgeQualification (+15 more)

### Community 14 - "config/package.json"
Cohesion: 0.11
Nodes (18): dependencies, zod, devDependencies, @types/node, typescript, exports, ./server, @types/node (+10 more)

### Community 15 - "validators/package.json"
Cohesion: 0.11
Nodes (17): dependencies, @radicar/shared-types, zod, devDependencies, typescript, exports, @radicar/shared-types, typescript (+9 more)

### Community 16 - "dashboard/page.tsx"
Cohesion: 0.18
Nodes (12): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+4 more)

### Community 17 - "shared-types/package.json"
Cohesion: 0.15
Nodes (12): devDependencies, typescript, exports, typescript, name, private, scripts, build (+4 more)

### Community 18 - "compilerOptions"
Cohesion: 0.18
Nodes (10): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+2 more)

### Community 19 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 20 - "seed.ts"
Cohesion: 0.28
Nodes (6): createDatabase(), database, migrationsFolder, database, now, timestamp

### Community 21 - "DataCollection"
Cohesion: 0.08
Nodes (20): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, matrixMono (+12 more)

### Community 22 - "auth/routes.ts"
Cohesion: 0.15
Nodes (17): AuthRouteOptions, cookieOptions(), fastify, FastifyRequest, registerAuthRoutes(), requestOtpSchema, requirePermission(), updateUserSchema (+9 more)

### Community 23 - "shared-types/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 24 - "validators/tsconfig.json"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, extends, include, src/**/*.ts, ../../tsconfig.base.json

### Community 25 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, resolveJsonModule, skipLibCheck, strict, target

### Community 26 - "worker/index.ts"
Cohesion: 0.29
Nodes (3): Env, ExecutionContext, worker

### Community 27 - "tasks"
Cohesion: 0.09
Nodes (22): nextConfig, localBindingConfig, ^build, .next/**, .vinext/**, dependsOn, outputs, cache (+14 more)

### Community 28 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 29 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 30 - "رادیکار — Resume Maker"
Cohesion: 0.20
Nodes (8): تنظیم Web, قرارداد HTTP, لایه داده Web, اجرای محلی, رادیکار — Resume Maker, ساختار پروژه, فرمان‌های اصلی, معماری داده و دسترسی

### Community 31 - "database/package.json"
Cohesion: 0.07
Nodes (26): drizzle-kit, dependencies, drizzle-orm, postgres, @radicar/shared-types, tsx, devDependencies, drizzle-kit (+18 more)

### Community 33 - "stage-sites-build.mjs"
Cohesion: 0.50
Nodes (3): repositoryRoot, sitesBuild, webBuild

### Community 34 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 36 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 37 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 40 - "ai/package.json"
Cohesion: 0.14
Nodes (13): devDependencies, typescript, exports, typescript, name, private, scripts, build (+5 more)

### Community 46 - "service.ts"
Cohesion: 0.22
Nodes (9): AuthError, AuthServiceOptions, RequestOtpResult, VerifyOtpResult, Database, authSessions, dataRecords, otpChallenges (+1 more)

### Community 48 - "AuthService"
Cohesion: 0.18
Nodes (6): AuthService, normalizePhone(), toAuthUser(), tokenHash(), UserRole, UserStatus

### Community 49 - "data-routes.test.ts"
Cohesion: 0.21
Nodes (11): buildApp(), BuildAppOptions, AuthServicePort, handleAuthError(), registerHealthRoutes(), adminIdentity, authService, createTestApp() (+3 more)

### Community 50 - "main.ts"
Cohesion: 0.24
Nodes (7): app, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

## Knowledge Gaps
- **373 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+368 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `data-routes.test.ts`, `stores.ts`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `.next/**` connect `tasks` to `DataCollection`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `cn()` connect `resume-document.tsx` to `knowledge-base/page.tsx`, `resume-builder.tsx`, `panel-shell.tsx`, `formatPersianNumber`, `match/page.tsx`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _373 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09350547730829421 - nodes in this community are weakly interconnected._
- **Should `knowledge-base/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06349206349206349 - nodes in this community are weakly interconnected._