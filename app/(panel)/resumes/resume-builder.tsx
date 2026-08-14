"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Save,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  ImagePlus,
  Plus,
  ScanSearch,
  Sparkles,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal, Modal } from "../_components/ui";
import { ResumePreviewSkeleton } from "../_components/loading-skeletons";
import { ResumeDocument } from "./resume-document";
import { ScaledResumePreview } from "./scaled-resume-preview";
import {
  getResumeEducations,
  getResumeExperiences,
  resumeColorOptions,
  resumeTemplates,
  type ResumeData,
  type ResumeColorId,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeLanguage,
  type ResumeProject,
  supportsResumeColors,
} from "./resume-data";
import {
  createRecordId,
  getActiveProfileId,
  knowledgeProfileStore,
} from "@/lib/data/stores";
import { scheduleFieldDirectionRefresh } from "@/lib/field-direction";
import { cn } from "@/lib/cn";
import { formatPersianNumber } from "@/lib/fa-number";
import { sanitizeLtrField } from "@/lib/ltr-field";
import { readProfileImage } from "@/lib/image-file";
import { useToast } from "../_components/panel-shell";

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-[15px] text-[11px] font-bold whitespace-nowrap text-white shadow-[0_7px_17px_rgba(15,123,98,.17)] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold whitespace-nowrap text-[#526461] disabled:cursor-not-allowed disabled:opacity-45";
const fieldArea =
  "grid gap-3 [&>h3]:m-0 [&>h3]:text-[13px] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[10px] [&_label]:font-normal [&_input]:min-h-[42px] [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-[#dfe5df] [&_input]:bg-[#fbfcfa] [&_input]:px-3 [&_input]:text-[12px] [&_input]:outline-none [&_input]:placeholder:text-right [&_input]:focus:border-[#79b8a5] [&_input]:focus:ring-3 [&_input]:focus:ring-[#e5f2ed] [&_textarea]:min-h-28 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-[10px] [&_textarea]:border [&_textarea]:border-[#dfe5df] [&_textarea]:bg-[#fbfcfa] [&_textarea]:p-3 [&_textarea]:text-[12px] [&_textarea]:outline-none [&_textarea]:placeholder:text-right [&_textarea]:focus:border-[#79b8a5] [&_textarea]:focus:ring-3 [&_textarea]:focus:ring-[#e5f2ed]";

const steps = [
  {
    title: "اطلاعات فردی",
    description: "مشخصات تماس و عنوان حرفه‌ای",
    icon: UserRound,
  },
  {
    title: "سابقه کاری",
    description: "آخرین تجربه و دستاوردهای مهم",
    icon: BriefcaseBusiness,
  },
  {
    title: "مهارت و تحصیلات",
    description: "توانمندی‌ها و اطلاعات تکمیلی",
    icon: GraduationCap,
  },
  {
    title: "خلاصه و بازبینی",
    description: "مرور نهایی پیش از دریافت",
    icon: ScanSearch,
  },
] as const;

type Props = {
  data: ResumeData;
  resumeName: string;
  selectedTemplate: string;
  selectedColor: ResumeColorId;
  hasBeenSaved: boolean;
  onClose: () => void;
  onDataChange: (field: keyof ResumeData, value: string) => void;
  onDataReplace: (data: ResumeData) => void;
  onDataMerge: (data: ResumeData) => void | Promise<void>;
  onResumeNameChange: (name: string) => void;
  onColorChange: (colorId: ResumeColorId) => void;
  onSave: () => void | Promise<void>;
};

type EditableLanguage = {
  id: string;
  name: string;
  proficiency: string;
};

const proficiencyOptions = [
  { value: "", label: "انتخاب سطح تسلط" },
  { value: "elementary", label: "مقدماتی" },
  { value: "limited-working", label: "توانایی کاری محدود" },
  { value: "professional-working", label: "توانایی کاری حرفه‌ای" },
  { value: "full-professional", label: "تسلط کامل حرفه‌ای" },
  { value: "native-bilingual", label: "زبان مادری یا دوزبانه" },
] as const;

function proficiencyLabel(value: string) {
  return (
    proficiencyOptions.find((option) => option.value === value)?.label || value
  );
}

function normalizeProficiency(value: string) {
  const normalized = value.trim().toLocaleLowerCase();
  const option = proficiencyOptions.find(
    (item) =>
      item.value === normalized || item.label.toLocaleLowerCase() === normalized,
  );
  if (option) return option.value;
  if (/(native|bilingual|مادری|دوزبانه|دو زبانه)/.test(normalized))
    return "native-bilingual";
  if (/(full professional|fluent|تسلط کامل)/.test(normalized))
    return "full-professional";
  if (/(professional working|حرفه‌ای|حرفه ای)/.test(normalized))
    return "professional-working";
  if (/(limited working|intermediate|محدود|متوسط)/.test(normalized))
    return "limited-working";
  if (/(elementary|basic|beginner|مقدماتی|پایه)/.test(normalized))
    return "elementary";
  return "";
}

function parseEditableLanguages(value: string): EditableLanguage[] {
  const items = value
    .split(/[|،,؛;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name = "", ...levelParts] = item.split(/\s*(?:—|–|:)\s*/);
      return {
        id: createRecordId("resume-language"),
        name: name.trim(),
        proficiency: normalizeProficiency(levelParts.join(" — ")),
      };
    });
  return items.length
    ? items
    : [{ id: createRecordId("resume-language"), name: "", proficiency: "" }];
}

