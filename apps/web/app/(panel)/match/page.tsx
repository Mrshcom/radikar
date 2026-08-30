"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  FileText,
  Link2,
  Sparkles,
  Target,
  WandSparkles,
  X,
} from "lucide-react";
import { CircularProgress } from "../_components/circular-progress";
import { Modal, SectionTitle } from "../_components/ui";
import {
  GenerationShimmer,
  MatchAnalysisSkeleton,
} from "../_components/loading-skeletons";
import { useToast } from "@/app/_components/toast";
import { useModelTasks } from "../_components/model-task-provider";
import {
  emptyResumeData,
  getDefaultResumeColor,
  resumeColorOptions,
  resumeTemplates,
  selectableResumeTemplates,
  type ResumeData,
  type ResumeColorId,
  type ResumeLanguage,
  supportsResumeColors,
} from "../resumes/resume-data";
import {
  createRecordId,
  jobStore,
  matchAnalysisStore,
  resumeStore,
} from "@/lib/data/stores";
import type {
  JobRecord,
  MatchAnalysisRecord,
  ResumeRecord,
} from "@/lib/data/models";
import { cn } from "@/lib/cn";
import { formatPersianNumber } from "@/lib/fa-number";
import { sanitizeLtrField } from "@/lib/ltr-field";
import { apiUrl } from "@/lib/api-url";

type ImportJobResponse = { text?: string; sourceUrl?: string; error?: string };
type JobSourceMode = "text" | "url";
type ResumeOption = {
  id: string;
  label: string;
  meta: string;
  data: ResumeData;
  templateId: string;
  colorId?: ResumeColorId;
};
type MatchAnalysis = {
  score: number;
  jobTitle: string;
  company: string;
  breakdown: Array<{ label: string; value: number }>;
  strengths: string[];
  gaps: string[];
};

const PERSIAN_SCRIPT_PATTERN = /\p{Script=Arabic}/u;
const panel =
  "rounded-[17px] border border-[#e7ebe6] bg-white p-[22px] shadow-[0_12px_36px_rgba(27,55,50,.055)]";
const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-[15px] text-[11px] font-bold whitespace-nowrap text-white shadow-[0_7px_17px_rgba(15,123,98,.17)] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#dfe5df] bg-white px-[15px] text-[10px] font-bold text-[#526461] transition-colors duration-200 hover:bg-[#f3f7f4]";
const scoreWidth = (value: number) =>
  value < 20
    ? "w-1/5"
    : value < 40
      ? "w-2/5"
      : value < 60
        ? "w-3/5"
        : value < 80
          ? "w-4/5"
          : "w-full";

export function getJobTextDirection(text: string): "rtl" | "ltr" {
  return PERSIAN_SCRIPT_PATTERN.test(text) ? "rtl" : "ltr";
}

