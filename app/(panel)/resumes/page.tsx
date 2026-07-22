"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FilePlus2, SlidersHorizontal } from "lucide-react";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { ResumeBuilder } from "./resume-builder";
import { ResumeDocument } from "./resume-document";
import { defaultResumeData, resumeTemplates, type ResumeData } from "./resume-data";

const templateCategories = ["همه", "ساده", "مدرن", "حرفه‌ای", "خلاق", "رنگی"] as const;
type TemplateCategory = (typeof templateCategories)[number];

const categoryByTag: Record<string, Exclude<TemplateCategory, "همه">> = {
  "پیشنهادی": "ساده",
  "رسمی": "ساده",
  "مینیمال": "ساده",
  "خوانا": "ساده",
  "کاربردی": "ساده",
  "ظریف": "ساده",
  "آکادمیک": "ساده",
  "English-ready": "ساده",
  "فارسی": "ساده",
  "مدرن": "مدرن",
  "فنی": "مدرن",
  "دیجیتال": "مدرن",
  "صنعتی": "مدرن",
  "آینده‌نگر": "مدرن",
  "محبوب": "حرفه‌ای",
  "مدیریتی": "حرفه‌ای",
  "حرفه‌ای": "حرفه‌ای",
  "شرکتی": "حرفه‌ای",
  "متعادل": "حرفه‌ای",
  "شیک": "حرفه‌ای",
  "هماهنگ": "حرفه‌ای",
  "خلاق": "خلاق",
  "رنگی": "رنگی",
};

function getTemplateCategory(tag: string) {
  return categoryByTag[tag] ?? "حرفه‌ای";
}

export default function ResumesPage() {
  const notify = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("ats");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("همه");
  const [data, setData] = useState<ResumeData>(defaultResumeData);
  const [savedDraft, setSavedDraft] = useState(false);
  const filteredTemplates = activeCategory === "همه"
    ? resumeTemplates
    : resumeTemplates.filter((template) => getTemplateCategory(template.tag) === activeCategory);

  useEffect(() => {
    const saved = window.localStorage.getItem("masir-resume-draft");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { data?: ResumeData; templateId?: string };
      const timer = window.setTimeout(() => {
        if (parsed.data) {
          setData({
            ...defaultResumeData,
            ...parsed.data,
            photoUrl: parsed.data.photoUrl || defaultResumeData.photoUrl,
          });
        }
        if (parsed.templateId) setSelectedTemplate(parsed.templateId);
        setSavedDraft(true);
      }, 0);
      return () => window.clearTimeout(timer);
    } catch { return; }
  }, []);

  const updateData = (field: keyof ResumeData, value: string) => setData((current) => ({ ...current, [field]: value }));
  const openBuilder = (templateId: string) => { setSelectedTemplate(templateId); setBuilderOpen(true); };
  const saveDraft = () => { window.localStorage.setItem("masir-resume-draft", JSON.stringify({ data, templateId: selectedTemplate })); setSavedDraft(true); notify("پیش‌نویس رزومه روی این دستگاه ذخیره شد"); };

  return <>
    <SectionTitle title="قالب‌های رزومه" description={`یکی از ${resumeTemplates.length} قالب آماده را انتخاب کن و اطلاعاتت را مرحله‌به‌مرحله وارد کن.`} action={<button className="primary-btn" onClick={() => openBuilder(selectedTemplate)}><FilePlus2 size={18} /> ساخت رزومه</button>} />
    {savedDraft && <div className="saved-draft-bar"><div><CheckCircle2 size={20} /><span><strong>پیش‌نویس ذخیره‌شده</strong><small>{data.fullName} · {resumeTemplates.find((template) => template.id === selectedTemplate)?.name}</small></span></div><button className="secondary-btn" onClick={() => setBuilderOpen(true)}>ادامه ویرایش</button></div>}

    <div className="template-filters"><div><SlidersHorizontal size={17} /><span>فیلتر قالب‌ها</span></div><div className="template-filter-list">{templateCategories.map((category) => { const count = category === "همه" ? resumeTemplates.length : resumeTemplates.filter((template) => getTemplateCategory(template.tag) === category).length; return <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}<span>{count}</span></button>; })}</div></div>

    <div className="template-results-meta"><strong>{filteredTemplates.length} قالب</strong><span>{activeCategory === "همه" ? "نمایش همه سبک‌ها" : `دسته ${activeCategory}`}</span></div>
    <div className="resume-template-gallery">{filteredTemplates.map((template) => <article className="resume-template-card" key={template.id}><div className="template-preview-frame"><ResumeDocument templateId={template.id} data={defaultResumeData} compact /></div><div className="template-card-info"><div><span>{template.tag}</span><h3>{template.name}</h3><p>{template.subtitle}</p></div><button className="primary-btn" onClick={() => openBuilder(template.id)}>استفاده از قالب</button></div></article>)}</div>

    {builderOpen && <ResumeBuilder data={data} selectedTemplate={selectedTemplate} onClose={() => setBuilderOpen(false)} onDataChange={updateData} onTemplateChange={setSelectedTemplate} onSave={saveDraft} />}
  </>;
}
