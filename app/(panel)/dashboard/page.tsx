"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, ChevronLeft, FileCheck2, Gauge, MessageSquareText, MoreHorizontal, Sparkles, WandSparkles, Zap } from "lucide-react";
import { CircularProgress } from "../_components/circular-progress";
import { JobCard } from "../_components/job-card";
import { DashboardSkeleton } from "../_components/loading-skeletons";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { applicationStore, dashboardSnapshotStore, jobStore, knowledgeProfileStore, resumeStore } from "@/lib/data/stores";
import type { ApplicationRecord, ApplicationStage, DashboardSnapshotRecord, JobRecord, ResumeRecord } from "@/lib/data/models";
import { hasResumeContent } from "../resumes/resume-data";

type DashboardState = {
  snapshot: DashboardSnapshotRecord;
  resumes: ResumeRecord[];
  jobs: JobRecord[];
  applications: ApplicationRecord[];
};

const statIcons = [BriefcaseBusiness, FileCheck2, MessageSquareText, Zap];
const stageLabels: Record<ApplicationStage, { label: string; className: string }> = {
  saved: { label: "ذخیره‌شده", className: "violet" },
  applied: { label: "ارسال‌شده", className: "amber" },
  review: { label: "در حال بررسی", className: "blue" },
  interview: { label: "مصاحبه", className: "green" },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(date));
}