export default function MatchPage() {
  const notify = useToast();
  const { isRunning, runModelTask } = useModelTasks();
  const [sourceMode, setSourceMode] = useState<JobSourceMode>("text");
  const [description, setDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [importedDescription, setImportedDescription] = useState("");
  const [copiedImportedDescription, setCopiedImportedDescription] =
    useState(false);
  const [analysisDescription, setAnalysisDescription] = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const [importError, setImportError] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [tailored, setTailored] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [resumePicker, setResumePicker] = useState(false);
  const [resumePickerOpensUp, setResumePickerOpensUp] = useState(false);
  const [resumeOptions, setResumeOptions] = useState<ResumeOption[]>([]);
  const [baseResumeId, setBaseResumeId] = useState("");
  const [prefilledSourceUrl, setPrefilledSourceUrl] = useState("");
  const [sourceJobId, setSourceJobId] = useState("");
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [tailoringTemplateId, setTailoringTemplateId] = useState("");
  const [tailoringColor, setTailoringColor] =
    useState<ResumeColorId>("mint");
  const [tailoringLanguage, setTailoringLanguage] =
    useState<ResumeLanguage>("fa");
  const resumePickerRef = useRef<HTMLDivElement>(null);
  const tailoring = isRunning("match-tailor-resume");
  const analysisBusy = analyzing || isRunning("match-analysis");

  useEffect(() => {
    let active = true;
    const jobId = new URLSearchParams(window.location.search).get("job");
    void Promise.all([
      resumeStore.list(),
      jobId ? jobStore.get(jobId) : Promise.resolve(undefined),
      jobId ? matchAnalysisStore.list() : Promise.resolve([]),
    ])
      .then(([resumes, selectedJob, matchAnalyses]) => {
        if (!active) return;
        const options = resumes.map((resume) => {
          const data = { ...emptyResumeData, ...resume.data };
          const templateName =
            resumeTemplates.find(
              (template) => template.id === resume.templateId,
            )?.name || "قالب ذخیره‌شده";
          return {
            id: resume.id,
            label: data.jobTitle
              ? `${data.fullName || "رزومه من"} — ${data.jobTitle}`
              : data.fullName || resume.name,
            meta: `${resume.source === "tailored" ? "نسخه اختصاصی" : "پیش‌نویس"} · ${templateName}`,
            data,
            templateId: resume.templateId,
            colorId: resume.colorId,
          };
        });
        setResumeOptions(options);

        if (selectedJob) {
          setSourceJobId(selectedJob.id);
          setSourceMode("text");
          setDescription(selectedJob.description);
          setJobUrl(selectedJob.sourceUrl || "");
          setPrefilledSourceUrl(selectedJob.sourceUrl || "");
          setImportedDescription("");
          setTailored(false);
          const previousAnalysis = matchAnalyses.find(
            (item) =>
              item.jobId === selectedJob.id ||
              (!item.jobId &&
                item.jobDescription === selectedJob.description) ||
              Boolean(
                !item.jobId &&
                  selectedJob.sourceUrl &&
                  item.sourceUrl === selectedJob.sourceUrl,
              ),
          );
          setAnalysis(previousAnalysis?.analysis || null);
          setAnalysisDescription(
            previousAnalysis?.jobDescription || selectedJob.description,
          );
          setAnalyzed(Boolean(previousAnalysis));
          const preferredResumeId = previousAnalysis?.resumeId;
          setBaseResumeId(
            options.some((resume) => resume.id === preferredResumeId)
              ? preferredResumeId!
              : options[0]?.id || "",
          );
        }
      })
      .catch(() => {
        if (active) setResumeOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!resumePicker) return;
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!resumePickerRef.current?.contains(event.target as Node))
        setResumePicker(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setResumePicker(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [resumePicker]);

  const selectedResume = resumeOptions.find(
    (resume) => resume.id === baseResumeId,
  );

  const selectSourceMode = (mode: JobSourceMode) => {
    setSourceMode(mode);
    setImportError("");
    setAnalysisError("");
  };

  const copyImportedDescription = async () => {
    if (!importedDescription) return;

    try {
      await navigator.clipboard.writeText(importedDescription);
      setCopiedImportedDescription(true);
      notify("متن استخراج‌شده کپی شد");
    } catch {
      const message =
        "کپی خودکار انجام نشد؛ مرورگر اجازه دسترسی به کلیپ‌بورد را نداد.";
      setImportError(message);
      notify(message, "error");
    }
  };

  const importJobDescription = async () => {
    const response = await fetch(apiUrl("/api/job-import"), {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: jobUrl.trim() }),
    });
    const result = (await response.json()) as ImportJobResponse;

    if (!response.ok || !result.text) {
      throw new Error(result.error || "متن آگهی از این لینک قابل دریافت نبود.");
    }

    return {
      text: result.text.trim(),
      sourceUrl: result.sourceUrl || jobUrl.trim(),
    };
  };

  const analyze = async () => {
    if (sourceMode === "text" && !description.trim()) return;
    if (sourceMode === "url" && !jobUrl.trim()) return;
    if (!selectedResume) return;

    setAnalyzing(true);
    setAnalyzed(false);
    setAnalysisError("");
    setImportError("");

    let selectedDescription = description.trim();
    let selectedSourceUrl = sourceMode === "text" ? prefilledSourceUrl : "";
    if (sourceMode === "url") {
      setImportingUrl(true);
      try {
        const imported = await importJobDescription();
        selectedDescription = imported.text;
        selectedSourceUrl = imported.sourceUrl;
        setImportedDescription(selectedDescription);
        setCopiedImportedDescription(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "خواندن لینک آگهی با خطا روبه‌رو شد.";
        setImportError(message);
        notify(message, "error");
        setAnalyzing(false);
        setImportingUrl(false);
        return;
      }
      setImportingUrl(false);
    }

    try {
      const { result, jobRecord } = await runModelTask({
        key: "match-analysis",
        title: "تحلیل هوشمند آگهی",
        pendingLabel: "مدل در حال تطبیق رزومه با آگهی شغلی است",
        completedLabel: "تحلیل تطبیق آگهی آماده شد",
        href: sourceJobId ? `/match?job=${sourceJobId}` : "/match",
        run: async () => {
          const response = await fetch(apiUrl("/api/match/analyze"), {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jobDescription: selectedDescription,
              resume: selectedResume.data,
            }),
          });
          const result = (await response.json()) as MatchAnalysis & {
            error?: string;
          };
          if (!response.ok)
            throw new Error(result.error || "تحلیل تطابق ناموفق بود.");
          const now = new Date().toISOString();
          const existingJob = (await jobStore.list()).find(
            (job) =>
              (selectedSourceUrl && job.sourceUrl === selectedSourceUrl) ||
              (!selectedSourceUrl && job.description === selectedDescription),
          );
          const jobRecord: JobRecord = {
            id: existingJob?.id || createRecordId("job"),
            company: result.company,
            role: result.jobTitle,
            match: result.score,
            place: existingJob?.place || "",
            age: new Intl.DateTimeFormat("fa-IR", {
              month: "short",
              day: "numeric",
            }).format(new Date()),
            tone: existingJob?.tone || "green",
            letter: Array.from(result.company.trim())[0] || "—",
            reason: result.strengths.join("، "),
            description: selectedDescription,
            sourceUrl: selectedSourceUrl || undefined,
            saved: existingJob?.saved || false,
            createdAt: existingJob?.createdAt || now,
            updatedAt: now,
          };
          await jobStore.put(jobRecord);
          const analysisRecord: MatchAnalysisRecord = {
            id: createRecordId("match"),
            resumeId: selectedResume.id,
            jobId: jobRecord.id,
            jobDescription: selectedDescription,
            sourceUrl: selectedSourceUrl || undefined,
            analysis: result,
            createdAt: now,
            updatedAt: now,
          };
          await matchAnalysisStore.put(analysisRecord);
          return { result, jobRecord };
        },
        getCompletedHref: ({ jobRecord }) => `/match?job=${jobRecord.id}`,
      });
      setAnalysis(result);
      setAnalysisDescription(selectedDescription);
      setAnalyzed(true);
      setSourceJobId(jobRecord.id);
      notify(
        sourceMode === "url"
          ? "آگهی از لینک خوانده و تحلیل شد"
          : "متن آگهی با مدل تحلیل شد",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "تحلیل تطابق ناموفق بود.";
      setAnalysisError(message);
      notify(message, "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const tailorResume = async (
    templateId: string,
    language: ResumeLanguage,
    colorId: ResumeColorId,
  ) => {
    if (!templateId) return;
    setTemplatePickerOpen(false);
    setAnalysisError("");
    try {
      if (!selectedResume) throw new Error("ابتدا رزومه مبنا را انتخاب کن.");
      await runModelTask({
        key: "match-tailor-resume",
        title: "ساخت رزومه اختصاصی",
        pendingLabel: `در حال ساخت رزومه براساس آگهی ${analysis?.jobTitle || "شغلی"}`,
        completedLabel: "رزومه اختصاصی آماده شد",
        href: sourceJobId ? `/match?job=${sourceJobId}` : "/match",
        run: async () => {
          const response = await fetch(apiUrl("/api/match/tailor"), {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              jobDescription: analysisDescription,
              resume: selectedResume.data,
              language,
            }),
          });
          const result = (await response.json()) as {
            resume?: ResumeData;
            error?: string;
          };

          if (!response.ok || !result.resume)
            throw new Error(
              result.error || "ساخت رزومه اختصاصی ناموفق بود.",
            );
          const linkedJob = sourceJobId
            ? await jobStore.get(sourceJobId)
            : (await jobStore.list()).find(
                (job) =>
                  job.description === analysisDescription ||
                  Boolean(
                    prefilledSourceUrl &&
                      job.sourceUrl === prefilledSourceUrl,
                  ),
              );
          const analyzedJobTitle = analysis?.jobTitle?.trim();
          const analyzedCompany = analysis?.company?.trim();
          const targetJobTitle =
            analyzedJobTitle && !analyzedJobTitle.includes("مشخص نشده")
              ? analyzedJobTitle
              : linkedJob?.role.trim() || undefined;
          const targetCompany =
            analyzedCompany && !analyzedCompany.includes("مشخص نشده")
              ? analyzedCompany
              : linkedJob?.company.trim() || undefined;
          const now = new Date().toISOString();
          const tailoredResume: ResumeRecord = {
            id: createRecordId("resume"),
            name: `${result.resume.fullName || result.resume.jobTitle || "رزومه"} — ${targetJobTitle || "نسخه اختصاصی"}`,
            templateId,
            colorId,
            data: result.resume,
            source: "tailored",
            targetJobId: linkedJob?.id || sourceJobId || undefined,
            targetJobTitle,
            targetCompany,
            createdAt: now,
            updatedAt: now,
          };
          await resumeStore.put(tailoredResume);
          return tailoredResume;
        },
        getCompletedHref: (resume) => `/resumes?openResume=${resume.id}`,
      });
      setTailored(true);
      notify("نسخه اختصاصی با DeepSeek ساخته و ذخیره شد");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "ساخت رزومه اختصاصی ناموفق بود.";
      setAnalysisError(message);
      notify(message, "error");
    }
  };

  const hasSelectedInput =
    sourceMode === "text"
      ? Boolean(description.trim())
      : Boolean(jobUrl.trim());

  return (
    <>
      <SectionTitle
        title="تطبیق هوشمند با شغل"
        description="روش ورود آگهی را انتخاب کن تا رزومه دقیقاً بر اساس همان منبع تحلیل شود."
      />
      {tailored && (
        <div className="mb-[18px] -mt-2.5 flex items-center gap-2.5 rounded-[13px] border border-[#cce7dc] bg-[#edf8f3] px-[15px] py-3 text-[#146e58]">
          <CheckCircle2 size={20} />
          <div className="flex flex-1 flex-col">
            <strong className="text-[11px]">نسخه اختصاصی ساخته شد</strong>
            <span className="mt-0.5 text-[9px] text-[#668d80]">
              پیش‌نویس جدید در بخش رزومه‌های من ذخیره شد.
            </span>
          </div>
          <button
            className="bg-transparent text-[#71988a]"
            onClick={() => setTailored(false)}
          >
            <X size={18} />
          </button>
        </div>
      )}
      {analysisError && (
        <div className="mb-[18px] -mt-2.5 flex items-center gap-2.5 rounded-[13px] border border-[#efd7a6] bg-[#fff7e8] px-[15px] py-3 text-[#9a6a20]">
          <Sparkles size={20} />
          <div className="flex flex-1 flex-col">
            <strong className="text-[11px]">تحلیل انجام نشد</strong>
            <span className="mt-0.5 text-[9px] text-[#8f7651]">
              {analysisError}
            </span>
          </div>
          <button
            className="bg-transparent text-[#9a6a20]"
            onClick={() => setAnalysisError("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div className="grid gap-4 min-[1121px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={panel}>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#e6f4ee] text-[10px] font-bold text-[#0f7b62]">
              ۱
            </span>
            <div className="flex flex-col">
              <strong className="text-[11px]">اطلاعات فرصت شغلی</strong>
              <small className="mt-0.5 text-[8px] text-[#8c9996]">
                یکی از دو روش زیر را انتخاب کن
              </small>
            </div>
          </div>
          <div
            className="grid grid-cols-1 gap-[9px] min-[561px]:grid-cols-2"
            role="radiogroup"
            aria-label="روش ورود آگهی شغلی"
          >
            {[
              {
                mode: "text" as const,
                icon: FileText,
                title: "وارد کردن متن آگهی",
                hint: "متن شرح شغل را کپی کن",
              },
              {
                mode: "url" as const,
                icon: Link2,
                title: "افزودن لینک آگهی",
                hint: "متن مستقیماً از لینک خوانده می‌شود",
              },
            ].map((source) => {
              const Icon = source.icon;
              const active = sourceMode === source.mode;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  key={source.mode}
                  className={cn(
                    "flex min-h-[72px] min-w-0 items-center gap-2.5 rounded-xl border p-3 text-right transition",
                    active
                      ? "border-[#6eb29e] bg-[#edf7f2] text-[#0f7b62] ring-3 ring-[rgba(33,132,102,.08)]"
                      : "border-[#dfe5df] bg-[#fbfcfa] text-[#73817e]",
                  )}
                  onClick={() => selectSourceMode(source.mode)}
                >
                  <Icon className="shrink-0" size={19} />
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <strong className="text-[9px] text-[#19312f]">
                      {source.title}
                    </strong>
                    <small className="truncate text-[9px] text-[#96a09e]">
                      {source.hint}
                    </small>
                  </span>
                  {active && (
                    <CheckCircle2
                      className="shrink-0 text-[#0f7b62]"
                      size={18}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {sourceMode === "text" ? (
            <div className="grid min-h-[246px] gap-1.5 pt-3 [&_label]:text-[10px] [&_label]:font-normal">
              <label htmlFor="job-description">متن آگهی شغلی</label>
              <textarea
                className="min-h-[160px] w-full resize-y rounded-[11px] border border-[#dfe5df] bg-[#fbfcfa] p-[13px] text-[12px] leading-8 outline-none placeholder:text-right focus:border-[#72b7a2] focus:ring-3 focus:ring-[#e7f3ef]"
                id="job-description"
                value={description}
                dir={
                  description.trim() ? getJobTextDirection(description) : "rtl"
                }
                lang={
                  description.trim() &&
                  getJobTextDirection(description) === "ltr"
                    ? "en"
                    : "fa"
                }
                placeholder="شرح موقعیت شغلی، مسئولیت‌ها و مهارت‌های موردنیاز را اینجا وارد کن..."
                onChange={(event) => {
                  setDescription(event.target.value);
                  setAnalysisDescription("");
                  setAnalyzed(false);
                }}
              />
              <div className="flex justify-end text-[8px] text-[#8c9996]">
                <span>{formatPersianNumber(description.length)} نویسه</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-1.5 pt-3 [&_label]:text-[10px] [&_label]:font-normal">
              <label htmlFor="job-url">لینک آگهی شغلی</label>
              <div className="flex h-[46px] items-center rounded-[11px] border border-[#dfe5df] bg-[#fbfcfa] px-3 text-[#8b9996] focus-within:border-[#79b8a5] focus-within:ring-3 focus-within:ring-[#e5f2ed]">
                <Link2 size={18} />
                <input
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 !text-left text-[12px] text-[#19312f] outline-none placeholder:!text-left placeholder:text-[#8b9996]"
                  id="job-url"
                  value={jobUrl}
                  onChange={(event) => {
                    setJobUrl(sanitizeLtrField(event.target.value));
                    setImportedDescription("");
                    setCopiedImportedDescription(false);
                    setAnalysisDescription("");
                    setAnalyzed(false);
                    setImportError("");
                  }}
                  dir="ltr"
                  data-direction="ltr"
                  inputMode="url"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                />
              </div>
              <p className="mx-0.5 mt-[9px] text-[8px] leading-[1.8] text-[#8c9996]">
                هنگام تحلیل، متن آگهی از همین لینک دریافت و سپس برای مدل ارسال
                می‌شود.
              </p>
              {importError && (
                <p className="m-0 text-[8px] text-[#b65e52]">{importError}</p>
              )}
              {importedDescription && (
                <div className="relative mt-2.5">
                  <details className="rounded-[10px] border border-[#dbe8e2] bg-[#f4f9f6] [&_p]:m-0 [&_p]:max-h-[125px] [&_p]:overflow-auto [&_p]:whitespace-pre-wrap [&_p]:px-3 [&_p]:pb-3 [&_p]:text-[8px] [&_p]:leading-[1.9] [&_p]:text-[#657572] [&_summary]:min-h-10 [&_summary]:cursor-pointer [&_summary]:py-3 [&_summary]:pr-3 [&_summary]:pl-11 [&_summary]:text-[8px] [&_summary]:font-bold [&_summary]:text-[#0f7b62]">
                    <summary>مشاهده متن استخراج‌شده از لینک</summary>
                    <p
                      dir={getJobTextDirection(importedDescription)}
                      lang={
                        getJobTextDirection(importedDescription) === "rtl"
                          ? "fa"
                          : "en"
                      }
                    >
                      {importedDescription}
                    </p>
                  </details>
                  <button
                    type="button"
                    className={cn(
                      "absolute top-[7px] left-[7px] grid size-7 place-items-center rounded-lg border border-[#cfe3da] bg-white text-[#0f7b62]",
                      copiedImportedDescription &&
                        "border-[#0f7b62] bg-[#0f7b62] text-white",
                    )}
                    onClick={copyImportedDescription}
                    aria-label={
                      copiedImportedDescription
                        ? "متن استخراج‌شده کپی شد"
                        : "کپی متن استخراج‌شده"
                    }
                    title={copiedImportedDescription ? "کپی شد" : "کپی متن"}
                  >
                    {copiedImportedDescription ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative mt-4 grid gap-1.5" ref={resumePickerRef}>
            <label className="text-[10px] font-normal">
              رزومه مبنا <span className="text-[#c85f52]">*</span>
            </label>
            <button
              className={cn(
                "flex min-h-[58px] w-full items-center gap-2.5 rounded-xl border bg-[#fbfcfa] p-2.5 text-right",
                selectedResume
                  ? "border-[#dfe5df]"
                  : "border-dashed border-[#cfd8d3]",
              )}
              onClick={() => {
                if (resumePicker) {
                  setResumePicker(false);
                  return;
                }
                const pickerRect =
                  resumePickerRef.current?.getBoundingClientRect();
                if (pickerRect) {
                  const spaceBelow = window.innerHeight - pickerRect.bottom;
                  setResumePickerOpensUp(
                    spaceBelow < 320 && pickerRect.top > spaceBelow,
                  );
                }
                setResumePicker(true);
              }}
              aria-expanded={resumePicker}
              aria-haspopup="listbox"
            >
              <div className="grid size-9 place-items-center rounded-[10px] bg-[#edf0ed] text-[#879590]">
                <FileText size={18} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate text-[9px] text-[#687773]">
                  {selectedResume?.label || "انتخاب رزومه مبنا"}
                </strong>
                <span className="mt-0.5 truncate text-[9px] text-[#929e9a]">
                  {selectedResume?.meta || "هیچ رزومه‌ای انتخاب نشده است"}
                </span>
              </div>
              <ChevronLeft size={18} />
            </button>
            {resumePicker && (
              <div
                className={cn(
                  "absolute right-0 left-0 z-40 max-h-[min(320px,calc(100vh-32px))] overflow-y-auto rounded-xl border border-[#dce6e1] bg-white p-1.5 shadow-[0_16px_40px_rgba(25,49,47,.14)]",
                  resumePickerOpensUp ? "bottom-[58px]" : "top-full mt-1.5",
                )}
                role="listbox"
              >
                {resumeOptions.length ? (
                  resumeOptions.map((resume) => (
                    <button
                      key={resume.id}
                      role="option"
                      aria-selected={baseResumeId === resume.id}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg p-2.5 text-right text-[#60716e] hover:bg-[#edf7f2]",
                        baseResumeId === resume.id &&
                          "bg-[#edf7f2] text-[#0f7b62]",
                      )}
                      onClick={() => {
                        setBaseResumeId(resume.id);
                        setResumePicker(false);
                        setAnalysisDescription("");
                        setAnalyzed(false);
                        setTailored(false);
                      }}
                    >
                      <FileText className="shrink-0" size={16} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <strong className="truncate text-[9px]">
                          {resume.label}
                        </strong>
                        <small className="mt-0.5 text-[7px] text-[#929e9a]">
                          {resume.meta}
                        </small>
                      </span>
                      {baseResumeId === resume.id && <Check size={15} />}
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center p-4 text-center text-[#8a9793]">
                    <FileText className="text-[#8fb4a8]" size={22} />
                    <strong className="mt-2 text-[9px] text-[#19312f]">
                      رزومه ذخیره‌شده‌ای نداری
                    </strong>
                    <small className="mt-1 text-[7px] leading-[1.8]">
                      ابتدا یک رزومه بساز و پیش‌نویس آن را ذخیره کن.
                    </small>
                    <Link
                      className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#0f7b62] px-[11px] py-2 text-[8px] font-bold text-white no-underline"
                      href="/resumes"
                    >
                      ساخت رزومه <ChevronLeft size={15} />
                    </Link>
                  </div>
                )}
              </div>
            )}
            {!selectedResume && (
              <p className="m-0 text-[8px] text-[#a36e45]">
                برای تحلیل تطابق، انتخاب رزومه مبنا الزامی است.
              </p>
            )}
          </div>
          <button
            className={`${primaryButton} mt-4 w-full`}
            disabled={
              !hasSelectedInput || !selectedResume || analysisBusy || importingUrl
            }
            onClick={analyze}
          >
            <Sparkles size={18} />{" "}
            {analysisBusy
              ? sourceMode === "url" && importingUrl
                ? "در حال خواندن لینک..."
                : "در حال تحلیل با مدل..."
              : analyzed
                ? "تحلیل مجدد"
                : sourceMode === "url"
                  ? "دریافت لینک و تحلیل تطابق"
                  : "تحلیل تطابق متن"}
          </button>
        </section>
        <section className={`${panel} min-h-[470px]`}>
          {analyzed && analysis ? (
            <>
              <div className="flex items-center gap-4 border-b border-[#edf0ec] pb-5">
                <CircularProgress
                  className="size-[105px] min-w-[105px] [--progress-track:#e1ece7] [--progress-value:#0f7b62]"
                  value={analysis.score}
                  label={`تطابق رزومه ${formatPersianNumber(analysis.score)} درصد`}
                  strokeWidth={9}
                >
                  <strong className="text-[24px]">
                    {formatPersianNumber(analysis.score)}
                  </strong>
                  <span className="text-[8px] text-[#758582]">٪ تطابق</span>
                </CircularProgress>
                <div>
                  <span className="rounded-md bg-[#e6f4ee] px-2 py-1 text-[8px] font-bold text-[#0f7b62]">
                    {analysis.score >= 85
                      ? "تطابق عالی"
                      : analysis.score >= 65
                        ? "تطابق خوب"
                        : "نیاز به بهبود"}
                  </span>
                  <h2 className="mb-1 mt-3 text-[16px]">{analysis.jobTitle}</h2>
                  <p className="m-0 text-[9px] text-[#758582]">
                    {analysis.company}
                  </p>
                </div>
              </div>
              <div className="my-5 grid gap-3">
                {analysis.breakdown.map((item) => (
                  <div className="grid gap-1.5" key={item.label}>
                    <div className="flex justify-between text-[9px]">
                      <span>{item.label}</span>
                      <strong>{formatPersianNumber(item.value)}٪</strong>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eeeb]">
                      <div
                        className={`h-full rounded-full bg-[#0f7b62] ${scoreWidth(item.value)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#edf0ec] pt-4">
                <h3 className="mb-2 text-[11px]">آنچه به‌خوبی پوشش داده‌ای</h3>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.strengths.map((item) => (
                    <span
                      className="inline-flex items-center gap-1 rounded-lg bg-[#edf7f2] px-2 py-1.5 text-[8px] text-[#0f7b62]"
                      key={item}
                    >
                      <Check size={14} /> {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 border-t border-[#edf0ec] pt-4">
                <h3 className="mb-2 text-[11px]">فرصت‌های بهبود</h3>
                <div className="grid gap-1.5">
                  {analysis.gaps.map((item) => (
                    <p
                      className="m-0 flex items-start gap-2 rounded-lg bg-[#fff7e8] p-2.5 text-[8px] leading-[1.8] text-[#8a6428]"
                      key={item}
                    >
                      <Sparkles className="shrink-0" size={16} /> {item}
                    </p>
                  ))}
                </div>
              </div>
              {tailoring && (
                <div className="mt-4">
                  <GenerationShimmer label="در حال بازنویسی رزومه براساس همین آگهی" />
                </div>
              )}
              <button
                className={`${primaryButton} mt-4 w-full`}
                disabled={tailoring}
                onClick={() => {
                  setTailoringTemplateId(
                    selectedResume?.templateId ||
                      selectableResumeTemplates[0].id,
                  );
                  setTailoringColor(
                    selectedResume?.colorId ||
                      getDefaultResumeColor(
                        selectedResume?.templateId ||
                          selectableResumeTemplates[0].id,
                      ),
                  );
                  setTailoringLanguage("fa");
                  setTemplatePickerOpen(true);
                }}
              >
                <WandSparkles size={18} />{" "}
                {tailoring ? "در حال ساخت با مدل..." : "ساخت رزومه اختصاصی"}
              </button>
            </>
          ) : analysisBusy ? (
            <MatchAnalysisSkeleton
              label={
                importingUrl
                  ? "در حال خواندن متن آگهی از لینک"
                  : "در حال مقایسه رزومه با نیازمندی‌های آگهی"
              }
            />
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center text-center text-[#8b9996]">
              <Target size={44} />
              <h3 className="mb-1 mt-3 text-[14px] text-[#19312f]">
                آماده تحلیل
              </h3>
              <p className="m-0 text-[9px]">
                شرح شغل را وارد کن تا گزارش تطبیق ساخته شود.
              </p>
            </div>
          )}
        </section>
      </div>
      {templatePickerOpen && (
        <Modal
          title="انتخاب قالب رزومه"
          description="رزومه اختصاصی با قالبی که انتخاب می‌کنی ساخته و ذخیره می‌شود."
          onClose={() => setTemplatePickerOpen(false)}
        >
          <div className="pt-4">
            <strong className="mb-2 block text-[10px] text-[#19312f]">
              زبان رزومه
            </strong>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "fa", label: "فارسی", description: "رزومه راست‌چین" },
                  {
                    id: "en",
                    label: "English",
                    description: "Left-to-right resume",
                  },
                ] as const
              ).map((language) => {
                const selected = tailoringLanguage === language.id;
                return (
                  <button
                    className={cn(
                      "flex min-h-[58px] items-center gap-2 rounded-xl border px-3 text-right transition-colors",
                      selected
                        ? "border-[#78b9a5] bg-[#edf7f2] text-[#0f7b62] ring-3 ring-[#e5f2ed]"
                        : "border-[#e1e7e2] bg-[#fbfcfa] text-[#60716e] hover:bg-[#f2f7f4]",
                    )}
                    type="button"
                    key={language.id}
                    onClick={() => setTailoringLanguage(language.id)}
                  >
                    <span
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full border",
                        selected
                          ? "border-[#0f7b62] bg-[#0f7b62] text-white"
                          : "border-[#ccd8d2] bg-white",
                      )}
                    >
                      {selected && <Check size={14} />}
                    </span>
                    <span className="flex flex-col">
                      <strong className="text-[9px]">{language.label}</strong>
                      <small
                        className="mt-0.5 text-[7px] text-[#879590]"
                        dir={language.id === "en" ? "ltr" : "rtl"}
                      >
                        {language.description}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
            <strong className="mb-2 mt-5 block text-[10px] text-[#19312f]">
              قالب رزومه
            </strong>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[561px]:grid-cols-2">
            {selectableResumeTemplates.map((template) => {
              const selectedTemplate = tailoringTemplateId === template.id;
              return (
                <button
                  className={cn(
                    "flex min-h-[72px] items-center gap-3 rounded-xl border p-3 text-right transition-colors duration-200",
                    selectedTemplate
                      ? "border-[#78b9a5] bg-[#edf7f2] text-[#0f7b62] ring-3 ring-[#e5f2ed]"
                      : "border-[#e1e7e2] bg-[#fbfcfa] text-[#60716e] hover:bg-[#f2f7f4]",
                  )}
                  type="button"
                  key={template.id}
                  onClick={() => {
                    setTailoringTemplateId(template.id);
                    setTailoringColor(getDefaultResumeColor(template.id));
                  }}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-[10px] text-[9px] font-extrabold",
                      selectedTemplate
                        ? "bg-[#0f7b62] text-white"
                        : "bg-[#e8eeea] text-[#72827e]",
                    )}
                  >
                    {selectedTemplate ? (
                      <Check size={16} />
                    ) : (
                      template.name.slice(0, 1)
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <strong className="text-[9px] text-[#19312f]">
                      {template.name}
                    </strong>
                    <small className="mt-1 line-clamp-2 text-[7px] leading-[1.7] text-[#879590]">
                      {template.subtitle}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
          {supportsResumeColors(tailoringTemplateId) && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#e3e9e4] bg-[#f8faf8] p-3">
              <strong className="ml-auto text-[9px] text-[#19312f]">
                رنگ قالب
              </strong>
              {resumeColorOptions.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  aria-label={color.label}
                  title={color.label}
                  className={cn(
                    "size-6 rounded-full border-2 border-white shadow-[0_0_0_1px_#d7dfda] transition-shadow",
                    color.swatch,
                    tailoringColor === color.id &&
                      "shadow-[0_0_0_2px_#0f7b62]",
                  )}
                  onClick={() => setTailoringColor(color.id)}
                />
              ))}
            </div>
          )}
          <div className="sticky -bottom-[22px] -mx-[22px] mt-5 flex justify-end gap-2 border-t border-[#e7ebe6] bg-white/95 px-[22px] py-3 backdrop-blur">
            <button
              className={secondaryButton}
              type="button"
              onClick={() => setTemplatePickerOpen(false)}
            >
              انصراف
            </button>
            <button
              className={primaryButton}
              type="button"
              disabled={!tailoringTemplateId || tailoring}
              onClick={() =>
                void tailorResume(
                  tailoringTemplateId,
                  tailoringLanguage,
                  tailoringColor,
                )
              }
            >
              <WandSparkles size={17} /> ساخت رزومه{" "}
              {tailoringLanguage === "en" ? "انگلیسی" : "فارسی"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
