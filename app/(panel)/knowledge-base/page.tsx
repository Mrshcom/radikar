"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  BookOpenText,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileUp,
  GraduationCap,
  LoaderCircle,
  Plus,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { DeleteConfirmModal, SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { emptyResumeData, type ResumeData } from "../resumes/resume-data";
import {
  createRecordId,
  getActiveProfileId,
  getLatestResume,
  knowledgeProfileStore,
  userProfileStore,
} from "@/lib/data/stores";
import type {
  KnowledgeExperience,
  KnowledgeLanguage,
  KnowledgeProfileRecord,
  KnowledgeQualification,
  UserProfileRecord,
} from "@/lib/data/models";
import { scheduleFieldDirectionRefresh } from "@/lib/field-direction";
import { skillSuggestions } from "@/lib/skill-suggestions";
import { cn } from "@/lib/cn";
import { formatPersianNumber } from "@/lib/fa-number";
import { sanitizeLtrField } from "@/lib/ltr-field";
import { readProfileImage } from "@/lib/image-file";

const primaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0f7b62] px-[15px] text-[11px] font-bold whitespace-nowrap text-white shadow-[0_7px_17px_rgba(15,123,98,.17)] disabled:cursor-not-allowed disabled:opacity-45";
const secondaryButton =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold whitespace-nowrap text-[#526461] disabled:cursor-not-allowed disabled:opacity-45";
const addButton =
  "inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#cfe3da] bg-[#edf7f2] px-2.5 text-[9px] font-bold text-[#0f7b62]";
const repeatGrid =
  "grid grid-cols-1 gap-3 min-[561px]:grid-cols-2 min-[1121px]:grid-cols-3 min-[1800px]:grid-cols-4";
const control =
  "min-h-[42px] w-full rounded-[10px] border border-[#dfe5df] bg-[#fbfcfa] px-3 text-[12px] text-right outline-none placeholder:text-right focus:border-[#79b8a5] focus:ring-3 focus:ring-[#e5f2ed] disabled:bg-[#f0f2ef] disabled:text-[#aab3b0]";

type KnowledgeForm = Omit<
  KnowledgeProfileRecord,
  "id" | "createdAt" | "updatedAt"
>;
type ImportResult = {
  resumeData?: Partial<ResumeData>;
  experiences?: Array<Omit<KnowledgeExperience, "id">>;
  qualifications?: Array<Omit<KnowledgeQualification, "id">>;
  skills?: string;
  languages?: string;
  languageItems?: Array<Omit<KnowledgeLanguage, "id">>;
  careerGoals?: string;
  preferredRoles?: string;
  preferredIndustries?: string;
  workPreferences?: string;
  interviewContext?: string;
  interviewChallenges?: string;
  fileName?: string;
  error?: string;
};

const emptyKnowledge: KnowledgeForm = {
  resumeData: emptyResumeData,
  experiences: [],
  qualifications: [],
  skills: "",
  languages: "",
  languageItems: [],
  careerGoals: "",
  preferredRoles: "",
  preferredIndustries: "",
  workPreferences: "",
  interviewContext: "",
  interviewChallenges: "",
};

const blankExperience = (): KnowledgeExperience => ({
  id: createRecordId("experience"),
  jobTitle: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
  technologies: "",
});

const blankQualification = (): KnowledgeQualification => ({
  id: createRecordId("qualification"),
  institution: "",
  credential: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
});

const blankLanguage = (): KnowledgeLanguage => ({
  id: createRecordId("language"),
  name: "",
  proficiency: "",
});

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

function normalizeProficiency(value: string | undefined) {
  const normalized = (value ?? "").trim().toLocaleLowerCase();
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
  return proficiencyOptions.some((option) => option.value === normalized)
    ? normalized
    : "";
}

function parseLanguageItems(value: string): KnowledgeLanguage[] {
  return value
    .split(/[|،,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name = "", ...levelParts] = item.split(/\s*(?:—|–|:)\s*/);
      const levelText = levelParts.join(" — ").trim();
      const matchedLevel =
        proficiencyOptions.find((option) => option.label === levelText)
          ?.value || normalizeProficiency(levelText);
      return {
        ...blankLanguage(),
        name: name.trim(),
        proficiency: matchedLevel,
      };
    });
}

function normalizeLanguage(
  item: Partial<KnowledgeLanguage>,
): KnowledgeLanguage {
  return {
    id: item.id || createRecordId("language"),
    name: item.name ?? "",
    proficiency: normalizeProficiency(item.proficiency),
  };
}

function languagesSummary(items: KnowledgeLanguage[]) {
  return items
    .filter((item) => item.name.trim())
    .map((item) =>
      [item.name.trim(), proficiencyLabel(item.proficiency)]
        .filter(Boolean)
        .join(" — "),
    )
    .join(" | ");
}

function splitExperienceDate(value: string) {
  const [startDate = "", endDate = ""] = value.split(/\s+(?:تا|–|—|-)\s+/, 2);
  const isCurrent = /(?:امروز|اکنون|حال حاضر|present|current)/i.test(endDate);
  return {
    startDate: startDate.trim(),
    endDate: isCurrent ? "" : endDate.trim(),
    isCurrent,
  };
}

function experienceFromResume(
  resume: ResumeData,
  legacy?: Partial<KnowledgeProfileRecord>,
): KnowledgeExperience {
  const dates = splitExperienceDate(resume.experienceDate);
  return {
    ...blankExperience(),
    jobTitle: resume.experienceTitle,
    company: resume.company,
    location: "",
    ...dates,
    description: resume.experience,
    technologies: legacy?.achievements ?? "",
  };
}

function normalizeExperience(
  item: Partial<KnowledgeExperience>,
): KnowledgeExperience {
  const dates =
    item.startDate || item.endDate || item.isCurrent
      ? {
          startDate: item.startDate ?? "",
          endDate: item.endDate ?? "",
          isCurrent: Boolean(item.isCurrent),
        }
      : splitExperienceDate(item.date ?? "");
  return {
    id: item.id || createRecordId("experience"),
    jobTitle: item.jobTitle ?? "",
    company: item.company ?? "",
    location: item.location ?? "",
    ...dates,
    description: item.description ?? "",
    technologies: item.technologies || item.achievements || "",
  };
}

function isExperienceEmpty(experience: KnowledgeExperience) {
  return (
    !experience.jobTitle.trim() &&
    !experience.company.trim() &&
    !experience.location.trim() &&
    !experience.startDate.trim() &&
    !experience.endDate.trim() &&
    !experience.description.trim() &&
    !experience.technologies.trim()
  );
}

function qualificationFromResume(
  resume: ResumeData,
  legacy?: Partial<KnowledgeProfileRecord>,
): KnowledgeQualification {
  return {
    ...blankQualification(),
    credential: [resume.education, legacy?.certifications]
      .filter(Boolean)
      .join(" — "),
  };
}