export default function DashboardPage() {
  const notify = useToast();
  const [data, setData] = useState<DashboardState | null>(null);
  const [hasResume, setHasResume] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [resumes, jobs, applications, snapshots, knowledgeProfiles] = await Promise.all([
          resumeStore.list(),
          jobStore.list(),
          applicationStore.list(),
          dashboardSnapshotStore.list(),
          knowledgeProfileStore.list(),
        ]);
        const resume = resumes[0];
        const knowledge = knowledgeProfiles[0];
        const analysisResume = knowledge?.resumeData ?? resume?.data;
        if (!hasResumeContent(analysisResume)) {
          if (active) {
            setHasResume(false);
            setData(null);
          }
          return;
        }

        if (active) setHasResume(true);
        const sourceId = knowledge?.id ?? resume!.id;
        const sourceType = knowledge ? "knowledge" : "resume";
        const sourceUpdatedAt = knowledge?.updatedAt ?? resume!.updatedAt;
        const cachedSnapshot = snapshots.find((snapshot) =>
          snapshot.sourceId === sourceId && snapshot.sourceType === sourceType
        ) ?? (!knowledge ? snapshots.find((snapshot) => snapshot.resumeId === resume!.id) : undefined);
        const snapshotIsCurrent = cachedSnapshot?.sourceUpdatedAt === sourceUpdatedAt;

        if (cachedSnapshot && snapshotIsCurrent) {
          if (active) setData({ snapshot: cachedSnapshot, resumes, jobs, applications });
          return;
        }

        try {
          const response = await fetch("/api/panel/dashboard", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              resume: analysisResume,
              knowledge: knowledge ? {
                experiences: knowledge.experiences,
                qualifications: knowledge.qualifications,
                skills: knowledge.skills,
                languages: knowledge.languages,
                careerGoals: knowledge.careerGoals,
                preferredRoles: knowledge.preferredRoles,
                preferredIndustries: knowledge.preferredIndustries,
                workPreferences: knowledge.workPreferences,
                interviewContext: knowledge.interviewContext,
                interviewChallenges: knowledge.interviewChallenges,
              } : undefined,
            }),
          });
          const result = await response.json() as Omit<DashboardSnapshotRecord, "id" | "resumeId" | "createdAt" | "updatedAt"> & { error?: string };
          if (!response.ok) throw new Error(result.error || "تحلیل داشبورد ناموفق بود.");
          const now = new Date().toISOString();
          const snapshot: DashboardSnapshotRecord = {
            ...result,
            id: cachedSnapshot?.id || `dashboard-${sourceType}-${sourceId}`,
            resumeId: resume?.id ?? "",
            sourceId,
            sourceType,
            sourceUpdatedAt,
            createdAt: cachedSnapshot?.createdAt || now,
            updatedAt: now,
          };
          await dashboardSnapshotStore.put(snapshot);
          if (active) setData({ snapshot, resumes, jobs, applications });
        } catch (modelError) {
          if (cachedSnapshot) {
            if (active) setData({ snapshot: cachedSnapshot, resumes, jobs, applications });
          } else {
            throw modelError;
          }
        }
      } catch (event) {
        if (active) setError(event instanceof Error ? event.message : "دریافت اطلاعات داشبورد ناموفق بود.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const weekly = useMemo(() => {
    const bars = Array.from({ length: 7 }, () => 0);
    if (!data) return bars;
    const today = new Date();
    data.applications.forEach((application) => {
      const daysAgo = Math.floor((today.getTime() - new Date(application.createdAt).getTime()) / 86400000);
      if (daysAgo >= 0 && daysAgo < 7) bars[6 - daysAgo] += 1;
    });
    const maximum = Math.max(...bars, 1);
    return bars.map((count) => count ? Math.max(18, Math.round((count / maximum) * 100)) : 0);
  }, [data]);

  if (loading) return <DashboardSkeleton />;
  if (!hasResume) return <div className="empty-results"><FileCheck2 size={34} /><h3>داشبورد هنوز داده‌ای ندارد</h3><p>اولین رزومه‌ات را بساز تا تحلیل و آمار واقعی نمایش داده شود.</p><Link className="primary-btn" href="/resumes">ساخت اولین رزومه</Link></div>;
  if (error || !data) return <div className="empty-results"><Sparkles size={34} /><h3>ساخت داشبورد ناموفق بود</h3><p>{error}</p><button className="secondary-btn" onClick={() => window.location.reload()}>تلاش دوباره</button></div>;

  const activeApplications = data.applications.filter((application) => application.stage !== "saved");
  const interviews = data.applications.filter((application) => application.stage === "interview");
  const stats = [
    { label: "فرصت‌های واردشده", value: String(data.jobs.length), note: "از آگهی‌های واقعی", tone: "peach" },
    { label: "اپلای‌های فعال", value: String(activeApplications.length), note: "در مسیر پیگیری", tone: "lavender" },
    { label: "دعوت به مصاحبه", value: String(interviews.length), note: "از وضعیت‌های ثبت‌شده", tone: "sky" },
    { label: "نسخه‌های رزومه", value: String(data.resumes.length), note: "ذخیره‌شده در حساب محلی", tone: "lemon" },
  ];

  return <>
    <SectionTitle eyebrow="داشبورد داینامیک" title={data.snapshot.greeting} description={data.snapshot.subtitle} action={<Link className="primary-btn" href="/match">تحلیل شغل جدید</Link>} />
    <section className="hero-grid">
      <div className="career-card"><div className="career-copy"><span className="soft-badge"><Sparkles size={14} /> وضعیت پروفایل حرفه‌ای</span><h2>{data.snapshot.heroTitle}</h2><p>{data.snapshot.heroText}</p><Link className="light-btn" href="/resumes">بهبود رزومه <ArrowLeft size={17} /></Link></div><CircularProgress className="score-ring" value={data.snapshot.profileScore} label={`امتیاز رزومه ${data.snapshot.profileScore} از ۱۰۰`} strokeWidth={8} startAngle={-125}><strong>{data.snapshot.profileScore}</strong><span>از ۱۰۰</span></CircularProgress><div className="career-dots" /></div>
      <div className="ai-card"><div className="icon-tile mint"><WandSparkles size={22} /></div><span className="new-label">پیشنهاد مدل</span><h3>{data.snapshot.aiTitle}</h3><p>{data.snapshot.aiText}</p><Link className="wide-outline" href="/match">شروع تطبیق هوشمند <ChevronLeft size={17} /></Link></div>
    </section>
    <section className="stats-row">{stats.map((stat, index) => { const Icon = statIcons[index] || Gauge; return <div className="stat-card" key={stat.label}><div className={`icon-tile ${stat.tone}`}><Icon size={20} /></div><div><span>{stat.label}</span><strong>{stat.value}</strong><small className="positive">{stat.note}</small></div></div>; })}</section>
    <section className="dashboard-columns">
      <div className="panel applications-panel"><div className="panel-head"><div><h3>آخرین اپلای‌ها</h3><p>براساس وضعیت‌هایی که خودت ثبت کرده‌ای</p></div><Link className="text-btn" href="/applications">مشاهده همه <ChevronLeft size={16} /></Link></div><div className="application-list">{data.applications.slice(0, 4).map((item) => { const stage = stageLabels[item.stage]; return <div className="application-row" key={item.id}><div className="company-logo">{Array.from(item.company)[0] || "—"}</div><div className="job-main"><strong>{item.role}</strong><span>{item.company}</span></div><span className={`stage ${stage.className}`}>{stage.label}</span><span className="date-cell">{formatDate(item.updatedAt)}</span><button className="icon-button" aria-label="گزینه‌های بیشتر" onClick={() => notify(`جزئیات اپلای ${item.company} آماده مشاهده است`)}><MoreHorizontal size={18} /></button></div>; })}{!data.applications.length && <div className="panel-empty-state">هنوز اپلایی ثبت نشده است.</div>}</div></div>
      <div className="panel weekly-panel"><div className="panel-head"><div><h3>عملکرد این هفته</h3><p>محاسبه‌شده از زمان ثبت اپلای‌ها</p></div><div className="icon-tile sky"><Gauge size={20} /></div></div><div className="weekly-bars">{weekly.map((value, index) => <div className="bar-wrap" key={index}><span style={{ height: `${value}%` }} className={value === Math.max(...weekly) && value > 0 ? "active" : ""} /><small>{["ش", "ی", "د", "س", "چ", "پ", "ج"][index]}</small></div>)}</div><div className="weekly-summary"><div><strong>{activeApplications.length}</strong><span>اپلای</span></div><div><strong>{data.applications.filter((item) => item.stage === "review").length}</strong><span>پاسخ</span></div><div><strong>{interviews.length}</strong><span>مصاحبه</span></div></div></div>
    </section>
    <section className="panel jobs-panel"><div className="panel-head"><div><h3>فرصت‌های ذخیره‌شده</h3><p>آگهی‌هایی که وارد یا تحلیل کرده‌ای</p></div><Link className="text-btn" href="/jobs">همه فرصت‌ها <ChevronLeft size={16} /></Link></div>{data.jobs.length ? <div className="job-cards">{data.jobs.slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)}</div> : <div className="panel-empty-state">هنوز فرصت شغلی وارد نشده است.</div>}</section>
  </>;
}
