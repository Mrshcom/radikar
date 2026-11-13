# Graph Report - web  (2026-11-13)

## Corpus Check
- 298 files · ~1,915,420 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1602 nodes · 4240 edges · 93 communities (77 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9bbe6d46`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- use-rendered-resume-pagination.ts
- billing.ts
- cn
- stores.ts
- admin/radicoins/page.tsx
- marketing-sections.tsx
- knowledge-base/page.tsx
- session.ts
- lib-utilities.test.ts
- admin/updates/page.tsx
- useToast
- table-page-size.ts
- compilerOptions
- AdminModelUsagePage
- employer.ts
- panel-shell.tsx
- referrals.ts
- edit/page.tsx
- devDependencies
- createPageMetadata
- [id]/page.tsx
- dependencies
- onboarding-provider.tsx
- support-workspace.tsx
- users/page.tsx
- memberships/page.tsx
- useEmployerProfile
- resume-builder.tsx
- dashboard/page.tsx
- match/page.tsx
- admin-stats.ts
- userDisplayName
- index.ts
- resumes/page.tsx
- resume-bank/page.tsx
- api/[...path]/route.ts
- login/page.tsx
- job-card.tsx
- apiRequest
- admin/settings/page.tsx
- job-pool/page.tsx
- interview/page.tsx
- range-slider.tsx
- interview-invites/page.tsx
- panel-navigation-progress.tsx
- model-task-provider.tsx
- formatPersianNumber
- scripts
- fa-number.ts
- employer/radicoins/page.tsx
- providers.tsx
- interview-result.tsx
- jobs/page.tsx
- repository.ts
- job-pool.ts
- invited-interview.tsx
- seo-page.tsx
- getBrowserQueryClient
- chatgpt-auth.ts
- status-state.tsx
- model-task-stack.tsx
- site.ts
- (marketing)/layout.tsx
- interview-answer-composer.tsx
- login/layout.tsx
- interview-conversation.tsx
- lib-critical-utilities.test.ts
- interviews/page.tsx
- interview-depth-chooser.tsx
- interview-message-intent.ts
- interview-practice-dialog.tsx
- package.json
- upgrade-link.tsx
- app/layout.tsx
- interview-progress.tsx
- لایه داده Web
- next.config.ts
- This is NOT the Next.js you know
- privacy/page.tsx
- public.spec.ts
- eslint.config.mjs
- lucide-react
- next
- react-dom
- @tanstack/react-query
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `cn()` - 128 edges
2. `apiRequest()` - 120 edges
3. `useToast()` - 59 edges
4. `useAuth()` - 49 edges
5. `KnowledgeBasePage()` - 33 edges
6. `formatPersianNumber()` - 33 edges
7. `SectionTitle()` - 30 edges
8. `createRecordId()` - 29 edges
9. `getResumeEducations()` - 27 edges
10. `PanelShellContent()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `GuidesPage()` --calls--> `absoluteUrl()`  [EXTRACTED]
  app/(marketing)/guides/page.tsx → lib/site.ts
- `InterviewSubmenu()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/_components/panel-shell.tsx → lib/cn.ts
- `KnowledgeSectionSkeleton()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/_components/skeletons/knowledge-skeletons.tsx → lib/cn.ts
- `Field()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/knowledge-base/page.tsx → lib/cn.ts
- `Providers()` --indirect_call--> `getBrowserQueryClient()`  [INFERRED]
  app/providers.tsx → lib/query-client.ts

## Import Cycles
- None detected.

## Communities (93 total, 16 thin omitted)

### Community 0 - "use-rendered-resume-pagination.ts"
Cohesion: 0.09
Nodes (47): getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve(), PAGE_BOTTOM_RESERVE, PAGE_TOP_RESERVE, DEFAULT_SECTION_ORDER, getResumeFlowSections() (+39 more)

### Community 1 - "billing.ts"
Cohesion: 0.08
Nodes (31): { apiRequest }, InterviewPackAction(), OrdersPage(), formatCoinAmount(), RadicoinsPage(), sourceIcons, sourceLabels, CheckoutForm (+23 more)

### Community 2 - "cn"
Cohesion: 0.05
Nodes (97): ApplicationsSkeleton(), DashboardSkeleton(), GenerationShimmer(), InterviewSkeleton(), JobCardsSkeleton(), MatchAnalysisSkeleton(), ResumePreviewSkeleton(), ResumesSkeleton() (+89 more)

### Community 3 - "stores.ts"
Cohesion: 0.08
Nodes (36): repository, ApplicationsPage(), readApplicationBoard(), ResumeProject, applicationPipelineStages, createSavedApplicationForJob(), moveApplicationToStage(), synchronizeJobsWithApplicationBoard() (+28 more)

### Community 4 - "admin/radicoins/page.tsx"
Cohesion: 0.15
Nodes (19): ActionForm, actionSchema, AdminRadicoinsPage(), numberValue, userName(), AccountType, accountTypeFilterOptions, accountTypeFilterParser (+11 more)

### Community 5 - "marketing-sections.tsx"
Cohesion: 0.08
Nodes (25): AnimatedNumber(), BorderBeam(), DotPattern(), Marquee(), Meteors(), MarketingAuthLink(), MarketingAuthLinkProps, marketingFaqs (+17 more)

### Community 6 - "knowledge-base/page.tsx"
Cohesion: 0.13
Nodes (36): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+28 more)

### Community 7 - "session.ts"
Cohesion: 0.08
Nodes (26): adminRoutes, paidPlan, resume, resumeData, adminStats, aiSettings, apiBaseUrl, billingStats (+18 more)

### Community 8 - "lib-utilities.test.ts"
Cohesion: 0.09
Nodes (28): Reader, ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField() (+20 more)

### Community 9 - "admin/updates/page.tsx"
Cohesion: 0.10
Nodes (25): AdminProductUpdatesPage(), emptyForm(), FormInput, FormOutput, kindLabels, PanelPageTitle(), formatDate(), ProductUpdatesPage() (+17 more)

### Community 10 - "useToast"
Cohesion: 0.17
Nodes (17): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, useToast(), mocks, LongMessageTrigger() (+9 more)

### Community 11 - "table-page-size.ts"
Cohesion: 0.26
Nodes (8): AuthResponse, positivePageParser, TablePageSize, tablePageSizes, tablePaginationParsers, modelUsageDaysParser, tableOptionalFilterParser, tableSearchParser

### Community 12 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dist, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 13 - "AdminModelUsagePage"
Cohesion: 0.29
Nodes (8): AdminModelUsagePage(), dateTime(), downloadCsv(), number(), percent(), UsageTable(), usd(), useAdminModelUsage()

### Community 14 - "employer.ts"
Cohesion: 0.27
Nodes (10): EmployerResumePreview(), ResumePreview(), apiUrl(), EmployerCandidate, EmployerPositionDetail, EmployerProfile, useEmployerBankResume(), useEmployerBankResumeFile() (+2 more)

### Community 15 - "panel-shell.tsx"
Cohesion: 0.12
Nodes (24): adminEventHref(), adminEventMessage(), adminEventSeenStorageKey(), adminEventTime(), employerMenuItems, getPanelBreadcrumbs(), interviewSubItems, InterviewSubmenu() (+16 more)

### Community 16 - "referrals.ts"
Cohesion: 0.13
Nodes (19): Checkbox, CheckboxProps, JoinPage(), ReferralSettingsForm(), ReferralSettingsFormValues, referralSettingsSchema, inviteSteps, ReferralsPage() (+11 more)

### Community 17 - "edit/page.tsx"
Cohesion: 0.13
Nodes (19): EmployerSetup(), profileSchema, ProfileValues, availableHiringStep(), HiringWorkflow(), HiringWorkflowProps, NextStepGuideProps, steps (+11 more)

### Community 18 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+19 more)

### Community 19 - "createPageMetadata"
Cohesion: 0.10
Nodes (10): metadata, metadata, metadata, SeoPage(), metadata, metadata, metadata, metadata (+2 more)

### Community 20 - "[id]/page.tsx"
Cohesion: 0.25
Nodes (8): candidateLabel(), EmployerPositionPage(), fileSchema, invitationPresentation(), inviteSchema, mobileFormSchema, statusLabel(), state

### Community 21 - "dependencies"
Cohesion: 0.08
Nodes (25): @fontsource/poppins, @fontsource-variable/vazirmatn, framer-motion, @hookform/resolvers, nuqs, dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn (+17 more)

### Community 22 - "onboarding-provider.tsx"
Cohesion: 0.11
Nodes (21): OnboardingState, OnboardingStepId, items, OnboardingChecklistModal(), AuthResponse, buildTourSteps(), OnboardingContext, OnboardingContextValue (+13 more)

### Community 23 - "support-workspace.tsx"
Cohesion: 0.07
Nodes (26): LocalizedNumberInput(), TextAreaField, TextField(), TextFieldProps, numberValue, RadicoinSettingsForm(), RadicoinSettingsFormValues, radicoinSettingsSchema (+18 more)

### Community 24 - "users/page.tsx"
Cohesion: 0.08
Nodes (53): SearchableSelect(), SearchableSelectOption, SearchableSelectProps, modelUsageFilterParsers, operationLabels, RecentModelRequest, AdminOrdersPage(), orderFilterParsers (+45 more)

### Community 25 - "memberships/page.tsx"
Cohesion: 0.06
Nodes (37): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, MembershipAction (+29 more)

### Community 26 - "useEmployerProfile"
Cohesion: 0.18
Nodes (13): EmployerDashboardPage(), statTones, statusMeta, SuggestedAction, EmployerPositionsPage(), EmployerProfilePage(), FormValues, schema (+5 more)

### Community 27 - "resume-builder.tsx"
Cohesion: 0.13
Nodes (23): AtsMatchSummary, EditableLanguage, normalizeProficiency(), parseEditableLanguages(), proficiencyLabel(), proficiencyOptions, Props, ResumeBuilder() (+15 more)

### Community 28 - "dashboard/page.tsx"
Cohesion: 0.13
Nodes (17): emptyState, panelSurface, panelSurfacePadded, primaryAction, scoreWidthClass(), secondaryAction, barHeightClass(), DashboardPage() (+9 more)

### Community 29 - "match/page.tsx"
Cohesion: 0.15
Nodes (17): useModelTasks(), getJobTextDirection(), ImportJobResponse, isMatchAnalysisTaskContext(), JobSourceMode, MatchAnalysisTaskContext, MatchPage(), ResumeOption (+9 more)

### Community 30 - "admin-stats.ts"
Cohesion: 0.11
Nodes (22): { apiRequest }, AdminPage(), collectionLabels, formatNumber(), AdminAiSettings, adminAiSettingsQueryKey, AdminBillingStats, adminBillingStatsQueryKey (+14 more)

### Community 31 - "userDisplayName"
Cohesion: 0.16
Nodes (17): CenterLink, EmployerAccountCenterPage(), groups, AccountCenterPage(), AccountGroup, accountGroups, AccountLink, MembershipsAdminPage() (+9 more)

### Community 32 - "index.ts"
Cohesion: 0.29
Nodes (4): ModelThinkingOrb(), KnowledgeCardsSkeleton(), KnowledgePageSkeleton(), KnowledgeSectionSkeleton()

### Community 33 - "resumes/page.tsx"
Cohesion: 0.14
Nodes (22): DeleteConfirmModal(), Modal(), categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge() (+14 more)

### Community 34 - "resume-bank/page.tsx"
Cohesion: 0.15
Nodes (15): EmployerResumeBankPage(), emptyResumes, fileSchema, initialFilters, invitationStates, newestPositionFirst(), normalizeSearch(), PositionInterviewList() (+7 more)

### Community 35 - "api/[...path]/route.ts"
Cohesion: 0.13
Nodes (16): DELETE, GET, OPTIONS, PATCH, POST, proxy(), PUT, DELETE (+8 more)

### Community 36 - "login/page.tsx"
Cohesion: 0.19
Nodes (12): localizedNumericString, LoginPage(), logReversedOtpFromResponse(), otpSchema, OtpValues, phoneSchema, PhoneValues, { apiRequest, notify, prefetch, replace } (+4 more)

### Community 37 - "job-card.tsx"
Cohesion: 0.18
Nodes (12): JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), JobLogo(), job, toneStyles, PanelLink() (+4 more)

### Community 38 - "apiRequest"
Cohesion: 0.09
Nodes (27): { apiRequest, replace, route }, AuthGate(), authQueryKey, CurrentUser, sharedCustomerPaths, useAuth(), useLogout(), UserRole (+19 more)

### Community 39 - "admin/settings/page.tsx"
Cohesion: 0.15
Nodes (15): AdminSettingsPage(), AdminSettingsTab, defaultJobPoolLocations, FormValues, JobPoolFormValues, jobPoolLocationOptions, jobPoolSchema, schema (+7 more)

### Community 40 - "job-pool/page.tsx"
Cohesion: 0.20
Nodes (17): AdminJobPoolPage(), apifyField(), apifyFieldLabel(), apifyFieldLabels, apifyLogo(), apifyText(), apifyValue(), apifyWideFields (+9 more)

### Community 41 - "interview/page.tsx"
Cohesion: 0.23
Nodes (14): isModelTaskCanceledError(), answerSchema, icons, interviewModeFor(), InterviewPage(), isAffirmativeReadiness(), isComprehensiveMode(), isInterviewMode() (+6 more)

### Community 42 - "range-slider.tsx"
Cohesion: 0.18
Nodes (9): clamp(), RangeSlider(), RangeSliderProps, stepPrecision(), clamp(), ImageEditorModal(), ImageEditorModalProps, ImageMetrics (+1 more)

### Community 43 - "interview-invites/page.tsx"
Cohesion: 0.39
Nodes (6): Interview, InterviewInvitesPage(), invitationActionLabel(), invitationStatus(), isActionableInvitation(), mocks

### Community 45 - "model-task-provider.tsx"
Cohesion: 0.18
Nodes (9): createTaskId(), ModelTaskCanceledError, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput (+1 more)

### Community 46 - "formatPersianNumber"
Cohesion: 0.27
Nodes (10): InterviewRadarChart(), point(), RadarTopic, getInterviewTopics(), InterviewTopicRadar(), legacyCategories, report, Topic (+2 more)

### Community 47 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, lint, start, test, test:e2e, test:e2e:report (+5 more)

### Community 48 - "fa-number.ts"
Cohesion: 0.22
Nodes (11): RangeInput(), RangeInputProps, CurrencyTooltip(), CurrencyTooltipProps, HoverTooltip(), HoverTooltipProps, TooltipPosition, formatDollarMicrosToTomans() (+3 more)

### Community 49 - "employer/radicoins/page.tsx"
Cohesion: 0.26
Nodes (10): EmployerRadicoinStorePage(), FormValues, schema, statusLabels, RadicoinPack, radicoinPackKeys, RadicoinPackOrder, useCreateRadicoinPackOrder() (+2 more)

### Community 50 - "providers.tsx"
Cohesion: 0.21
Nodes (5): metadata, state, PanelShell(), metadata, Providers()

### Community 51 - "interview-result.tsx"
Cohesion: 0.20
Nodes (8): CircularProgress(), CircularProgressProps, InterviewReportHero(), InterviewReportView(), InterviewReportViewData, InterviewResult(), InterviewSessionRecord, interviewSessionStore

### Community 53 - "jobs/page.tsx"
Cohesion: 0.20
Nodes (10): JobPoolCard(), categoryOptions, JobsPageTab, boundedMatchParser, jobFilterParsers, jobFilterUrlKeys, JobScope, jobScopes (+2 more)

### Community 54 - "repository.ts"
Cohesion: 0.20
Nodes (3): apiRequest, queryClient, DataRepository

### Community 55 - "job-pool.ts"
Cohesion: 0.22
Nodes (10): JobPoolPreview(), JobsPage(), JobPoolPageSize, jobPoolPageSizes, jobPoolQueryKey(), jobRecommendationQueryKey(), JobRecommendationResponse, PublicJobPoolResponse (+2 more)

### Community 56 - "invited-interview.tsx"
Cohesion: 0.16
Nodes (7): alertStyles, AlertTone, answerSchema, formatInvitationDeadline(), Invitation, InvitedInterview(), mocks

### Community 57 - "seo-page.tsx"
Cohesion: 0.27
Nodes (7): JsonLd(), SeoFaq, SeoSection, guides, GuidesPage(), metadata, siteConfig

### Community 58 - "getBrowserQueryClient"
Cohesion: 0.42
Nodes (3): HttpDataRepository, createQueryClient(), getBrowserQueryClient()

### Community 59 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 62 - "model-task-stack.tsx"
Cohesion: 0.31
Nodes (7): ModelTask, ModelTaskStack(), TaskCard(), taskDescription(), taskTone, failedSession, tasks

### Community 65 - "site.ts"
Cohesion: 0.42
Nodes (5): privatePaths, robots(), publicRoutes, sitemap(), absoluteUrl()

### Community 66 - "(marketing)/layout.tsx"
Cohesion: 0.25
Nodes (6): MarketingFooter(), MarketingHeader(), metadata, organizationSchema, revalidate, websiteSchema

### Community 68 - "interview-answer-composer.tsx"
Cohesion: 0.39
Nodes (4): InterviewAnswerComposer(), InterviewAnswerComposerProps, resizeTextarea(), submitInterviewAnswerOnEnter()

### Community 69 - "login/layout.tsx"
Cohesion: 0.38
Nodes (4): LoginLayout(), cookies, getServerAuthUser(), ServerAuthUser

### Community 71 - "lib-critical-utilities.test.ts"
Cohesion: 0.10
Nodes (30): CalendarPosition, JalaliDatePicker(), JalaliDatePickerProps, weekDays, createContinuationResumePage(), enforceResumeSectionFlow(), hasResumeSectionFlowViolation(), hasWorkContent() (+22 more)

### Community 72 - "interviews/page.tsx"
Cohesion: 0.33
Nodes (7): candidateLabel(), EmployerInterviewResultsPage(), InvitationFilter, invitationStates, mocks, tookPart(), useSetEmployerInterviewFeedbackSharing()

### Community 73 - "interview-depth-chooser.tsx"
Cohesion: 0.60
Nodes (3): InterviewDepthChooser(), interviewDepthLabel(), options

### Community 74 - "interview-message-intent.ts"
Cohesion: 0.60
Nodes (3): isInterviewClarification(), isUnrelatedInterviewQuestion(), unrelatedInterviewQuestionReply

### Community 76 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 80 - "لایه داده Web"
Cohesion: 0.50
Nodes (3): تنظیم Web, قرارداد HTTP, لایه داده Web

### Community 81 - "next.config.ts"
Cohesion: 0.50
Nodes (3): apiProxyOrigin, monorepoRoot, nextConfig

## Knowledge Gaps
- **490 isolated node(s):** `CenterLink`, `groups`, `statusMeta`, `statTones`, `SuggestedAction` (+485 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `marketing-sections.tsx`, `knowledge-base/page.tsx`, `useToast`, `panel-shell.tsx`, `referrals.ts`, `support-workspace.tsx`, `users/page.tsx`, `memberships/page.tsx`, `resume-builder.tsx`, `match/page.tsx`, `userDisplayName`, `index.ts`, `resumes/page.tsx`, `job-card.tsx`, `job-pool/page.tsx`, `range-slider.tsx`, `panel-navigation-progress.tsx`, `formatPersianNumber`, `fa-number.ts`, `jobs/page.tsx`, `job-pool.ts`, `model-task-stack.tsx`, `lib-critical-utilities.test.ts`, `upgrade-link.tsx`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `billing.ts`, `admin/radicoins/page.tsx`, `knowledge-base/page.tsx`, `lib-utilities.test.ts`, `admin/updates/page.tsx`, `useToast`, `table-page-size.ts`, `AdminModelUsagePage`, `employer.ts`, `panel-shell.tsx`, `referrals.ts`, `edit/page.tsx`, `[id]/page.tsx`, `onboarding-provider.tsx`, `support-workspace.tsx`, `users/page.tsx`, `memberships/page.tsx`, `useEmployerProfile`, `resume-builder.tsx`, `dashboard/page.tsx`, `match/page.tsx`, `admin-stats.ts`, `userDisplayName`, `resume-bank/page.tsx`, `login/page.tsx`, `admin/settings/page.tsx`, `job-pool/page.tsx`, `interview/page.tsx`, `interview-invites/page.tsx`, `employer/radicoins/page.tsx`, `jobs/page.tsx`, `repository.ts`, `job-pool.ts`, `invited-interview.tsx`, `getBrowserQueryClient`, `interviews/page.tsx`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `lucide-react`, `next`, `react-dom`, `@tanstack/react-query`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CenterLink`, `groups`, `statusMeta` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08748114630467571 - nodes in this community are weakly interconnected._
- **Should `billing.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._