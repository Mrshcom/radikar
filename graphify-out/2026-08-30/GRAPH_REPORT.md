# Graph Report - resumeMaker  (2026-08-30)

## Corpus Check
- 125 files · ~199,299 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1139 nodes · 2270 edges · 56 communities (48 shown, 8 thin omitted)
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
- interview/page.tsx
- BillingService
- main.ts
- dependencies
- stores.ts
- auth/routes.ts
- dashboard/page.tsx
- formatPersianNumber
- loading-skeletons.tsx
- AuthService
- apiRequest
- devDependencies
- match/page.tsx
- resume-builder.tsx
- tasks
- app.ts
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
- resumes/page.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- panel-shell.tsx
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
4. `apiRequest()` - 31 edges
5. `createRecordId()` - 26 edges
6. `BillingService` - 25 edges
7. `getResumeEducations()` - 25 edges
8. `getDefaultResumeColor()` - 23 edges
9. `scripts` - 23 edges
10. `getResumeExperiences()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `createTestApp()` --calls--> `buildApp()`  [EXTRACTED]
  apps/api/tests/data-routes.test.ts → apps/api/src/app.ts
- `registerAiRoutes()` --calls--> `getAnalyzeConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts
- `registerAiRoutes()` --calls--> `getWriteConfig()`  [EXTRACTED]
  apps/api/src/modules/ai/routes.ts → packages/ai/src/config.ts
- `registerKnowledgeImportRoute()` --calls--> `getAnalyzeConfig()`  [EXTRACTED]
  apps/api/src/modules/imports/knowledge-import.ts → packages/ai/src/config.ts
- `Shimmer()` --calls--> `cn()`  [EXTRACTED]
  apps/web/app/(panel)/_components/loading-skeletons.tsx → apps/web/lib/cn.ts

## Import Cycles
- None detected.

## Communities (56 total, 8 thin omitted)

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
Cohesion: 0.09
Nodes (40): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+32 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, next, @radicar/shared-types, react, @tanstack/react-query (+9 more)

### Community 6 - "DataCollection"
Cohesion: 0.08
Nodes (20): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+12 more)

### Community 7 - "interview/page.tsx"
Cohesion: 0.16
Nodes (16): InterviewSkeleton(), useModelTasks(), Feedback, icons, InterviewPage(), PracticeCard, SessionData, ResumeBuilder() (+8 more)

### Community 8 - "BillingService"
Cohesion: 0.17
Nodes (4): addDays(), addLimit(), BillingService, orderNumber()

### Community 9 - "main.ts"
Cohesion: 0.22
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "stores.ts"
Cohesion: 0.12
Nodes (18): Job, JobTone, AppProfileRecord, DashboardSnapshotRecord, KnowledgeExperience, KnowledgeLanguage, KnowledgeQualification, MatchAnalysisData (+10 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.09
Nodes (26): AuthRouteOptions, AuthServicePort, cookieOptions(), eventListSchema, fastify, FastifyRequest, requestOtpSchema, updateProfileSchema (+18 more)

### Community 13 - "dashboard/page.tsx"
Cohesion: 0.18
Nodes (12): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+4 more)

### Community 14 - "formatPersianNumber"
Cohesion: 0.15
Nodes (19): ApplicationsPage(), formatUpdateTime(), pipelineStages, JobCard(), JobCardData, toneStyles, ApplicationsSkeleton(), useToast() (+11 more)

### Community 15 - "loading-skeletons.tsx"
Cohesion: 0.14
Nodes (11): DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+3 more)

### Community 16 - "AuthService"
Cohesion: 0.16
Nodes (6): AuthService, normalizePhone(), toAuthUser(), tokenHash(), UserRole, UserStatus

### Community 17 - "apiRequest"
Cohesion: 0.05
Nodes (68): AuthGate(), authQueryKey, CurrentUser, useAuth(), useLogout(), UserRole, LoginPage(), otpSchema (+60 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "match/page.tsx"
Cohesion: 0.24
Nodes (10): getJobTextDirection(), ImportJobResponse, JobSourceMode, MatchAnalysis, MatchPage(), ResumeOption, scoreWidth(), supportsResumeColors() (+2 more)

### Community 20 - "resume-builder.tsx"
Cohesion: 0.12
Nodes (24): EditableLanguage, normalizeProficiency(), parseEditableLanguages(), proficiencyLabel(), proficiencyOptions, Props, ResumeLanguageEditor(), serializeLanguages() (+16 more)

### Community 21 - "tasks"
Cohesion: 0.11
Nodes (19): nextConfig, ^build, .next/**, dependsOn, outputs, cache, dependsOn, persistent (+11 more)

### Community 22 - "app.ts"
Cohesion: 0.13
Nodes (19): buildApp(), BuildAppOptions, handleAuthError(), registerAuthRoutes(), requirePermission(), adjustCreditSchema, adminListSchema, callbackSchema (+11 more)

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
Cohesion: 0.13
Nodes (22): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, UsageResource, createDatabase(), Database, database (+14 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 41 - "resumes/page.tsx"
Cohesion: 0.21
Nodes (13): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+5 more)

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

### Community 48 - "panel-shell.tsx"
Cohesion: 0.07
Nodes (38): createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput (+30 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

## Knowledge Gaps
- **424 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+419 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `stores.ts`, `auth/routes.ts`, `billing/service.ts`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `resume-builder.tsx`, `DataCollection`, `interview/page.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Why does `.next/**` connect `tasks` to `DataCollection`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _424 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09170471841704718 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07138535995160314 - nodes in this community are weakly interconnected._