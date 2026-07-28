"use client";

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { BookOpenText, BriefcaseBusiness, CheckCircle2, ChevronDown, CircleHelp, FileUp, GraduationCap, LoaderCircle, Plus, Save, Settings2, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { emptyResumeData, type ResumeData } from "../resumes/resume-data";
import { createRecordId, getActiveProfileId, getLatestResume, knowledgeProfileStore, userProfileStore } from "@/lib/data/stores";
import type { KnowledgeExperience, KnowledgeProfileRecord, KnowledgeQualification, UserProfileRecord } from "@/lib/data/models";
import { scheduleFieldDirectionRefresh } from "@/lib/field-direction";
import { skillSuggestions } from "@/lib/skill-suggestions";

type KnowledgeForm = Omit<KnowledgeProfileRecord, "id" | "createdAt" | "updatedAt">;
type ImportResult = {
  resumeData?: Partial<ResumeData>;
  experiences?: Array<Omit<KnowledgeExperience, "id">>;
  qualifications?: Array<Omit<KnowledgeQualification, "id">>;
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
  education: "",
  certifications: "",
});

function splitExperienceDate(value: string) {
  const [startDate = "", endDate = ""] = value.split(/\s+(?:تا|–|—|-)\s+/, 2);
  const isCurrent = /(?:امروز|اکنون|حال حاضر|present|current)/i.test(endDate);
  return { startDate: startDate.trim(), endDate: isCurrent ? "" : endDate.trim(), isCurrent };
}

