type SkeletonProps = { label?: string };

function Shimmer({ className = "" }: { className?: string }) {
  return <span className={`shimmer-block ${className}`} aria-hidden="true" />;
}

function LoadingContext({ children }: { children: string }) {
  return <div className="loading-context"><i />{children}</div>;
}

function SkeletonJobCard() {
  return <article className="job-card skeleton-job-card" aria-hidden="true">
    <div className="job-card-top"><Shimmer className="shimmer-logo" /><Shimmer className="shimmer-pill" /></div>
    <Shimmer className="shimmer-title" /><Shimmer className="shimmer-company" /><Shimmer className="shimmer-place" />
    <div className="skeleton-card-foot"><Shimmer className="shimmer-short" /><Shimmer className="shimmer-action" /></div>
  </article>;
}

export function JobCardsSkeleton({ count = 8, dashboard = false }: { count?: number; dashboard?: boolean }) {
  return <div className={dashboard ? "job-cards skeleton-grid" : "job-list-page skeleton-grid"} role="status" aria-label="در حال دریافت فرصت‌های شغلی">
    {Array.from({ length: count }, (_, index) => <SkeletonJobCard key={index} />)}
  </div>;
}

export function DashboardSkeleton() {
  return <div className="page-skeleton dashboard-skeleton" role="status" aria-live="polite">
    <LoadingContext>در حال تحلیل رزومه و ساخت نمای کلی داشبورد</LoadingContext>
    <div className="skeleton-section-title"><div><Shimmer className="shimmer-heading" /><Shimmer className="shimmer-subtitle" /></div><Shimmer className="shimmer-button" /></div>
    <section className="hero-grid">
      <div className="career-card skeleton-hero"><div><Shimmer className="shimmer-badge" /><Shimmer className="shimmer-hero-title" /><Shimmer className="shimmer-copy wide" /><Shimmer className="shimmer-copy" /><Shimmer className="shimmer-button" /></div><Shimmer className="shimmer-ring" /></div>
      <div className="panel skeleton-ai-card"><Shimmer className="shimmer-logo" /><Shimmer className="shimmer-badge" /><Shimmer className="shimmer-title" /><Shimmer className="shimmer-copy wide" /><Shimmer className="shimmer-copy" /><Shimmer className="shimmer-button full" /></div>
    </section>
    <section className="stats-row">{Array.from({ length: 4 }, (_, index) => <div className="stat-card skeleton-stat" key={index}><Shimmer className="shimmer-logo" /><div><Shimmer className="shimmer-short" /><Shimmer className="shimmer-stat-value" /><Shimmer className="shimmer-company" /></div></div>)}</section>
    <section className="dashboard-columns">
      <div className="panel skeleton-list-panel"><Shimmer className="shimmer-panel-title" />{Array.from({ length: 4 }, (_, index) => <div className="skeleton-list-row" key={index}><Shimmer className="shimmer-logo" /><div><Shimmer className="shimmer-company" /><Shimmer className="shimmer-short" /></div><Shimmer className="shimmer-pill" /></div>)}</div>
      <div className="panel skeleton-chart-panel"><Shimmer className="shimmer-panel-title" /><div className="skeleton-bars">{Array.from({ length: 7 }, (_, index) => <Shimmer className="shimmer-bar" key={index} />)}</div><div className="skeleton-chart-summary"><Shimmer /><Shimmer /><Shimmer /></div></div>
    </section>
    <section className="panel jobs-panel skeleton-jobs-panel"><Shimmer className="shimmer-panel-title" /><JobCardsSkeleton count={3} dashboard /></section>
  </div>;
}

function SkeletonKanbanCard() {
  return <article className="kanban-card skeleton-kanban-card" aria-hidden="true"><div><Shimmer className="shimmer-logo small" /><Shimmer className="shimmer-company" /></div><Shimmer className="shimmer-title" /><Shimmer className="shimmer-pill" /><Shimmer className="shimmer-copy" /></article>;
}

