"use client";

import { useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Save, UserRound, BriefcaseBusiness, GraduationCap, ScanSearch, Sparkles } from "lucide-react";
import { Modal } from "../_components/ui";
import { ResumePreviewSkeleton } from "../_components/loading-skeletons";
import { ResumeDocument } from "./resume-document";
import { resumeTemplates, type ResumeData } from "./resume-data";
import { getActiveProfileId, knowledgeProfileStore } from "@/lib/data/stores";
import { scheduleFieldDirectionRefresh } from "@/lib/field-direction";

const steps = [
  { title: "اطلاعات فردی", description: "مشخصات تماس و عنوان حرفه‌ای", icon: UserRound },
  { title: "سابقه کاری", description: "آخرین تجربه و دستاوردهای مهم", icon: BriefcaseBusiness },
  { title: "مهارت و تحصیلات", description: "توانمندی‌ها و اطلاعات تکمیلی", icon: GraduationCap },
  { title: "خلاصه و بازبینی", description: "مرور نهایی پیش از دریافت", icon: ScanSearch },
] as const;

type Props = {
  data: ResumeData;
  selectedTemplate: string;
  onClose: () => void;
  onDataChange: (field: keyof ResumeData, value: string) => void;
  onDataMerge: (data: ResumeData) => void | Promise<void>;
  onTemplateChange: (templateId: string) => void;
  onSave: () => void | Promise<void>;
};

export function ResumeBuilder({ data, selectedTemplate, onClose, onDataChange, onDataMerge, onTemplateChange, onSave }: Props) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [modelError, setModelError] = useState("");
  const selected = resumeTemplates.find((template) => template.id === selectedTemplate);
  const canContinue = [Boolean(data.fullName.trim() && data.jobTitle.trim() && data.email.trim()), Boolean(data.experienceTitle.trim() && data.company.trim()), Boolean(data.education.trim() && data.skills.trim()), true][step];
  const input = (field: keyof ResumeData) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onDataChange(field, event.target.value);
  const finish = async () => { await onSave(); window.setTimeout(() => window.print(), 100); };
  const generateWithModel = async () => {
    setGenerating(true);
    setModelError("");
    try {
      const knowledge = await knowledgeProfileStore.get(await getActiveProfileId());
      const response = await fetch("/api/resume/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resume: data, knowledge }) });
      const result = await response.json() as { resume?: ResumeData; error?: string };
      if (!response.ok || !result.resume) throw new Error(result.error || "مدل رزومه‌ساز پاسخ نداد.");
      await onDataMerge(result.resume);
      scheduleFieldDirectionRefresh();
    } catch (error) {
      setModelError(error instanceof Error ? error.message : "مدل رزومه‌ساز پاسخ نداد.");
    } finally {
      setGenerating(false);
    }
  };

  return <Modal wide title="رزومه‌ساز رادیکار" description={`مرحله ${step + 1} از ${steps.length} · ${steps[step].title}`} onClose={onClose}>
    <div className="resume-builder">
      <aside className="builder-form">
        <div className="builder-progress" aria-label="مراحل ساخت رزومه">
          {steps.map((item, index) => { const Icon = item.icon; return <button key={item.title} className={index === step ? "active" : index < step ? "done" : ""} onClick={() => index <= step && setStep(index)}><span>{index < step ? <Check size={14} /> : <Icon size={14} />}</span><div><strong>{item.title}</strong><small>{item.description}</small></div></button>; })}
        </div>

        <div className="builder-template-select"><strong>قالب انتخاب‌شده: {selected?.name}</strong><div>{resumeTemplates.map((template) => <button key={template.id} className={selectedTemplate === template.id ? "active" : ""} onClick={() => onTemplateChange(template.id)}>{template.name}</button>)}</div></div>
        <div className="model-assist-box"><button className="secondary-btn" disabled={generating} onClick={generateWithModel}><Sparkles size={16} /> {generating ? "در حال تکمیل با مدل..." : "تکمیل رزومه با مدل"}</button>{modelError && <span>{modelError}</span>}</div>

        <div className="builder-fields builder-step" key={step}>
          {step === 0 && <><h3>اطلاعات فردی</h3><p className="step-help">اطلاعاتی را وارد کن که کارفرما برای شناخت و تماس با تو نیاز دارد.</p><div className="field-pair"><label>نام و نام خانوادگی<input autoFocus value={data.fullName} onChange={input("fullName")} /></label><label>عنوان حرفه‌ای<input value={data.jobTitle} onChange={input("jobTitle")} /></label></div><div className="field-pair"><label>ایمیل<input type="email" value={data.email} onChange={input("email")} /></label><label>شماره تماس<input value={data.phone} onChange={input("phone")} /></label></div><div className="field-pair"><label>محل سکونت<input value={data.location} onChange={input("location")} /></label><label>وب‌سایت یا لینکدین<input value={data.website} onChange={input("website")} /></label></div></>}

          {step === 1 && <><h3>سابقه کاری</h3><p className="step-help">جدیدترین و مرتبط‌ترین تجربه شغلی خودت را ثبت کن.</p><div className="field-pair"><label>عنوان شغلی<input autoFocus value={data.experienceTitle} onChange={input("experienceTitle")} /></label><label>شرکت<input value={data.company} onChange={input("company")} /></label></div><label>بازه همکاری<input value={data.experienceDate} onChange={input("experienceDate")} /></label><label>دستاوردها — هر مورد در یک خط<textarea value={data.experience} onChange={input("experience")} /></label></>}

          {step === 2 && <><h3>مهارت و تحصیلات</h3><p className="step-help">مهم‌ترین توانمندی‌ها و سوابق آموزشی مرتبط را اضافه کن.</p><label>تحصیلات<input autoFocus value={data.education} onChange={input("education")} /></label><label>مهارت‌ها<input value={data.skills} onChange={input("skills")} /></label><label>زبان‌ها<input value={data.languages} onChange={input("languages")} /></label></>}

          {step === 3 && <><h3>خلاصه و بازبینی</h3><p className="step-help">در چند جمله ارزش حرفه‌ای خودت را توضیح بده و پیش‌نمایش را بررسی کن.</p><label>خلاصه حرفه‌ای<textarea autoFocus value={data.summary} onChange={input("summary")} /></label><div className="review-summary"><div><Check size={15} /><span><strong>اطلاعات فردی</strong><small>{data.fullName} · {data.jobTitle}</small></span></div><div><Check size={15} /><span><strong>سابقه کاری</strong><small>{data.experienceTitle} در {data.company}</small></span></div><div><Check size={15} /><span><strong>مهارت‌ها</strong><small>{data.skills.split(/،|,/).slice(0, 3).join("، ")}</small></span></div></div></>}
        </div>

        <div className="builder-navigation"><button className="secondary-btn" disabled={step === 0} onClick={() => setStep((current) => current - 1)}><ArrowRight size={16} /> مرحله قبل</button>{step < steps.length - 1 ? <button className="primary-btn" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>ادامه <ArrowLeft size={16} /></button> : <button className="primary-btn" onClick={finish}><Download size={16} /> دریافت PDF</button>}</div>
      </aside>

      <section className="builder-preview"><div className="builder-preview-head"><div><span>پیش‌نمایش زنده</span><strong>{selected?.name}</strong></div><div><button className="secondary-btn" onClick={onSave}><Save size={16} /> ذخیره پیش‌نویس</button></div></div><div className={`resume-page-stage ${generating ? "is-generating" : ""}`}>{generating ? <ResumePreviewSkeleton /> : <ResumeDocument templateId={selectedTemplate} data={data} />}</div></section>
    </div>
  </Modal>;
}
