"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FilePlus2,
  Pencil,
  SlidersHorizontal,
  Sparkles,
  Star,
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
import { calculateKnowledgeCompletion } from "@/lib/knowledge-completion";

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

function getDefaultResumeName(data: ResumeData, templateId: string) {
  const fullNameParts = data.fullName.trim().split(/\s+/).filter(Boolean);
  const ownerName =
    fullNameParts[0] || data.jobTitle.trim() || "رزومه بدون عنوان";
  const templateName =
    resumeTemplates.find((template) => template.id === templateId)?.name ||
    "قالب رزومه";
  return `${ownerName} — ${templateName}`;
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
  const projects = (knowledge.projects || []).map((project) => ({
    ...project,
  }));
  return {
    ...stored,
    experiences: experiences.length ? experiences : stored.experiences,
    educations: educations.length ? educations : stored.educations,
    projects: projects.length ? projects : stored.projects,
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

function prioritizePinnedResumes(resumes: ResumeRecord[]) {
  return [...resumes].sort((left, right) => {
    if (left.pinnedAt && right.pinnedAt)
      return right.pinnedAt.localeCompare(left.pinnedAt);
    if (left.pinnedAt) return -1;
    if (right.pinnedAt) return 1;
    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export default function ResumesPage() {
  const router = useRouter();
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
  const [knowledgeCompletion, setKnowledgeCompletion] = useState(0);
  const [knowledgeRequirementOpen, setKnowledgeRequirementOpen] =
    useState(false);
  const [activeResumeId, setActiveResumeId] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
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
        setSavedResumes(prioritizePinnedResumes(restoredResumes));
        if (knowledge) {
          setKnowledgeData(resumeFromKnowledge(knowledge));
          setKnowledgeCompletion(calculateKnowledgeCompletion(knowledge));
        }
        if (resume) {
          setData({ ...emptyResumeData, ...resume.data });
          setSelectedTemplate(resume.templateId);
          setSelectedColor(
            resume.colorId || getDefaultResumeColor(resume.templateId),
          );
          setActiveResumeId(resume.id);
          setResumeName(resume.name);
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
        resumeName?.trim() ||
        getDefaultResumeName(nextData, selectedTemplate),
      templateId: selectedTemplate,
      colorId: selectedColor,
      pinnedAt: previous?.pinnedAt,
      data: nextData,
      source: previous?.source ?? source,
      targetJobId: previous?.targetJobId,
      targetJobTitle: previous?.targetJobTitle,
      targetCompany: previous?.targetCompany,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    };
    await resumeStore.put(record);
    setSavedResumes((current) =>
      prioritizePinnedResumes([
        record,
        ...current.filter((resume) => resume.id !== record.id),
      ]),
    );
    setActiveResumeId(id);
    setResumeName(record.name);
  };
  const mergeData = async (nextData: ResumeData) => {
    setData(nextData);
    await persistResume(nextData);
  };
  const openBuilder = (templateId: string) => {
    if (knowledgeCompletion < 10) {
      setKnowledgeRequirementOpen(true);
      return;
    }
    setSelectedTemplate(templateId);
    setSelectedColor(
      templateColors[templateId] || getDefaultResumeColor(templateId),
    );
    if (knowledgeData) setData({ ...emptyResumeData, ...knowledgeData });
    setActiveResumeId("");
    setResumeName(null);
    setBuilderOpen(true);
  };
  const openSavedResume = (resume: ResumeRecord) => {
    setData({ ...emptyResumeData, ...resume.data });
    setSelectedTemplate(resume.templateId);
    setSelectedColor(
      resume.colorId || getDefaultResumeColor(resume.templateId),
    );
    setActiveResumeId(resume.id);
    setResumeName(resume.name);
    setBuilderOpen(true);
  };
  const saveDraft = async () => {
    await persistResume(data);
    notify("رزومه با موفقیت ذخیره شد.");
  };
  const toggleResumePin = async (resume: ResumeRecord) => {
    const pinned = !resume.pinnedAt;
    const nextResume: ResumeRecord = {
      ...resume,
      pinnedAt: pinned ? new Date().toISOString() : undefined,
    };
    try {
      await resumeStore.put(nextResume);
      setSavedResumes((current) =>
        prioritizePinnedResumes(
          current.map((item) =>
            item.id === nextResume.id ? nextResume : item,
          ),
        ),
      );
      notify(pinned ? "رزومه نشان شد" : "نشان رزومه برداشته شد");
    } catch {
      notify("تغییر نشان رزومه ناموفق بود", "error");
    }
  };
  const deleteResume = async () => {
    if (!resumeToDelete) return;
    const resumeId = resumeToDelete.id;
    const expectedRemainingResumes = savedResumes.filter(
      (resume) => resume.id !== resumeId,
    );
    try {
      await resumeStore.remove(resumeId);
      let storedResumes = await resumeStore.list();
      const storedResumeIds = new Set(storedResumes.map((resume) => resume.id));
      const unexpectedlyRemovedResumes = expectedRemainingResumes.filter(
        (resume) => !storedResumeIds.has(resume.id),
      );
      if (unexpectedlyRemovedResumes.length > 0) {
        await Promise.all(
          unexpectedlyRemovedResumes.map((resume) => resumeStore.put(resume)),
        );
        storedResumes = await resumeStore.list();
      }
      setSavedResumes(prioritizePinnedResumes(storedResumes));
      if (activeResumeId === resumeId) {
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
                    className="relative grid h-[260px] w-full place-items-center overflow-hidden border-0 bg-[#e9eeea] p-3 transition-colors duration-200 hover:bg-[#e1e8e3] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0f7b62]"
                    type="button"
                    aria-label={`مشاهده و ویرایش ${resume.name}`}
                    onClick={() => openSavedResume(resume)}
                  >
                    <div
                      className="pointer-events-none mx-auto w-full max-w-[166px] select-none"
                      inert
                      aria-hidden="true"
                    >
                      <ScaledResumePreview
                        templateId={resume.templateId}
                        data={resume.data}
                        colorId={
                          resume.colorId ||
                          getDefaultResumeColor(resume.templateId)
                        }
                      />
                    </div>
                    <span
                      className="absolute inset-0 z-10 cursor-pointer"
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className="grid min-w-0 gap-3 border-t border-[#e5ebe6] p-4 text-right"
                    dir="rtl"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
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
                      <span className="max-w-[38%] shrink-0 truncate text-[7px] text-[#899692]">
                        {template?.name || "قالب ذخیره‌شده"}
                      </span>
                    </div>
                    <h3 className="m-0 block w-full overflow-hidden text-ellipsis whitespace-nowrap text-right text-[11px]">
                      {resume.name}
                    </h3>
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
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-200",
                            resume.pinnedAt
                              ? "bg-[#fff4d7] text-[#b77908] hover:bg-[#f9e7b8]"
                              : "bg-transparent text-[#83918d] hover:bg-[#edf2ef] hover:text-[#51625e]",
                          )}
                          type="button"
                          aria-label={`${resume.pinnedAt ? "برداشتن نشان از" : "نشان کردن"} ${resume.name}`}
                          title={resume.pinnedAt ? "برداشتن نشان" : "نشان کردن رزومه"}
                          aria-pressed={Boolean(resume.pinnedAt)}
                          onClick={() => void toggleResumePin(resume)}
                        >
                          <Star
                            className={resume.pinnedAt ? "fill-current" : undefined}
                            size={14}
                          />
                        </button>
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
          <div className="mb-4 flex items-center gap-[13px] overflow-hidden rounded-[15px] border border-[#d8e5df] bg-[linear-gradient(135deg,#ffffff_0%,#fbfcfb_52%,#f0f7f3_100%)] px-[13px] py-[11px] shadow-[0_12px_32px_rgba(33,68,58,.09)]">
        <div className="flex shrink-0 items-center gap-[7px] rounded-[11px] bg-[#e7f4ef] px-[11px] py-[9px] text-[10px] font-bold whitespace-nowrap text-[#155f50] shadow-[inset_0_0_0_1px_rgba(21,95,80,.06)]">
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
                  "inline-flex h-[34px] shrink-0 items-stretch overflow-hidden rounded-full border p-0 text-[10px] font-semibold transition-all duration-200",
                  active
                    ? "border-[#0e765e] bg-[linear-gradient(135deg,#16876b_0%,#0a6956_100%)] text-white shadow-[0_5px_14px_rgba(13,112,88,.26)]"
                    : "border-[#dbe6e1] bg-[#f4f7f5] text-[#526862] hover:border-[#9ec3b6] hover:bg-[#ebf5f0] hover:text-[#155f50]",
                )}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveCategory(category)}
              >
                <span className="flex items-center gap-[7px] px-[11px] py-1">
                  {active && (
                    <Check
                      aria-hidden="true"
                      size={12}
                      strokeWidth={3}
                    />
                  )}
                  <span>{category}</span>
                </span>
                <span
                  className={cn(
                    "m-px flex size-[30px] shrink-0 items-center justify-center self-center rounded-full text-[10px] font-bold",
                    active
                      ? "bg-white/16 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)]"
                      : "bg-white text-[#47766a] shadow-[0_1px_4px_rgba(32,75,62,.1),inset_0_0_0_1px_#e2ebe7]",
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
                className="relative grid min-h-[360px] w-full place-items-center overflow-hidden border-0 bg-[#eef1ee] p-5 transition-colors duration-200 hover:bg-[#e5ebe7] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#0f7b62]"
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
                <div
                  className="pointer-events-none w-full max-w-[226px] select-none"
                  inert
                  aria-hidden="true"
                >
                  <ScaledResumePreview
                    templateId={template.id}
                    data={templatePreviewData}
                    colorId={templateColor}
                  />
                </div>
                <span
                  className="absolute inset-0 z-10 cursor-pointer"
                  aria-hidden="true"
                />
                <span className="absolute bottom-3 left-3 rounded-md bg-[#e7f4ee] px-2 py-1 text-[7px] text-[#0d765c] shadow-sm">
                  {template.tag}
                </span>
              </button>
              <div className="grid gap-3 border-t border-[#edf0ec] p-[15px]">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
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
          resumeName={
            resumeName ?? getDefaultResumeName(data, selectedTemplate)
          }
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          hasBeenSaved={Boolean(activeResumeId)}
          onClose={() => setBuilderOpen(false)}
          onDataChange={updateData}
          onDataReplace={setData}
          onDataMerge={mergeData}
          onResumeNameChange={setResumeName}
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
      {knowledgeRequirementOpen && (
        <Modal
          title="پایگاه دانش هنوز کامل نیست"
          description="اطلاعات پایگاه دانشت باید حداقل ۱۰٪ تکمیل شده باشد تا بتوانی یک رزومه بسازی."
          onClose={() => setKnowledgeRequirementOpen(false)}
        >
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#dfe5df] bg-white px-4 text-[10px] font-bold text-[#526461] hover:bg-[#f7f9f7]"
              type="button"
              onClick={() => setKnowledgeRequirementOpen(false)}
            >
              فعلاً نه
            </button>
            <button
              className={primaryButton}
              type="button"
              onClick={() => {
                setKnowledgeRequirementOpen(false);
                router.push("/knowledge-base");
              }}
            >
              تکمیل پایگاه دانش
            </button>
          </div>
        </Modal>
      )}
      {templatePreview && (
        <Modal
          document
          showCloseButton
          title={`پیش‌نمایش ${templatePreview.name}`}
          titleClassName="!mb-0 !text-[16px] !leading-[1.5]"
          headerClassName="pb-[22px]"
          headerActions={
            <button
              className={primaryButton}
              type="button"
              onClick={() => {
                const templateId = templatePreview.id;
                setTemplatePreview(null);
                openBuilder(templateId);
              }}
            >
              استفاده از قالب
            </button>
          }
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
