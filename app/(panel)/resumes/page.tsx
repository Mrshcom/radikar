"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FilePlus2, SlidersHorizontal } from "lucide-react";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { ResumeBuilder } from "./resume-builder";
import { ResumeDocument } from "./resume-document";
import { emptyResumeData, resumeTemplates, type ResumeData } from "./resume-data";
import { templatePreviewData } from "./template-preview-data";
import { createRecordId, getActiveProfileId, getLatestResume, knowledgeProfileStore, resumeStore } from "@/lib/data/stores";
import type { ResumeRecord } from "@/lib/data/models";

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
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [knowledgeData, setKnowledgeData] = useState<ResumeData | null>(null);
  const [activeResumeId, setActiveResumeId] = useState("");
  const [savedDraft, setSavedDraft] = useState(false);
  const filteredTemplates = activeCategory === "همه"
    ? resumeTemplates
    : resumeTemplates.filter((template) => getTemplateCategory(template.tag) === activeCategory);

  useEffect(() => {
    let active = true;
    void getActiveProfileId().then((profileId) => Promise.all([getLatestResume(), knowledgeProfileStore.get(profileId)])).then(([resume, knowledge]) => {
      if (!active) return;
      if (knowledge) setKnowledgeData({ ...emptyResumeData, ...knowledge.resumeData });
      if (resume) {
        setData({ ...emptyResumeData, ...resume.data });
        setSelectedTemplate(resume.templateId);
        setActiveResumeId(resume.id);
        setSavedDraft(true);
        return;
      }
      if (knowledge) setData({ ...emptyResumeData, ...knowledge.resumeData });
    }).catch(() => {
      if (active) notify("خواندن پیش‌نویس‌های ذخیره‌شده ناموفق بود");
    });
    return () => { active = false; };
  }, [notify]);

  const updateData = (field: keyof ResumeData, value: string) => setData((current) => ({ ...current, [field]: value }));
  const persistResume = async (nextData: ResumeData, source: ResumeRecord["source"] = "user") => {
    const now = new Date().toISOString();
    const id = activeResumeId || createRecordId("resume");
    const previous = activeResumeId ? await resumeStore.get(activeResumeId) : undefined;
    await resumeStore.put({
      id,
      name: nextData.fullName.trim() || nextData.jobTitle.trim() || "رزومه بدون عنوان",
      templateId: selectedTemplate,
      data: nextData,
      source,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    });
    const profileId = await getActiveProfileId();
    const knowledge = await knowledgeProfileStore.get(profileId);
    const firstExperience = knowledge?.experiences?.[0];
    const firstQualification = knowledge?.qualifications?.[0];
    await knowledgeProfileStore.put({
      id: profileId,
      resumeData: nextData,
      experiences: [
        {
          id: firstExperience?.id ?? createRecordId("experience"),
          jobTitle: nextData.experienceTitle,
          company: nextData.company,
          location: firstExperience?.location ?? "",
          startDate: firstExperience?.startDate ?? firstExperience?.date ?? nextData.experienceDate,
          endDate: firstExperience?.endDate ?? "",
          isCurrent: firstExperience?.isCurrent ?? false,
          description: nextData.experience,
          technologies: firstExperience?.technologies ?? firstExperience?.achievements ?? knowledge?.achievements ?? "",
        },
        ...(knowledge?.experiences?.slice(1).map((experience) => ({
          id: experience.id,
          jobTitle: experience.jobTitle ?? "",
          company: experience.company ?? "",
          location: experience.location ?? "",
          startDate: experience.startDate ?? experience.date ?? "",
          endDate: experience.endDate ?? "",
          isCurrent: Boolean(experience.isCurrent),
          description: experience.description ?? "",
          technologies: experience.technologies ?? experience.achievements ?? "",
        })) ?? []),
      ],
      qualifications: [
        {
          id: firstQualification?.id ?? createRecordId("qualification"),
          education: nextData.education,
          skills: nextData.skills,
          languages: nextData.languages,
          certifications: firstQualification?.certifications ?? knowledge?.certifications ?? "",
        },
        ...(knowledge?.qualifications?.slice(1) ?? []),
      ],
      careerGoals: knowledge?.careerGoals ?? "",
      preferredRoles: knowledge?.preferredRoles ?? "",
      preferredIndustries: knowledge?.preferredIndustries ?? "",
      workPreferences: knowledge?.workPreferences ?? "",
      interviewContext: knowledge?.interviewContext ?? "",
      interviewChallenges: knowledge?.interviewChallenges ?? "",
      createdAt: knowledge?.createdAt ?? now,
      updatedAt: now,
    });
    setActiveResumeId(id);
    setSavedDraft(true);
  };
  const mergeData = async (nextData: ResumeData) => {
    setData(nextData);
    await persistResume(nextData);
  };
  const openBuilder = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (knowledgeData) setData({ ...emptyResumeData, ...knowledgeData });
    setActiveResumeId("");
    setSavedDraft(false);
    setBuilderOpen(true);
  };
  const saveDraft = async () => {
    await persistResume(data);
    notify("پیش‌نویس رزومه در فضای محلی امن ذخیره شد");
  };

  return <>
    <SectionTitle title="قالب‌های رزومه" description={`یکی از ${resumeTemplates.length} قالب آماده را انتخاب کن و اطلاعاتت را مرحله‌به‌مرحله وارد کن.`} action={<button className="primary-btn" onClick={() => openBuilder(selectedTemplate)}><FilePlus2 size={18} /> ساخت رزومه</button>} />
    {savedDraft && <div className="saved-draft-bar"><div><CheckCircle2 size={20} /><span><strong>پیش‌نویس ذخیره‌شده</strong><small>{data.fullName} · {resumeTemplates.find((template) => template.id === selectedTemplate)?.name}</small></span></div><button className="secondary-btn" onClick={() => setBuilderOpen(true)}>ادامه ویرایش</button></div>}

    <div className="template-filters"><div><SlidersHorizontal size={17} /><span>فیلتر قالب‌ها</span></div><div className="template-filter-list">{templateCategories.map((category) => { const count = category === "همه" ? resumeTemplates.length : resumeTemplates.filter((template) => getTemplateCategory(template.tag) === category).length; return <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}<span>{count}</span></button>; })}</div></div>

    <div className="template-results-meta"><strong>{filteredTemplates.length} قالب</strong><span>{activeCategory === "همه" ? "نمایش همه سبک‌ها" : `دسته ${activeCategory}`}</span></div>
    <div className="resume-template-gallery">{filteredTemplates.map((template) => <article className="resume-template-card" key={template.id}><div className="template-preview-frame"><ResumeDocument templateId={template.id} data={templatePreviewData} compact /></div><div className="template-card-info"><div><span>{template.tag}</span><h3>{template.name}</h3><p>{template.subtitle}</p></div><button className="primary-btn" onClick={() => openBuilder(template.id)}>استفاده از قالب</button></div></article>)}</div>

    {builderOpen && <ResumeBuilder data={data} selectedTemplate={selectedTemplate} onClose={() => setBuilderOpen(false)} onDataChange={updateData} onDataMerge={mergeData} onTemplateChange={setSelectedTemplate} onSave={saveDraft} />}
  </>;
}