function experienceFromResume(resume: ResumeData, legacy?: Partial<KnowledgeProfileRecord>): KnowledgeExperience {
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

function normalizeExperience(item: Partial<KnowledgeExperience>): KnowledgeExperience {
  const dates = item.startDate || item.endDate || item.isCurrent ? {
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    isCurrent: Boolean(item.isCurrent),
  } : splitExperienceDate(item.date ?? "");
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

function qualificationFromResume(resume: ResumeData, legacy?: Partial<KnowledgeProfileRecord>): KnowledgeQualification {
  return {
    ...blankQualification(),
    education: resume.education,
    certifications: legacy?.certifications ?? "",
  };
}

function normalizeQualification(item: Partial<KnowledgeQualification>): KnowledgeQualification {
  return {
    id: item.id || createRecordId("qualification"),
    education: item.education ?? "",
    certifications: item.certifications ?? "",
  };
}

function normalizeWorkMode(value: string | undefined): UserProfileRecord["workMode"] {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completionDetailsRef = useRef<HTMLDivElement>(null);
  const resume = useMemo<ResumeData>(() => {
    const experience = form.experiences[0];
    const qualification = form.qualifications[0];
    return {
      ...form.resumeData,
      experienceTitle: experience?.jobTitle ?? "",
      company: experience?.company ?? "",
      experienceDate: experience
        ? [experience.startDate, experience.isCurrent ? "امروز" : experience.endDate].filter(Boolean).join(" تا ")
        : "",
      experience: experience?.description ?? "",
      education: qualification?.education ?? "",
      skills: form.skills,
      languages: form.languages,
    };
  }, [form]);

  useEffect(() => {
    let active = true;
    void getActiveProfileId().then((profileId) => Promise.all([
      knowledgeProfileStore.get(profileId),
      getLatestResume(),
      userProfileStore.get(profileId),
    ])).then(([knowledge, latestResume, profile]) => {
      if (!active) return;
      if (knowledge) {
        const storedResume = { ...emptyResumeData, ...knowledge.resumeData };
        setForm({
          ...emptyKnowledge,
          ...knowledge,
          resumeData: storedResume,
          skills: knowledge.skills || knowledge.qualifications?.map((item) => item.skills).filter(Boolean).join("، ") || storedResume.skills,
          languages: knowledge.languages || knowledge.qualifications?.map((item) => item.languages).filter(Boolean).join("، ") || storedResume.languages,
          workPreferences: normalizeWorkMode(knowledge.workPreferences || profile?.workMode),
          experiences: knowledge.experiences?.length
            ? knowledge.experiences.map(normalizeExperience)
            : [experienceFromResume(storedResume, knowledge)],
          qualifications: knowledge.qualifications?.length ? knowledge.qualifications.map(normalizeQualification) : [qualificationFromResume(storedResume, knowledge)],
        });
        setCreatedAt(knowledge.createdAt);
      } else {
        const storedResume = {
          ...emptyResumeData,
          ...latestResume?.data,
          fullName: latestResume?.data.fullName || profile?.fullName || "",
          jobTitle: latestResume?.data.jobTitle || profile?.targetTitle || "",
        };
        setForm({
          ...emptyKnowledge,
          resumeData: storedResume,
          skills: storedResume.skills,
          languages: storedResume.languages,
          experiences: [experienceFromResume(storedResume)],
          qualifications: [qualificationFromResume(storedResume)],
          workPreferences: profile?.workMode ?? "",
        });
      }
    }).catch(() => notify("خواندن اطلاعات پایگاه دانش ناموفق بود."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [notify]);

  useEffect(() => {
    if (!showCompletionDetails) return;
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!completionDetailsRef.current?.contains(event.target as Node)) setShowCompletionDetails(false);
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
      { label: "نام و نام خانوادگی را وارد کن", complete: Boolean(form.resumeData.fullName.trim()) },
      { label: "عنوان حرفه‌ای را مشخص کن", complete: Boolean(form.resumeData.jobTitle.trim()) },
      { label: "ایمیل را وارد کن", complete: Boolean(form.resumeData.email.trim()) },
      { label: "شماره تماس را وارد کن", complete: Boolean(form.resumeData.phone.trim()) },
      { label: "محل سکونت را وارد کن", complete: Boolean(form.resumeData.location.trim()) },
      { label: "وب‌سایت یا لینکدین را اضافه کن", complete: Boolean(form.resumeData.website.trim()) },
      { label: "بخش درباره من را کامل کن", complete: Boolean(form.resumeData.summary.trim()) },
      { label: "هدف شغلی را توضیح بده", complete: Boolean(form.careerGoals.trim()) },
      { label: "نقش‌های شغلی موردنظر را اضافه کن", complete: Boolean(form.preferredRoles.trim()) },
      { label: "صنایع موردعلاقه را مشخص کن", complete: Boolean(form.preferredIndustries.trim()) },
      { label: "نحوه همکاری را انتخاب کن", complete: Boolean(form.workPreferences.trim()) },
      { label: "مهارت‌های عمومی را اضافه کن", complete: Boolean(form.skills.trim()) },
      { label: "زبان‌ها را مشخص کن", complete: Boolean(form.languages.trim()) },
      { label: "زمینه مصاحبه را توضیح بده", complete: Boolean(form.interviewContext.trim()) },
      { label: "چالش‌های مصاحبه را اضافه کن", complete: Boolean(form.interviewChallenges.trim()) },
    ];
    form.experiences.forEach((experience, index) => {
      const number = String(index + 1).toLocaleString("fa-IR");
      items.push(
        { label: `عنوان شغلی تجربه ${number} را وارد کن`, complete: Boolean(experience.jobTitle.trim()) },
        { label: `نام شرکت تجربه ${number} را وارد کن`, complete: Boolean(experience.company.trim()) },
        { label: `کشور یا استان تجربه ${number} را وارد کن`, complete: Boolean(experience.location.trim()) },
        { label: `بازه همکاری تجربه ${number} را کامل کن`, complete: Boolean(experience.startDate.trim() && (experience.isCurrent || experience.endDate.trim())) },
        { label: `شرح مسئولیت‌های تجربه ${number} را بنویس`, complete: Boolean(experience.description.trim()) },
        { label: `مهارت‌ها و تکنولوژی‌های تجربه ${number} را اضافه کن`, complete: Boolean(experience.technologies.trim()) },
      );
    });
    form.qualifications.forEach((qualification, index) => {
      const number = String(index + 1).toLocaleString("fa-IR");
      items.push(
        { label: `تحصیلات مورد ${number} را وارد کن`, complete: Boolean(qualification.education.trim()) },
        { label: `گواهی‌ها و دوره‌های مورد ${number} را اضافه کن`, complete: Boolean(qualification.certifications.trim()) },
      );
    });
    return items;
  }, [form]);
  const missingCompletionItems = completionItems.filter((item) => !item.complete);
  const completedFields = completionItems.length - missingCompletionItems.length;
  const completion = completionItems.length ? Math.round((completedFields / completionItems.length) * 100) : 0;

  const setResumeField = (field: keyof ResumeData) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, resumeData: { ...current.resumeData, [field]: event.target.value } }));
  };
  const setField = (field: keyof Omit<KnowledgeForm, "resumeData">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };
  const setExperienceField = (id: string, field: keyof Omit<KnowledgeExperience, "id">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === id ? { ...item, [field]: event.target.value } : item) }));
  };
  const setExperienceValue = (id: string, field: keyof Omit<KnowledgeExperience, "id">, value: string) => {
    setForm((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  };
  const setQualificationField = (id: string, field: keyof Omit<KnowledgeQualification, "id">) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, qualifications: current.qualifications.map((item) => item.id === id ? { ...item, [field]: event.target.value } : item) }));
  };
  const addExperience = () => {
    const experience = blankExperience();
    setForm((current) => ({ ...current, experiences: [...current.experiences, experience] }));
    setOpenExperienceId(experience.id);
  };
  const removeExperience = (id: string) => {
    setForm((current) => ({ ...current, experiences: current.experiences.filter((item) => item.id !== id) }));
    setOpenExperienceId((current) => current === id ? null : current);
  };

  const importResume = async (file: File) => {
    setImporting(true);
    setImportError("");
    setImportedFile("");
    try {
      const payload = new FormData();
      payload.append("resume", file);
      const response = await fetch("/api/knowledge/import", { method: "POST", body: payload });
      const result = await response.json() as ImportResult;
      if (!response.ok) throw new Error(result.error || "استخراج اطلاعات رزومه ناموفق بود.");

      setForm((current) => ({
        ...current,
        resumeData: { ...current.resumeData, ...result.resumeData },
        experiences: result.experiences?.length
          ? result.experiences.map((item) => normalizeExperience({ ...item, id: createRecordId("experience") }))
          : current.experiences,
        qualifications: result.qualifications?.length
          ? result.qualifications.map((item) => normalizeQualification({ ...item, id: createRecordId("qualification") }))
          : current.qualifications,
        skills: result.qualifications?.map((item) => item.skills).filter(Boolean).join("، ") || current.skills,
        languages: result.qualifications?.map((item) => item.languages).filter(Boolean).join("، ") || current.languages,
        careerGoals: result.careerGoals || current.careerGoals,
        preferredRoles: result.preferredRoles || current.preferredRoles,
        preferredIndustries: result.preferredIndustries || current.preferredIndustries,
        workPreferences: normalizeWorkMode(result.workPreferences) || current.workPreferences,
        interviewContext: result.interviewContext || current.interviewContext,
        interviewChallenges: result.interviewChallenges || current.interviewChallenges,
      }));
      scheduleFieldDirectionRefresh();
      setImportedFile(result.fileName || file.name);
      notify("اطلاعات رزومه استخراج و در فیلدها درج شد؛ موارد را بازبینی و ذخیره کن.");
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "استخراج اطلاعات رزومه ناموفق بود.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const save = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    try {
      const profileId = await getActiveProfileId();
      await knowledgeProfileStore.put({ id: profileId, ...form, resumeData: resume, createdAt: createdAt || now, updatedAt: now });
      const previousProfile = await userProfileStore.get(profileId);
      const profile: UserProfileRecord = {
        id: profileId,
        fullName: resume.fullName.trim(),
        targetTitle: resume.jobTitle.trim(),
        workMode: normalizeWorkMode(form.workPreferences) || previousProfile?.workMode || "",
        createdAt: previousProfile?.createdAt ?? now,
        updatedAt: now,
      };
      await userProfileStore.put(profile);
      setCreatedAt(createdAt || now);
      notify("پایگاه دانش ذخیره شد و برای ابزارهای رادیکار آماده است.");
    } catch {
      notify("ذخیره پایگاه دانش ناموفق بود.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="knowledge-skeleton"><div /><div /><div /></div>;

  return <>
    <SectionTitle eyebrow="منبع واحد اطلاعات حرفه‌ای" title="پایگاه دانش من" description="اطلاعاتت را یک‌بار کامل کن تا در ساخت رزومه، تطبیق شغلی و آمادگی مصاحبه از آن استفاده شود." />

    <div className="knowledge-overview">
      <div><BookOpenText size={23} /><span><strong>پروفایل حرفه‌ای تو</strong><small>همه اطلاعات فقط در مرورگر خودت نگهداری می‌شود.</small></span></div>
      <div className="knowledge-score-wrap" ref={completionDetailsRef}>
        <div className="knowledge-score"><span>{completion.toLocaleString("fa-IR")}٪ تکمیل</span><i><b style={{ width: `${completion}%` }} /></i></div>
        <button className="knowledge-score-trigger" type="button" aria-expanded={showCompletionDetails} onClick={() => setShowCompletionDetails((current) => !current)}>
          <CircleHelp size={14} /><span>راه‌های بهبود</span><ChevronDown size={13} />
        </button>
        {showCompletionDetails && <div className="knowledge-score-popover">
          <header>
            <span><Sparkles size={17} /></span>
            <div><strong>{missingCompletionItems.length ? "پروفایلت را کامل‌تر کن" : "پروفایل حرفه‌ای کامل"}</strong><small>{completion.toLocaleString("fa-IR")}٪ از اطلاعات پیشنهادی تکمیل شده</small></div>
            <b>{missingCompletionItems.length.toLocaleString("fa-IR")}</b>
          </header>
          <div className="knowledge-score-popover-body">
            {missingCompletionItems.length ? <>
              <p>موارد زیر را کامل کن تا رزومه و تمرین‌های مصاحبه دقیق‌تر و شخصی‌تر شوند.</p>
              <ul>{missingCompletionItems.map((item) => <li key={item.label}>{item.label}</li>)}</ul>
            </> : <div className="knowledge-score-complete"><CheckCircle2 size={18} /><span><strong>پروفایل کامل است</strong><small>همه اطلاعات پیشنهادی ثبت شده‌اند.</small></span></div>}
          </div>
          {missingCompletionItems.length > 0 && <footer>بعد از تکمیل موارد، دکمه «ذخیره اطلاعات» را بزن.</footer>}
        </div>}
      </div>
    </div>

    <section className="knowledge-import">
      <div className="knowledge-import-icon">{importing ? <LoaderCircle className="spin" size={24} /> : <FileUp size={24} />}</div>
      <div><h2>تکمیل خودکار با رزومه فعلی</h2><p>فایل PDF، DOCX یا TXT را بارگذاری کن تا اطلاعات تماس، تجربه‌ها، تحصیلات و مهارت‌ها استخراج و در فرم‌ها درج شوند.</p>{importedFile && <span className="knowledge-import-success"><CheckCircle2 size={14} /> اطلاعات «{importedFile}» آماده بازبینی است.</span>}{importError && <span className="knowledge-import-error">{importError}</span>}</div>
      <input ref={fileInputRef} className="visually-hidden" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importResume(file); }} />
      <button className="secondary-btn" disabled={importing} onClick={() => fileInputRef.current?.click()}><FileUp size={16} />{importing ? "در حال استخراج..." : "انتخاب فایل رزومه"}</button>
    </section>

    {importing ? <KnowledgeCardsSkeleton /> : <div className="knowledge-layout">
      <KnowledgeSection icon={<UserRound size={18} />} title="اطلاعات فردی و تماس" description="اطلاعات پایه‌ای که در سربرگ رزومه استفاده می‌شود.">
        <div className="field-pair"><Field label="نام و نام خانوادگی" value={resume.fullName} onChange={setResumeField("fullName")} /><Field label="عنوان حرفه‌ای" value={resume.jobTitle} onChange={setResumeField("jobTitle")} /></div>
        <div className="field-pair"><Field label="ایمیل" type="email" value={resume.email} onChange={setResumeField("email")} /><Field label="شماره تماس" value={resume.phone} onChange={setResumeField("phone")} /></div>
        <div className="field-pair"><Field label="محل سکونت" value={resume.location} onChange={setResumeField("location")} /><Field label="وب‌سایت یا لینکدین" value={resume.website} onChange={setResumeField("website")} /></div>
        <Field textarea label="درباره من" value={resume.summary} onChange={setResumeField("summary")} />
      </KnowledgeSection>

      <KnowledgeSection icon={<Settings2 size={18} />} title="اطلاعات عمومی" description="مهارت‌ها، زبان‌ها و شیوه همکاری ترجیحی تو.">
        <MultiSkillAutocomplete label="مهارت‌ها" value={form.skills} onChange={(skills) => setForm((current) => ({ ...current, skills }))} />
        <Field label="زبان‌ها" value={form.languages} onChange={setField("languages")} placeholder="مثلاً فارسی، انگلیسی، آلمانی" />
        <SelectField label="نحوه همکاری" value={form.workPreferences} onChange={(workPreferences) => setForm((current) => ({ ...current, workPreferences }))} options={[
          { value: "", label: "انتخاب کنید" },
          { value: "remote", label: "دورکاری" },
          { value: "hybrid", label: "هیبرید" },
          { value: "onsite", label: "حضوری" },
        ]} />
      </KnowledgeSection>

      <KnowledgeSection icon={<BriefcaseBusiness size={18} />} title="تجربه حرفه‌ای" description="همه تجربه‌ها، مسئولیت‌ها و دستاوردهای قابل ارائه." action={<button className="knowledge-add-button" onClick={addExperience}><Plus size={15} /> افزودن تجربه</button>}>
        <div className="knowledge-experience-list">
          {form.experiences.map((experience, index) => {
            const isOpen = openExperienceId === experience.id;
            return <article className={`knowledge-experience-accordion${isOpen ? " open" : ""}`} key={experience.id}>
              <button className="knowledge-experience-summary" type="button" aria-expanded={isOpen} aria-controls={`experience-${experience.id}`} onClick={() => setOpenExperienceId(isOpen ? null : experience.id)}>
                <span>
                  <strong>{experience.jobTitle.trim() || `تجربه ${String(index + 1).toLocaleString("fa-IR")}`}</strong>
                  <small>{experience.company.trim() || "نام شرکت ثبت نشده"}</small>
                </span>
                <ChevronDown size={17} aria-hidden="true" />
              </button>
              {isOpen && <div className="knowledge-experience-body" id={`experience-${experience.id}`}>
                <div className="knowledge-experience-actions"><span>ویرایش جزئیات تجربه</span><button disabled={form.experiences.length === 1} onClick={() => removeExperience(experience.id)} aria-label={`حذف تجربه ${String(index + 1).toLocaleString("fa-IR")}`}><Trash2 size={15} /> حذف</button></div>
                <div className="field-pair"><Field label="عنوان شغلی" value={experience.jobTitle} onChange={setExperienceField(experience.id, "jobTitle")} /><Field label="شرکت یا سازمان" value={experience.company} onChange={setExperienceField(experience.id, "company")} /></div>
                <Field label="کشور/استان" value={experience.location} onChange={setExperienceField(experience.id, "location")} />
                <div className="field-pair"><Field label="تاریخ شروع" value={experience.startDate} onChange={setExperienceField(experience.id, "startDate")} placeholder="مثلاً فروردین ۱۴۰۱" /><Field label="تاریخ پایان" value={experience.endDate} disabled={experience.isCurrent} onChange={setExperienceField(experience.id, "endDate")} placeholder={experience.isCurrent ? "تا امروز" : "مثلاً اسفند ۱۴۰۳"} /></div>
                <label className="knowledge-current-job"><input type="checkbox" checked={experience.isCurrent} onChange={(event) => setForm((current) => ({ ...current, experiences: current.experiences.map((item) => item.id === experience.id ? { ...item, isCurrent: event.target.checked, endDate: event.target.checked ? "" : item.endDate } : item) }))} /><span>همچنان در این موقعیت مشغول به کار هستم</span></label>
                <Field textarea label="شرح مسئولیت‌ها و نتایج" value={experience.description} onChange={setExperienceField(experience.id, "description")} placeholder="هر مورد را در یک خط بنویس." />
                <MultiSkillAutocomplete label="مهارت‌ها و تکنولوژی‌ها" value={experience.technologies} onChange={(value) => setExperienceValue(experience.id, "technologies", value)} />
              </div>}
            </article>;
          })}
        </div>
      </KnowledgeSection>

      <KnowledgeSection icon={<GraduationCap size={18} />} title="تحصیلات و مدارک" description="همه سوابق تحصیلی، گواهی‌ها و دوره‌های حرفه‌ای." action={<button className="knowledge-add-button" onClick={() => setForm((current) => ({ ...current, qualifications: [...current.qualifications, blankQualification()] }))}><Plus size={15} /> افزودن مورد</button>}>
        {form.qualifications.map((qualification, index) => <div className="knowledge-repeat-item" key={qualification.id}>
          <div className="knowledge-repeat-head"><strong>مورد {String(index + 1).toLocaleString("fa-IR")}</strong><button disabled={form.qualifications.length === 1} onClick={() => setForm((current) => ({ ...current, qualifications: current.qualifications.filter((item) => item.id !== qualification.id) }))} aria-label="حذف مورد"><Trash2 size={15} /> حذف</button></div>
          <Field label="تحصیلات" value={qualification.education} onChange={setQualificationField(qualification.id, "education")} />
          <Field textarea label="گواهی‌ها و دوره‌ها" value={qualification.certifications} onChange={setQualificationField(qualification.id, "certifications")} />
        </div>)}
      </KnowledgeSection>

      <KnowledgeSection icon={<Sparkles size={18} />} title="هدف شغلی و آمادگی مصاحبه" description="زمینه لازم برای شخصی‌سازی پیشنهادها و تمرین‌ها.">
        <Field textarea label="هدف شغلی" value={form.careerGoals} onChange={setField("careerGoals")} placeholder="در یک تا سه سال آینده می‌خواهی به چه جایگاهی برسی؟" />
        <div className="field-pair"><Field label="نقش‌های موردنظر" value={form.preferredRoles} onChange={setField("preferredRoles")} /><Field label="صنایع موردعلاقه" value={form.preferredIndustries} onChange={setField("preferredIndustries")} /></div>
        <Field textarea label="زمینه و تجربه مصاحبه" value={form.interviewContext} onChange={setField("interviewContext")} />
        <Field textarea label="چالش‌ها و نگرانی‌های مصاحبه" value={form.interviewChallenges} onChange={setField("interviewChallenges")} />
      </KnowledgeSection>
    </div>}

    <div className="knowledge-save-bar"><div><CheckCircle2 size={18} /><span>پس از ذخیره، ساخت رزومه جدید با این اطلاعات آغاز می‌شود.</span></div><button className="primary-btn" disabled={saving || importing} onClick={() => void save()}><Save size={16} /> ذخیره پایگاه دانش</button></div>
  </>;
}

