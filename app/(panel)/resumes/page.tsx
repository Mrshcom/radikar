"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  FilePlus2,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal, Modal, SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { ResumeBuilder } from "./resume-builder";
import { ScaledResumePreview } from "./scaled-resume-preview";
import {
  emptyResumeData,
  getDefaultResumeColor,
  resumeColorOptions,
  resumeTemplates,
  selectableResumeTemplates,
  type ResumeData,
  type ResumeColorId,
  supportsResumeColors,
} from "./resume-data";
import { templatePreviewData } from "./template-preview-data";
import {
  createRecordId,
  getActiveProfileId,
  jobStore,
  knowledgeProfileStore,
  resumeStore,
} from "@/lib/data/stores";
import type {
  JobRecord,
  KnowledgeProfileRecord,
  ResumeRecord,
} from "@/lib/data/models";
import { cn } from "@/lib/cn";
import { formatPersianNumber } from "@/lib/fa-number";

const templateCategories = [
  "همه",
  "ساده",
  "مدرن",
  "حرفه‌ای",
  "خلاق",
  "رنگی",
] as const;
const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-[15px] text-[11px] font-bold whitespace-nowrap text-white shadow-[0_7px_17px_rgba(15,123,98,.17)] transition-colors duration-200 hover:bg-[#0b6954]";
type TemplateCategory = (typeof templateCategories)[number];
type ResumePageTab = "resumes" | "templates";

const categoryByTag: Record<string, Exclude<TemplateCategory, "همه">> = {
  پیشنهادی: "ساده",
  رسمی: "ساده",
  مینیمال: "ساده",
  خوانا: "ساده",
  کاربردی: "ساده",
  ظریف: "ساده",
  آکادمیک: "ساده",
  "English-ready": "ساده",
  فارسی: "ساده",
  مدرن: "مدرن",
  فنی: "مدرن",
  دیجیتال: "مدرن",
  صنعتی: "مدرن",
  آینده‌نگر: "مدرن",
  محبوب: "حرفه‌ای",
  مدیریتی: "حرفه‌ای",
  حرفه‌ای: "حرفه‌ای",
  شرکتی: "حرفه‌ای",
  متعادل: "حرفه‌ای",
  شیک: "حرفه‌ای",
  هماهنگ: "حرفه‌ای",
  خلاق: "خلاق",
  رنگی: "رنگی",
};

function getTemplateCategory(tag: string) {
  return categoryByTag[tag] ?? "حرفه‌ای";
}

function resumeFromKnowledge(knowledge: KnowledgeProfileRecord): ResumeData {
  const stored = { ...emptyResumeData, ...knowledge.resumeData };
  const experiences = (knowledge.experiences || [])
    .filter(
      (item) =>
        (item.jobTitle || "").trim() ||
        (item.company || "").trim() ||
        (item.description || "").trim() ||
        (item.startDate || "").trim() ||
        (item.endDate || "").trim(),
    )
    .map((item) => ({
      id: item.id,
      jobTitle: item.jobTitle || "",
      company: item.company || "",
      location: item.location || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      isCurrent: item.isCurrent,
      description: item.description || "",
      technologies: item.technologies || item.achievements || "",
    }));
  const educations = (knowledge.qualifications || [])
    .filter(
      (item) =>
        (item.institution || "").trim() ||
        (item.credential || item.education || "").trim() ||
        (item.startDate || "").trim() ||
        (item.endDate || "").trim(),
    )
    .map((item) => ({
      id: item.id,
      institution: item.institution || "",
      credential: item.credential || item.education || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      isCurrent: item.isCurrent,
    }));
  return {
    ...stored,
    experiences: experiences.length ? experiences : stored.experiences,
    educations: educations.length ? educations : stored.educations,
  };
}

async function restoreTailoredJobDetails(
  resumes: ResumeRecord[],
  jobs: JobRecord[],
) {
  const restored = await Promise.all(
    resumes.map(async (resume) => {
      if (
        resume.source !== "tailored" ||
        (resume.targetJobTitle?.trim() && resume.targetCompany?.trim())
      )
        return resume;

      const resumeCreatedAt = new Date(resume.createdAt).getTime();
      const linkedJob =
        jobs.find((job) => job.id === resume.targetJobId) ||
        jobs
          .map((job) => ({
            job,
            distance:
              resumeCreatedAt -
              new Date(job.updatedAt || job.createdAt).getTime(),
          }))
          .filter(
            ({ distance }) =>
              Number.isFinite(distance) &&
              distance >= 0 &&
              distance <= 30 * 60 * 1000,
          )
          .sort((left, right) => left.distance - right.distance)[0]?.job;

      if (!linkedJob) return resume;
      const nextResume: ResumeRecord = {
        ...resume,
        targetJobId: linkedJob.id,
        targetJobTitle: resume.targetJobTitle || linkedJob.role,
        targetCompany: resume.targetCompany || linkedJob.company,
        updatedAt: resume.updatedAt,
      };
      await resumeStore.put(nextResume);
      return nextResume;
    }),
  );
  return restored;
}

export default function ResumesPage() {
  const notify = useToast();
  const [activeTab, setActiveTab] = useState<ResumePageTab>("resumes");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("ats");
  const [selectedColor, setSelectedColor] = useState<ResumeColorId>("mint");
  const [templateColors, setTemplateColors] = useState<
    Record<string, ResumeColorId>
  >({});
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("همه");
  const [data, setData] = useState<ResumeData>(emptyResumeData);
  const [knowledgeData, setKnowledgeData] = useState<ResumeData | null>(null);
  const [activeResumeId, setActiveResumeId] = useState("");
  const [savedResumes, setSavedResumes] = useState<ResumeRecord[]>([]);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeRecord | null>(
    null,
  );
  const [templatePreview, setTemplatePreview] = useState<{
    id: string;
    name: string;
    colorId: ResumeColorId;
  } | null>(null);
  const filteredTemplates =
    activeCategory === "همه"
      ? selectableResumeTemplates
      : selectableResumeTemplates.filter(
          (template) => getTemplateCategory(template.tag) === activeCategory,
        );

  useEffect(() => {
    let active = true;
    void getActiveProfileId()
      .then((profileId) =>
        Promise.all([
          resumeStore.list(),
          knowledgeProfileStore.get(profileId),
          jobStore.list(),
        ]),
      )
      .then(async ([resumes, knowledge, jobs]) => {
        if (!active) return;
        const restoredResumes = await restoreTailoredJobDetails(resumes, jobs);
        if (!active) return;
        const resume = restoredResumes[0];
        setSavedResumes(restoredResumes);
        if (knowledge) setKnowledgeData(resumeFromKnowledge(knowledge));
        if (resume) {
          setData({ ...emptyResumeData, ...resume.data });
          setSelectedTemplate(resume.templateId);
          setSelectedColor(
            resume.colorId || getDefaultResumeColor(resume.templateId),
          );
          setActiveResumeId(resume.id);
          return;
        }
        if (knowledge) setData(resumeFromKnowledge(knowledge));
      })
      .catch(() => {
        if (active)
          notify("خواندن پیش‌نویس‌های ذخیره‌شده ناموفق بود", "error");
      });
    return () => {
      active = false;
    };
  }, [notify]);

  const updateData = (field: keyof ResumeData, value: string) =>
    setData((current) => ({ ...current, [field]: value }));
  const persistResume = async (
    nextData: ResumeData,
    source: ResumeRecord["source"] = "user",
  ) => {
    const now = new Date().toISOString();
    const id = activeResumeId || createRecordId("resume");
    const previous = activeResumeId
      ? await resumeStore.get(activeResumeId)
      : undefined;
    const record: ResumeRecord = {
      id,
      name:
        nextData.fullName.trim() ||
        nextData.jobTitle.trim() ||
        "رزومه بدون عنوان",
      templateId: selectedTemplate,
      colorId: selectedColor,
      data: nextData,
      source: previous?.source ?? source,
      targetJobId: previous?.targetJobId,
      targetJobTitle: previous?.targetJobTitle,
      targetCompany: previous?.targetCompany,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    await resumeStore.put(record);
    setSavedResumes((current) => [
      record,
      ...current.filter((resume) => resume.id !== record.id),
    ]);
    setActiveResumeId(id);
  };
  const mergeData = async (nextData: ResumeData) => {
    setData(nextData);
    await persistResume(nextData);
  };
  const openBuilder = (templateId: string) => {
    setSelectedTemplate(templateId);
    setSelectedColor(
      templateColors[templateId] || getDefaultResumeColor(templateId),
    );
    if (knowledgeData) setData({ ...emptyResumeData, ...knowledgeData });
    setActiveResumeId("");
    setBuilderOpen(true);
  };
  const openSavedResume = (resume: ResumeRecord) => {
    setData({ ...emptyResumeData, ...resume.data });
    setSelectedTemplate(resume.templateId);
    setSelectedColor(
      resume.colorId || getDefaultResumeColor(resume.templateId),
    );
    setActiveResumeId(resume.id);
    setBuilderOpen(true);
  };
  const saveDraft = async () => {
    await persistResume(data);
    notify("رزومه در فضای محلی امن ذخیره شد");
  };
  const deleteResume = async () => {
    if (!resumeToDelete) return;
    try {
      await resumeStore.remove(resumeToDelete.id);
      setSavedResumes((current) =>
        current.filter((resume) => resume.id !== resumeToDelete.id),
      );
      if (activeResumeId === resumeToDelete.id) {
        setActiveResumeId("");
        setBuilderOpen(false);
      }
      setResumeToDelete(null);
      notify("رزومه حذف شد");
    } catch {
      notify("حذف رزومه ناموفق بود", "error");
    }
  };

  return (
    <>
      <SectionTitle
        title="رزومه‌های من"
        description="رزومه‌های ذخیره‌شده‌ات را مدیریت کن یا از قالب‌های آماده یک رزومه جدید بساز."
        action={
          <button
            className={primaryButton}
            onClick={() => setActiveTab("templates")}
          >
            <FilePlus2 size={18} /> ساخت رزومه
          </button>
        }
      />

      <div
        className="mb-6 flex w-full gap-1 rounded-[14px] border border-[#dfe7e1] bg-[#f2f5f2] p-1.5"
        role="tablist"
        aria-label="بخش‌های رزومه"
      >
        <button
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center rounded-[10px] px-4 text-[10px] font-bold transition-colors duration-200",
            activeTab === "resumes"
              ? "bg-white text-[#0f7b62] shadow-[0_4px_14px_rgba(27,55,50,.08)]"
              : "bg-transparent text-[#71807c] hover:bg-white/60 hover:text-[#29433e]",
          )}
          type="button"
          role="tab"
          aria-selected={activeTab === "resumes"}
          onClick={() => setActiveTab("resumes")}
        >
          رزومه‌ها
        </button>
        <button
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center rounded-[10px] px-4 text-[10px] font-bold transition-colors duration-200",
            activeTab === "templates"
              ? "bg-white text-[#0f7b62] shadow-[0_4px_14px_rgba(27,55,50,.08)]"
              : "bg-transparent text-[#71807c] hover:bg-white/60 hover:text-[#29433e]",
          )}
          type="button"
          role="tab"
          aria-selected={activeTab === "templates"}
          onClick={() => setActiveTab("templates")}
        >
          قالب‌های آماده رزومه
        </button>
      </div>

      {activeTab === "resumes" && savedResumes.length > 0 && (
        <section className="mb-6 min-w-0 overflow-hidden rounded-[18px] border border-[#dfe8e2] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.055)]">
          <header className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-[14px]">رزومه‌های من</h2>
              <p className="mb-0 mt-1 text-[8px] text-[#84928f]">
                نسخه‌های ذخیره‌شده و رزومه‌هایی که برای فرصت‌های مشخص ساخته‌ای.
              </p>
            </div>
            <span className="rounded-full bg-[#edf7f2] px-2.5 py-1 text-[8px] font-bold text-[#0f7b62]">
              {formatPersianNumber(savedResumes.length)} نسخه
            </span>
          </header>
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[700px]:grid-cols-2 min-[1121px]:grid-cols-3">
            {savedResumes.map((resume) => {
              const template = resumeTemplates.find(
                (item) => item.id === resume.templateId,
              );
              const tailored = resume.source === "tailored";
              return (
                <article
                  className="group min-w-0 overflow-hidden rounded-[16px] border border-[#e1e8e2] bg-[#fbfcfa] transition-shadow duration-200 hover:shadow-[0_14px_30px_rgba(27,55,50,.09)]"
                  key={resume.id}
                >
                  <button
                    className="grid h-[260px] w-full place-items-center overflow-hidden border-0 bg-[#e9eeea] p-3 transition-colors duration-200 hover:bg-[#e1e8e3] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0f7b62]"
                    type="button"
                    aria-label={`مشاهده و ویرایش ${resume.name}`}
                    onClick={() => openSavedResume(resume)}
                  >
                    <div className="mx-auto w-full max-w-[166px]">
                      <ScaledResumePreview
                        templateId={resume.templateId}
                        data={resume.data}
                        colorId={
                          resume.colorId ||
                          getDefaultResumeColor(resume.templateId)
                        }
                      />
                    </div>
                  </button>
                  <div className="grid min-w-0 gap-3 border-t border-[#e5ebe6] p-4">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[7px] font-bold",
                            tailored
                              ? "bg-[#e8e1f5] text-[#725aa7]"
                              : "bg-[#e6f4ee] text-[#0f7b62]",
                          )}
                        >
                          {tailored ? (
                            <Sparkles size={11} />
                          ) : (
                            <FilePlus2 size={11} />
                          )}
                          {tailored ? "نسخه اختصاصی" : "رزومه شخصی"}
                        </span>
                        <h3
                          className="mb-0 mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px]"
                          dir="auto"
                        >
                          {resume.name}
                        </h3>
                      </div>
                      <span className="max-w-[38%] shrink-0 truncate text-[7px] text-[#899692]">
                        {template?.name || "قالب ذخیره‌شده"}
                      </span>
                    </div>
                    {tailored && (
                      <div className="min-w-0 overflow-hidden rounded-xl border border-[#d9e8e1] bg-[#eff8f4] p-3">
                        <span className="flex items-center gap-1 text-[7px] font-bold text-[#43816f]">
                          <BriefcaseBusiness size={12} /> ساخته‌شده برای فرصت
                        </span>
                        <strong
                          className="mt-1.5 block truncate text-[9px] leading-[1.7] text-[#19312f]"
                          dir="auto"
                        >
                          {resume.targetJobTitle || "عنوان فرصت ثبت نشده"}
                        </strong>
                        <small
                          className="mt-0.5 block truncate text-[8px] text-[#758783]"
                          dir="auto"
                        >
                          {resume.targetCompany || "نام شرکت ثبت نشده"}
                        </small>
                      </div>
                    )}
                    <div className="flex min-w-0 items-center justify-between gap-2 border-t border-[#e8ede9] pt-3">
                      <small className="flex min-w-0 items-center gap-1 truncate text-[7px] text-[#8b9895]">
                        <CalendarDays className="shrink-0" size={12} />
                        <span className="truncate">
                          {new Intl.DateTimeFormat("fa-IR", {
                            dateStyle: "medium",
                          }).format(new Date(resume.updatedAt))}
                        </span>
                      </small>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#edf7f2] px-2.5 text-[8px] font-bold text-[#0f7b62] transition-colors duration-200 hover:bg-[#dceee6]"
                          onClick={() => openSavedResume(resume)}
                        >
                          <Pencil size={13} /> مشاهده و ویرایش
                        </button>
                        <button
                          className="grid size-8 shrink-0 place-items-center rounded-lg bg-transparent text-[#a04a43] transition-colors duration-200 hover:bg-[#f8e9e7]"
                          type="button"
                          aria-label={`حذف ${resume.name}`}
                          title="حذف رزومه"
                          onClick={() => setResumeToDelete(resume)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "resumes" && savedResumes.length === 0 && (
        <section className="grid min-h-[260px] place-items-center rounded-[18px] border border-dashed border-[#cfdcd5] bg-white px-6 py-10 text-center">
          <div>
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#edf7f2] text-[#0f7b62]">
              <FilePlus2 size={22} />
            </span>
            <h2 className="mb-2 mt-4 text-[14px]">هنوز رزومه‌ای نساخته‌ای</h2>
            <p className="mb-5 mt-0 text-[9px] text-[#7f8e8a]">
              از میان قالب‌های آماده انتخاب کن و اولین رزومه‌ات را بساز.
            </p>
            <button
              className={primaryButton}
              type="button"
              onClick={() => setActiveTab("templates")}
            >
              مشاهده قالب‌های آماده
            </button>
          </div>
        </section>
      )}

      {activeTab === "templates" && (
        <>
          <div className="mb-4 flex items-center gap-[13px] overflow-hidden rounded-[15px] border border-[#e7ebe6] bg-white px-[13px] py-[11px] shadow-[0_12px_36px_rgba(27,55,50,.055)]">
        <div className="flex shrink-0 items-center gap-[7px] border-l border-[#e8ece8] pl-[13px] text-[10px] font-bold whitespace-nowrap text-[#123c37]">
          <SlidersHorizontal size={17} />
          <span>فیلتر قالب‌ها</span>
        </div>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {templateCategories.map((category) => {
            const count =
              category === "همه"
                ? selectableResumeTemplates.length
                : selectableResumeTemplates.filter(
                    (template) =>
                      getTemplateCategory(template.tag) === category,
                  ).length;
            const active = activeCategory === category;
            return (
              <button
                key={category}
                className={cn(
                  "inline-flex min-h-[31px] shrink-0 items-center gap-[7px] rounded-full border px-[9px] py-1 text-[9px] transition",
                  active
                    ? "border-[#b9dccf] bg-[#e5f3ed] text-[#0c7058]"
                    : "border-transparent bg-[#f3f6f3] text-[#667773] hover:border-[#d2e3dc] hover:bg-[#edf5f1] hover:text-[#123c37]",
                )}
                onClick={() => setActiveCategory(category)}
              >
                {category}
                <span
                  className={cn(
                    "grid size-5 min-w-5 place-items-center rounded-full text-[7px]",
                    active
                      ? "bg-[#0f7b62] text-white"
                      : "bg-white/80 text-[#7c8d88]",
                  )}
                >
                  {formatPersianNumber(count)}
                </span>
              </button>
            );
          })}
        </div>
          </div>

          <div className="mx-0.5 mb-[11px] flex items-center gap-2">
            <strong className="text-[10px]">
              {formatPersianNumber(filteredTemplates.length)} قالب
            </strong>
            <span className="text-[8px] text-[#909b98]">
              {activeCategory === "همه"
                ? "نمایش همه سبک‌ها"
                : `دسته ${activeCategory}`}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[700px]:grid-cols-2 min-[1121px]:grid-cols-3 min-[1800px]:grid-cols-4">
            {filteredTemplates.map((template) => {
          const templateColor =
            templateColors[template.id] ||
            getDefaultResumeColor(template.id);
          return (
            <article
              className="overflow-hidden rounded-[17px] border border-[#e7ebe6] bg-white shadow-[0_12px_36px_rgba(27,55,50,.055)]"
              key={template.id}
            >
              <button
                className="grid min-h-[360px] w-full place-items-center overflow-hidden border-0 bg-[#eef1ee] p-5 transition-colors duration-200 hover:bg-[#e5ebe7] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0f7b62]"
                type="button"
                aria-label={`پیش‌نمایش قالب ${template.name}`}
                onClick={() =>
                  setTemplatePreview({
                    id: template.id,
                    name: template.name,
                    colorId: templateColor,
                  })
                }
              >
                <div className="w-full max-w-[226px]">
                  <ScaledResumePreview
                    templateId={template.id}
                    data={templatePreviewData}
                    colorId={templateColor}
                  />
                </div>
              </button>
              <div className="grid gap-3 border-t border-[#edf0ec] p-[15px]">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-md bg-[#e7f4ee] px-1.5 py-1 text-[7px] text-[#0d765c]">
                      {template.tag}
                    </span>
                    <h3 className="my-1.5 text-[11px]">{template.name}</h3>
                    <p className="m-0 text-[8px] text-[#98a3a0]">
                      {template.subtitle}
                    </p>
                  </div>
                  <button
                    className={primaryButton}
                    onClick={() => openBuilder(template.id)}
                  >
                    استفاده از قالب
                  </button>
                </div>
                {supportsResumeColors(template.id) && (
                  <div className="flex items-center gap-2 border-t border-[#edf0ec] pt-3">
                    <span className="ml-auto text-[8px] text-[#7d8c88]">
                      رنگ قالب
                    </span>
                    {resumeColorOptions.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        aria-label={color.label}
                        title={color.label}
                        className={cn(
                          "size-5 rounded-full border-2 border-white shadow-[0_0_0_1px_#d7dfda] transition-shadow",
                          color.swatch,
                          templateColor === color.id &&
                            "shadow-[0_0_0_2px_#0f7b62]",
                        )}
                        onClick={() =>
                          setTemplateColors((current) => ({
                            ...current,
                            [template.id]: color.id,
                          }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
            })}
          </div>
        </>
      )}

      {builderOpen && (
        <ResumeBuilder
          data={data}
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          onClose={() => setBuilderOpen(false)}
          onDataChange={updateData}
          onDataReplace={setData}
          onDataMerge={mergeData}
          onColorChange={setSelectedColor}
          onSave={saveDraft}
        />
      )}
      {resumeToDelete && (
        <DeleteConfirmModal
          itemName={resumeToDelete.name}
          onCancel={() => setResumeToDelete(null)}
          onConfirm={() => void deleteResume()}
        />
      )}
      {templatePreview && (
        <Modal
          document
          title={`پیش‌نمایش ${templatePreview.name}`}
          description="نمایش قالب با اطلاعات نمونه؛ برای ساخت رزومه از دکمه استفاده از قالب کمک بگیر."
          onClose={() => setTemplatePreview(null)}
        >
          <div className="max-h-[calc(100vh-160px)] overflow-auto bg-[#e9eeea] p-5">
            <div className="mx-auto w-full max-w-[720px]">
              <ScaledResumePreview
                templateId={templatePreview.id}
                data={templatePreviewData}
                colorId={templatePreview.colorId}
                showAllPages
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