function serializeLanguages(items: EditableLanguage[]) {
  return items
    .filter((item) => item.name.trim())
    .map((item) =>
      [item.name.trim(), proficiencyLabel(item.proficiency)]
        .filter(Boolean)
        .join(" — "),
    )
    .join(" | ");
}

function ResumeLanguageEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [items, setItems] = useState(() => parseEditableLanguages(value));
  const lastSerializedValue = useRef(value);

  useEffect(() => {
    if (value === lastSerializedValue.current) return;
    setItems(parseEditableLanguages(value));
    lastSerializedValue.current = value;
  }, [value]);

  const commit = (nextItems: EditableLanguage[]) => {
    setItems(nextItems);
    const serialized = serializeLanguages(nextItems);
    lastSerializedValue.current = serialized;
    onChange(serialized);
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-[10px] font-normal">زبان‌ها</strong>
        <button
          className={secondaryButton}
          type="button"
          onClick={() =>
            setItems((current) => [
              ...current,
              {
                id: createRecordId("resume-language"),
                name: "",
                proficiency: "",
              },
            ])
          }
        >
          <Plus size={14} /> افزودن زبان
        </button>
      </div>
      {items.map((language, index) => (
        <div
          className="grid grid-cols-1 gap-3 rounded-xl border border-[#e2e7e2] bg-[#fbfcfa] p-3 min-[561px]:grid-cols-[1fr_1fr_auto]"
          key={language.id}
        >
          <label>
            نام زبان
            <input
              value={language.name}
              placeholder="مثلاً English"
              onChange={(event) =>
                commit(
                  items.map((item) =>
                    item.id === language.id
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </label>
          <label>
            سطح تسلط
            <select
              className="min-h-[42px] w-full rounded-[10px] border border-[#dfe5df] bg-[#fbfcfa] px-3 text-[11px] outline-none focus:border-[#79b8a5] focus:ring-3 focus:ring-[#e5f2ed]"
              value={language.proficiency}
              onChange={(event) =>
                commit(
                  items.map((item) =>
                    item.id === language.id
                      ? { ...item, proficiency: event.target.value }
                      : item,
                  ),
                )
              }
            >
              {proficiencyOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="mt-auto grid size-[42px] place-items-center rounded-[10px] border border-[#eccfc9] bg-[#fff5f2] text-[#b65e52] disabled:opacity-40"
            type="button"
            disabled={items.length === 1}
            aria-label={`حذف زبان ${formatPersianNumber(index + 1)}`}
            onClick={() =>
              commit(items.filter((item) => item.id !== language.id))
            }
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ResumeBuilder({
  data,
  resumeName,
  selectedTemplate,
  selectedColor,
  hasBeenSaved,
  onClose,
  onDataChange,
  onDataReplace,
  onDataMerge,
  onResumeNameChange,
  onColorChange,
  onSave,
}: Props) {
  const notify = useToast();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [modelError, setModelError] = useState("");
  const [modelOverwriteConfirmOpen, setModelOverwriteConfirmOpen] =
    useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoDeleteConfirm, setPhotoDeleteConfirm] = useState(false);
  const [printView, setPrintView] = useState(false);
  const [printReady, setPrintReady] = useState(false);
  const [pendingItemDelete, setPendingItemDelete] = useState<{
    itemName: string;
    action: () => void;
  } | null>(null);
  const [generationLanguagePickerOpen, setGenerationLanguagePickerOpen] =
    useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const selected = resumeTemplates.find(
    (template) => template.id === selectedTemplate,
  );
  useEffect(() => {
    if (!printView) return;
    const closePrintView = () => {
      setPrintView(false);
      setPrintReady(false);
    };
    window.addEventListener("afterprint", closePrintView);
    return () => window.removeEventListener("afterprint", closePrintView);
  }, [printView]);
  useEffect(() => {
    if (!printView || !printReady) return;
    let cancelled = false;
    const printWhenLayoutIsStable = async () => {
      await document.fonts.ready;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (!cancelled) window.print();
        });
      });
    };
    void printWhenLayoutIsStable();
    return () => {
      cancelled = true;
    };
  }, [printReady, printView]);
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const canContinue = [
    Boolean(data.fullName.trim() && data.jobTitle.trim() && data.email.trim()),
    Boolean(
      experiences.some(
        (experience) =>
          experience.jobTitle.trim() && experience.company.trim(),
      ),
    ),
    Boolean(
      educations.some(
        (education) =>
          education.credential.trim() || education.institution.trim(),
      ) && data.skills.trim(),
    ),
    true,
  ][step];
  const input =
    (field: keyof ResumeData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const ltrOnly =
        field === "email" ||
        field === "phone" ||
        field === "website" ||
        field === "experienceDate";
      onDataChange(
        field,
        ltrOnly ? sanitizeLtrField(event.target.value) : event.target.value,
      );
    };
  const finish = async () => {
    await onSave();
    setPrintReady(false);
    setPrintView(true);
  };
  const replaceExperiences = (nextExperiences: ResumeExperience[]) => {
    const first = nextExperiences[0];
    onDataReplace({
      ...data,
      experiences: nextExperiences,
      experienceTitle: first?.jobTitle || "",
      company: first?.company || "",
      experienceDate: first
        ? [
            first.startDate,
            first.isCurrent ? "امروز" : first.endDate,
          ]
            .filter(Boolean)
            .join(" تا ")
        : "",
      experience: first?.description || "",
    });
  };
  const replaceEducations = (nextEducations: ResumeEducation[]) => {
    onDataReplace({
      ...data,
      educations: nextEducations,
      education: nextEducations
        .map((item) => {
          const title = [item.credential, item.institution]
            .filter(Boolean)
            .join("، ");
          const date = [
            item.startDate,
            item.isCurrent ? "امروز" : item.endDate,
          ]
            .filter(Boolean)
            .join(" تا ");
          return [title, date].filter(Boolean).join(" — ");
        })
        .filter(Boolean)
        .join("\n"),
    });
  };
  const replaceProjects = (nextProjects: ResumeProject[]) =>
    onDataReplace({ ...data, projects: nextProjects });
  const updatePhoto = async (file: File) => {
    setPhotoError("");
    try {
      onDataChange("photoUrl", await readProfileImage(file));
      notify("تصویر رزومه با موفقیت انتخاب شد.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "انتخاب تصویر ناموفق بود.";
      setPhotoError(message);
      notify(message, "error");
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };
  const generateWithModel = async (language: ResumeLanguage) => {
    setGenerationLanguagePickerOpen(false);
    setGenerating(true);
    setModelError("");
    try {
      const knowledge = await knowledgeProfileStore.get(
        await getActiveProfileId(),
      );
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume: data, knowledge, language }),
      });
      const result = (await response.json()) as {
        resume?: ResumeData;
        error?: string;
      };
      if (!response.ok || !result.resume)
        throw new Error(result.error || "مدل رزومه‌ساز پاسخ نداد.");
      await onDataMerge(result.resume);
      scheduleFieldDirectionRefresh();
      notify("رزومه با مدل ساخته و ذخیره شد.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "مدل رزومه‌ساز پاسخ نداد.";
      setModelError(message);
      notify(message, "error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal
      wide
      showCloseButton
      title={selected?.name || "قالب رزومه"}
      headerActions={
        <>
          <button
            className={secondaryButton}
            type="button"
            disabled={generating}
            onClick={() => setModelOverwriteConfirmOpen(true)}
          >
            <Sparkles size={16} />
            {generating ? "در حال تکمیل با مدل..." : "تکمیل رزومه با AI"}
          </button>
          <button
            className={secondaryButton}
            type="button"
            onClick={() => void onSave()}
          >
            <Save size={16} /> ذخیره رزومه
          </button>
          {hasBeenSaved && (
            <button
              className={primaryButton}
              type="button"
              onClick={() => void finish()}
            >
              <Download size={16} /> دانلود PDF
            </button>
          )}
        </>
      }
      onClose={onClose}
    >
      <div className="grid h-[min(760px,calc(100vh-120px))] min-w-0 grid-cols-1 [grid-template-areas:'form'_'preview'] min-[821px]:grid-cols-[minmax(0,1fr)_430px] min-[821px]:[grid-template-areas:'preview_form'] min-[1121px]:grid-cols-[minmax(0,1fr)_520px]">
        <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden [grid-area:form]">
          <div
            className="min-h-0 flex-1 overflow-y-auto p-[22px] pb-6"
            data-resume-builder-scroll
          >
            <section
              className="mb-3 grid gap-3 rounded-[14px] border border-[#dfe7e1] bg-[#f8faf8] px-3.5 py-3 shadow-[0_5px_18px_rgba(27,55,50,.035)]"
              aria-label="تنظیمات قالب"
            >
              <label className="grid gap-1.5 text-[8px] font-bold text-[#5f726d]">
                نام رزومه
                <input
                  className="min-h-10 w-full rounded-[10px] border border-[#dfe5df] bg-white px-3 text-[11px] font-normal text-[#243d39] outline-none transition focus:border-[#79b8a5] focus:ring-3 focus:ring-[#e5f2ed]"
                  dir="auto"
                  value={resumeName}
                  onChange={(event) => onResumeNameChange(event.target.value)}
                />
              </label>
              {supportsResumeColors(selectedTemplate) && (
                <div className="flex flex-wrap items-center gap-2.5 border-t border-[#e3e9e4] pt-3">
                  <span className="ml-auto text-[8px] font-bold text-[#5f726d]">
                    رنگ‌بندی قالب
                  </span>
                  {resumeColorOptions.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      aria-label={color.label}
                      title={color.label}
                      className={cn(
                        "size-6 rounded-full border-2 border-white shadow-[0_0_0_1px_#d7dfda] transition-all duration-200 hover:scale-110",
                        color.swatch,
                        selectedColor === color.id &&
                          "scale-110 shadow-[0_0_0_2px_#0f7b62]",
                      )}
                      onClick={() => onColorChange(color.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            <div
              className="mb-3.5 grid grid-cols-4 gap-1 rounded-[14px] border border-[#dfe7e1] bg-[#f0f4f1] p-1.5"
              role="tablist"
              aria-label="مراحل ساخت رزومه"
            >
              {steps.map((item, index) => {
                const Icon = item.icon;
                const state =
                  index === step ? "active" : index < step ? "done" : "idle";
                return (
                  <button
                    key={item.title}
                    className={cn(
                      "flex min-w-0 items-center justify-center gap-2 rounded-[10px] border border-transparent px-2 py-2.5 text-center transition-all duration-200",
                      state === "active" &&
                        "border-white bg-white text-[#0f7b62] shadow-[0_5px_16px_rgba(27,55,50,.1)]",
                      state === "done" &&
                        "bg-[#e5f2ec] text-[#3f7567] hover:bg-[#dcece5]",
                      state === "idle" && "text-[#8a9692]",
                    )}
                    type="button"
                    role="tab"
                    aria-selected={state === "active"}
                    disabled={index > step}
                    onClick={() => setStep(index)}
                  >
                    <span
                      className={cn(
                        "grid size-[27px] shrink-0 place-items-center rounded-[8px] bg-[#e6ebe8] text-[#7c8b87] transition-colors duration-200",
                        state === "active" && "bg-[#0f7b62] text-white",
                        state === "done" && "bg-[#71aa99] text-white",
                      )}
                    >
                      {index < step ? <Check size={14} /> : <Icon size={14} />}
                    </span>
                    <strong className="hidden min-w-0 truncate text-[7px] min-[421px]:block">
                      {item.title}
                    </strong>
                  </button>
                );
              })}
            </div>
            {modelError && (
              <div className="mb-3 rounded-lg border border-[#efccc7] bg-[#fff7f5] px-3 py-2 text-[8px] text-[#b65e52]">
                {modelError}
              </div>
            )}

            <div className={`${fieldArea} min-h-[345px]`} key={step}>
            {step === 0 && (
              <>
                <h3>اطلاعات فردی</h3>
                <p className="m-0 text-[8px] leading-[1.8] text-[#82908d]">
                  اطلاعات این نسخه مستقل است و تغییری در پایگاه دانش یا
                  رزومه‌های دیگر ایجاد نمی‌کند.
                </p>
                <div className="flex items-center gap-3 rounded-xl border border-[#dfe8e2] bg-[#f8faf8] p-3">
                  <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#d5e3dc] bg-[#e8f2ed] text-[#6d8980]">
                    {data.photoUrl ? (
                      <Image
                        className="size-full object-cover"
                        src={data.photoUrl}
                        width={128}
                        height={128}
                        unoptimized
                        alt="تصویر این رزومه"
                      />
                    ) : (
                      <UserRound size={25} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="text-[9px] text-[#19312f]">
                      عکس همین رزومه
                    </strong>
                    <p className="mb-0 mt-1 text-[7px] leading-[1.7] text-[#84928f]">
                      {data.photoUrl
                        ? "می‌توانی عکس را برای همین نسخه جایگزین یا حذف کنی."
                        : "این رزومه بدون عکس ساخته می‌شود؛ در صورت نیاز عکس اضافه کن."}
                    </p>
                    {photoError && (
                      <span className="mt-1 block text-[7px] text-[#b65e52]">
                        {photoError}
                      </span>
                    )}
                  </div>
                  <input
                    ref={photoInputRef}
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void updatePhoto(file);
                    }}
                  />
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      className="grid size-9 place-items-center rounded-[10px] border border-[#dfe5df] bg-white text-[#526461] transition-colors duration-200 hover:bg-[#edf7f2] hover:text-[#0f7b62]"
                      type="button"
                      aria-label={data.photoUrl ? "جایگزینی عکس" : "افزودن عکس"}
                      title={data.photoUrl ? "جایگزینی عکس" : "افزودن عکس"}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <ImagePlus size={16} />
                    </button>
                    {data.photoUrl && (
                      <button
                        className="grid size-9 place-items-center rounded-[10px] border border-[#eccfc9] bg-[#fff5f2] text-[#b65e52] transition-colors duration-200 hover:bg-[#ffe9e4]"
                        type="button"
                        aria-label="حذف عکس"
                        title="حذف عکس"
                        onClick={() => setPhotoDeleteConfirm(true)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-3 min-[561px]:grid-cols-2">
                  <label>
                    نام و نام خانوادگی
                    <input
                      autoFocus
                      value={data.fullName}
                      onChange={input("fullName")}
                    />
                  </label>
                  <label>
                    عنوان حرفه‌ای
                    <input value={data.jobTitle} onChange={input("jobTitle")} />
                  </label>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-3 min-[561px]:grid-cols-2">
                  <label>
                    ایمیل
                    <input
                      className="!text-left placeholder:!text-left"
                      dir="ltr"
                      data-direction="ltr"
                      type="email"
                      value={data.email}
                      onChange={input("email")}
                    />
                  </label>
                  <label>
                    شماره تماس
                    <input
                      className="!text-left placeholder:!text-left"
                      dir="ltr"
                      data-direction="ltr"
                      type="tel"
                      value={data.phone}
                      onChange={input("phone")}
                    />
                  </label>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-3 min-[561px]:grid-cols-2">
                  <label>
                    محل سکونت
                    <input value={data.location} onChange={input("location")} />
                  </label>
                  <label>
                    وب‌سایت یا لینکدین
                    <input
                      className="!text-left placeholder:!text-left"
                      dir="ltr"
                      data-direction="ltr"
                      inputMode="url"
                      value={data.website}
                      onChange={input("website")}
                    />
                  </label>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3>سوابق کاری</h3>
                    <p className="m-0 text-[8px] leading-[1.8] text-[#82908d]">
                      همه تجربه‌های این رزومه را مستقل ویرایش کن.
                    </p>
                  </div>
                  <button
                    className={secondaryButton}
                    type="button"
                    onClick={() =>
                      replaceExperiences([
                        ...experiences,
                        {
                          id: createRecordId("resume-experience"),
                          jobTitle: "",
                          company: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          isCurrent: false,
                          description: "",
                          technologies: "",
                        },
                      ])
                    }
                  >
                    <Plus size={15} /> افزودن سابقه
                  </button>
                </div>
                {experiences.map((experience, index) => (
                  <article
                    className="grid gap-3 rounded-xl border border-[#dfe8e2] bg-[#f8faf8] p-3"
                    key={experience.id}
                  >
                    <header className="flex items-center justify-between gap-3">
                      <strong className="text-[9px]">
                        تجربه {formatPersianNumber(index + 1)}
                      </strong>
                      <button
                        className="grid size-7 place-items-center rounded-lg bg-transparent text-[#c95649] transition-colors hover:bg-[#fff0ed]"
                        type="button"
                        aria-label={`حذف تجربه ${formatPersianNumber(index + 1)}`}
                        onClick={() =>
                          setPendingItemDelete({
                            itemName:
                              experience.jobTitle ||
                              `تجربه ${formatPersianNumber(index + 1)}`,
                            action: () =>
                              replaceExperiences(
                                experiences.filter(
                                  (item) => item.id !== experience.id,
                                ),
                              ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>
                    <div className="grid min-w-0 grid-cols-1 gap-3 min-[561px]:grid-cols-2">
                      {(
                        [
                          ["jobTitle", "عنوان شغلی"],
                          ["company", "شرکت"],
                          ["location", "محل فعالیت"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field}>
                          {label}
                          <input
                            value={experience[field]}
                            onChange={(event) =>
                              replaceExperiences(
                                experiences.map((item) =>
                                  item.id === experience.id
                                    ? { ...item, [field]: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                      {(
                        [
                          ["startDate", "تاریخ شروع"],
                          ["endDate", "تاریخ پایان"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field}>
                          {label}
                          <input
                            className="!text-left placeholder:!text-left"
                            dir="ltr"
                            disabled={
                              field === "endDate" && experience.isCurrent
                            }
                            value={experience[field]}
                            onChange={(event) =>
                              replaceExperiences(
                                experiences.map((item) =>
                                  item.id === experience.id
                                    ? {
                                        ...item,
                                        [field]: sanitizeLtrField(
                                          event.target.value,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label className="!flex items-center gap-2">
                      <input
                        className="!size-4 !min-h-0 !w-4"
                        type="checkbox"
                        checked={experience.isCurrent}
                        onChange={(event) =>
                          replaceExperiences(
                            experiences.map((item) =>
                              item.id === experience.id
                                ? {
                                    ...item,
                                    isCurrent: event.target.checked,
                                    endDate: event.target.checked
                                      ? ""
                                      : item.endDate,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      همچنان مشغول فعالیت هستم
                    </label>
                    <label>
                      دستاوردها — هر مورد در یک خط
                      <textarea
                        value={experience.description}
                        onChange={(event) =>
                          replaceExperiences(
                            experiences.map((item) =>
                              item.id === experience.id
                                ? {
                                    ...item,
                                    description: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      مهارت‌ها و فناوری‌های این تجربه
                      <input
                        value={experience.technologies}
                        onChange={(event) =>
                          replaceExperiences(
                            experiences.map((item) =>
                              item.id === experience.id
                                ? {
                                    ...item,
                                    technologies: event.target.value,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </article>
                ))}
                {!experiences.length && (
                  <button
                    className={`${secondaryButton} w-full`}
                    type="button"
                    onClick={() =>
                      replaceExperiences([
                        {
                          id: createRecordId("resume-experience"),
                          jobTitle: "",
                          company: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          isCurrent: false,
                          description: "",
                          technologies: "",
                        },
                      ])
                    }
                  >
                    <Plus size={15} /> ثبت اولین سابقه کاری
                  </button>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3>پروژه‌ها</h3>
                    <p className="m-0 text-[8px] leading-[1.8] text-[#82908d]">
                      پروژه‌های شخصی، متن‌باز یا حرفه‌ای قابل ارائه را اضافه کن.
                    </p>
                  </div>
                  <button
                    className={secondaryButton}
                    type="button"
                    onClick={() =>
                      replaceProjects([
                        ...projects,
                        {
                          id: createRecordId("resume-project"),
                          name: "",
                          role: "",
                          url: "",
                          startDate: "",
                          endDate: "",
                          isCurrent: false,
                          description: "",
                          technologies: "",
                        },
                      ])
                    }
                  >
                    <Plus size={15} /> افزودن پروژه
                  </button>
                </div>
                {projects.map((project, index) => (
                  <article
                    className="grid gap-3 rounded-xl border border-[#dfe8e2] bg-[#f8faf8] p-3"
                    key={project.id}
                  >
                    <header className="flex items-center justify-between gap-3">
                      <strong className="text-[9px]">
                        پروژه {formatPersianNumber(index + 1)}
                      </strong>
                      <button
                        className="grid size-7 place-items-center rounded-lg bg-transparent text-[#c95649] transition-colors hover:bg-[#fff0ed]"
                        type="button"
                        aria-label={`حذف پروژه ${formatPersianNumber(index + 1)}`}
                        onClick={() =>
                          setPendingItemDelete({
                            itemName:
                              project.name ||
                              `پروژه ${formatPersianNumber(index + 1)}`,
                            action: () =>
                              replaceProjects(
                                projects.filter(
                                  (item) => item.id !== project.id,
                                ),
                              ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>
                    <div className="grid min-w-0 grid-cols-1 gap-3 min-[561px]:grid-cols-2">
                      {(
                        [
                          ["name", "نام پروژه"],
                          ["role", "نقش، کارفرما یا نوع پروژه"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field}>
                          {label}
                          <input
                            value={project[field]}
                            onChange={(event) =>
                              replaceProjects(
                                projects.map((item) =>
                                  item.id === project.id
                                    ? { ...item, [field]: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                      <label>
                        لینک پروژه
                        <input
                          className="!text-left placeholder:!text-left"
                          dir="ltr"
                          inputMode="url"
                          value={project.url}
                          onChange={(event) =>
                            replaceProjects(
                              projects.map((item) =>
                                item.id === project.id
                                  ? {
                                      ...item,
                                      url: sanitizeLtrField(event.target.value),
                                    }
                                  : item,
                              ),
                            )
                          }
                        />
                      </label>
                      {(
                        [
                          ["startDate", "تاریخ شروع"],
                          ["endDate", "تاریخ پایان"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field}>
                          {label}
                          <input
                            className="!text-left placeholder:!text-left"
                            dir="ltr"
                            disabled={field === "endDate" && project.isCurrent}
                            value={project[field]}
                            onChange={(event) =>
                              replaceProjects(
                                projects.map((item) =>
                                  item.id === project.id
                                    ? {
                                        ...item,
                                        [field]: sanitizeLtrField(
                                          event.target.value,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label className="!flex items-center gap-2">
                      <input
                        className="!size-4 !min-h-0 !w-4"
                        type="checkbox"
                        checked={project.isCurrent}
                        onChange={(event) =>
                          replaceProjects(
                            projects.map((item) =>
                              item.id === project.id
                                ? {
                                    ...item,
                                    isCurrent: event.target.checked,
                                    endDate: event.target.checked
                                      ? ""
                                      : item.endDate,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      پروژه همچنان فعال است
                    </label>
                    <label>
                      توضیحات و دستاوردها — هر مورد در یک خط
                      <textarea
                        value={project.description}
                        onChange={(event) =>
                          replaceProjects(
                            projects.map((item) =>
                              item.id === project.id
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      فناوری‌ها و ابزارها
                      <input
                        value={project.technologies}
                        onChange={(event) =>
                          replaceProjects(
                            projects.map((item) =>
                              item.id === project.id
                                ? { ...item, technologies: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  </article>
                ))}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3>مهارت و تحصیلات</h3>
                    <p className="m-0 text-[8px] leading-[1.8] text-[#82908d]">
                      همه سوابق آموزشی این رزومه را مستقل ویرایش کن.
                    </p>
                  </div>
                  <button
                    className={secondaryButton}
                    type="button"
                    onClick={() =>
                      replaceEducations([
                        ...educations,
                        {
                          id: createRecordId("resume-education"),
                          institution: "",
                          credential: "",
                          startDate: "",
                          endDate: "",
                          isCurrent: false,
                        },
                      ])
                    }
                  >
                    <Plus size={15} /> افزودن تحصیلات
                  </button>
                </div>
                {educations.map((education, index) => (
                  <article
                    className="grid gap-3 rounded-xl border border-[#dfe8e2] bg-[#f8faf8] p-3"
                    key={education.id}
                  >
                    <header className="flex items-center justify-between gap-3">
                      <strong className="text-[9px]">
                        تحصیلات {formatPersianNumber(index + 1)}
                      </strong>
                      <button
                        className="grid size-7 place-items-center rounded-lg bg-transparent text-[#c95649] transition-colors hover:bg-[#fff0ed]"
                        type="button"
                        aria-label={`حذف تحصیلات ${formatPersianNumber(index + 1)}`}
                        onClick={() =>
                          setPendingItemDelete({
                            itemName:
                              education.credential ||
                              `تحصیلات ${formatPersianNumber(index + 1)}`,
                            action: () =>
                              replaceEducations(
                                educations.filter(
                                  (item) => item.id !== education.id,
                                ),
                              ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>
                    <div className="grid min-w-0 grid-cols-1 gap-3 min-[561px]:grid-cols-2">
                      {(
                        [
                          ["institution", "دانشگاه یا مؤسسه"],
                          ["credential", "مدرک یا رشته"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field}>
                          {label}
                          <input
                            value={education[field]}
                            onChange={(event) =>
                              replaceEducations(
                                educations.map((item) =>
                                  item.id === education.id
                                    ? { ...item, [field]: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                      {(
                        [
                          ["startDate", "تاریخ شروع"],
                          ["endDate", "تاریخ پایان"],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field}>
                          {label}
                          <input
                            className="!text-left placeholder:!text-left"
                            dir="ltr"
                            disabled={
                              field === "endDate" && education.isCurrent
                            }
                            value={education[field]}
                            onChange={(event) =>
                              replaceEducations(
                                educations.map((item) =>
                                  item.id === education.id
                                    ? {
                                        ...item,
                                        [field]: sanitizeLtrField(
                                          event.target.value,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                    </div>
                    <label className="!flex items-center gap-2">
                      <input
                        className="!size-4 !min-h-0 !w-4"
                        type="checkbox"
                        checked={education.isCurrent}
                        onChange={(event) =>
                          replaceEducations(
                            educations.map((item) =>
                              item.id === education.id
                                ? {
                                    ...item,
                                    isCurrent: event.target.checked,
                                    endDate: event.target.checked
                                      ? ""
                                      : item.endDate,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      همچنان مشغول تحصیل هستم
                    </label>
                  </article>
                ))}
                {!educations.length && (
                  <button
                    className={`${secondaryButton} w-full`}
                    type="button"
                    onClick={() =>
                      replaceEducations([
                        {
                          id: createRecordId("resume-education"),
                          institution: "",
                          credential: "",
                          startDate: "",
                          endDate: "",
                          isCurrent: false,
                        },
                      ])
                    }
                  >
                    <Plus size={15} /> ثبت اولین سابقه تحصیلی
                  </button>
                )}
                <label>
                  مهارت‌ها
                  <input value={data.skills} onChange={input("skills")} />
                </label>
                <ResumeLanguageEditor
                  value={data.languages}
                  onChange={(value) => onDataChange("languages", value)}
                />
              </>
            )}

            {step === 3 && (
              <>
                <h3>خلاصه و بازبینی</h3>
                <p className="m-0 text-[8px] leading-[1.8] text-[#82908d]">
                  در چند جمله ارزش حرفه‌ای خودت را توضیح بده و پیش‌نمایش را
                  بررسی کن.
                </p>
                <label>
                  خلاصه حرفه‌ای
                  <textarea
                    autoFocus
                    value={data.summary}
                    onChange={input("summary")}
                  />
                </label>
                <div className="grid gap-2 [&>div]:flex [&>div]:items-center [&>div]:gap-[9px] [&>div]:rounded-[10px] [&>div]:border [&>div]:border-[#dce8e2] [&>div]:bg-[#f4f9f6] [&>div]:p-2.5 [&>div]:text-[#0f7b62] [&_span]:flex [&_span]:min-w-0 [&_span]:flex-col [&_strong]:text-[9px] [&_strong]:text-[#19312f] [&_small]:mt-0.5 [&_small]:truncate [&_small]:text-[7px] [&_small]:text-[#81908d]">
                  <div>
                    <Check size={15} />
                    <span>
                      <strong>اطلاعات فردی</strong>
                      <small>
                        {data.fullName} · {data.jobTitle}
                      </small>
                    </span>
                  </div>
                  <div>
                    <Check size={15} />
                    <span>
                      <strong>سابقه کاری</strong>
                      <small>
                        {data.experienceTitle} در {data.company}
                      </small>
                    </span>
                  </div>
                  <div>
                    <Check size={15} />
                    <span>
                      <strong>مهارت‌ها</strong>
                      <small>
                        {data.skills.split(/،|,/).slice(0, 3).join("، ")}
                      </small>
                    </span>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>

          <div
            className="flex shrink-0 justify-between gap-2 border-t border-[#e7ebe6] bg-white px-[22px] py-[18px]"
            data-resume-builder-footer
          >
            <button
              className={secondaryButton}
              disabled={step === 0}
              onClick={() => setStep((current) => current - 1)}
            >
              <ArrowRight size={16} /> مرحله قبل
            </button>
            {step < steps.length - 1 ? (
              <button
                className={primaryButton}
                disabled={!canContinue}
                onClick={() => setStep((current) => current + 1)}
              >
                ادامه <ArrowLeft size={16} />
              </button>
            ) : hasBeenSaved ? (
              <button className={primaryButton} onClick={finish}>
                <Download size={16} /> دریافت PDF
              </button>
            ) : (
              <button className={primaryButton} onClick={() => void onSave()}>
                <Save size={16} /> ذخیره رزومه
              </button>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col overflow-hidden bg-[#edf0ed] [grid-area:preview]">
          <div
            className={cn(
              "grid min-h-0 flex-1 items-start justify-items-center overflow-auto p-5 print:contents",
            )}
          >
            {generating ? (
              <ResumePreviewSkeleton />
            ) : (
              <ScaledResumePreview
                templateId={selectedTemplate}
                data={data}
                colorId={selectedColor}
                showAllPages
              />
            )}
          </div>
        </section>
      </div>
      {photoDeleteConfirm && (
        <DeleteConfirmModal
          itemName="عکس این رزومه"
          onCancel={() => setPhotoDeleteConfirm(false)}
          onConfirm={() => {
            onDataChange("photoUrl", "");
            setPhotoDeleteConfirm(false);
          }}
        />
      )}
      {pendingItemDelete && (
        <DeleteConfirmModal
          itemName={pendingItemDelete.itemName}
          onCancel={() => setPendingItemDelete(null)}
          onConfirm={() => {
            pendingItemDelete.action();
            setPendingItemDelete(null);
          }}
        />
      )}
      {modelOverwriteConfirmOpen && (
        <Modal
          title="تأیید تکمیل رزومه با AI"
          description="با ادامه، اطلاعات فعلی این رزومه توسط مدل تغییر می‌کند. آیا مطمئن هستی؟"
          onClose={() => setModelOverwriteConfirmOpen(false)}
        >
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              className={secondaryButton}
              type="button"
              onClick={() => setModelOverwriteConfirmOpen(false)}
            >
              انصراف
            </button>
            <button
              className={primaryButton}
              type="button"
              onClick={() => {
                setModelOverwriteConfirmOpen(false);
                setGenerationLanguagePickerOpen(true);
              }}
            >
              بله، ادامه بده
            </button>
          </div>
        </Modal>
      )}
      {generationLanguagePickerOpen && (
        <Modal
          title="زبان رزومه را انتخاب کن"
          description="مدل همه متن‌های حرفه‌ای رزومه را با زبان انتخاب‌شده تکمیل می‌کند."
          onClose={() => setGenerationLanguagePickerOpen(false)}
        >
          <div className="grid grid-cols-1 gap-2 pt-5 min-[561px]:grid-cols-2">
            <button
              className="flex min-h-[76px] items-center gap-3 rounded-xl border border-[#b9dccf] bg-[#edf7f2] p-3 text-right text-[#0f7b62] transition-colors hover:bg-[#e2f1ea]"
              type="button"
              onClick={() => void generateWithModel("fa")}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0f7b62] text-[11px] font-extrabold text-white">
                فا
              </span>
              <span className="flex flex-col">
                <strong className="text-[10px]">رزومه فارسی</strong>
                <small className="mt-1 text-[8px] text-[#758582]">
                  متن فارسی و چیدمان راست‌چین
                </small>
              </span>
            </button>
            <button
              className="flex min-h-[76px] items-center gap-3 rounded-xl border border-[#dfe5df] bg-[#fbfcfa] p-3 text-left text-[#324743] transition-colors hover:border-[#b9dccf] hover:bg-[#f1f7f4]"
              type="button"
              dir="ltr"
              onClick={() => void generateWithModel("en")}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e5ece8] text-[10px] font-extrabold text-[#324743]">
                EN
              </span>
              <span className="flex flex-col">
                <strong className="text-[10px]">English resume</strong>
                <small className="mt-1 text-[8px] text-[#758582]">
                  English content and LTR layout
                </small>
              </span>
            </button>
          </div>
        </Modal>
      )}
      {printView &&
        createPortal(
          <>
            <style media="print">
              {`@page { size: A4 portrait; margin: 0; }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #fff !important;
                }
                body > * {
                  display: none !important;
                }
                body > [data-resume-print-root] {
                  display: block !important;
                  width: 210mm !important;
                }
                [data-resume-print-page] {
                  box-sizing: border-box !important;
                  position: relative !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  overflow: hidden !important;
                  break-after: page !important;
                }
                [data-resume-print-page]:last-child {
                  break-after: auto !important;
                }
                [data-resume-print-page] > div {
                  width: 210mm !important;
                  min-width: 210mm !important;
                  max-width: 210mm !important;
                  height: 297mm !important;
                  min-height: 297mm !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                }`}
            </style>
            <div
              className="fixed left-[-10000px] top-0 w-[210mm] overflow-visible bg-white print:static print:block"
              dir="rtl"
              aria-hidden="true"
              data-resume-print-root
            >
              <ResumeDocument
                templateId={selectedTemplate}
                data={data}
                colorId={selectedColor}
                onPaginationReady={() => setPrintReady(true)}
              />
            </div>
          </>,
          document.body,
        )}
    </Modal>
  );
}
