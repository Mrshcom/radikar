"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, CheckCircle2, ChevronLeft, Copy, FileText, Link2, Sparkles, Target, WandSparkles, X } from "lucide-react";
import { CircularProgress } from "../_components/circular-progress";
import { SectionTitle } from "../_components/ui";
import { GenerationShimmer, MatchAnalysisSkeleton } from "../_components/loading-skeletons";
import { useToast } from "../_components/panel-shell";
import { emptyResumeData, resumeTemplates, type ResumeData } from "../resumes/resume-data";
import { createRecordId, jobStore, matchAnalysisStore, resumeStore } from "@/lib/data/stores";
import type { JobRecord, MatchAnalysisRecord, ResumeRecord } from "@/lib/data/models";

type ImportJobResponse = { text?: string; sourceUrl?: string; error?: string };
type JobSourceMode = "text" | "url";
type ResumeOption = { id: string; label: string; meta: string; data: ResumeData; templateId: string };
type MatchAnalysis = {
  score: number;
  jobTitle: string;
  company: string;
  breakdown: Array<{ label: string; value: number }>;
  strengths: string[];
  gaps: string[];
};

const PERSIAN_SCRIPT_PATTERN = /\p{Script=Arabic}/u;

export function getJobTextDirection(text: string): "rtl" | "ltr" {
  return PERSIAN_SCRIPT_PATTERN.test(text) ? "rtl" : "ltr";
}