export function ApplicationsSkeleton() {
  return <div className="page-skeleton" role="status" aria-live="polite">
    <LoadingContext>در حال ساخت ستون‌ها و وضعیت اپلای‌ها</LoadingContext>
    <div className="skeleton-section-title"><div><Shimmer className="shimmer-heading" /><Shimmer className="shimmer-subtitle" /></div><Shimmer className="shimmer-button" /></div>
    <div className="pipeline-summary skeleton-summary"><Shimmer /><Shimmer /><Shimmer /></div>
    <div className="kanban skeleton-kanban">{Array.from({ length: 4 }, (_, column) => <section className="kanban-column" key={column}><div className="kanban-head"><Shimmer className="shimmer-company" /><Shimmer className="shimmer-count" /></div><SkeletonKanbanCard /><SkeletonKanbanCard /></section>)}</div>
  </div>;
}

export function InterviewSkeleton() {
  return <div className="page-skeleton" role="status" aria-live="polite">
    <LoadingContext>در حال تولید جلسه و سؤال‌های مصاحبه متناسب با رزومه</LoadingContext>
    <div className="skeleton-section-title"><div><Shimmer className="shimmer-heading" /><Shimmer className="shimmer-subtitle" /></div></div>
    <div className="interview-hero skeleton-interview-hero"><div><Shimmer className="shimmer-badge" /><Shimmer className="shimmer-hero-title" /><Shimmer className="shimmer-copy wide" /><Shimmer className="shimmer-copy" /><Shimmer className="shimmer-meta" /><Shimmer className="shimmer-button" /></div><Shimmer className="shimmer-orb" /></div>
    <div className="practice-grid">{Array.from({ length: 3 }, (_, index) => <article className="panel skeleton-practice-card" key={index}><Shimmer className="shimmer-logo" /><Shimmer className="shimmer-title" /><Shimmer className="shimmer-copy wide" /><Shimmer className="shimmer-copy" /><Shimmer className="shimmer-action" /></article>)}</div>
  </div>;
}

export function MatchAnalysisSkeleton({ label = "در حال مقایسه رزومه با نیازمندی‌های آگهی" }: SkeletonProps) {
  return <div className="skeleton-analysis" role="status" aria-live="polite">
    <LoadingContext>{label}</LoadingContext>
    <div className="skeleton-analysis-head"><Shimmer className="shimmer-ring" /><div><Shimmer className="shimmer-badge" /><Shimmer className="shimmer-title" /><Shimmer className="shimmer-company" /></div></div>
    <div className="skeleton-score-list">{Array.from({ length: 3 }, (_, index) => <div key={index}><div><Shimmer className="shimmer-company" /><Shimmer className="shimmer-short" /></div><Shimmer className="shimmer-progress" /></div>)}</div>
    <div className="skeleton-analysis-section"><Shimmer className="shimmer-panel-title" /><div className="skeleton-chips"><Shimmer /><Shimmer /><Shimmer /></div></div>
    <div className="skeleton-analysis-section"><Shimmer className="shimmer-panel-title" /><Shimmer className="shimmer-feedback-row" /><Shimmer className="shimmer-feedback-row short" /></div>
  </div>;
}

export function GenerationShimmer({ label = "در حال تولید محتوا با مدل" }: SkeletonProps) {
  return <div className="generation-shimmer" role="status" aria-live="polite"><div><i /><span>{label}</span></div><Shimmer className="shimmer-copy wide" /><Shimmer className="shimmer-copy" /></div>;
}

export function FeedbackSkeleton() {
  return <div className="feedback-box skeleton-feedback" role="status" aria-label="در حال تولید بازخورد"><Shimmer className="shimmer-logo small" /><div><Shimmer className="shimmer-company" /><Shimmer className="shimmer-copy wide" /><Shimmer className="shimmer-copy" /></div></div>;
}

export function ResumePreviewSkeleton() {
  return <div className="resume-preview-skeleton" role="status" aria-label="در حال تکمیل اطلاعات رزومه"><LoadingContext>در حال بازنویسی اطلاعات و ساخت پیش‌نمایش رزومه</LoadingContext><div className="skeleton-resume-header"><Shimmer className="shimmer-avatar" /><div><Shimmer className="shimmer-hero-title" /><Shimmer className="shimmer-company" /></div></div><div className="skeleton-resume-body"><aside>{Array.from({ length: 7 }, (_, index) => <Shimmer className={index % 3 === 0 ? "shimmer-panel-title" : "shimmer-copy"} key={index} />)}</aside><div className="skeleton-resume-main">{Array.from({ length: 11 }, (_, index) => <Shimmer className={index % 4 === 0 ? "shimmer-panel-title" : index % 3 === 0 ? "shimmer-copy" : "shimmer-copy wide"} key={index} />)}</div></div></div>;
}
