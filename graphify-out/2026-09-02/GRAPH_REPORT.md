# Graph Report - resumeMaker  (2026-09-02)

## Corpus Check
- 163 files · ~225,105 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1400 nodes · 3109 edges · 77 communities (67 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c0339cb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- validators/src/index.ts
- parseResumeSkills
- scripts
- dependencies
- resumes/page.tsx
- knowledge-base/page.tsx
- BillingService
- app.ts
- dependencies
- stores.ts
- auth/routes.ts
- ai/routes.ts
- toast.tsx
- useToast
- AuthService
- admin/orders/page.tsx
- devDependencies
- apiRequest
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- match/page.tsx
- react-dom
- KnowledgeBasePage
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
- panel-shell.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- normalizeImportedText
- memberships/page.tsx
- admin-stats.ts
- dashboard/page.tsx
- compilerOptions
- data-routes.test.ts
- job-application-filter.ts
- @hookform/resolvers
- Database
- job-url.ts
- model-usage/page.tsx
- jobs/page.tsx
- AGENTS.md
- job-description-validation.ts
- table-page-size.ts
- eslint.config.mjs
- resume-section-flow.ts
- resume-import.test.mjs
- jalali-date-picker.tsx
- match-analysis.ts
- postcss.config.mjs
- config/src/index.ts
- @radicar/shared-types
- react
- @fontsource/poppins
- users/page.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 80 edges
2. `apiRequest()` - 41 edges
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

## Communities (77 total, 10 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.06
Nodes (86): DataTableSkeleton(), ApplicationsSkeleton(), DashboardSkeleton(), GenerationShimmer(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton() (+78 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.08
Nodes (48): getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve(), PAGE_BOTTOM_RESERVE, PAGE_TOP_RESERVE, DEFAULT_SECTION_ORDER, getResumeFlowSections() (+40 more)

### Community 2 - "validators/src/index.ts"
Cohesion: 0.13
Nodes (23): aliasedObjectInput(), baseRecordSchema, boundedImportedArray(), collectionInput(), collectionWrapperKeys, firstDefined(), importedBooleanSchema, importedExperienceSchema (+15 more)

### Community 3 - "parseResumeSkills"
Cohesion: 0.80
Nodes (3): isStandaloneTechnicalToken(), parseResumeSkills(), serializeResumeSkills()

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource-variable/vazirmatn, lucide-react, next, nuqs, @radicar/validators, react-hook-form, @tanstack/react-query (+9 more)

### Community 6 - "resumes/page.tsx"
Cohesion: 0.10
Nodes (35): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+27 more)

### Community 7 - "knowledge-base/page.tsx"
Cohesion: 0.09
Nodes (25): useModelTasks(), InterviewPage(), emptyKnowledge, FieldProps, ImportResult, isExperienceEmpty(), isProjectEmpty(), KnowledgeForm (+17 more)

### Community 8 - "BillingService"
Cohesion: 0.17
Nodes (4): addDays(), addLimit(), BillingService, orderNumber()

### Community 9 - "app.ts"
Cohesion: 0.14
Nodes (15): buildApp(), BuildAppOptions, app, billingService, config, database, handleAuthError(), handleBillingError() (+7 more)

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (47): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+39 more)

### Community 11 - "stores.ts"
Cohesion: 0.08
Nodes (37): ApplicationsPage(), formatUpdateTime(), readApplicationBoard(), FeedbackSkeleton(), InterviewSkeleton(), Feedback, icons, PracticeCard (+29 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.10
Nodes (21): AuthRouteOptions, AuthServicePort, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, registerAuthRoutes() (+13 more)

### Community 13 - "ai/routes.ts"
Cohesion: 0.08
Nodes (49): asObject(), hasResumeContent(), JsonObject, validateJobDescription(), ValidationResult, Analysis, bodyOf(), breakdownWeights (+41 more)

### Community 14 - "toast.tsx"
Cohesion: 0.16
Nodes (12): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, DeleteConfirmModal(), Modal(), SectionTitle() (+4 more)

### Community 15 - "useToast"
Cohesion: 0.16
Nodes (15): AuthGate(), authQueryKey, CurrentUser, useLogout(), useToast(), localizedNumericString, LoginPage(), otpSchema (+7 more)

### Community 16 - "AuthService"
Cohesion: 0.16
Nodes (7): AuthService, normalizePhone(), toAuthUser(), tokenHash(), AuthUser, UserRole, UserStatus

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.11
Nodes (28): orderFilterParsers, Response, statusOptions, Payment, paymentFilterParsers, Response, statusOptions, collectionOptions (+20 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "apiRequest"
Cohesion: 0.17
Nodes (18): AdminOrdersPage(), OrdersPage(), UpgradePage(), ApiError, apiRequest(), notifyPlanUpgradeRequired(), apiUrl(), AdminMembershipDetails (+10 more)

### Community 21 - "tasks"
Cohesion: 0.11
Nodes (19): nextConfig, ^build, .next/**, dependsOn, outputs, cache, dependsOn, persistent (+11 more)

### Community 22 - "billing/routes.ts"
Cohesion: 0.11
Nodes (17): requirePermission(), adjustCreditSchema, adminListSchema, callbackSchema, cancelSchema, createOrderSchema, extendSchema, grantPlanSchema (+9 more)

### Community 23 - "compilerOptions"
Cohesion: 0.06
Nodes (30): compilerOptions, allowImportingTsExtensions, allowJs, incremental, isolatedModules, jsx, lib, module (+22 more)

### Community 24 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 25 - "web/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 26 - "match/page.tsx"
Cohesion: 0.11
Nodes (22): CircularProgress(), CircularProgressProps, createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue (+14 more)

### Community 28 - "KnowledgeBasePage"
Cohesion: 0.26
Nodes (20): blankExperience(), blankLanguage(), blankProject(), blankQualification(), experienceFromResume(), KnowledgeBasePage(), mergeImportedKnowledge(), normalizeExperience() (+12 more)

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
Cohesion: 0.20
Nodes (18): AuthServiceOptions, RequestOtpResult, VerifyOtpResult, BillingServiceOptions, UsageCosts, UsageResource, usageResourceLabels, authSessions (+10 more)

### Community 38 - "ZarinpalClient"
Cohesion: 0.24
Nodes (4): ZarinpalClient, ZarinpalData, ZarinpalError, ZarinpalResponse

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.08
Nodes (18): PostgresRecordRepository, RecordRepository, CollectionParams, parseCollection(), RecordParams, registerDataRoutes(), MemoryRecordRepository, metadata (+10 more)

### Community 41 - "panel-shell.tsx"
Cohesion: 0.13
Nodes (23): adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems, pageTitles, PanelShell() (+15 more)

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

### Community 47 - "normalizeImportedText"
Cohesion: 0.35
Nodes (15): canonicalDates(), canonicalExperience(), canonicalId(), canonicalLanguage(), canonicalProject(), canonicalQualification(), normalizeDataRecordForStorage(), normalizeImportedBoolean() (+7 more)

### Community 48 - "memberships/page.tsx"
Cohesion: 0.10
Nodes (24): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, localizedNumber() (+16 more)

### Community 49 - "admin-stats.ts"
Cohesion: 0.15
Nodes (15): UserRole, AdminPage(), collectionLabels, formatNumber(), AdminBillingStats, adminBillingStatsQueryKey, AdminEvent, adminEventsQueryKey (+7 more)

### Community 50 - "dashboard/page.tsx"
Cohesion: 0.11
Nodes (23): JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), toneStyles, barHeightClass(), DashboardPage(), DashboardState (+15 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "data-routes.test.ts"
Cohesion: 0.10
Nodes (37): isStandaloneTechnicalToken(), serializeResumeSkills(), allowedHostSuffixes, decodeEntities(), extractAttribute(), extractCompanyLogoUrl(), extractJobText(), extractMetaContent() (+29 more)

### Community 53 - "job-application-filter.ts"
Cohesion: 0.27
Nodes (9): DatedApplication, hasJobActivityInDateRange(), isTimeInRange(), JobIdentity, normalizedIdentity(), normalizedPart(), rangeBoundary(), applications (+1 more)

### Community 55 - "Database"
Cohesion: 0.18
Nodes (7): createDatabase(), Database, database, migrationsFolder, database, now, timestamp

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "model-usage/page.tsx"
Cohesion: 0.29
Nodes (11): AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number(), operationLabels, percent(), RecentModelRequest (+3 more)

### Community 58 - "jobs/page.tsx"
Cohesion: 0.14
Nodes (16): categoryOptions, JobsPage(), applicationStore, jobStore, ClassifiableJob, inferJobCategories(), JobCategory, matchesJobCategory() (+8 more)

### Community 63 - "table-page-size.ts"
Cohesion: 0.29
Nodes (8): PaginationItem, paginationItems(), TablePagination(), AuthResponse, positivePageParser, TablePageSize, tablePageSizes, tablePaginationParsers

### Community 66 - "resume-section-flow.ts"
Cohesion: 0.24
Nodes (7): ResumeEducation, createContinuationResumePage(), enforceResumeSectionFlow(), hasResumeSectionFlowViolation(), hasWorkContent(), projectRoot, repositoryRoot

### Community 67 - "resume-import.test.mjs"
Cohesion: 0.39
Nodes (6): KnowledgeProfileRecord, calculateKnowledgeCompletion(), isSeededKnowledgeSampleProject(), KnowledgeCompletionData, normalizeImportedResumeData(), normalizeResumeImportPayload()

### Community 68 - "jalali-date-picker.tsx"
Cohesion: 0.27
Nodes (15): JalaliDatePicker(), JalaliDatePickerProps, weekDays, addCalendarDays(), atNoon(), formatPersianCalendarDate(), formatPersianCalendarMonth(), getPersianDateParts() (+7 more)

### Community 69 - "match-analysis.ts"
Cohesion: 0.43
Nodes (6): boundedScore(), defaultBreakdownLabels, MatchAnalysis, normalizeMatchAnalysisInput(), objectOf(), normalizeImportedTextArray()

### Community 76 - "users/page.tsx"
Cohesion: 0.22
Nodes (14): useAuth(), MembershipsAdminPage(), AdminPaymentsPage(), AdminRecordsPage(), AdminUser, AdminUsersPage(), PendingUserAction, roleLabels (+6 more)

## Knowledge Gaps
- **478 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+473 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `resume-document.tsx` to `jalali-date-picker.tsx`, `resumes/page.tsx`, `knowledge-base/page.tsx`, `panel-shell.tsx`, `stores.ts`, `toast.tsx`, `admin/orders/page.tsx`, `dashboard/page.tsx`, `match/page.tsx`, `KnowledgeBasePage`, `table-page-size.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Why does `DataCollection` connect `DataCollection` to `validators/src/index.ts`, `stores.ts`, `data-routes.test.ts`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `resumes/page.tsx`, `knowledge-base/page.tsx`, `DataCollection`, `panel-shell.tsx`, `stores.ts`, `users/page.tsx`, `useToast`, `memberships/page.tsx`, `admin/orders/page.tsx`, `dashboard/page.tsx`, `admin-stats.ts`, `model-usage/page.tsx`, `match/page.tsx`, `table-page-size.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _478 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06428237494156147 - nodes in this community are weakly interconnected._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.083710407239819 - nodes in this community are weakly interconnected._