export default function MatchPage() {
  const notify = useToast();
  const [sourceMode, setSourceMode] = useState<JobSourceMode>("text");
  const [description, setDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [importedDescription, setImportedDescription] = useState("");
  const [copiedImportedDescription, setCopiedImportedDescription] = useState(false);
  const [analysisDescription, setAnalysisDescription] = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const [importError, setImportError] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [tailored, setTailored] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [resumePicker, setResumePicker] = useState(false);
  const [resumeOptions, setResumeOptions] = useState<ResumeOption[]>([]);
  const [baseResumeId, setBaseResumeId] = useState("");

  useEffect(() => {
    let active = true;
    void resumeStore.list().then((resumes) => {
      if (!active) return;
      setResumeOptions(resumes.map((resume) => {
        const data = { ...emptyResumeData, ...resume.data };
        const templateName = resumeTemplates.find((template) => template.id === resume.templateId)?.name || "قالب ذخیره‌شده";
        return {
          id: resume.id,
          label: data.jobTitle ? `${data.fullName || "رزومه من"} — ${data.jobTitle}` : data.fullName || resume.name,
          meta: `${resume.source === "tailored" ? "نسخه اختصاصی" : "پیش‌نویس"} · ${templateName}`,
          data,
          templateId: resume.templateId,
        };
      }));
    }).catch(() => {
      if (active) setResumeOptions([]);
    });
    return () => { active = false; };
  }, []);

  const selectedResume = resumeOptions.find((resume) => resume.id === baseResumeId);

  const selectSourceMode = (mode: JobSourceMode) => {
    setSourceMode(mode);
    setAnalyzed(false);
    setTailored(false);
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
      setImportError("کپی خودکار انجام نشد؛ مرورگر اجازه دسترسی به کلیپ‌بورد را نداد.");
    }
  };

  const importJobDescription = async () => {
    const response = await fetch("/api/job-import", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: jobUrl.trim() }),
    });
    const result = (await response.json()) as ImportJobResponse;

    if (!response.ok || !result.text) {
      throw new Error(result.error || "متن آگهی از این لینک قابل دریافت نبود.");
    }

    return { text: result.text.trim(), sourceUrl: result.sourceUrl || jobUrl.trim() };
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
    let selectedSourceUrl = "";
    if (sourceMode === "url") {
      setImportingUrl(true);
      try {
        const imported = await importJobDescription();
        selectedDescription = imported.text;
        selectedSourceUrl = imported.sourceUrl;
        setImportedDescription(selectedDescription);
        setCopiedImportedDescription(false);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : "خواندن لینک آگهی با خطا روبه‌رو شد.");
        setAnalyzing(false);
        setImportingUrl(false);
        return;
      }
      setImportingUrl(false);
    }

    try {
      const response = await fetch("/api/match/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription: selectedDescription, resume: selectedResume.data }),
      });
      const result = await response.json() as MatchAnalysis & { error?: string };

      if (!response.ok) throw new Error(result.error || "تحلیل تطابق ناموفق بود.");
      setAnalysis(result);
      setAnalysisDescription(selectedDescription);
      setAnalyzed(true);
      const now = new Date().toISOString();
      const analysisRecord: MatchAnalysisRecord = {
        id: createRecordId("match"),
        resumeId: selectedResume.id,
        jobDescription: selectedDescription,
        sourceUrl: selectedSourceUrl || undefined,
        analysis: result,
        createdAt: now,
        updatedAt: now,
      };
      await matchAnalysisStore.put(analysisRecord);
      const existingJob = (await jobStore.list()).find((job) =>
        (selectedSourceUrl && job.sourceUrl === selectedSourceUrl)
        || (!selectedSourceUrl && job.description === selectedDescription),
      );
      const jobRecord: JobRecord = {
        id: existingJob?.id || createRecordId("job"),
        company: result.company,
        role: result.jobTitle,
        match: result.score,
        place: existingJob?.place || "",
        age: new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date()),
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
      notify(sourceMode === "url" ? "آگهی از لینک خوانده و تحلیل شد" : "متن آگهی با مدل تحلیل شد");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "تحلیل تطابق ناموفق بود.");
    } finally {
      setAnalyzing(false);
    }
  };

  const tailorResume = async () => {
    setTailoring(true);
    setAnalysisError("");
    try {
      if (!selectedResume) throw new Error("ابتدا رزومه مبنا را انتخاب کن.");
      const response = await fetch("/api/match/tailor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription: analysisDescription, resume: selectedResume.data }),
      });
      const result = await response.json() as { resume?: ResumeData; error?: string };

      if (!response.ok || !result.resume) throw new Error(result.error || "ساخت رزومه اختصاصی ناموفق بود.");
      const now = new Date().toISOString();
      const tailoredResume: ResumeRecord = {
        id: createRecordId("resume"),
        name: `${result.resume.fullName || result.resume.jobTitle || "رزومه"} — ${analysis?.jobTitle || "نسخه اختصاصی"}`,
        templateId: selectedResume.templateId,
        data: result.resume,
        source: "tailored",
        createdAt: now,
        updatedAt: now,
      };
      await resumeStore.put(tailoredResume);
      setTailored(true);
      notify("نسخه اختصاصی با DeepSeek ساخته و ذخیره شد");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "ساخت رزومه اختصاصی ناموفق بود.");
    } finally {
      setTailoring(false);
    }
  };

  const hasSelectedInput = sourceMode === "text" ? Boolean(description.trim()) : Boolean(jobUrl.trim());

  return <><SectionTitle title="تطبیق هوشمند با شغل" description="روش ورود آگهی را انتخاب کن تا رزومه دقیقاً بر اساس همان منبع تحلیل شود." />{tailored && <div className="success-banner"><CheckCircle2 size={20} /><div><strong>نسخه اختصاصی ساخته شد</strong><span>پیش‌نویس جدید در بخش رزومه‌های من ذخیره شد.</span></div><button onClick={() => setTailored(false)}><X size={18} /></button></div>}{analysisError && <div className="success-banner warning-banner"><Sparkles size={20} /><div><strong>تحلیل انجام نشد</strong><span>{analysisError}</span></div><button onClick={() => setAnalysisError("")}><X size={18} /></button></div>}<div className="match-layout">
    <section className="panel match-input-panel">
      <div className="step-label"><span>۱</span><div><strong>اطلاعات فرصت شغلی</strong><small>یکی از دو روش زیر را انتخاب کن</small></div></div>
      <div className="job-source-switch" role="radiogroup" aria-label="روش ورود آگهی شغلی">
        <button type="button" role="radio" aria-checked={sourceMode === "text"} className={sourceMode === "text" ? "active" : ""} onClick={() => selectSourceMode("text")}><FileText size={19} /><span><strong>وارد کردن متن آگهی</strong><small>متن شرح شغل را کپی کن</small></span>{sourceMode === "text" && <CheckCircle2 size={18} />}</button>
        <button type="button" role="radio" aria-checked={sourceMode === "url"} className={sourceMode === "url" ? "active" : ""} onClick={() => selectSourceMode("url")}><Link2 size={19} /><span><strong>افزودن لینک آگهی</strong><small>متن مستقیماً از لینک خوانده می‌شود</small></span>{sourceMode === "url" && <CheckCircle2 size={18} />}</button>
      </div>

      {sourceMode === "text" ? <div className="job-source-content">
        <label htmlFor="job-description">متن آگهی شغلی</label>
        <textarea id="job-description" value={description} dir={description.trim() ? getJobTextDirection(description) : "rtl"} lang={description.trim() && getJobTextDirection(description) === "ltr" ? "en" : "fa"} placeholder="شرح موقعیت شغلی، مسئولیت‌ها و مهارت‌های موردنیاز را اینجا وارد کن..." onChange={(event) => { setDescription(event.target.value); setAnalysisDescription(""); setAnalyzed(false); }} />
        <div className="input-actions"><span>{description.length} نویسه</span></div>
      </div> : <div className="job-source-content">
        <label htmlFor="job-url">لینک آگهی شغلی</label>
        <div className="job-url-import"><Link2 size={18} /><input id="job-url" value={jobUrl} onChange={(event) => { setJobUrl(event.target.value); setImportedDescription(""); setCopiedImportedDescription(false); setAnalysisDescription(""); setAnalyzed(false); setImportError(""); }} dir="ltr" inputMode="url" placeholder="https://www.linkedin.com/jobs/view/..." /></div>
        <p className="job-source-hint">هنگام تحلیل، متن آگهی از همین لینک دریافت و سپس برای مدل ارسال می‌شود.</p>
        {importError && <p className="import-error">{importError}</p>}
        {importedDescription && <div className="imported-job-preview-wrap"><details className="imported-job-preview"><summary>مشاهده متن استخراج‌شده از لینک</summary><p dir={getJobTextDirection(importedDescription)} lang={getJobTextDirection(importedDescription) === "rtl" ? "fa" : "en"}>{importedDescription}</p></details><button type="button" className={`copy-imported-job${copiedImportedDescription ? " copied" : ""}`} onClick={copyImportedDescription} aria-label={copiedImportedDescription ? "متن استخراج‌شده کپی شد" : "کپی متن استخراج‌شده"} title={copiedImportedDescription ? "کپی شد" : "کپی متن"}>{copiedImportedDescription ? <Check size={14} /> : <Copy size={14} />}</button></div>}
      </div>}

      <label>رزومه مبنا <span className="required-mark">*</span></label>
      <button className={`resume-select ${selectedResume ? "" : "empty"}`} onClick={() => setResumePicker((value) => !value)} aria-expanded={resumePicker} aria-haspopup="listbox"><div className="mini-file"><FileText size={18} /></div><div><strong>{selectedResume?.label || "انتخاب رزومه مبنا"}</strong><span>{selectedResume?.meta || "هیچ رزومه‌ای انتخاب نشده است"}</span></div><ChevronLeft size={18} /></button>
      {resumePicker && <div className="resume-picker" role="listbox">{resumeOptions.length ? resumeOptions.map((resume) => <button key={resume.id} role="option" aria-selected={baseResumeId === resume.id} className={baseResumeId === resume.id ? "active" : ""} onClick={() => { setBaseResumeId(resume.id); setResumePicker(false); setAnalysisDescription(""); setAnalyzed(false); setTailored(false); }}><FileText size={16} /><span><strong>{resume.label}</strong><small>{resume.meta}</small></span>{baseResumeId === resume.id && <Check size={15} />}</button>) : <div className="empty-resume-picker"><FileText size={22} /><strong>رزومه ذخیره‌شده‌ای نداری</strong><small>ابتدا یک رزومه بساز و پیش‌نویس آن را ذخیره کن.</small><Link href="/resumes">ساخت رزومه <ChevronLeft size={15} /></Link></div>}</div>}
      {!selectedResume && <p className="resume-required-note">برای تحلیل تطابق، انتخاب رزومه مبنا الزامی است.</p>}
      <button className="primary-btn analyze-btn" disabled={!hasSelectedInput || !selectedResume || analyzing || importingUrl} onClick={analyze}><Sparkles size={18} /> {analyzing ? (sourceMode === "url" && importingUrl ? "در حال خواندن لینک..." : "در حال تحلیل با مدل...") : analyzed ? "تحلیل مجدد" : sourceMode === "url" ? "دریافت لینک و تحلیل تطابق" : "تحلیل تطابق متن"}</button>
    </section>
    <section className="panel analysis-panel">{analyzed && analysis ? <><div className="analysis-head"><CircularProgress className="large-score" value={analysis.score} label={`تطابق رزومه ${analysis.score} درصد`} strokeWidth={9}><strong>{analysis.score}</strong><span>٪ تطابق</span></CircularProgress><div><span className="great-label">{analysis.score >= 85 ? "تطابق عالی" : analysis.score >= 65 ? "تطابق خوب" : "نیاز به بهبود"}</span><h2>{analysis.jobTitle}</h2><p>{analysis.company}</p></div></div><div className="score-breakdown">{analysis.breakdown.map((item) => <div key={item.label}><div><span>{item.label}</span><strong>{item.value}٪</strong></div><i><b style={{ width: `${item.value}%` }} /></i></div>)}</div><div className="keywords-block"><h3>آنچه به‌خوبی پوشش داده‌ای</h3><div>{analysis.strengths.map((item) => <span key={item}><Check size={14} /> {item}</span>)}</div></div><div className="gap-block"><h3>فرصت‌های بهبود</h3>{analysis.gaps.map((item) => <p key={item}><Sparkles size={16} /> {item}</p>)}</div>{tailoring && <GenerationShimmer label="در حال بازنویسی رزومه براساس همین آگهی" />}<button className="primary-btn full" disabled={tailoring} onClick={tailorResume}><WandSparkles size={18} /> {tailoring ? "در حال ساخت با مدل..." : "ساخت رزومه اختصاصی"}</button></> : analyzing ? <MatchAnalysisSkeleton label={importingUrl ? "در حال خواندن متن آگهی از لینک" : "در حال مقایسه رزومه با نیازمندی‌های آگهی"} /> : <div className="empty-analysis"><Target size={44} /><h3>آماده تحلیل</h3><p>شرح شغل را وارد کن تا گزارش تطبیق ساخته شود.</p></div>}</section>
  </div></>;
}