function normalizeQualification(
  item: Partial<KnowledgeQualification>,
): KnowledgeQualification {
  const legacyCredential = [item.education, item.certifications]
    .filter(Boolean)
    .join(" — ");
  return {
    id: item.id || createRecordId("qualification"),
    institution: item.institution ?? "",
    credential: item.credential || legacyCredential,
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    isCurrent: Boolean(item.isCurrent),
  };
}

function qualificationSummary(qualification: KnowledgeQualification) {
  const title = [qualification.credential, qualification.institution]
    .filter((value) => value.trim())
    .join("، ");
  const dates = [
    qualification.startDate,
    qualification.isCurrent ? "اکنون" : qualification.endDate,
  ]
    .filter((value) => value.trim())
    .join(" تا ");
  return [title, dates].filter(Boolean).join(" — ");
}

function normalizeWorkMode(
  value: string | undefined,
): UserProfileRecord["workMode"] {
  const normalized = (value ?? "").trim().toLocaleLowerCase();
  if (/(remote|دورکار)/.test(normalized)) return "remote";
  if (/(hybrid|هیبرید|ترکیبی)/.test(normalized)) return "hybrid";
  if (/(onsite|on-site|حضوری)/.test(normalized)) return "onsite";
  return "";
}

export default function KnowledgeBasePage() {
  const notify = useToast();
  const [form, setForm] = useState<KnowledgeForm>(emptyKnowledge);
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importedFile, setImportedFile] = useState("");
  const [openExperienceId, setOpenExperienceId] = useState<string | null>(null);
  const [showCompletionDetails, setShowCompletionDetails] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    itemName: string;
    action: () => void;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const completionDetailsRef = useRef<HTMLDivElement>(null);
  const resume = useMemo<ResumeData>(() => {
    const experience = form.experiences[0];
    const experiences = form.experiences
      .filter((item) => !isExperienceEmpty(item))
      .map((item) => ({ ...item }));
    const educations = form.qualifications
      .filter(
        (item) =>
          item.institution.trim() ||
          item.credential.trim() ||
          item.startDate.trim() ||
          item.endDate.trim(),
      )
      .map((item) => ({ ...item }));
    return {
      ...form.resumeData,
      experienceTitle: experience?.jobTitle ?? "",
      company: experience?.company ?? "",
      experienceDate: experience
        ? [
            experience.startDate,
            experience.isCurrent ? "امروز" : experience.endDate,
          ]
            .filter(Boolean)
            .join(" تا ")
        : "",
      experience: experience?.description ?? "",
      experiences,
      education: form.qualifications
        .map(qualificationSummary)
        .filter(Boolean)
        .join("\n"),
      educations,
      skills: form.skills,
      languages: languagesSummary(form.languageItems) || form.languages,
    };
  }, [form]);

  useEffect(() => {
    let active = true;
    void getActiveProfileId()
      .then((profileId) =>
        Promise.all([
          knowledgeProfileStore.get(profileId),
          getLatestResume(),
          userProfileStore.get(profileId),
        ]),
      )
      .then(([knowledge, latestResume, profile]) => {
        if (!active) return;
        if (knowledge) {
          const storedResume = { ...emptyResumeData, ...knowledge.resumeData };
          const experiences = knowledge.experiences?.length
            ? knowledge.experiences.map(normalizeExperience)
            : [experienceFromResume(storedResume, knowledge)];
          setForm({
            ...emptyKnowledge,
            ...knowledge,
            resumeData: storedResume,
            skills:
              knowledge.skills ||
              knowledge.qualifications
                ?.map((item) => item.skills)
                .filter(Boolean)
                .join("، ") ||
              storedResume.skills,
            languages:
              knowledge.languages ||
              knowledge.qualifications
                ?.map((item) => item.languages)
                .filter(Boolean)
                .join("، ") ||
              storedResume.languages,
            languageItems: knowledge.languageItems?.length
              ? knowledge.languageItems.map(normalizeLanguage)
              : parseLanguageItems(
                    knowledge.languages || storedResume.languages,
                  ).length
                ? parseLanguageItems(
                    knowledge.languages || storedResume.languages,
                  )
                : [blankLanguage()],
            workPreferences: normalizeWorkMode(
              knowledge.workPreferences || profile?.workMode,
            ),
            experiences,
            qualifications: knowledge.qualifications?.length
              ? knowledge.qualifications.map(normalizeQualification)
              : [qualificationFromResume(storedResume, knowledge)],
          });
          if (experiences.length === 1 && isExperienceEmpty(experiences[0]))
            setOpenExperienceId(experiences[0].id);
          setCreatedAt(knowledge.createdAt);
        } else {
          const storedResume = {
            ...emptyResumeData,
            ...latestResume?.data,
            fullName: latestResume?.data.fullName || profile?.fullName || "",
            jobTitle: latestResume?.data.jobTitle || profile?.targetTitle || "",
          };
          const experiences = [experienceFromResume(storedResume)];
          setForm({
            ...emptyKnowledge,
            resumeData: storedResume,
            skills: storedResume.skills,
            languages: storedResume.languages,
            languageItems: parseLanguageItems(storedResume.languages).length
              ? parseLanguageItems(storedResume.languages)
              : [blankLanguage()],
            experiences,
            qualifications: [qualificationFromResume(storedResume)],
            workPreferences: profile?.workMode ?? "",
          });
          if (isExperienceEmpty(experiences[0]))
            setOpenExperienceId(experiences[0].id);
        }
      })
      .catch(() =>
        notify("خواندن اطلاعات پایگاه دانش ناموفق بود.", "error"),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [notify]);

  useEffect(() => {
    if (!showCompletionDetails) return;
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!completionDetailsRef.current?.contains(event.target as Node))
        setShowCompletionDetails(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCompletionDetails(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showCompletionDetails]);

  const completionItems = useMemo(() => {
    const items = [
      {
        label: "نام و نام خانوادگی را وارد کن",
        complete: Boolean(form.resumeData.fullName.trim()),
      },
      {
        label: "عنوان حرفه‌ای را مشخص کن",
        complete: Boolean(form.resumeData.jobTitle.trim()),
      },
      {
        label: "ایمیل را وارد کن",
        complete: Boolean(form.resumeData.email.trim()),
      },
      {
        label: "شماره تماس را وارد کن",
        complete: Boolean(form.resumeData.phone.trim()),
      },
      {
        label: "محل سکونت را وارد کن",
        complete: Boolean(form.resumeData.location.trim()),
      },
      {
        label: "وب‌سایت یا لینکدین را اضافه کن",
        complete: Boolean(form.resumeData.website.trim()),
      },
      {
        label: "بخش درباره من را کامل کن",
        complete: Boolean(form.resumeData.summary.trim()),
      },
      {
        label: "هدف شغلی را توضیح بده",
        complete: Boolean(form.careerGoals.trim()),
      },
      {
        label: "نقش‌های شغلی موردنظر را اضافه کن",
        complete: Boolean(form.preferredRoles.trim()),
      },
      {
        label: "صنایع موردعلاقه را مشخص کن",
        complete: Boolean(form.preferredIndustries.trim()),
      },
      {
        label: "نحوه همکاری را انتخاب کن",
        complete: Boolean(form.workPreferences.trim()),
      },
      {
        label: "مهارت‌های عمومی را اضافه کن",
        complete: Boolean(form.skills.trim()),
      },
      {
        label: "زمینه مصاحبه را توضیح بده",
        complete: Boolean(form.interviewContext.trim()),
      },
      {
        label: "چالش‌های مصاحبه را اضافه کن",
        complete: Boolean(form.interviewChallenges.trim()),
      },
    ];
    form.experiences.forEach((experience, index) => {
      const number = formatPersianNumber(index + 1);
      items.push(
        {
          label: `عنوان شغلی تجربه ${number} را وارد کن`,
          complete: Boolean(experience.jobTitle.trim()),
        },
        {
          label: `نام شرکت تجربه ${number} را وارد کن`,
          complete: Boolean(experience.company.trim()),
        },
        {
          label: `کشور یا استان تجربه ${number} را وارد کن`,
          complete: Boolean(experience.location.trim()),
        },
        {
          label: `بازه همکاری تجربه ${number} را کامل کن`,
          complete: Boolean(
            experience.startDate.trim() &&
              (experience.isCurrent || experience.endDate.trim()),
          ),
        },
        {
          label: `شرح مسئولیت‌های تجربه ${number} را بنویس`,
          complete: Boolean(experience.description.trim()),
        },
        {
          label: `مهارت‌ها و تکنولوژی‌های تجربه ${number} را اضافه کن`,
          complete: Boolean(experience.technologies.trim()),
        },
      );
    });
    form.qualifications.forEach((qualification, index) => {
      const number = formatPersianNumber(index + 1);
      items.push(
        {
          label: `دانشگاه یا مؤسسه مورد ${number} را وارد کن`,
          complete: Boolean(qualification.institution.trim()),
        },
        {
          label: `مدرک یا گواهی مورد ${number} را وارد کن`,
          complete: Boolean(qualification.credential.trim()),
        },
        {
          label: `تاریخ شروع مورد ${number} را وارد کن`,
          complete: Boolean(qualification.startDate.trim()),
        },
        {
          label: `تاریخ پایان مورد ${number} را وارد کن یا وضعیت فعالیت را مشخص کن`,
          complete: Boolean(
            qualification.isCurrent || qualification.endDate.trim(),
          ),
        },
      );
    });
    form.languageItems.forEach((language, index) => {
      const number = formatPersianNumber(index + 1);
      items.push(
        {
          label: `نام زبان ${number} را وارد کن`,
          complete: Boolean(language.name.trim()),
        },
        {
          label: `سطح تسلط زبان ${number} را مشخص کن`,
          complete: Boolean(language.proficiency.trim()),
        },
      );
    });
    return items;
  }, [form]);
  const missingCompletionItems = completionItems.filter(
    (item) => !item.complete,
  );
  const completedFields =
    completionItems.length - missingCompletionItems.length;
  const completion = completionItems.length
    ? Math.round((completedFields / completionItems.length) * 100)
    : 0;

  const setResumeField =
    (field: keyof ResumeData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "email" || field === "phone" || field === "website"
          ? sanitizeLtrField(event.target.value)
          : event.target.value;
      setForm((current) => ({
        ...current,
        resumeData: { ...current.resumeData, [field]: value },
      }));
    };
  const setField =
    (field: keyof Omit<KnowledgeForm, "resumeData">) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  const setExperienceField =
    (id: string, field: keyof Omit<KnowledgeExperience, "id">) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "startDate" || field === "endDate"
          ? sanitizeLtrField(event.target.value)
          : event.target.value;
      setForm((current) => ({
        ...current,
        experiences: current.experiences.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      }));
    };
  const setExperienceValue = (
    id: string,
    field: keyof Omit<KnowledgeExperience, "id">,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      experiences: current.experiences.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };
  const setQualificationField =
    (id: string, field: keyof Omit<KnowledgeQualification, "id">) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "startDate" || field === "endDate"
          ? sanitizeLtrField(event.target.value)
          : event.target.value;
      setForm((current) => ({
        ...current,
        qualifications: current.qualifications.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      }));
    };
  const setLanguageField = (
    id: string,
    field: keyof Omit<KnowledgeLanguage, "id">,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      languageItems: current.languageItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };
  const addExperience = () => {
    const experience = blankExperience();
    setForm((current) => ({
      ...current,
      experiences: [...current.experiences, experience],
    }));
    setOpenExperienceId(experience.id);
  };
  const removeExperience = (id: string) => {
    setForm((current) => ({
      ...current,
      experiences: current.experiences.filter((item) => item.id !== id),
    }));
    setOpenExperienceId((current) => (current === id ? null : current));
  };
  const requestDelete = (itemName: string, action: () => void) =>
    setPendingDelete({ itemName, action });

  const importResume = async (file: File) => {
    setImporting(true);
    setImportError("");
    setImportedFile("");
    try {
      const payload = new FormData();
      payload.append("resume", file);
      const response = await fetch("/api/knowledge/import", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json()) as ImportResult;
      if (!response.ok)
        throw new Error(result.error || "استخراج اطلاعات رزومه ناموفق بود.");

      setForm((current) => ({
        ...current,
        resumeData: {
          ...current.resumeData,
          ...result.resumeData,
          photoUrl: result.resumeData?.photoUrl || current.resumeData.photoUrl,
        },
        experiences: result.experiences?.length
          ? result.experiences.map((item) =>
              normalizeExperience({
                ...item,
                id: createRecordId("experience"),
              }),
            )
          : current.experiences,
        qualifications: result.qualifications?.length
          ? result.qualifications.map((item) =>
              normalizeQualification({
                ...item,
                id: createRecordId("qualification"),
              }),
            )
          : current.qualifications,
        skills:
          result.skills ||
          result.qualifications
            ?.map((item) => item.skills)
            .filter(Boolean)
            .join("، ") ||
          current.skills,
        languages:
          result.languages ||
          result.qualifications
            ?.map((item) => item.languages)
            .filter(Boolean)
            .join("، ") ||
          current.languages,
        languageItems: result.languageItems?.length
          ? result.languageItems.map((item) =>
              normalizeLanguage({ ...item, id: createRecordId("language") }),
            )
          : parseLanguageItems(result.languages || "").length
            ? parseLanguageItems(result.languages || "")
            : current.languageItems,
        careerGoals: result.careerGoals || current.careerGoals,
        preferredRoles: result.preferredRoles || current.preferredRoles,
        preferredIndustries:
          result.preferredIndustries || current.preferredIndustries,
        workPreferences:
          normalizeWorkMode(result.workPreferences) || current.workPreferences,
        interviewContext: result.interviewContext || current.interviewContext,
        interviewChallenges:
          result.interviewChallenges || current.interviewChallenges,
      }));
      scheduleFieldDirectionRefresh();
      setImportedFile(result.fileName || file.name);
      notify(
        "اطلاعات رزومه استخراج و در فیلدها درج شد؛ موارد را بازبینی و ذخیره کن.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "استخراج اطلاعات رزومه ناموفق بود.";
      setImportError(message);
      notify(message, "error");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateProfilePhoto = async (file: File) => {
    try {
      const photoUrl = await readProfileImage(file);
      setForm((current) => ({
        ...current,
        resumeData: { ...current.resumeData, photoUrl },
      }));
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "انتخاب تصویر ناموفق بود.",
        "error",
      );
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    try {
      const profileId = await getActiveProfileId();
      await knowledgeProfileStore.put({
        id: profileId,
        ...form,
        languages: resume.languages,
        resumeData: resume,
        createdAt: createdAt || now,
        updatedAt: now,
      });
      const previousProfile = await userProfileStore.get(profileId);
      const profile: UserProfileRecord = {
        id: profileId,
        fullName: resume.fullName.trim(),
        targetTitle: resume.jobTitle.trim(),
        workMode:
          normalizeWorkMode(form.workPreferences) ||
          previousProfile?.workMode ||
          "",
        createdAt: previousProfile?.createdAt ?? now,
        updatedAt: now,
      };
      await userProfileStore.put(profile);
      setCreatedAt(createdAt || now);
      notify("پایگاه دانش ذخیره شد و برای ابزارهای رادیکار آماده است.");
    } catch {
      notify("ذخیره پایگاه دانش ناموفق بود.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <KnowledgePageSkeleton />;

  return (
    <>
      <SectionTitle
        eyebrow="منبع واحد اطلاعات حرفه‌ای"
        title="پایگاه دانش من"
        description="اطلاعاتت را یک‌بار کامل کن تا در ساخت رزومه، تطبیق شغلی و آمادگی مصاحبه از آن استفاده شود."
      />

      <div className="mb-4 flex flex-col gap-4 rounded-[18px] border border-[#dcebe5] bg-[linear-gradient(135deg,#f7fbf9,#edf7f2)] p-5 min-[700px]:flex-row min-[700px]:items-center min-[700px]:justify-between">
        <div className="flex items-center gap-3 text-[#0f7b62]">
          <span className="grid size-11 place-items-center rounded-xl bg-white shadow-sm">
            <BookOpenText size={23} />
          </span>
          <span className="flex flex-col">
            <strong className="text-[12px] text-[#19312f]">
              پروفایل حرفه‌ای تو
            </strong>
            <small className="mt-1 text-[8px] text-[#7f8e8a]">
              همه اطلاعات فقط در مرورگر خودت نگهداری می‌شود.
            </small>
          </span>
        </div>
        <div
          className="relative flex items-center gap-3"
          ref={completionDetailsRef}
        >
          <div className="grid min-w-[190px] gap-1.5">
            <span className="text-[9px] font-bold text-[#24423e]">
              {completion.toLocaleString("fa-IR")}٪ تکمیل
            </span>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#dce8e3]">
              <div
                className={cn(
                  "h-full rounded-full bg-[#0f7b62]",
                  completion === 0
                    ? "w-0"
                    : completion < 20
                      ? "w-1/5"
                      : completion < 40
                        ? "w-2/5"
                        : completion < 60
                          ? "w-3/5"
                          : completion < 80
                            ? "w-4/5"
                            : "w-full",
                )}
              />
            </div>
          </div>
          <button
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#cfe3da] bg-white px-2.5 text-[8px] font-bold text-[#0f7b62]"
            type="button"
            aria-expanded={showCompletionDetails}
            onClick={() => setShowCompletionDetails((current) => !current)}
          >
            <CircleHelp size={14} />
            <span>راه‌های بهبود</span>
            <ChevronDown size={13} />
          </button>
          {showCompletionDetails && (
            <div className="absolute top-[calc(100%+10px)] left-0 z-30 w-[min(390px,calc(100vw-40px))] overflow-hidden rounded-2xl border border-[#d8e8e1] bg-white shadow-[0_22px_60px_rgba(25,49,47,.18)]">
              <header className="flex items-center gap-2.5 bg-[#edf7f2] p-3.5">
                <span className="grid size-9 place-items-center rounded-[10px] bg-[#d7eee5] text-[#0f7b62]">
                  <Sparkles size={17} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <strong className="text-[10px]">
                    {missingCompletionItems.length
                      ? "پروفایلت را کامل‌تر کن"
                      : "پروفایل حرفه‌ای کامل"}
                  </strong>
                  <small className="mt-0.5 text-[7px] text-[#758582]">
                    {completion.toLocaleString("fa-IR")}٪ از اطلاعات پیشنهادی
                    تکمیل شده
                  </small>
                </div>
                <b className="grid size-7 place-items-center rounded-full bg-white text-[9px] text-[#0f7b62]">
                  {missingCompletionItems.length.toLocaleString("fa-IR")}
                </b>
              </header>
              <div className="max-h-[280px] overflow-y-auto p-3.5">
                {missingCompletionItems.length ? (
                  <>
                    <p className="mt-0 text-[8px] leading-[1.8] text-[#758582]">
                      موارد زیر را کامل کن تا رزومه و تمرین‌های مصاحبه دقیق‌تر و
                      شخصی‌تر شوند.
                    </p>
                    <ul className="m-0 grid list-none gap-1.5 p-0">
                      {missingCompletionItems.map((item) => (
                        <li
                          className="relative rounded-lg bg-[#f7f9f7] py-2 pr-6 pl-2 text-[8px] before:absolute before:top-3 before:right-2.5 before:size-1.5 before:rounded-full before:bg-[#66ad96]"
                          key={item.label}
                        >
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[#0f7b62]">
                    <CheckCircle2 size={18} />
                    <span className="flex flex-col">
                      <strong className="text-[9px]">پروفایل کامل است</strong>
                      <small className="text-[7px] text-[#758582]">
                        همه اطلاعات پیشنهادی ثبت شده‌اند.
                      </small>
                    </span>
                  </div>
                )}
              </div>
              {missingCompletionItems.length > 0 && (
                <footer className="border-t border-[#e7ebe6] bg-[#fafbf9] px-3.5 py-2.5 text-[7px] text-[#758582]">
                  بعد از تکمیل موارد، دکمه «ذخیره اطلاعات» را بزن.
                </footer>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mb-4 flex flex-col items-start gap-3 rounded-[17px] border border-[#dce7e1] bg-white p-4 shadow-[0_12px_36px_rgba(27,55,50,.055)] min-[700px]:flex-row min-[700px]:items-center">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e3f2ec] text-[#0f7b62]">
          {importing ? (
            <LoaderCircle className="animate-spin" size={24} />
          ) : (
            <FileUp size={24} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[11px]">تکمیل خودکار با رزومه فعلی</h2>
          <p className="my-1 text-[8px] leading-[1.8] text-[#758582]">
            فایل PDF، DOCX یا TXT را بارگذاری کن تا اطلاعات تماس، تجربه‌ها،
            تحصیلات و مهارت‌ها استخراج و در فرم‌ها درج شوند.
          </p>
          {importedFile && (
            <span className="flex items-center gap-1 text-[8px] text-[#0f7b62]">
              <CheckCircle2 size={14} /> اطلاعات «{importedFile}» آماده بازبینی
              است.
            </span>
          )}
          {importError && (
            <span className="block text-[8px] text-[#b65e52]">
              {importError}
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          className="sr-only"
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importResume(file);
          }}
        />
        <button
          className={secondaryButton}
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp size={16} />
          {importing ? "در حال استخراج..." : "انتخاب فایل رزومه"}
        </button>
      </section>

      {importing ? (
        <KnowledgeCardsSkeleton />
      ) : (
        <div className="grid gap-4">
          <KnowledgeSection
            icon={<UserRound size={18} />}
            title="اطلاعات فردی و تماس"
            description="اطلاعات پایه‌ای که در سربرگ رزومه استفاده می‌شود."
          >
            <div className="col-span-full flex flex-wrap items-center gap-4 rounded-xl border border-[#dfe8e2] bg-[#f8faf8] p-3.5">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#d5e3dc] bg-[#e8f2ed] text-[#6d8980]">
                {resume.photoUrl ? (
                  <Image
                    className="size-full object-cover"
                    src={resume.photoUrl}
                    width={160}
                    height={160}
                    unoptimized
                    alt="تصویر پروفایل"
                  />
                ) : (
                  <UserRound size={30} />
                )}
              </div>
              <div className="min-w-[180px] flex-1">
                <strong className="text-[10px] text-[#19312f]">
                  تصویر پروفایل
                </strong>
                <p className="mb-0 mt-1 text-[8px] leading-[1.8] text-[#84928f]">
                  این تصویر به‌عنوان عکس پیش‌فرض رزومه‌های جدید استفاده می‌شود.
                  حداکثر حجم ۵ مگابایت.
                </p>
              </div>
              <input
                ref={photoInputRef}
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void updateProfilePhoto(file);
                }}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className={secondaryButton}
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {resume.photoUrl ? "جایگزینی تصویر" : "انتخاب تصویر"}
                </button>
                {resume.photoUrl && (
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#eccfc9] bg-[#fff5f2] px-3 text-[9px] font-bold text-[#b65e52] transition-colors duration-200 hover:bg-[#ffe9e4]"
                    type="button"
                    onClick={() =>
                      requestDelete("تصویر پروفایل", () =>
                        setForm((current) => ({
                          ...current,
                          resumeData: { ...current.resumeData, photoUrl: "" },
                        })),
                      )
                    }
                  >
                    حذف تصویر
                  </button>
                )}
              </div>
            </div>
            <Field
              label="نام و نام خانوادگی"
              value={resume.fullName}
              onChange={setResumeField("fullName")}
            />
            <Field
              label="عنوان حرفه‌ای"
              value={resume.jobTitle}
              onChange={setResumeField("jobTitle")}
            />
            <Field
              ltrOnly
              label="ایمیل"
              type="email"
              value={resume.email}
              onChange={setResumeField("email")}
            />
            <Field
              ltrOnly
              label="شماره تماس"
              type="tel"
              value={resume.phone}
              onChange={setResumeField("phone")}
            />
            <Field
              label="محل سکونت"
              value={resume.location}
              onChange={setResumeField("location")}
            />
            <Field
              ltrOnly
              label="وب‌سایت یا لینکدین"
              value={resume.website}
              onChange={setResumeField("website")}
            />
            <Field
              textarea
              textareaSize="large"
              label="درباره من"
              value={resume.summary}
              onChange={setResumeField("summary")}
            />
          </KnowledgeSection>

          <KnowledgeSection
            icon={<Settings2 size={18} />}
            title="اطلاعات عمومی"
            description="مهارت‌ها، زبان‌ها و شیوه همکاری ترجیحی تو."
          >
            <MultiSkillAutocomplete
              label="مهارت‌ها"
              value={form.skills}
              onChange={(skills) =>
                setForm((current) => ({ ...current, skills }))
              }
            />
            <SelectField
              label="نحوه همکاری"
              value={form.workPreferences}
              onChange={(workPreferences) =>
                setForm((current) => ({ ...current, workPreferences }))
              }
              options={[
                { value: "", label: "انتخاب کنید" },
                { value: "remote", label: "دورکاری" },
                { value: "hybrid", label: "هیبرید" },
                { value: "onsite", label: "حضوری" },
              ]}
            />
            <div className="col-span-full grid gap-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <strong className="text-[10px]">زبان‌ها</strong>
                  <p className="mt-1 mb-0 text-[8px] text-[#83918e]">
                    نام زبان و سطح تسلط خودت را جداگانه ثبت کن.
                  </p>
                </div>
                <button
                  className={addButton}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      languageItems: [
                        ...current.languageItems,
                        blankLanguage(),
                      ],
                    }))
                  }
                >
                  <Plus size={15} /> افزودن زبان
                </button>
              </div>
              {form.languageItems.map((language, index) => (
                <div
                  className="grid grid-cols-1 gap-3 rounded-xl border border-[#e2e7e2] bg-[#fbfcfa] p-3 min-[561px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  key={language.id}
                >
                  <Field
                    label={`زبان ${formatPersianNumber(index + 1)}`}
                    value={language.name}
                    onChange={(event) =>
                      setLanguageField(language.id, "name", event.target.value)
                    }
                    placeholder="مثلاً فارسی یا انگلیسی"
                  />
                  <SelectField
                    label="سطح تسلط"
                    value={language.proficiency}
                    onChange={(proficiency) =>
                      setLanguageField(language.id, "proficiency", proficiency)
                    }
                    options={[...proficiencyOptions]}
                  />
                  <button
                    className="flex h-[42px] self-end items-center gap-1 rounded-lg px-2.5 text-[8px] text-[#b65e52] hover:bg-[#fff0ed] disabled:opacity-40"
                    type="button"
                    disabled={form.languageItems.length === 1}
                    onClick={() =>
                      requestDelete(
                        language.name.trim() ||
                          `زبان ${formatPersianNumber(index + 1)}`,
                        () =>
                          setForm((current) => ({
                            ...current,
                            languageItems: current.languageItems.filter(
                              (item) => item.id !== language.id,
                            ),
                          })),
                      )
                    }
                    aria-label={`حذف زبان ${formatPersianNumber(index + 1)}`}
                  >
                    <Trash2 size={15} /> حذف
                  </button>
                </div>
              ))}
            </div>
          </KnowledgeSection>

          <KnowledgeSection
            icon={<BriefcaseBusiness size={18} />}
            title="تجربه حرفه‌ای"
            description="همه تجربه‌ها، مسئولیت‌ها و دستاوردهای قابل ارائه."
            action={
              <button className={addButton} onClick={addExperience}>
                <Plus size={15} /> افزودن تجربه
              </button>
            }
          >
            <div className="col-span-full grid gap-2">
              {form.experiences.map((experience, index) => {
                const isOpen = openExperienceId === experience.id;
                return (
                  <article
                    className={cn(
                      "rounded-xl border bg-[#fbfcfa]",
                      isOpen
                        ? "overflow-visible border-[#9bcdbd] shadow-[0_0_0_3px_rgba(31,132,102,.06)]"
                        : "overflow-hidden border-[#e2e7e2]",
                    )}
                    key={experience.id}
                  >
                    <button
                      className="flex min-h-[58px] w-full items-center justify-between gap-3 bg-transparent px-3.5 py-2.5 text-right"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`experience-${experience.id}`}
                      onClick={() =>
                        setOpenExperienceId(isOpen ? null : experience.id)
                      }
                    >
                      <span className="flex min-w-0 flex-col">
                        <strong className="truncate text-[10px]">
                          {experience.jobTitle.trim() ||
                            `تجربه ${formatPersianNumber(index + 1)}`}
                        </strong>
                        <small className="mt-1 truncate text-[8px] text-[#84918e]">
                          {experience.company.trim() || "نام شرکت ثبت نشده"}
                        </small>
                      </span>
                      <ChevronDown
                        className={cn(
                          "shrink-0 transition-transform",
                          isOpen && "rotate-180",
                        )}
                        size={17}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div
                        className={`${repeatGrid} rounded-b-[11px] border-t border-[#e4e9e4] bg-white p-3.5`}
                        id={`experience-${experience.id}`}
                      >
                        <div className="col-span-full flex items-center justify-between">
                          <span className="text-[8px] text-[#758582]">
                            ویرایش جزئیات تجربه
                          </span>
                          <button
                            className="inline-flex items-center gap-1 bg-transparent text-[8px] text-[#b65e52] disabled:opacity-40"
                            disabled={form.experiences.length === 1}
                            onClick={() =>
                              requestDelete(
                                experience.jobTitle.trim() ||
                                  `تجربه ${formatPersianNumber(index + 1)}`,
                                () => removeExperience(experience.id),
                              )
                            }
                            aria-label={`حذف تجربه ${formatPersianNumber(index + 1)}`}
                          >
                            <Trash2 size={15} /> حذف
                          </button>
                        </div>
                        <Field
                          label="عنوان شغلی"
                          value={experience.jobTitle}
                          onChange={setExperienceField(
                            experience.id,
                            "jobTitle",
                          )}
                        />
                        <Field
                          label="شرکت یا سازمان"
                          value={experience.company}
                          onChange={setExperienceField(
                            experience.id,
                            "company",
                          )}
                        />
                        <Field
                          label="کشور/استان"
                          value={experience.location}
                          onChange={setExperienceField(
                            experience.id,
                            "location",
                          )}
                        />
                        <Field
                          ltrOnly
                          label="تاریخ شروع"
                          value={experience.startDate}
                          onChange={setExperienceField(
                            experience.id,
                            "startDate",
                          )}
                          placeholder="مثلاً 2023/04"
                        />
                        <Field
                          ltrOnly
                          label="تاریخ پایان"
                          value={experience.endDate}
                          disabled={experience.isCurrent}
                          onChange={setExperienceField(
                            experience.id,
                            "endDate",
                          )}
                          placeholder={
                            experience.isCurrent ? "Present" : "مثلاً 2026/03"
                          }
                        />
                        <label className="flex h-[42px] self-end cursor-pointer items-center gap-2 text-[10px] font-normal transition-colors hover:text-[#0f7b62]">
                          <input
                            className="size-4 accent-[#0f7b62]"
                            type="checkbox"
                            checked={experience.isCurrent}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                experiences: current.experiences.map((item) =>
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
                              }))
                            }
                          />
                          <span>همچنان در این موقعیت مشغول به کار هستم</span>
                        </label>
                        <Field
                          textarea
                          label="شرح مسئولیت‌ها و نتایج"
                          value={experience.description}
                          onChange={setExperienceField(
                            experience.id,
                            "description",
                          )}
                          placeholder="هر مورد را در یک خط بنویس."
                        />
                        <MultiSkillAutocomplete
                          label="مهارت‌ها و تکنولوژی‌ها"
                          value={experience.technologies}
                          onChange={(value) =>
                            setExperienceValue(
                              experience.id,
                              "technologies",
                              value,
                            )
                          }
                        />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </KnowledgeSection>

          <KnowledgeSection
            icon={<GraduationCap size={18} />}
            title="تحصیلات و مدارک"
            description="همه سوابق تحصیلی، گواهی‌ها و دوره‌های حرفه‌ای."
            action={
              <button
                className={addButton}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    qualifications: [
                      ...current.qualifications,
                      blankQualification(),
                    ],
                  }))
                }
              >
                <Plus size={15} /> افزودن مورد
              </button>
            }
          >
            {form.qualifications.map((qualification, index) => (
              <div
                className="col-span-full grid gap-3 rounded-xl border border-[#e2e7e2] bg-[#fbfcfa] p-3.5"
                key={qualification.id}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-[9px]">
                    مورد {formatPersianNumber(index + 1)}
                  </strong>
                  <button
                    className="inline-flex items-center gap-1 bg-transparent text-[8px] text-[#b65e52] disabled:opacity-40"
                    disabled={form.qualifications.length === 1}
                    onClick={() =>
                      requestDelete(
                        qualification.credential.trim() ||
                          `تحصیلات ${formatPersianNumber(index + 1)}`,
                        () =>
                          setForm((current) => ({
                            ...current,
                            qualifications: current.qualifications.filter(
                              (item) => item.id !== qualification.id,
                            ),
                          })),
                      )
                    }
                    aria-label="حذف مورد"
                  >
                    <Trash2 size={15} /> حذف
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 min-[561px]:grid-cols-2">
                  <Field
                    label="دانشگاه یا مؤسسه"
                    value={qualification.institution}
                    onChange={setQualificationField(
                      qualification.id,
                      "institution",
                    )}
                  />
                  <Field
                    label="مدرک یا گواهی"
                    value={qualification.credential}
                    onChange={setQualificationField(
                      qualification.id,
                      "credential",
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 min-[561px]:grid-cols-2 min-[1121px]:grid-cols-3">
                  <Field
                    ltrOnly
                    label="تاریخ شروع"
                    value={qualification.startDate}
                    onChange={setQualificationField(
                      qualification.id,
                      "startDate",
                    )}
                    placeholder="مثلاً 2019/09"
                  />
                  <Field
                    ltrOnly
                    label="تاریخ پایان"
                    value={qualification.endDate}
                    disabled={qualification.isCurrent}
                    onChange={setQualificationField(
                      qualification.id,
                      "endDate",
                    )}
                    placeholder={
                      qualification.isCurrent ? "Present" : "مثلاً 2023/09"
                    }
                  />
                  <label className="flex h-[42px] self-end cursor-pointer items-center gap-2 text-[10px] font-normal transition-colors hover:text-[#0f7b62]">
                    <input
                      className="size-4 accent-[#0f7b62]"
                      type="checkbox"
                      checked={qualification.isCurrent}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          qualifications: current.qualifications.map((item) =>
                            item.id === qualification.id
                              ? {
                                  ...item,
                                  isCurrent: event.target.checked,
                                  endDate: event.target.checked
                                    ? ""
                                    : item.endDate,
                                }
                              : item,
                          ),
                        }))
                      }
                    />
                    <span>همچنان مشغول فعالیت هستم</span>
                  </label>
                </div>
              </div>
            ))}
          </KnowledgeSection>

          <KnowledgeSection
            icon={<Sparkles size={18} />}
            title="هدف شغلی و آمادگی مصاحبه"
            description="زمینه لازم برای شخصی‌سازی پیشنهادها و تمرین‌ها."
          >
            <Field
              textarea
              label="هدف شغلی"
              value={form.careerGoals}
              onChange={setField("careerGoals")}
              placeholder="در یک تا سه سال آینده می‌خواهی به چه جایگاهی برسی؟"
            />
            <Field
              label="نقش‌های موردنظر"
              value={form.preferredRoles}
              onChange={setField("preferredRoles")}
            />
            <Field
              label="صنایع موردعلاقه"
              value={form.preferredIndustries}
              onChange={setField("preferredIndustries")}
            />
            <Field
              textarea
              label="زمینه و تجربه مصاحبه"
              value={form.interviewContext}
              onChange={setField("interviewContext")}
            />
            <Field
              textarea
              label="چالش‌ها و نگرانی‌های مصاحبه"
              value={form.interviewChallenges}
              onChange={setField("interviewChallenges")}
            />
          </KnowledgeSection>
        </div>
      )}

      <div className="sticky bottom-4 z-10 mt-4 flex flex-col items-start justify-between gap-3 rounded-[15px] border border-[#d8e6df] bg-white/95 p-3.5 shadow-[0_14px_40px_rgba(25,49,47,.12)] backdrop-blur min-[561px]:flex-row min-[561px]:items-center">
        <div className="flex items-center gap-2 text-[8px] text-[#758582]">
          <CheckCircle2 className="text-[#0f7b62]" size={18} />
          <span>پس از ذخیره، ساخت رزومه جدید با این اطلاعات آغاز می‌شود.</span>
        </div>
        <button
          className={primaryButton}
          disabled={saving || importing}
          onClick={() => void save()}
        >
          <Save size={16} /> ذخیره پایگاه دانش
        </button>
      </div>
      {pendingDelete && (
        <DeleteConfirmModal
          itemName={pendingDelete.itemName}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            pendingDelete.action();
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
}

function KnowledgeCardsSkeleton() {
  return (
    <div
      className="grid gap-4"
      aria-label="در حال استخراج اطلاعات رزومه"
      aria-busy="true"
    >
      {[7, 4, 1, 1, 5].map((fieldCount, cardIndex) => (
        <section
          className="rounded-[18px] border border-[#e7ebe6] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.045)]"
          key={cardIndex}
        >
          <header className="mb-5 flex items-center gap-3">
            <span className="size-10 animate-pulse rounded-xl bg-[#e8eeea]" />
            <div className="grid flex-1 gap-2">
              <i className="h-3 w-32 animate-pulse rounded bg-[#e8eeea]" />
              <i className="h-2 w-56 max-w-full animate-pulse rounded bg-[#eef2ef]" />
            </div>
            {cardIndex === 2 || cardIndex === 3 ? (
              <i className="h-8 w-24 animate-pulse rounded-lg bg-[#e8eeea]" />
            ) : null}
          </header>
          <div className={repeatGrid}>
            {Array.from({ length: fieldCount }, (_, fieldIndex) => {
              const multiline =
                (cardIndex === 0 && fieldIndex === fieldCount - 1) ||
                (cardIndex === 4 && fieldIndex >= 3);
              const fullWidth = multiline || cardIndex === 2 || cardIndex === 3;
              return (
                <div
                  className={cn("grid gap-1.5", fullWidth && "col-span-full")}
                  key={fieldIndex}
                >
                  <i className="h-2 w-16 animate-pulse rounded bg-[#e8eeea]" />
                  <b
                    className={cn(
                      "h-[42px] animate-pulse rounded-[10px] bg-[#eef2ef]",
                      multiline && "h-24",
                    )}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function KnowledgePageSkeleton() {
  return (
    <div role="status" aria-label="در حال خواندن پایگاه دانش">
      <div className="mb-8 flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <i className="mb-3 block h-2.5 w-40 animate-pulse rounded bg-[#e8eeea]" />
          <i className="block h-8 w-56 animate-pulse rounded-lg bg-[#e5eae6]" />
          <i className="mt-3 block h-3 w-[min(620px,95%)] animate-pulse rounded bg-[#eef2ef]" />
        </div>
      </div>
      <div className="mb-4 flex min-h-[84px] items-center gap-4 rounded-[18px] border border-[#dcebe5] bg-[#f2f8f5] p-5">
        <i className="size-11 animate-pulse rounded-xl bg-white" />
        <div className="min-w-0 flex-1">
          <i className="block h-3 w-32 animate-pulse rounded bg-[#dfe9e4]" />
          <i className="mt-2 block h-2 w-56 max-w-full animate-pulse rounded bg-[#e5ede9]" />
        </div>
        <i className="h-8 w-48 animate-pulse rounded-lg bg-white" />
      </div>
      <div className="mb-4 flex min-h-[86px] items-center gap-3 rounded-[17px] border border-[#dce7e1] bg-white p-4 shadow-[0_12px_36px_rgba(27,55,50,.055)]">
        <i className="size-11 animate-pulse rounded-xl bg-[#e3f2ec]" />
        <div className="min-w-0 flex-1">
          <i className="block h-3 w-40 animate-pulse rounded bg-[#e5eae6]" />
          <i className="mt-2 block h-2 w-3/4 animate-pulse rounded bg-[#eef2ef]" />
        </div>
        <i className="h-10 w-32 animate-pulse rounded-[10px] bg-[#e8eeea]" />
      </div>
      <KnowledgeCardsSkeleton />
      <div className="mt-4 flex min-h-[68px] items-center justify-between rounded-[15px] border border-[#d8e6df] bg-white p-3.5 shadow-[0_14px_40px_rgba(25,49,47,.12)]">
        <i className="h-2.5 w-64 max-w-1/2 animate-pulse rounded bg-[#e8eeea]" />
        <i className="h-10 w-36 animate-pulse rounded-[10px] bg-[#dfe9e4]" />
      </div>
    </div>
  );
}

function KnowledgeSection({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[#e7ebe6] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.045)]">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-[#e6f4ee] text-[#0f7b62]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[12px]">{title}</h2>
          <p className="mt-1 mb-0 text-[8px] leading-[1.7] text-[#83918e]">
            {description}
          </p>
        </div>
        {action}
      </header>
      <div className={repeatGrid}>{children}</div>
    </section>
  );
}

type FieldProps = {
  label: string;
  textarea?: boolean;
  textareaSize?: "default" | "large";
  type?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  ltrOnly?: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
};

function Field({
  label,
  textarea,
  textareaSize = "default",
  type,
  value,
  placeholder,
  disabled,
  ltrOnly = false,
  onChange,
}: FieldProps) {
  return (
    <label
      className={cn(
        "grid min-w-0 gap-1.5 text-[10px] font-normal",
        textarea && "col-span-full",
      )}
    >
      {label}
      {textarea ? (
        <textarea
          className={cn(
            control,
            textareaSize === "large" ? "!min-h-44" : "!min-h-28",
            "resize-y p-3",
          )}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
        />
      ) : (
        <input
          className={cn(
            control,
            ltrOnly && "!text-left placeholder:!text-left",
          )}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          dir={ltrOnly ? "ltr" : undefined}
          data-direction={ltrOnly ? "ltr" : undefined}
          onChange={onChange}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[10px] font-normal">
      {label}
      <span className="relative block">
        <select
          className={`${control} appearance-none pr-3 pl-11`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#60716e]"
          size={16}
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

function parseSkills(value: string) {
  return value
    .split(/[,،;؛\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function MultiSkillAutocomplete({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [pendingSkillDelete, setPendingSkillDelete] = useState<string | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedSkills = useMemo(() => parseSkills(value), [value]);
  const normalizedSelected = useMemo(
    () => new Set(selectedSkills.map((skill) => skill.toLocaleLowerCase())),
    [selectedSkills],
  );
  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return skillSuggestions
      .filter((skill) => !normalizedSelected.has(skill.toLocaleLowerCase()))
      .filter(
        (skill) =>
          !normalizedQuery ||
          skill.toLocaleLowerCase().includes(normalizedQuery),
      )
      .slice(0, 10);
  }, [normalizedSelected, query]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const commit = (rawSkill: string) => {
    const skill = rawSkill.trim().replace(/^[،,]+|[،,]+$/g, "");
    if (
      !skill ||
      selectedSkills.length >= 100 ||
      normalizedSelected.has(skill.toLocaleLowerCase())
    ) {
      setQuery("");
      return;
    }
    onChange([...selectedSkills, skill].join(", "));
    setQuery("");
    setOpen(true);
    scheduleFieldDirectionRefresh();
  };
  const remove = (skill: string) => {
    onChange(selectedSkills.filter((item) => item !== skill).join(", "));
    scheduleFieldDirectionRefresh();
  };

  return (
    <div className="relative col-span-full grid min-w-0 gap-1.5" ref={rootRef}>
      <span className="flex items-center justify-between text-[10px] font-normal">
        {label}
        <small className="text-[7px] text-[#8b9894]">
          {selectedSkills.length.toLocaleString("fa-IR")} از ۱۰۰
        </small>
      </span>
      <div
        className={cn(
          "flex min-h-[42px] cursor-pointer flex-wrap items-center gap-1.5 rounded-[10px] border bg-[#fbfcfa] p-1.5 transition hover:border-[#9ccbbb] hover:bg-[#f7faf8]",
          open ? "border-[#79b8a5] ring-3 ring-[#e5f2ed]" : "border-[#dfe5df]",
        )}
        dir="ltr"
        onClick={() => setOpen(true)}
      >
        {selectedSkills.map((skill) => (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-[#cfe3da] bg-[#edf7f2] py-1 pr-2 pl-1 text-[8px] text-[#0f7b62]"
            key={skill}
          >
            {skill}
            <button
              className="grid size-4 place-items-center rounded-full bg-[#d8ece4] text-[#0f7b62]"
              type="button"
              aria-label={`حذف ${skill}`}
              onClick={(event) => {
                event.stopPropagation();
                setPendingSkillDelete(skill);
              }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          className="min-h-7 min-w-[150px] flex-1 border-0 bg-transparent px-1 text-left text-[12px] outline-none placeholder:text-right"
          dir="ltr"
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          placeholder={
            selectedSkills.length
              ? "مهارت بیشتر..."
              : "نام مهارت یا تکنولوژی را جست‌وجو کن"
          }
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commit(suggestions[0] ?? query);
            } else if (
              event.key === "Backspace" &&
              !query &&
              selectedSkills.length
            ) {
              setPendingSkillDelete(selectedSkills[selectedSkills.length - 1]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </div>
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-20 max-h-64 overflow-y-auto rounded-xl border border-[#dce6e1] bg-white p-1.5 shadow-[0_16px_40px_rgba(25,49,47,.14)]"
          dir="ltr"
          id={listboxId}
          role="listbox"
        >
          {suggestions.map((skill) => (
            <button
              className="flex w-full items-center gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left text-[9px] text-[#4f625e] hover:bg-[#edf7f2] hover:text-[#0f7b62]"
              type="button"
              role="option"
              aria-selected="false"
              key={skill}
              onClick={() => commit(skill)}
            >
              <Plus size={13} />
              <span>{skill}</span>
            </button>
          ))}
          {query.trim() &&
            !normalizedSelected.has(query.trim().toLocaleLowerCase()) &&
            !suggestions.some(
              (skill) =>
                skill.toLocaleLowerCase() === query.trim().toLocaleLowerCase(),
            ) && (
              <button
                className="flex w-full items-center gap-2 rounded-lg bg-[#f2f8f5] px-2.5 py-2 text-left text-[9px] text-[#0f7b62]"
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => commit(query)}
              >
                <Plus size={13} />
                <span>افزودن «{query.trim()}»</span>
              </button>
            )}
          {!suggestions.length && !query.trim() && (
            <p className="m-0 p-3 text-center text-[8px] text-[#8b9894]">
              مهارت دیگری برای پیشنهاد باقی نمانده است.
            </p>
          )}
        </div>
      )}
      {pendingSkillDelete && (
        <DeleteConfirmModal
          itemName={pendingSkillDelete}
          onCancel={() => setPendingSkillDelete(null)}
          onConfirm={() => {
            remove(pendingSkillDelete);
            setPendingSkillDelete(null);
          }}
        />
      )}
    </div>
  );
}
