# Graph Report - resumeMaker  (2026-08-29)

## Corpus Check
- 107 files · ~185,563 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1006 nodes · 1973 edges · 53 communities (45 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cc57bfe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- resume-data.ts
- ai/routes.ts
- knowledge-base/page.tsx
- scripts
- dependencies
- DataCollection
- interview/page.tsx
- data-routes.test.ts
- main.ts
- dependencies
- formatPersianNumber
- auth/routes.ts
- service.ts
- dashboard/page.tsx
- resumes/page.tsx
- AuthService
- auth.tsx
- devDependencies
- stores.ts
- resume-builder.tsx
- tasks
- field-direction.ts
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
- data/routes.ts
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

## Communities (53 total, 8 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (69): getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume(), BannerModernResume() (+61 more)

### Community 1 - "resume-data.ts"
Cohesion: 0.07
Nodes (54): experienceWeight(), OneColumnPageDraft, paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeEducation, ResumeExperience, selectableTemplateIds (+46 more)

### Community 2 - "ai/routes.ts"
Cohesion: 0.08
Nodes (51): asObject(), hasResumeContent(), isStandaloneTechnicalToken(), JsonObject, serializeResumeSkills(), validateJobDescription(), ValidationResult, Analysis (+43 more)

### Community 3 - "knowledge-base/page.tsx"
Cohesion: 0.12
Nodes (34): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+26 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, next, @radicar/shared-types, react, @tanstack/react-query (+9 more)

### Community 6 - "DataCollection"
Cohesion: 0.12
Nodes (9): PostgresRecordRepository, MemoryRecordRepository, metadata, Providers(), DataRepository, HttpDataRepository, createQueryClient(), getBrowserQueryClient() (+1 more)

### Community 7 - "interview/page.tsx"
Cohesion: 0.09
Nodes (22): ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton() (+14 more)

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
Cohesion: 0.21
Nodes (11): JobCard(), JobCardData, toneStyles, DeleteConfirmModal(), Modal(), SectionTitle(), Job, JobTone (+3 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.13
Nodes (18): AuthRouteOptions, cookieOptions(), fastify, FastifyRequest, registerAuthRoutes(), requestOtpSchema, requirePermission(), updateUserSchema (+10 more)

### Community 13 - "service.ts"
Cohesion: 0.18
Nodes (14): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, createDatabase(), Database, database, migrationsFolder, authSessions (+6 more)

### Community 14 - "dashboard/page.tsx"
Cohesion: 0.14
Nodes (15): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+7 more)

### Community 15 - "resumes/page.tsx"
Cohesion: 0.14
Nodes (19): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+11 more)

### Community 16 - "AuthService"
Cohesion: 0.17
Nodes (6): AuthService, normalizePhone(), toAuthUser(), tokenHash(), UserRole, UserStatus

### Community 17 - "auth.tsx"
Cohesion: 0.11
Nodes (21): AuthGate(), authQueryKey, CurrentUser, useAuth(), UserRole, LoginPage(), otpSchema, OtpValues (+13 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "stores.ts"
Cohesion: 0.08
Nodes (41): useLogout(), ApplicationsPage(), formatUpdateTime(), pipelineStages, initials(), MenuItem, menuItems, PanelShellContent() (+33 more)

### Community 20 - "resume-builder.tsx"
Cohesion: 0.12
Nodes (27): useModelTasks(), useToast(), getJobTextDirection(), ImportJobResponse, JobSourceMode, MatchAnalysis, MatchPage(), ResumeOption (+19 more)

### Community 21 - "tasks"
Cohesion: 0.11
Nodes (19): nextConfig, ^build, .next/**, dependsOn, outputs, cache, dependsOn, persistent (+11 more)

### Community 22 - "field-direction.ts"
Cohesion: 0.19
Nodes (16): MultiSkillAutocomplete(), parseSkills(), ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES (+8 more)

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
Cohesion: 0.18
Nodes (10): RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), ApiError, dataCollections, DataRecord (+2 more)

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
- **383 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+378 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `data-routes.test.ts`, `stores.ts`, `service.ts`, `data/routes.ts`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `cn()` connect `resume-document.tsx` to `knowledge-base/page.tsx`, `interview/page.tsx`, `formatPersianNumber`, `resumes/page.tsx`, `stores.ts`, `resume-builder.tsx`, `field-direction.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `.next/**` connect `tasks` to `DataCollection`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _383 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.091324200913242 - nodes in this community are weakly interconnected._
- **Should `resume-data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06912442396313365 - nodes in this community are weakly interconnected._