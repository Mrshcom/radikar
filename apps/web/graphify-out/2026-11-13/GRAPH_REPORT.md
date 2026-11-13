# Graph Report - web  (2026-11-13)

## Corpus Check
- 298 files · ~1,914,529 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1596 nodes · 4226 edges · 98 communities (83 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9bbe6d46`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- use-rendered-resume-pagination.ts
- useAuth
- cn
- stores.ts
- memberships/page.tsx
- marketing-sections.tsx
- knowledge-base/page.tsx
- session.ts
- lib-utilities.test.ts
- admin/updates/page.tsx
- useToast
- resume-document.tsx
- compilerOptions
- model-usage/page.tsx
- users/page.tsx
- panel-shell.tsx
- referrals.ts
- [id]/page.tsx
- devDependencies
- createPageMetadata
- getResumeEducations
- dependencies
- onboarding-provider.tsx
- support-workspace.tsx
- records/page.tsx
- date-time-display.tsx
- employer.ts
- resume-builder.tsx
- dashboard/page.tsx
- match/page.tsx
- admin-stats.ts
- userDisplayName
- apiRequest
- resumes/page.tsx
- resume-bank/page.tsx
- api/[...path]/route.ts
- login/page.tsx
- job-card.tsx
- auth.tsx
- admin/settings/page.tsx
- job-pool/page.tsx
- interview/page.tsx
- range-slider.tsx
- text-field.tsx
- resume-data.ts
- model-task-provider.tsx
- formatPersianNumber
- scripts
- fa-number.ts
- employer/radicoins/page.tsx
- providers.tsx
- interview-result.tsx
- data-table.tsx
- jobs/page.tsx
- repository.ts
- job-pool.ts
- invited-interview.tsx
- seo-page.tsx
- getBrowserQueryClient
- chatgpt-auth.ts
- status-state.tsx
- admin/page.tsx
- model-task-stack.tsx
- time-picker.tsx
- paginateResumeData
- site.ts
- (marketing)/layout.tsx
- radicoin-settings-form.tsx
- interview-answer-composer.tsx
- login/layout.tsx
- interview-conversation.tsx
- job-category.ts
- EmployerInterviewResultsPage
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
- `TimeColumn()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/_components/time-picker.tsx → lib/cn.ts
- `SectionHeading()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/resumes/resume-document.tsx → lib/cn.ts
- `CenterlineHeading()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/resumes/resume-document.tsx → lib/cn.ts
- `PastelBandHeading()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/resumes/resume-document.tsx → lib/cn.ts

## Import Cycles
- None detected.

## Communities (98 total, 15 thin omitted)

### Community 0 - "use-rendered-resume-pagination.ts"
Cohesion: 0.05
Nodes (71): CalendarPosition, JalaliDatePicker(), JalaliDatePickerProps, weekDays, getFlowContentBounds(), getPageFlows(), getRenderedPageLayout(), getScaledReserve() (+63 more)

### Community 1 - "useAuth"
Cohesion: 0.08
Nodes (43): { apiRequest }, useAuth(), AccountPage(), MembershipsAdminPage(), AdminOrdersPage(), orderFilterParsers, Response, statusOptions (+35 more)

### Community 2 - "cn"
Cohesion: 0.07
Nodes (35): PanelNavigationProgress(), ProgressStage, InterviewSubmenu(), KnowledgeCardsSkeleton(), KnowledgePageSkeleton(), KnowledgeSectionSkeleton(), ApplicationsSkeleton(), DashboardSkeleton() (+27 more)

### Community 3 - "stores.ts"
Cohesion: 0.08
Nodes (33): repository, ApplicationsPage(), readApplicationBoard(), applicationPipelineStages, createSavedApplicationForJob(), moveApplicationToStage(), synchronizeJobsWithApplicationBoard(), ApplicationRecord (+25 more)

### Community 4 - "memberships/page.tsx"
Cohesion: 0.08
Nodes (35): cancelSchema, creditSchema, detailNumber(), detailString(), eventContent(), extendSchema, grantSchema, MembershipAction (+27 more)

### Community 5 - "marketing-sections.tsx"
Cohesion: 0.08
Nodes (25): AnimatedNumber(), BorderBeam(), DotPattern(), Marquee(), Meteors(), MarketingAuthLink(), MarketingAuthLinkProps, marketingFaqs (+17 more)

### Community 6 - "knowledge-base/page.tsx"
Cohesion: 0.14
Nodes (35): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), FieldProps, ImportResult (+27 more)

### Community 7 - "session.ts"
Cohesion: 0.08
Nodes (26): adminRoutes, paidPlan, resume, resumeData, adminStats, aiSettings, apiBaseUrl, billingStats (+18 more)

### Community 8 - "lib-utilities.test.ts"
Cohesion: 0.10
Nodes (27): Reader, ALWAYS_LTR_INPUT_TYPES, applyFieldDirection(), applyWithin(), DirectionalField, getFieldDirection(), IGNORED_INPUT_TYPES, isDirectionalField() (+19 more)

### Community 9 - "admin/updates/page.tsx"
Cohesion: 0.11
Nodes (24): AdminProductUpdatesPage(), emptyForm(), FormInput, FormOutput, kindLabels, formatDate(), ProductUpdatesPage(), statusLabels (+16 more)

### Community 10 - "useToast"
Cohesion: 0.12
Nodes (21): ToastContext, ToastNotifier, ToastProvider(), ToastState, ToastVariant, useToast(), Interview, InterviewInvitesPage() (+13 more)

### Community 11 - "resume-document.tsx"
Cohesion: 0.09
Nodes (27): CenterlineHeading(), colorPalettes, EducationEntries(), ENGLISH_PROFICIENCY_LABELS, getExternalHref(), getInitials(), getLanguageItems(), getLinkedInProfileLabel() (+19 more)

### Community 12 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dist, dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts (+22 more)

### Community 13 - "model-usage/page.tsx"
Cohesion: 0.11
Nodes (21): SearchableSelect(), SearchableSelectOption, SearchableSelectProps, AdminModelUsagePage(), dateTime(), downloadCsv(), modelUsageFilterParsers, number() (+13 more)

### Community 14 - "users/page.tsx"
Cohesion: 0.13
Nodes (19): InvitationFilter, invitationStates, adjustmentSchema, AdjustmentValues, AdminUser, roleLabels, userFilterParsers, UsersResponse (+11 more)

### Community 15 - "panel-shell.tsx"
Cohesion: 0.12
Nodes (25): useLogout(), adminEventHref(), adminEventMessage(), adminEventSeenStorageKey(), adminEventTime(), employerMenuItems, getPanelBreadcrumbs(), interviewSubItems (+17 more)

### Community 16 - "referrals.ts"
Cohesion: 0.11
Nodes (23): Checkbox, CheckboxProps, JoinPage(), AdminReferralsPage(), userName(), ReferralSettingsForm(), ReferralSettingsFormValues, referralSettingsSchema (+15 more)

### Community 17 - "[id]/page.tsx"
Cohesion: 0.12
Nodes (20): availableHiringStep(), HiringWorkflow(), HiringWorkflowProps, NextStepGuideProps, steps, PositionForm(), PositionFormProps, positionSchema (+12 more)

### Community 18 - "devDependencies"
Cohesion: 0.07
Nodes (27): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+19 more)

### Community 19 - "createPageMetadata"
Cohesion: 0.10
Nodes (10): metadata, metadata, metadata, SeoPage(), metadata, metadata, metadata, metadata (+2 more)

### Community 20 - "getResumeEducations"
Cohesion: 0.32
Nodes (25): getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), AngularTechnicalResume(), BannerModernResume(), CenterlineMarketingResume(), CorporateCompetenciesResume(), DarkSidebarTimelineResume() (+17 more)

### Community 21 - "dependencies"
Cohesion: 0.08
Nodes (25): @fontsource/poppins, @fontsource-variable/vazirmatn, framer-motion, @hookform/resolvers, nuqs, dependencies, @fontsource/poppins, @fontsource-variable/vazirmatn (+17 more)

### Community 22 - "onboarding-provider.tsx"
Cohesion: 0.11
Nodes (21): OnboardingState, OnboardingStepId, items, OnboardingChecklistModal(), AuthResponse, buildTourSteps(), OnboardingContext, OnboardingContextValue (+13 more)

### Community 23 - "support-workspace.tsx"
Cohesion: 0.10
Nodes (15): AccountType, categoryText, CreateInput, createSchema, dateLabel(), Detail, Message, ReplyInput (+7 more)

### Community 24 - "records/page.tsx"
Cohesion: 0.16
Nodes (17): collectionOptions, recordFilterParsers, RecordRow, RecordsResponse, SortState, orderFilterParsers, statusLabel, statusOptions (+9 more)

### Community 25 - "date-time-display.tsx"
Cohesion: 0.12
Nodes (17): InterviewPackAction(), EmployerMembershipStats, employerStatItems, emptyEmployerStats, MembershipSummary(), remainingDays(), usageItems, UsageKey (+9 more)

### Community 26 - "employer.ts"
Cohesion: 0.15
Nodes (16): EmployerDashboardPage(), statTones, statusMeta, SuggestedAction, EmployerResumePreview(), EmployerPositionsPage(), state, EmployerCandidate (+8 more)

### Community 27 - "resume-builder.tsx"
Cohesion: 0.13
Nodes (17): useModelTasks(), ModelThinkingOrb(), AtsMatchSummary, EditableLanguage, normalizeProficiency(), parseEditableLanguages(), proficiencyLabel(), proficiencyOptions (+9 more)

### Community 28 - "dashboard/page.tsx"
Cohesion: 0.13
Nodes (16): emptyState, panelSurface, panelSurfacePadded, primaryAction, scoreWidthClass(), secondaryAction, barHeightClass(), DashboardPage() (+8 more)

### Community 29 - "match/page.tsx"
Cohesion: 0.16
Nodes (18): getJobTextDirection(), ImportJobResponse, isMatchAnalysisTaskContext(), JobSourceMode, MatchAnalysisTaskContext, MatchPage(), ResumeOption, ResumeColorId (+10 more)

### Community 30 - "admin-stats.ts"
Cohesion: 0.12
Nodes (18): { apiRequest }, AdminAiSettings, adminAiSettingsQueryKey, AdminBillingStats, adminBillingStatsQueryKey, AdminEvent, adminEventsQueryKey, AdminJobPool (+10 more)

### Community 31 - "userDisplayName"
Cohesion: 0.18
Nodes (14): CenterLink, EmployerAccountCenterPage(), groups, AccountCenterPage(), AccountGroup, accountGroups, AccountLink, UserEditModal() (+6 more)

### Community 32 - "apiRequest"
Cohesion: 0.16
Nodes (17): EmployerSetup(), profileSchema, ProfileValues, NewEmployerPositionPage(), EmployerProfilePage(), FormValues, schema, SettingsPage() (+9 more)

### Community 33 - "resumes/page.tsx"
Cohesion: 0.16
Nodes (17): DeleteConfirmModal(), categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab (+9 more)

### Community 34 - "resume-bank/page.tsx"
Cohesion: 0.14
Nodes (18): EmployerResumeBankPage(), emptyResumes, fileSchema, initialFilters, invitationStates, newestPositionFirst(), normalizeSearch(), PositionInterviewList() (+10 more)

### Community 35 - "api/[...path]/route.ts"
Cohesion: 0.13
Nodes (16): DELETE, GET, OPTIONS, PATCH, POST, proxy(), PUT, DELETE (+8 more)

### Community 36 - "login/page.tsx"
Cohesion: 0.18
Nodes (13): localizedNumericString, LoginPage(), logReversedOtpFromResponse(), otpSchema, OtpValues, phoneSchema, PhoneValues, { apiRequest, notify, prefetch, replace } (+5 more)

### Community 37 - "job-card.tsx"
Cohesion: 0.15
Nodes (13): JobCard(), JobCardData, JobDetailsData, JobDetailsModal(), JobLogo(), job, toneStyles, JobPoolCard() (+5 more)

### Community 38 - "auth.tsx"
Cohesion: 0.14
Nodes (12): { apiRequest, replace, route }, AuthGate(), authQueryKey, CurrentUser, sharedCustomerPaths, UserRole, PageLoader(), schema (+4 more)

### Community 39 - "admin/settings/page.tsx"
Cohesion: 0.15
Nodes (16): AdminSettingsPage(), AdminSettingsTab, defaultJobPoolLocations, FormValues, JobPoolFormValues, jobPoolLocationOptions, jobPoolSchema, schema (+8 more)

### Community 40 - "job-pool/page.tsx"
Cohesion: 0.21
Nodes (16): AdminJobPoolPage(), apifyField(), apifyFieldLabel(), apifyFieldLabels, apifyLogo(), apifyText(), apifyValue(), apifyWideFields (+8 more)

### Community 41 - "interview/page.tsx"
Cohesion: 0.21
Nodes (15): isModelTaskCanceledError(), answerSchema, icons, interviewModeFor(), InterviewPage(), isAffirmativeReadiness(), isComprehensiveMode(), isInterviewMode() (+7 more)

### Community 42 - "range-slider.tsx"
Cohesion: 0.18
Nodes (9): clamp(), RangeSlider(), RangeSliderProps, stepPrecision(), clamp(), ImageEditorModal(), ImageEditorModalProps, ImageMetrics (+1 more)

### Community 43 - "text-field.tsx"
Cohesion: 0.20
Nodes (9): LocalizedNumberInput(), TextAreaField, TextField(), TextFieldProps, searchSchema, SearchValues, TableFilterSelect(), TableToolbar() (+1 more)

### Community 44 - "resume-data.ts"
Cohesion: 0.20
Nodes (12): emptyResumeData, OneColumnPageDraft, resumeColorOptions, ResumeEducation, ResumeExperience, ResumeLanguage, ResumeProject, resumeTemplates (+4 more)

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
Cohesion: 0.32
Nodes (8): RangeInput(), RangeInputProps, CurrencyTooltip(), CurrencyTooltipProps, formatDollarMicrosToTomans(), formatDollarTextToTomans(), formatGroupedNumber(), normalizeNumericInput()

### Community 49 - "employer/radicoins/page.tsx"
Cohesion: 0.26
Nodes (10): EmployerRadicoinStorePage(), FormValues, schema, statusLabels, RadicoinPack, radicoinPackKeys, RadicoinPackOrder, useCreateRadicoinPackOrder() (+2 more)

### Community 50 - "providers.tsx"
Cohesion: 0.21
Nodes (5): metadata, state, PanelShell(), metadata, Providers()

### Community 51 - "interview-result.tsx"
Cohesion: 0.20
Nodes (8): CircularProgress(), CircularProgressProps, InterviewReportHero(), InterviewReportView(), InterviewReportViewData, InterviewResult(), InterviewSessionRecord, interviewSessionStore

### Community 52 - "data-table.tsx"
Cohesion: 0.30
Nodes (10): compareSortValues(), DataTable(), DataTableEmptyState(), DataTableErrorState(), getMobileTableViewportServerSnapshot(), getMobileTableViewportSnapshot(), normalizeSortText(), SortDirection (+2 more)

### Community 53 - "jobs/page.tsx"
Cohesion: 0.23
Nodes (9): categoryOptions, JobsPageTab, applicationStore, boundedMatchParser, jobFilterParsers, jobFilterUrlKeys, JobScope, jobScopes (+1 more)

### Community 54 - "repository.ts"
Cohesion: 0.18
Nodes (4): apiRequest, queryClient, BaseRecord, DataRepository

### Community 55 - "job-pool.ts"
Cohesion: 0.22
Nodes (10): JobPoolPreview(), JobsPage(), JobPoolPageSize, jobPoolPageSizes, jobPoolQueryKey(), jobRecommendationQueryKey(), JobRecommendationResponse, PublicJobPoolResponse (+2 more)

### Community 56 - "invited-interview.tsx"
Cohesion: 0.22
Nodes (6): alertStyles, AlertTone, answerSchema, Invitation, InvitedInterview(), mocks

### Community 57 - "seo-page.tsx"
Cohesion: 0.27
Nodes (7): JsonLd(), SeoFaq, SeoSection, guides, GuidesPage(), metadata, siteConfig

### Community 58 - "getBrowserQueryClient"
Cohesion: 0.42
Nodes (3): HttpDataRepository, createQueryClient(), getBrowserQueryClient()

### Community 59 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 61 - "admin/page.tsx"
Cohesion: 0.31
Nodes (7): AdminPage(), collectionLabels, formatNumber(), HoverTooltipProps, TooltipPosition, useAdminBillingStats(), useAdminStats()

### Community 62 - "model-task-stack.tsx"
Cohesion: 0.31
Nodes (7): ModelTask, ModelTaskStack(), TaskCard(), taskDescription(), taskTone, failedSession, tasks

### Community 63 - "time-picker.tsx"
Cohesion: 0.28
Nodes (8): displayTime(), hours, minutes, persianTime, safeTime(), TimeColumn(), TimePicker(), TimePickerProps

### Community 64 - "paginateResumeData"
Cohesion: 0.31
Nodes (9): experienceWeight(), getResumeProjects(), paginateOneColumnResume(), paginateResumeData(), projectGroupsForTemplate(), projectGroupWeight(), projectWeight(), ProjectEntries() (+1 more)

### Community 65 - "site.ts"
Cohesion: 0.42
Nodes (5): privatePaths, robots(), publicRoutes, sitemap(), absoluteUrl()

### Community 66 - "(marketing)/layout.tsx"
Cohesion: 0.25
Nodes (6): MarketingFooter(), MarketingHeader(), metadata, organizationSchema, revalidate, websiteSchema

### Community 67 - "radicoin-settings-form.tsx"
Cohesion: 0.32
Nodes (7): numberValue, RadicoinSettingsForm(), RadicoinSettingsFormValues, radicoinSettingsSchema, rewardFields, useRadicoinAdminSettings(), useUpdateRadicoinSettings()

### Community 68 - "interview-answer-composer.tsx"
Cohesion: 0.39
Nodes (4): InterviewAnswerComposer(), InterviewAnswerComposerProps, resizeTextarea(), submitInterviewAnswerOnEnter()

### Community 69 - "login/layout.tsx"
Cohesion: 0.38
Nodes (4): LoginLayout(), cookies, getServerAuthUser(), ServerAuthUser

### Community 71 - "job-category.ts"
Cohesion: 0.48
Nodes (5): ClassifiableJob, inferJobCategories(), JobCategory, matchesJobCategory(), normalized()

### Community 72 - "EmployerInterviewResultsPage"
Cohesion: 0.33
Nodes (5): candidateLabel(), EmployerInterviewResultsPage(), mocks, tookPart(), useSetEmployerInterviewFeedbackSharing()

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
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `use-rendered-resume-pagination.ts`, `marketing-sections.tsx`, `knowledge-base/page.tsx`, `useToast`, `resume-document.tsx`, `model-usage/page.tsx`, `users/page.tsx`, `panel-shell.tsx`, `referrals.ts`, `getResumeEducations`, `resume-builder.tsx`, `match/page.tsx`, `userDisplayName`, `resumes/page.tsx`, `job-card.tsx`, `job-pool/page.tsx`, `range-slider.tsx`, `text-field.tsx`, `formatPersianNumber`, `fa-number.ts`, `data-table.tsx`, `jobs/page.tsx`, `job-pool.ts`, `admin/page.tsx`, `model-task-stack.tsx`, `time-picker.tsx`, `paginateResumeData`, `upgrade-link.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `apiRequest()` connect `apiRequest` to `useAuth`, `memberships/page.tsx`, `knowledge-base/page.tsx`, `admin/updates/page.tsx`, `useToast`, `model-usage/page.tsx`, `users/page.tsx`, `panel-shell.tsx`, `referrals.ts`, `[id]/page.tsx`, `onboarding-provider.tsx`, `support-workspace.tsx`, `records/page.tsx`, `date-time-display.tsx`, `employer.ts`, `resume-builder.tsx`, `dashboard/page.tsx`, `match/page.tsx`, `admin-stats.ts`, `userDisplayName`, `resume-bank/page.tsx`, `login/page.tsx`, `auth.tsx`, `admin/settings/page.tsx`, `job-pool/page.tsx`, `interview/page.tsx`, `employer/radicoins/page.tsx`, `jobs/page.tsx`, `repository.ts`, `job-pool.ts`, `invited-interview.tsx`, `getBrowserQueryClient`, `admin/page.tsx`, `radicoin-settings-form.tsx`, `EmployerInterviewResultsPage`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CenterLink`, `groups`, `statusMeta` to the rest of the system?**
  _490 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `use-rendered-resume-pagination.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05238095238095238 - nodes in this community are weakly interconnected._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.08272859216255443 - nodes in this community are weakly interconnected._