# Graph Report - resumeMaker  (2026-08-18)

## Corpus Check
- 73 files · ~178,057 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 607 nodes · 1449 edges · 33 communities (26 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cc57bfe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- resume-document.tsx
- llm-client.ts
- resume-data.ts
- knowledge-base/page.tsx
- dependencies
- devDependencies
- DataCollection
- stores.ts
- resume-builder.tsx
- compilerOptions
- formatPersianNumber
- dashboard/page.tsx
- panel-shell.tsx
- interview/page.tsx
- job-import/route.ts
- match/page.tsx
- resumes/page.tsx
- chatgpt-auth.ts
- model-task-provider.tsx
- notes/route.ts
- worker/index.ts
- login/page.tsx
- app/layout.tsx
- eslint.config.mjs
- next.config.ts
- postcss.config.mjs
- vite.config.ts
- job-card.tsx
- vinext-starter
- Data access
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `cn()` - 68 edges
2. `KnowledgeBasePage()` - 30 edges
3. `createRecordId()` - 26 edges
4. `getResumeEducations()` - 25 edges
5. `getDefaultResumeColor()` - 23 edges
6. `getResumeExperiences()` - 21 edges
7. `formatPersianNumber()` - 21 edges
8. `getResumePresentation()` - 20 edges
9. `documentClass()` - 20 edges
10. `formatDateRange()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Shimmer()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/_components/loading-skeletons.tsx → lib/cn.ts
- `LoadingContext()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/_components/loading-skeletons.tsx → lib/cn.ts
- `SkeletonLines()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/_components/loading-skeletons.tsx → lib/cn.ts
- `KnowledgeCardsSkeleton()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/knowledge-base/page.tsx → lib/cn.ts
- `Field()` --calls--> `cn()`  [EXTRACTED]
  app/(panel)/knowledge-base/page.tsx → lib/cn.ts

## Import Cycles
- None detected.

## Communities (33 total, 7 thin omitted)

### Community 0 - "resume-document.tsx"
Cohesion: 0.10
Nodes (66): getDefaultResumeColor(), getResumeEducations(), getResumeExperiences(), getResumeProjects(), AngularTechnicalEducation(), AngularTechnicalHeading(), AngularTechnicalResume(), BannerModernResume() (+58 more)

### Community 1 - "llm-client.ts"
Cohesion: 0.08
Nodes (46): Feedback, POST(), InterviewSession, POST(), extensionOf(), extractFileText(), ImportedKnowledge, POST() (+38 more)

### Community 2 - "resume-data.ts"
Cohesion: 0.07
Nodes (50): experienceWeight(), OneColumnPageDraft, paginateOneColumnResume(), paginateResumeData(), projectWeight(), ResumeColorId, ResumeData, ResumeEducation (+42 more)

### Community 3 - "knowledge-base/page.tsx"
Cohesion: 0.10
Nodes (39): blankExperience(), blankLanguage(), blankProject(), blankQualification(), emptyKnowledge, experienceFromResume(), Field(), FieldProps (+31 more)

### Community 4 - "dependencies"
Cohesion: 0.05
Nodes (40): drizzle-orm, @fontsource/poppins, @fontsource-variable/vazirmatn, @hookform/resolvers, lucide-react, mammoth, next, dependencies (+32 more)

### Community 5 - "devDependencies"
Cohesion: 0.06
Nodes (33): @cloudflare/vite-plugin, drizzle-kit, eslint, eslint-config-next, devDependencies, @cloudflare/vite-plugin, drizzle-kit, eslint (+25 more)

### Community 6 - "DataCollection"
Cohesion: 0.17
Nodes (8): DataCollection, COLLECTIONS, DataRepository, HttpDataRepository, IndexedDbRepository, LEGACY_DATABASE_NAME, requestToPromise(), transactionToPromise()

### Community 7 - "stores.ts"
Cohesion: 0.16
Nodes (19): ApplicationRecord, AppProfileRecord, BaseRecord, DashboardSnapshotRecord, InterviewSessionRecord, JobRecord, MatchAnalysisData, MatchAnalysisRecord (+11 more)

### Community 8 - "resume-builder.tsx"
Cohesion: 0.12
Nodes (24): EditableLanguage, normalizeProficiency(), parseEditableLanguages(), proficiencyLabel(), proficiencyOptions, Props, ResumeBuilder(), ResumeLanguageEditor() (+16 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "formatPersianNumber"
Cohesion: 0.21
Nodes (14): ApplicationsPage(), formatUpdateTime(), pipelineStages, JobCard(), ApplicationsSkeleton(), useToast(), SectionTitle(), InterviewPage() (+6 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.17
Nodes (12): CircularProgress(), CircularProgressProps, barHeightClass(), DashboardPage(), DashboardState, dashboardTitle(), formatDate(), stageLabels (+4 more)

### Community 12 - "panel-shell.tsx"
Cohesion: 0.18
Nodes (12): initials(), menuItems, PanelShell(), PanelShellContent(), ToastContext, ToastNotifier, ToastState, ToastVariant (+4 more)

### Community 13 - "interview/page.tsx"
Cohesion: 0.09
Nodes (19): DashboardSkeleton(), FeedbackSkeleton(), GenerationShimmer(), InterviewSkeleton(), JobCardsSkeleton(), LoadingContext(), MatchAnalysisSkeleton(), ResumePreviewSkeleton() (+11 more)

### Community 14 - "job-import/route.ts"
Cohesion: 0.33
Nodes (11): ALLOWED_HOST_SUFFIXES, decodeEntities(), extractJobText(), extractMetaContent(), isAllowedHost(), normalizeWhitespace(), pickJobPosting(), POST() (+3 more)

### Community 15 - "match/page.tsx"
Cohesion: 0.19
Nodes (13): useModelTasks(), getJobTextDirection(), ImportJobResponse, JobSourceMode, MatchAnalysis, MatchPage(), ResumeOption, scoreWidth() (+5 more)

### Community 16 - "resumes/page.tsx"
Cohesion: 0.20
Nodes (14): categoryByTag, getDefaultResumeName(), getTemplateCategory(), prioritizePinnedResumes(), restoreTailoredJobDetails(), resumeFromKnowledge(), ResumePageTab, ResumesPage() (+6 more)

### Community 17 - "chatgpt-auth.ts"
Cohesion: 0.39
Nodes (8): chatGPTSignInPath(), chatGPTSignOutPath(), ChatGPTUser, getChatGPTUser(), isReservedAuthPath(), requireChatGPTUser(), safeDecodeURIComponent(), safeRelativeReturnPath()

### Community 18 - "model-task-provider.tsx"
Cohesion: 0.25
Nodes (8): createTaskId(), ModelTask, ModelTaskContext, ModelTaskContextValue, ModelTaskProvider(), ModelTaskStateProvider(), ModelTaskStatus, RunModelTaskInput

### Community 19 - "notes/route.ts"
Cohesion: 0.39
Nodes (5): getDb(), GET(), POST(), toRouteErrorMessage(), notes

### Community 20 - "worker/index.ts"
Cohesion: 0.29
Nodes (3): Env, ExecutionContext, worker

### Community 21 - "login/page.tsx"
Cohesion: 0.33
Nodes (4): otpSchema, OtpValues, phoneSchema, PhoneValues

### Community 29 - "job-card.tsx"
Cohesion: 0.24
Nodes (6): JobCardData, toneStyles, DeleteConfirmModal(), Modal(), Job, JobTone

### Community 30 - "vinext-starter"
Cohesion: 0.22
Nodes (8): Included Shape, Learn More, Optional Dispatch-Owned ChatGPT Sign-In, Prerequisites, Quick Start, Useful Commands, vinext-starter, Workspace Auth Headers

## Knowledge Gaps
- **169 isolated node(s):** `CircularProgressProps`, `toneStyles`, `JobCardData`, `SkeletonProps`, `ModelTaskStatus` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `resume-document.tsx` to `knowledge-base/page.tsx`, `resume-builder.tsx`, `formatPersianNumber`, `panel-shell.tsx`, `interview/page.tsx`, `match/page.tsx`, `resumes/page.tsx`, `job-card.tsx`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `ResumeData` connect `resume-data.ts` to `resume-document.tsx`, `llm-client.ts`, `knowledge-base/page.tsx`, `stores.ts`, `resume-builder.tsx`, `match/page.tsx`, `resumes/page.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `DataCollection` connect `DataCollection` to `stores.ts`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `KnowledgeBasePage()` (e.g. with `normalizeExperience()` and `normalizeLanguage()`) actually correct?**
  _`KnowledgeBasePage()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `CircularProgressProps`, `toneStyles`, `JobCardData` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `resume-document.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09974424552429667 - nodes in this community are weakly interconnected._
- **Should `llm-client.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._