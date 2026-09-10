# Graph Report - resumeMaker  (2026-09-10)

## Corpus Check
- 175 files · ~230,048 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1474 nodes · 3236 edges · 90 communities (79 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bba12430`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- use-rendered-resume-pagination.ts
- data-routes.test.ts
- applications/page.tsx
- scripts
- dependencies
- resume-builder.tsx
- resume-data.ts
- BillingService
- app.ts
- dependencies
- formatPersianNumber
- auth/routes.ts
- apiRequest
- toast.tsx
- jobs/page.tsx
- AuthService
- admin/orders/page.tsx
- devDependencies
- dashboard/page.tsx
- tasks
- billing/routes.ts
- compilerOptions
- scripts
- web/package.json
- table-page-size.ts
- react-dom
- stores.ts
- compilerOptions
- رادیکار — Resume Maker
- database/package.json
- compilerOptions
- config/package.json
- compilerOptions
- shared-types/package.json
- validators/package.json
- auth/service.ts
- billing/service.ts
- chatgpt-auth.ts
- DataCollection
- knowledge-base/page.tsx
- ai/package.json
- shared-types/tsconfig.json
- validators/tsconfig.json
- compilerOptions
- job-import.ts
- auth.tsx
- admin-stats.ts
- match/page.tsx
- compilerOptions
- ai/routes.ts
- react
- memberships/page.tsx
- validators/src/index.ts
- job-url.ts
- marketing-sections.tsx
- @fontsource-variable/vazirmatn
- AGENTS.md
- job-description-validation.ts
- @radicar/shared-types
- loading-skeletons.tsx
- eslint.config.mjs
- api/[...path]/route.ts
- panel-shell.tsx
- @hookform/resolvers
- field-direction.ts
- postcss.config.mjs
- config/src/index.ts
- jalali-date-picker.tsx
- resume-pagination-profile.ts
- استقرار Production رادیکار
- normalizeImportedText
- backup-postgres.sh
- build-app.ts
- Database
- resumes/page.tsx
- job-application-filter.ts
- resume-import.test.mjs
- model-usage/page.tsx
- match-analysis.ts
- data/routes.ts
- resume-section-heading-visibility.ts
- useRenderedResumePagination
- resume-pagination-layout.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 81 edges
2. `apiRequest()` - 43 edges
3. `KnowledgeBasePage()` - 36 edges
4. `DataCollection` - 35 edges
5. `normalizeImportedText()` - 32 edges
6. `BillingService` - 29 edges
7. `useAuth()` - 27 edges
8. `useToast()` - 27 edges
9. `createRecordId()` - 27 edges
10. `registerAiRoutes()` - 26 edges

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

## Communities (90 total, 11 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.09
Nodes (69): DataTableSkeleton(), getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume() (+61 more)

### Community 1 - "use-rendered-resume-pagination.ts"
Cohesion: 0.18
Nodes (24): getResumeFlowSections(), getResumePaginationFlows(), appendText(), clonePage(), getCandidate(), getPageContentKey(), getPagesLayoutKey(), getRenderedFlow() (+16 more)

### Community 2 - "data-routes.test.ts"
Cohesion: 0.14
Nodes (24): isStandaloneTechnicalToken(), serializeResumeSkills(), AuthServicePort, applyEmbeddedLinkFallbacks(), applyTextFallbacks(), buildResumeImportPrompt(), extensionOf(), extractContactFallbacks() (+16 more)

### Community 3 - "applications/page.tsx"
Cohesion: 0.29
Nodes (10): ApplicationsPage(), formatUpdateTime(), readApplicationBoard(), applicationPipelineStages, createSavedApplicationForJob(), moveApplicationToStage(), synchronizeJobsWithApplicationBoard(), ApplicationRecord (+2 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (36): devDependencies, turbo, engines, node, turbo, name, packageManager, private (+28 more)

### Community 5 - "dependencies"
Cohesion: 0.12
Nodes (17): dependencies, @fontsource/poppins, lucide-react, next, nuqs, @radicar/validators, react-hook-form, @tanstack/react-query (+9 more)

### Community 6 - "resume-builder.tsx"
Cohesion: 0.15
Nodes (15): EditableLanguage, normalizeProficiency(), parseEditableLanguages(), proficiencyLabel(), proficiencyOptions, Props, ResumeLanguageEditor(), serializeLanguages() (+7 more)

### Community 7 - "resume-data.ts"
Cohesion: 0.21
Nodes (15): emptyResumeData, experienceWeight(), OneColumnPageDraft, paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeEducation, selectableResumeTemplates (+7 more)

### Community 8 - "BillingService"
Cohesion: 0.22
Nodes (3): addDays(), addLimit(), BillingService

### Community 9 - "app.ts"
Cohesion: 0.20
Nodes (8): app, billingService, config, database, ApiConfig, environmentSchema, loadLocalEnvironment(), readConfig()

### Community 10 - "dependencies"
Cohesion: 0.04
Nodes (48): dependencies, drizzle-orm, fastify, @fastify/cookie, @fastify/cors, @fastify/multipart, mammoth, @radicar/ai (+40 more)

### Community 11 - "formatPersianNumber"
Cohesion: 0.20
Nodes (12): JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), JobLogo(), toneStyles, Modal(), Job (+4 more)

### Community 12 - "auth/routes.ts"
Cohesion: 0.11
Nodes (19): AuthRouteOptions, cookieOptions(), eventListSchema, fastify, FastifyRequest, recordListSchema, requestOtpSchema, updatePreferencesSchema (+11 more)

### Community 13 - "apiRequest"
Cohesion: 0.22
Nodes (23): useAuth(), AccountPage(), MembershipsAdminPage(), AdminOrdersPage(), AdminPaymentsPage(), AdminRecordsPage(), AdminUsersPage(), OrdersPage() (+15 more)

### Community 14 - "toast.tsx"
Cohesion: 0.16
Nodes (13): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, ApiError, clearPendingPlanUpgradeMessage(), getPendingPlanUpgradeMessage() (+5 more)

### Community 15 - "jobs/page.tsx"
Cohesion: 0.13
Nodes (17): JobCardsSkeleton(), categoryOptions, JobsPage(), applicationStore, jobStore, ClassifiableJob, inferJobCategories(), JobCategory (+9 more)

### Community 16 - "AuthService"
Cohesion: 0.18
Nodes (6): AuthService, normalizePhone(), toAuthUser(), tokenHash(), UserRole, UserStatus

### Community 17 - "admin/orders/page.tsx"
Cohesion: 0.09
Nodes (38): orderFilterParsers, Response, statusOptions, Payment, paymentFilterParsers, Response, statusOptions, collectionOptions (+30 more)

### Community 18 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 19 - "dashboard/page.tsx"
Cohesion: 0.17
Nodes (13): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+5 more)

### Community 21 - "tasks"
Cohesion: 0.10
Nodes (21): apiProxyOrigin, monorepoRoot, nextConfig, ^build, .next/**, dependsOn, outputs, cache (+13 more)

### Community 22 - "billing/routes.ts"
Cohesion: 0.12
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

### Community 26 - "table-page-size.ts"
Cohesion: 0.43
Nodes (5): AuthResponse, positivePageParser, TablePageSize, tablePageSizes, tablePaginationParsers

### Community 28 - "stores.ts"
Cohesion: 0.10
Nodes (27): Feedback, icons, PracticeCard, SessionData, AppProfileRecord, InterviewFeedbackRecord, InterviewSessionRecord, KnowledgeExperience (+19 more)

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

### Community 37 - "auth/service.ts"
Cohesion: 0.17
Nodes (16): AuthError, AuthServiceOptions, RequestOtpResult, VerifyOtpResult, aiSettings, authSessions, dataRecords, membershipEvents (+8 more)

### Community 38 - "billing/service.ts"
Cohesion: 0.12
Nodes (11): BillingError, BillingServiceOptions, orderNumber(), UsageCosts, UsageResource, usageResourceLabels, ZarinpalClient, ZarinpalData (+3 more)

### Community 39 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 40 - "DataCollection"
Cohesion: 0.09
Nodes (13): PostgresRecordRepository, RecordRepository, parseCollection(), registerDataRoutes(), MemoryRecordRepository, metadata, Providers(), BaseRecord (+5 more)

### Community 41 - "knowledge-base/page.tsx"
Cohesion: 0.12
Nodes (37): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+29 more)

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

### Community 47 - "job-import.ts"
Cohesion: 0.25
Nodes (16): allowedHostSuffixes, decodeEntities(), extractAttribute(), extractCompanyLogoUrl(), extractJobText(), extractMetaContent(), getLinkedInJobId(), isAllowedHost() (+8 more)

### Community 48 - "auth.tsx"
Cohesion: 0.13
Nodes (17): AuthGate(), authQueryKey, CurrentUser, useLogout(), UserRole, localizedNumericString, LoginPage(), otpSchema (+9 more)

### Community 49 - "admin-stats.ts"
Cohesion: 0.11
Nodes (21): AdminPage(), collectionLabels, formatNumber(), AdminSettingsPage(), FormValues, schema, AdminAiSettings, adminAiSettingsQueryKey (+13 more)

### Community 50 - "match/page.tsx"
Cohesion: 0.11
Nodes (21): createTaskId(), isModelTaskCanceledError(), ModelTask, ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider() (+13 more)

### Community 51 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, module, moduleResolution, noEmit, types, extends, include, node (+3 more)

### Community 52 - "ai/routes.ts"
Cohesion: 0.08
Nodes (56): asObject(), hasResumeContent(), JsonObject, validateJobDescription(), ValidationResult, aiSettingsSchema, Analysis, bodyOf() (+48 more)

### Community 54 - "memberships/page.tsx"
Cohesion: 0.11
Nodes (20): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, membershipFilterParsers (+12 more)

### Community 55 - "validators/src/index.ts"
Cohesion: 0.13
Nodes (23): aliasedObjectInput(), baseRecordSchema, boundedImportedArray(), collectionInput(), collectionWrapperKeys, firstDefined(), importedBooleanSchema, importedExperienceSchema (+15 more)

### Community 56 - "job-url.ts"
Cohesion: 0.83
Nodes (3): getLinkedInJobId(), isLinkedInHost(), resolveJobUrls()

### Community 57 - "marketing-sections.tsx"
Cohesion: 0.14
Nodes (16): DemoSection(), faqs, FaqSection(), features, FeaturesSection(), FinalCta(), HeroSection(), MarketingFooter() (+8 more)

### Community 64 - "loading-skeletons.tsx"
Cohesion: 0.13
Nodes (12): ApplicationsSkeleton(), DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton() (+4 more)

### Community 66 - "api/[...path]/route.ts"
Cohesion: 0.13
Nodes (16): DELETE, GET, OPTIONS, PATCH, POST, proxy(), PUT, DELETE (+8 more)

### Community 67 - "panel-shell.tsx"
Cohesion: 0.18
Nodes (17): useToast(), useModelTasks(), adminEventHref(), adminEventMessage(), adminEventTime(), initials(), MenuItem, menuItems (+9 more)

### Community 69 - "field-direction.ts"
Cohesion: 0.19
Nodes (16): MultiSkillAutocomplete(), parseSkills(), ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES (+8 more)

### Community 73 - "jalali-date-picker.tsx"
Cohesion: 0.27
Nodes (15): JalaliDatePicker(), JalaliDatePickerProps, weekDays, addCalendarDays(), atNoon(), formatPersianCalendarDate(), formatPersianCalendarMonth(), getPersianDateParts() (+7 more)

### Community 74 - "resume-pagination-profile.ts"
Cohesion: 0.14
Nodes (9): DEFAULT_SECTION_ORDER, profiles, ResumePaginationFlow, ResumePaginationProfile, ResumePaginationSection, STANDARD_TWO_COLUMN_PROFILE, templatePreviewData, projectRoot (+1 more)

### Community 75 - "استقرار Production رادیکار"
Cohesion: 0.25
Nodes (7): DeepSeek محلی, آماده‌سازی, اجرا, استقرار Production رادیکار, انتشار نسخه جدید, پشتیبان‌گیری PostgreSQL, پیش‌نیاز

### Community 76 - "normalizeImportedText"
Cohesion: 0.37
Nodes (14): canonicalDates(), canonicalExperience(), canonicalId(), canonicalLanguage(), canonicalProject(), canonicalQualification(), normalizeDataRecordForStorage(), normalizeImportedText() (+6 more)

### Community 79 - "build-app.ts"
Cohesion: 0.33
Nodes (9): buildApp(), BuildAppOptions, handleAuthError(), registerAuthRoutes(), requirePermission(), handleBillingError(), registerBillingRoutes(), registerHealthRoutes() (+1 more)

### Community 80 - "Database"
Cohesion: 0.20
Nodes (7): createDatabase(), Database, database, migrationsFolder, database, now, timestamp

### Community 81 - "resumes/page.tsx"
Cohesion: 0.18
Nodes (14): DeleteConfirmModal(), SectionTitle(), categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge() (+6 more)

### Community 82 - "job-application-filter.ts"
Cohesion: 0.27
Nodes (9): DatedApplication, hasJobActivityInDateRange(), isTimeInRange(), JobIdentity, normalizedIdentity(), normalizedPart(), rangeBoundary(), applications (+1 more)

### Community 83 - "resume-import.test.mjs"
Cohesion: 0.39
Nodes (6): KnowledgeProfileRecord, calculateKnowledgeCompletion(), isSeededKnowledgeSampleProject(), KnowledgeCompletionData, normalizeImportedResumeData(), normalizeResumeImportPayload()

### Community 84 - "model-usage/page.tsx"
Cohesion: 0.29
Nodes (11): AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number(), operationLabels, percent(), RecentModelRequest (+3 more)

### Community 85 - "match-analysis.ts"
Cohesion: 0.43
Nodes (6): boundedScore(), defaultBreakdownLabels, MatchAnalysis, normalizeMatchAnalysisInput(), objectOf(), normalizeImportedTextArray()

### Community 86 - "data/routes.ts"
Cohesion: 0.24
Nodes (6): CollectionParams, RecordParams, ApiError, dataCollections, DataRecord, dataCollectionSchema

### Community 87 - "resume-section-heading-visibility.ts"
Cohesion: 0.38
Nodes (9): getContinuedResumeSections(), getHeadingSection(), normalizeHeading(), pageHasSection(), ResumeHeadingSection, SECTION_BY_HEADING, SECTION_HEADING_ALIASES, syncRenderedResumeSectionHeadings() (+1 more)

### Community 88 - "useRenderedResumePagination"
Cohesion: 0.46
Nodes (6): ResumeData, ResumeDocument(), ResumeDocumentPage(), ScaledResumePreview(), useRenderedResumePagination(), normalizeResumeDataInput()

### Community 89 - "resume-pagination-layout.ts"
Cohesion: 0.43
Nodes (6): getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve(), PAGE_BOTTOM_RESERVE, PAGE_TOP_RESERVE

## Knowledge Gaps
- **513 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+508 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataCollection` connect `DataCollection` to `data-routes.test.ts`, `stores.ts`, `data/routes.ts`, `validators/src/index.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `cn()` connect `resume-document.tsx` to `loading-skeletons.tsx`, `panel-shell.tsx`, `field-direction.ts`, `resume-builder.tsx`, `jalali-date-picker.tsx`, `knowledge-base/page.tsx`, `formatPersianNumber`, `toast.tsx`, `jobs/page.tsx`, `admin/orders/page.tsx`, `match/page.tsx`, `resumes/page.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `BillingService` connect `BillingService` to `data-routes.test.ts`, `auth/service.ts`, `billing/service.ts`, `app.ts`, `build-app.ts`, `Database`, `job-import.ts`, `ai/routes.ts`, `billing/routes.ts`, `data/routes.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _513 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.091324200913242 - nodes in this community are weakly interconnected._
- **Should `data-routes.test.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14153846153846153 - nodes in this community are weakly interconnected._