function KnowledgeCardsSkeleton() {
  return <div className="knowledge-layout knowledge-cards-skeleton" aria-label="در حال استخراج اطلاعات رزومه" aria-busy="true">
    {[6, 9, 6, 7].map((fieldCount, cardIndex) => <section className="knowledge-card" key={cardIndex}>
      <header><span className="knowledge-shimmer-icon" /><div><i className="knowledge-shimmer-title" /><i className="knowledge-shimmer-description" /></div></header>
      <div className="knowledge-shimmer-fields">{Array.from({ length: fieldCount }, (_, fieldIndex) => <div className={fieldIndex >= fieldCount - 2 ? "multiline" : ""} key={fieldIndex}><i /><b /></div>)}</div>
    </section>)}
  </div>;
}

function KnowledgeSection({ icon, title, description, action, children }: { icon: ReactNode; title: string; description: string; action?: ReactNode; children: ReactNode }) {
  return <section className="knowledge-card"><header><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div>{action}</header><div className="knowledge-fields">{children}</div></section>;
}

type FieldProps = {
  label: string;
  textarea?: boolean;
  type?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

function Field({ label, textarea, type, value, placeholder, disabled, onChange }: FieldProps) {
  return <label className={textarea ? "knowledge-multiline-field" : undefined}>{label}{textarea
    ? <textarea value={value} placeholder={placeholder} onChange={onChange} />
    : <input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={onChange} />}</label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>;
}

function parseSkills(value: string) {
  return value.split(/[,،;؛\n]/).map((skill) => skill.trim()).filter(Boolean);
}

function MultiSkillAutocomplete({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedSkills = useMemo(() => parseSkills(value), [value]);
  const normalizedSelected = useMemo(() => new Set(selectedSkills.map((skill) => skill.toLocaleLowerCase())), [selectedSkills]);
  const suggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return skillSuggestions
      .filter((skill) => !normalizedSelected.has(skill.toLocaleLowerCase()))
      .filter((skill) => !normalizedQuery || skill.toLocaleLowerCase().includes(normalizedQuery))
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
    if (!skill || selectedSkills.length >= 100 || normalizedSelected.has(skill.toLocaleLowerCase())) {
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

  return <div className="knowledge-multi-skill-field" ref={rootRef}>
    <span className="knowledge-multi-skill-label">{label}<small>{selectedSkills.length.toLocaleString("fa-IR")} از ۱۰۰</small></span>
    <div className={`knowledge-skill-combobox${open ? " open" : ""}`} onClick={() => setOpen(true)}>
      {selectedSkills.map((skill) => <span className="knowledge-skill-chip" key={skill}>{skill}<button type="button" aria-label={`حذف ${skill}`} onClick={(event) => { event.stopPropagation(); remove(skill); }}><X size={11} /></button></span>)}
      <input
        value={query}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        placeholder={selectedSkills.length ? "مهارت بیشتر..." : "نام مهارت یا تکنولوژی را جست‌وجو کن"}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commit(suggestions[0] ?? query);
          } else if (event.key === "Backspace" && !query && selectedSkills.length) {
            remove(selectedSkills[selectedSkills.length - 1]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      />
    </div>
    {open && <div className="knowledge-skill-suggestions" id={listboxId} role="listbox">
      {suggestions.map((skill) => <button type="button" role="option" aria-selected="false" key={skill} onClick={() => commit(skill)}><Plus size={13} /><span>{skill}</span></button>)}
      {query.trim() && !normalizedSelected.has(query.trim().toLocaleLowerCase()) && !suggestions.some((skill) => skill.toLocaleLowerCase() === query.trim().toLocaleLowerCase()) &&
        <button className="custom-skill-option" type="button" role="option" aria-selected="false" onClick={() => commit(query)}><Plus size={13} /><span>افزودن «{query.trim()}»</span></button>}
      {!suggestions.length && !query.trim() && <p>مهارت دیگری برای پیشنهاد باقی نمانده است.</p>}
    </div>}
  </div>;
}
