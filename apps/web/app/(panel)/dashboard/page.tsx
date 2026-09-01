"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  FileCheck2,
  Gauge,
  MessageSquareText,
  MoreHorizontal,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { CircularProgress } from "../_components/circular-progress";
import { JobCard } from "../_components/job-card";
import { DashboardSkeleton } from "../_components/loading-skeletons";
import { SectionTitle } from "../_components/ui";
import { useToast } from "@/app/_components/toast";
import { useModelTasks } from "../_components/model-task-provider";
import {
  applicationStore,
  dashboardSnapshotStore,
  jobStore,
  knowledgeProfileStore,
  resumeStore,
} from "@/lib/data/stores";
import type {
  ApplicationRecord,
  ApplicationStage,
  DashboardSnapshotRecord,
  JobRecord,
  ResumeRecord,
} from "@/lib/data/models";
import { hasResumeContent } from "../resumes/resume-data";
import { formatPersianNumber } from "@/lib/fa-number";
import { apiRequest } from "@/lib/api-client";

type DashboardState = {
  snapshot: DashboardSnapshotRecord;
  resumes: ResumeRecord[];
  jobs: JobRecord[];
  applications: ApplicationRecord[];
  displayName: string;
};

const statIcons = [BriefcaseBusiness, FileCheck2, MessageSquareText, Zap];
const stageLabels: Record<
  ApplicationStage,
  { label: string; className: string }
> = {
  saved: { label: "ذخیره‌شده", className: "bg-[#eee8f8] text-[#735ba8]" },
  applied: { label: "ارسال‌شده", className: "bg-[#fff1d9] text-[#a87529]" },
  review: { label: "در حال بررسی", className: "bg-[#e7f0f7] text-[#577b9e]" },
  interview: { label: "مصاحبه", className: "bg-[#e6f4ee] text-[#0f7b62]" },
};

const buttonPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-[15px] text-[11px] font-bold whitespace-nowrap text-white no-underline shadow-[0_7px_17px_rgba(15,123,98,.17)] transition-colors duration-200 hover:bg-[#0b6954] disabled:cursor-not-allowed disabled:opacity-45";
const buttonSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold whitespace-nowrap text-[#526461]";
const panel =
  "rounded-[17px] border border-[#e7ebe6] bg-white shadow-[0_12px_36px_rgba(27,55,50,.055)]";
const empty =
  "grid min-h-[220px] place-items-center gap-3 rounded-[17px] border border-dashed border-[#d9e2dd] bg-white p-10 text-center text-[#758582] [&_h3]:m-0 [&_h3]:text-[15px] [&_h3]:text-[#19312f] [&_p]:m-0 [&_p]:text-[11px]";
const toneClasses = [
  "bg-[#fae8dc] text-[#bb704e]",
  "bg-[#eee9f8] text-[#7660a8]",
  "bg-[#e5eff7] text-[#547da5]",
  "bg-[#f6edcf] text-[#98752c]",
];
const barHeightClass = (value: number) => {
  if (!value) return "h-0";
  if (value <= 20) return "h-1/5";
  if (value <= 40) return "h-2/5";
  if (value <= 60) return "h-3/5";
  if (value <= 80) return "h-4/5";
  return "h-full";
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function dashboardTitle(fullName: string) {
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName
    ? `سلام ${firstName}، آماده‌ی یک قدم تازه‌ای؟`
    : "سلام، آماده‌ی یک قدم تازه‌ای؟";
}

function ExpandableText({
  children,
  className,
  expanded,
  onToggle,
}: {
  children: string;
  className: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [canExpand, setCanExpand] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(57);
  const [expandedHeight, setExpandedHeight] = useState(57);

  useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    const updateOverflow = () => {
      const lineHeight = Number.parseFloat(
        window.getComputedStyle(text).lineHeight,
      );
      const nextCollapsedHeight = lineHeight * 3;
      const nextExpandedHeight = text.scrollHeight;
      setCanExpand(nextExpandedHeight > nextCollapsedHeight + 1);
      setCollapsedHeight((current) =>
        current === nextCollapsedHeight ? current : nextCollapsedHeight,
      );
      setExpandedHeight((current) =>
        current === nextExpandedHeight ? current : nextExpandedHeight,
      );
    };
    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div>
      <p
        ref={textRef}
        className={`${className} overflow-hidden ${hasInteracted ? "transition-[max-height] duration-300 ease-in-out" : ""}`}
        style={{
          maxHeight: `${expanded ? expandedHeight : collapsedHeight}px`,
        }}
      >
        {children}
      </p>
      {canExpand && (
        <button
          className="mt-1 inline-flex items-center gap-1 border-0 bg-transparent py-1 text-[8px] font-medium text-current opacity-65 transition hover:opacity-100"
          type="button"
          aria-expanded={expanded}
          onClick={() => {
            setHasInteracted(true);
            onToggle();
          }}
        >
          {expanded ? (
            <>
              نمایش کمتر <ChevronUp size={13} />
            </>
          ) : (
            <>
              نمایش بیشتر <ChevronDown size={13} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const notify = useToast();
  const { runModelTask } = useModelTasks();
  const [data, setData] = useState<DashboardState | null>(null);
  const [hasResume, setHasResume] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [heroTextExpanded, setHeroTextExpanded] = useState(false);
  const [aiTextExpanded, setAiTextExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [resumes, jobs, applications, snapshots, knowledgeProfiles] =
          await Promise.all([
            resumeStore.list(),
            jobStore.list(),
            applicationStore.list(),
            dashboardSnapshotStore.list(),
            knowledgeProfileStore.list(),
          ]);
        const resume = resumes[0];
        const knowledge = knowledgeProfiles[0];
        const analysisResume = knowledge?.resumeData ?? resume?.data;
        const displayName = analysisResume?.fullName ?? "";
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
        const cachedSnapshot =
          snapshots.find(
            (snapshot) =>
              snapshot.sourceId === sourceId &&
              snapshot.sourceType === sourceType,
          ) ??
          (!knowledge
            ? snapshots.find((snapshot) => snapshot.resumeId === resume!.id)
            : undefined);
        const snapshotIsCurrent =
          cachedSnapshot?.sourceUpdatedAt === sourceUpdatedAt;

        if (cachedSnapshot && snapshotIsCurrent) {
          if (active)
            setData({
              snapshot: cachedSnapshot,
              resumes,
              jobs,
              applications,
              displayName,
            });
          return;
        }

        try {
          const snapshot = await runModelTask({
            key: `dashboard-analysis-${sourceType}-${sourceId}`,
            title: "تحلیل هوشمند داشبورد",
            pendingLabel: "مدل در حال به‌روزرسانی پیشنهادهای داشبورد است",
            completedLabel: "تحلیل داشبورد به‌روز شد",
            href: "/dashboard",
            run: async () => {
              const result = await apiRequest<
                Omit<
                  DashboardSnapshotRecord,
                  "id" | "resumeId" | "createdAt" | "updatedAt"
                > & { error?: string }
              >("/api/panel/dashboard", {
                method: "POST",
                body: JSON.stringify({
                  resume: analysisResume,
                  knowledge: knowledge
                    ? {
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
                      }
                    : undefined,
                }),
              });
              const now = new Date().toISOString();
              const snapshot: DashboardSnapshotRecord = {
                ...result,
                id:
                  cachedSnapshot?.id ||
                  `dashboard-${sourceType}-${sourceId}`,
                resumeId: resume?.id ?? "",
                sourceId,
                sourceType,
                sourceUpdatedAt,
                createdAt: cachedSnapshot?.createdAt || now,
                updatedAt: now,
              };
              await dashboardSnapshotStore.put(snapshot);
              return snapshot;
            },
          });
          if (active)
            setData({ snapshot, resumes, jobs, applications, displayName });
        } catch (modelError) {
          if (cachedSnapshot) {
            if (active)
              setData({
                snapshot: cachedSnapshot,
                resumes,
                jobs,
                applications,
                displayName,
              });
          } else {
            throw modelError;
          }
        }
      } catch (event) {
        if (active) {
          const message =
            event instanceof Error
              ? event.message
              : "دریافت اطلاعات داشبورد ناموفق بود.";
          setError(message);
          notify(message, "error");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [notify, runModelTask]);

  const weekly = useMemo(() => {
    const bars = Array.from({ length: 7 }, () => 0);
    if (!data) return bars;
    const today = new Date();
    data.applications.forEach((application) => {
      const daysAgo = Math.floor(
        (today.getTime() - new Date(application.createdAt).getTime()) /
          86400000,
      );
      if (daysAgo >= 0 && daysAgo < 7) bars[6 - daysAgo] += 1;
    });
    const maximum = Math.max(...bars, 1);
    return bars.map((count) =>
      count ? Math.max(18, Math.round((count / maximum) * 100)) : 0,
    );
  }, [data]);

  if (loading) return <DashboardSkeleton />;
  if (!hasResume)
    return (
      <div className={empty}>
        <FileCheck2 size={34} />
        <h3>داشبورد هنوز داده‌ای ندارد</h3>
        <p>اولین رزومه‌ات را بساز تا تحلیل و آمار واقعی نمایش داده شود.</p>
        <Link className={buttonPrimary} href="/resumes">
          ساخت اولین رزومه
        </Link>
      </div>
    );
  if (error || !data)
    return (
      <div className={empty}>
        <Sparkles size={34} />
        <h3>ساخت داشبورد ناموفق بود</h3>
        <p>{error}</p>
        <button
          className={buttonSecondary}
          onClick={() => window.location.reload()}
        >
          تلاش دوباره
        </button>
      </div>
    );

  const activeApplications = data.applications.filter(
    (application) => application.stage !== "saved",
  );
  const interviews = data.applications.filter(
    (application) => application.stage === "interview",
  );
  const stats = [
    {
      label: "فرصت‌های واردشده",
      value: formatPersianNumber(data.jobs.length),
      note: "از آگهی‌های واقعی",
      tone: "peach",
    },
    {
      label: "اپلای‌های فعال",
      value: formatPersianNumber(activeApplications.length),
      note: "در مسیر پیگیری",
      tone: "lavender",
    },
    {
      label: "دعوت به مصاحبه",
      value: formatPersianNumber(interviews.length),
      note: "از وضعیت‌های ثبت‌شده",
      tone: "sky",
    },
    {
      label: "نسخه‌های رزومه",
      value: formatPersianNumber(data.resumes.length),
      note: "ذخیره‌شده در حساب شما",
      tone: "lemon",
    },
  ];

  return (
    <>
      <SectionTitle
        eyebrow="داشبورد داینامیک"
        title={dashboardTitle(data.displayName)}
        description={data.snapshot.subtitle}
        action={
          <Link className={buttonPrimary} href="/match">
            تحلیل شغل جدید
          </Link>
        }
      />
      <section className="grid gap-4 min-[1121px]:grid-cols-[minmax(0,1.9fr)_minmax(270px,.8fr)]">
        <div className="relative flex min-h-[265px] items-center overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_12%_15%,rgba(80,157,139,.33),transparent_30%),linear-gradient(128deg,#173f39,#0f2f2d)] px-[clamp(24px,3vw,38px)] py-[34px] text-white">
          <div className="relative z-[2] max-w-[510px]">
            <span className="flex w-fit items-center gap-[5px] rounded-lg border border-white/8 bg-white/10 px-[9px] py-1.5 text-[9px] text-[#cce7df]">
              <Sparkles size={14} /> وضعیت پروفایل حرفه‌ای
            </span>
            <h2 className="my-[13px] mb-1.5 text-[clamp(16px,2.25vw,24px)] leading-[1.6] tracking-[-.6px]">
              {data.snapshot.heroTitle}
            </h2>
            <ExpandableText
              className="mb-1 max-w-[440px] text-[10px] leading-[1.9] text-[#abc4be]"
              expanded={heroTextExpanded}
              onToggle={() => setHeroTextExpanded((current) => !current)}
            >
              {data.snapshot.heroText}
            </ExpandableText>
            <Link
              className="mt-4 inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-[10px] bg-white px-[17px] text-[11px] font-bold whitespace-nowrap text-[#123c37] no-underline transition-colors duration-200 hover:bg-[#eaf4ef]"
              href="/resumes"
            >
              بهبود رزومه <ArrowLeft size={17} />
            </Link>
          </div>
          <CircularProgress
            className="mr-auto size-[132px] min-w-[132px] [--progress-track:rgba(255,255,255,.16)] [--progress-value:#60c6a8] before:absolute before:inset-2.5 before:z-0 before:rounded-full before:bg-[#153a36]"
            value={data.snapshot.profileScore}
            label={`امتیاز رزومه ${formatPersianNumber(data.snapshot.profileScore)} از ۱۰۰`}
            strokeWidth={8}
          >
            <strong className="text-[32px]">
              {formatPersianNumber(data.snapshot.profileScore)}
            </strong>
            <span className="text-[8px] text-[#9fb9b3]">از ۱۰۰</span>
          </CircularProgress>
          <div className="absolute -bottom-[120px] -left-[35px] size-[230px] rounded-full border border-white/6 shadow-[0_0_0_35px_rgba(255,255,255,.02),0_0_0_75px_rgba(255,255,255,.015)]" />
        </div>
        <div className="flex min-h-[265px] flex-col items-start rounded-[22px] border border-[#e3e9e0] bg-[linear-gradient(150deg,#f0f5ed,#eef1e9)] p-7">
          <div className="grid size-[39px] place-items-center rounded-xl bg-[#d8eee5] text-[#0c765d]">
            <WandSparkles size={22} />
          </div>
          <span className="-mt-[35px] mr-auto rounded-md bg-[#f4dfb9] px-[7px] py-1 text-[8px] text-[#8a6327]">
            پیشنهاد مدل
          </span>
          <h3 className="mt-5 mb-1.5 max-w-60 text-lg leading-[1.65]">
            {data.snapshot.aiTitle}
          </h3>
          <ExpandableText
            className="m-0 text-[10px] leading-[1.8] text-[#72827f]"
            expanded={aiTextExpanded}
            onToggle={() => setAiTextExpanded((current) => !current)}
          >
            {data.snapshot.aiText}
          </ExpandableText>
          <div className="mt-auto w-full pt-4">
            <Link
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#dfe5dd] bg-white/60 px-[15px] text-[11px] font-bold text-[#526460] no-underline"
              href="/match"
            >
              شروع تطبیق هوشمند <ChevronLeft size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="my-4 grid grid-cols-1 gap-3 min-[700px]:grid-cols-2 min-[1121px]:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = statIcons[index] || Gauge;
          return (
            <div
              className={`${panel} flex items-center gap-[13px] p-[17px]`}
              key={stat.label}
            >
              <div
                className={`grid size-[39px] place-items-center rounded-xl ${toneClasses[index]}`}
              >
                <Icon size={20} />
              </div>
              <div className="grid flex-1 grid-cols-[auto_auto]">
                <span className="col-span-2 text-[9px] text-[#7d8b88]">
                  {stat.label}
                </span>
                <strong className="mt-0.5 text-[22px]">{stat.value}</strong>
                <small className="self-end justify-self-end text-[8px] text-[#3a9a77]">
                  {stat.note}
                </small>
              </div>
            </div>
          );
        })}
      </section>
      <section className="grid gap-4 min-[1121px]:grid-cols-[minmax(0,1.65fr)_minmax(280px,.7fr)]">
        <div className={`${panel} p-[21px]`}>
          <div className="flex items-start justify-between gap-5">
            <div>
              <h3 className="m-0 mb-[5px] text-[13px]">آخرین اپلای‌ها</h3>
              <p className="m-0 text-[9px] text-[#99a4a1]">
                براساس وضعیت‌هایی که خودت ثبت کرده‌ای
              </p>
            </div>
            <Link
              className="flex items-center gap-[3px] p-1.5 text-[10px] font-bold text-[#0f7b62] no-underline"
              href="/applications"
            >
              مشاهده همه <ChevronLeft size={16} />
            </Link>
          </div>
          <div className="mt-3.5">
            {data.applications.slice(0, 4).map((item) => {
              const stage = stageLabels[item.stage];
              return (
                <div
                  className="grid min-h-[61px] grid-cols-[36px_minmax(100px,1fr)_auto_48px_25px] items-center gap-2.5 border-t border-[#eef1ed]"
                  key={item.id}
                >
                  <div className="grid size-[34px] place-items-center rounded-[10px] border border-[#e4e8e3] bg-[#f1f4f0] text-[10px] font-extrabold">
                    {Array.from(item.company)[0] || "—"}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <strong className="truncate text-[10px]">
                      {item.role}
                    </strong>
                    <span className="truncate text-[8px] text-[#929e9b]">
                      {item.company}
                    </span>
                  </div>
                  <span
                    className={`w-fit rounded-[7px] px-2 py-[5px] text-[8px] ${stage.className}`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[8px] text-[#929e9b]">
                    {formatDate(item.updatedAt)}
                  </span>
                  <button
                    className="grid place-items-center bg-transparent p-[5px] text-[#9ba5a3]"
                    aria-label="گزینه‌های بیشتر"
                    onClick={() =>
                      notify(`جزئیات اپلای ${item.company} آماده مشاهده است`)
                    }
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              );
            })}
            {!data.applications.length && (
              <div className="grid min-h-[118px] place-items-center rounded-xl border border-dashed border-[#d9e2dd] bg-[#fbfcfa] p-6 text-center text-[9px] text-[#86938f]">
                هنوز اپلایی ثبت نشده است.
              </div>
            )}
          </div>
        </div>
        <div className={`${panel} p-[21px]`}>
          <div className="flex items-start justify-between gap-5">
            <div>
              <h3 className="m-0 mb-[5px] text-[13px]">عملکرد این هفته</h3>
              <p className="m-0 text-[9px] text-[#99a4a1]">
                محاسبه‌شده از زمان ثبت اپلای‌ها
              </p>
            </div>
            <div className="grid size-[39px] place-items-center rounded-xl bg-[#e5eff7] text-[#547da5]">
              <Gauge size={20} />
            </div>
          </div>
          <div className="my-[19px] mb-[13px] flex h-[118px] items-end justify-between gap-[7px] border-b border-[#edf0ec]">
            {weekly.map((value, index) => (
              <div
                className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                key={index}
              >
                <span
                  className={`w-[70%] min-w-2 max-w-[17px] rounded-t-md ${barHeightClass(value)} ${value === Math.max(...weekly) && value > 0 ? "bg-[#0f7b62]" : "bg-[#dce8e3]"}`}
                />
                <small className="text-[8px] text-[#9ba6a3]">
                  {["ش", "ی", "د", "س", "چ", "پ", "ج"][index]}
                </small>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 pt-[3px] [&>div]:flex [&>div]:flex-col [&>div]:items-center [&>div]:border-l [&>div]:border-[#edf0ec] [&>div:last-child]:border-0 [&_strong]:text-[15px] [&_span]:mt-[3px] [&_span]:text-[8px] [&_span]:text-[#9da7a5]">
            <div>
              <strong>{formatPersianNumber(activeApplications.length)}</strong>
              <span>اپلای</span>
            </div>
            <div>
              <strong>
                {formatPersianNumber(
                  data.applications.filter((item) => item.stage === "review")
                    .length,
                )}
              </strong>
              <span>پاسخ</span>
            </div>
            <div>
              <strong>{formatPersianNumber(interviews.length)}</strong>
              <span>مصاحبه</span>
            </div>
          </div>
        </div>
      </section>
      <section className={`${panel} mt-4 p-[21px]`}>
        <div className="flex items-start justify-between gap-5">
          <div>
            <h3 className="m-0 mb-[5px] text-[13px]">فرصت‌های ذخیره‌شده</h3>
            <p className="m-0 text-[9px] text-[#99a4a1]">
              آگهی‌هایی که وارد یا تحلیل کرده‌ای
            </p>
          </div>
          <Link
            className="flex items-center gap-[3px] p-1.5 text-[10px] font-bold text-[#0f7b62] no-underline"
            href="/jobs"
          >
            همه فرصت‌ها <ChevronLeft size={16} />
          </Link>
        </div>
        {data.jobs.length ? (
          <div className="mt-4 grid grid-cols-1 gap-[11px] min-[700px]:grid-cols-2 min-[1121px]:grid-cols-3 mt-3">
            {data.jobs.slice(0, 4).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-[118px] place-items-center rounded-xl border border-dashed border-[#d9e2dd] bg-[#fbfcfa] p-6 text-center text-[9px] text-[#86938f] mt-3">
            هنوز فرصت شغلی وارد نشده است.
          </div>
        )}
      </section>
    </>
  );
}
