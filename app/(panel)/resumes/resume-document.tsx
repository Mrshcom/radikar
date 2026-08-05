"use client";

import {
  BriefcaseBusiness,
  CircleUserRound,
  Globe2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import {
  getDefaultResumeColor,
  getResumeEducations,
  getResumeExperiences,
  type ResumeColorId,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
} from "./resume-data";
import { cn } from "@/lib/cn";
import { useRenderedResumePagination } from "./use-rendered-resume-pagination";

type ResumeDocumentProps = {
  templateId: string;
  data: ResumeData;
  compact?: boolean;
  colorId?: ResumeColorId;
  continuation?: boolean;
};

type ResumeTheme = {
  accent: string;
  accentText: string;
  header: string;
  headerText: string;
  side: string;
  sideText: string;
  avatar: string;
  rule: string;
};

const PERSIAN_SCRIPT_PATTERN = /\p{Script=Arabic}/gu;
const LATIN_SCRIPT_PATTERN = /\p{Script=Latin}/gu;
const LANGUAGE_FIELDS: Array<keyof ResumeData> = [
  "fullName",
  "jobTitle",
  "summary",
  "experienceTitle",
  "company",
  "experience",
  "education",
  "skills",
  "languages",
];
const resumeLabels = {
  fa: {
    about: "درباره من",
    contact: "اطلاعات تماس",
    education: "تحصیلات",
    experience: "سوابق حرفه‌ای",
    languages: "زبان‌ها",
    skills: "مهارت‌ها",
  },
  en: {
    about: "About Me",
    contact: "Contact Information",
    education: "Education",
    experience: "Professional Experience",
    languages: "Languages",
    skills: "Skills",
  },
} as const;

const colorPalettes: Record<
  ResumeColorId,
  {
    text: string;
    border: string;
    background: string;
    softBackground: string;
    dot: string;
  }
> = {
  mint: {
    text: "text-[#0c8767]",
    border: "border-[#42cfa5]",
    background: "bg-[#42ddb0]",
    softBackground: "bg-[#e8f8f2]",
    dot: "bg-[#42ddb0]",
  },
  yellow: {
    text: "text-[#0f7b62]",
    border: "border-[#0f7b62]",
    background: "bg-[#0f7b62]",
    softBackground: "bg-[#e5f3ed]",
    dot: "bg-[#0f7b62]",
  },
  cyan: {
    text: "text-[#147f95]",
    border: "border-[#65c7db]",
    background: "bg-[#78d8eb]",
    softBackground: "bg-[#e9f8fb]",
    dot: "bg-[#78d8eb]",
  },
  sand: {
    text: "text-[#9c6d20]",
    border: "border-[#dfae55]",
    background: "bg-[#f2c979]",
    softBackground: "bg-[#fff6e5]",
    dot: "bg-[#f2c979]",
  },
  gray: {
    text: "text-[#646966]",
    border: "border-[#bfc4c1]",
    background: "bg-[#d8d8d5]",
    softBackground: "bg-[#f2f3f2]",
    dot: "bg-[#bfc4c1]",
  },
  coral: {
    text: "text-[#cc5a60]",
    border: "border-[#e86f73]",
    background: "bg-[#e86f73]",
    softBackground: "bg-[#fff0f0]",
    dot: "bg-[#e86f73]",
  },
  blue: {
    text: "text-[#247fc1]",
    border: "border-[#278fdf]",
    background: "bg-[#278fdf]",
    softBackground: "bg-[#eaf5fd]",
    dot: "bg-[#278fdf]",
  },
  purple: {
    text: "text-[#6335a9]",
    border: "border-[#7140bd]",
    background: "bg-[#7140bd]",
    softBackground: "bg-[#f3edfb]",
    dot: "bg-[#7140bd]",
  },
  black: {
    text: "text-[#171717]",
    border: "border-[#171717]",
    background: "bg-[#171717]",
    softBackground: "bg-[#f1f1f1]",
    dot: "bg-[#171717]",
  },
};

const twoColumnTemplates = new Set([
  "navy",
  "tech",
  "two-professional",
  "two-clean",
  "two-corporate",
  "two-clear",
  "two-balanced",
  "two-essential",
  "two-polished",
  "two-harmonized",
  "two-defined",
  "two-industrial",
  "two-elegant",
  "two-modern",
  "two-creative",
  "two-visionary",
  "two-color-splash",
  "photo-creative",
  "organic-photographer",
  "sector-orange",
  "sector-yellow",
  "sector-turquoise",
  "sector-green",
]);

const themes: Record<string, ResumeTheme> = {
  default: {
    accent: "text-[#0f7b62]",
    accentText: "text-white",
    header: "bg-white",
    headerText: "text-[#19312f]",
    side: "bg-[#eef6f2]",
    sideText: "text-[#25433e]",
    avatar: "bg-[#bfe5d8] text-[#164b42]",
    rule: "border-[#86c9b4]",
  },
  ats: {
    accent: "text-[#243d3a]",
    accentText: "text-white",
    header: "bg-white",
    headerText: "text-[#19312f]",
    side: "bg-[#f7f8f6]",
    sideText: "text-[#314743]",
    avatar: "bg-[#e5e9e6] text-[#32443f]",
    rule: "border-[#b9c4c0]",
  },
  emerald: {
    accent: "text-[#0a8063]",
    accentText: "text-white",
    header: "bg-[#123c37]",
    headerText: "text-white",
    side: "bg-[#e1f3ec]",
    sideText: "text-[#174d43]",
    avatar: "bg-[#74d0b5] text-[#103f38]",
    rule: "border-[#69c6aa]",
  },
  classic: {
    accent: "text-[#7c5d3b]",
    accentText: "text-white",
    header: "bg-[#f8f4ec]",
    headerText: "text-[#443323]",
    side: "bg-[#f4eee3]",
    sideText: "text-[#513d2b]",
    avatar: "bg-[#d8c3a7] text-[#4f3925]",
    rule: "border-[#b69670]",
  },
  navy: {
    accent: "text-[#8ee0d0]",
    accentText: "text-white",
    header: "bg-[#243f50]",
    headerText: "text-white",
    side: "bg-[#243f50]",
    sideText: "text-white",
    avatar: "bg-[#a6e3d8] text-[#243f50]",
    rule: "border-[#84d8ca]",
  },
  creative: {
    accent: "text-[#d66755]",
    accentText: "text-white",
    header: "bg-[#fff4ef]",
    headerText: "text-[#55352e]",
    side: "bg-[#fde4dc]",
    sideText: "text-[#653b32]",
    avatar: "bg-[#ee9c86] text-white",
    rule: "border-[#e38772]",
  },
  executive: {
    accent: "text-[#91733e]",
    accentText: "text-white",
    header: "bg-[#202b2d]",
    headerText: "text-white",
    side: "bg-[#ede8dc]",
    sideText: "text-[#413a2f]",
    avatar: "bg-[#c3a96d] text-[#202b2d]",
    rule: "border-[#ad9257]",
  },
  academic: {
    accent: "text-[#496a87]",
    accentText: "text-white",
    header: "bg-[#edf3f8]",
    headerText: "text-[#29445b]",
    side: "bg-[#e7eff5]",
    sideText: "text-[#344f65]",
    avatar: "bg-[#9db9ce] text-[#243f55]",
    rule: "border-[#7fa5c0]",
  },
  global: {
    accent: "text-[#315d75]",
    accentText: "text-white",
    header: "bg-white",
    headerText: "text-[#243a45]",
    side: "bg-[#eef3f5]",
    sideText: "text-[#2f4b59]",
    avatar: "bg-[#bdd0d9] text-[#294554]",
    rule: "border-[#759cae]",
  },
  persian: {
    accent: "text-[#8b3f35]",
    accentText: "text-white",
    header: "bg-[#fbf3e8]",
    headerText: "text-[#4d3029]",
    side: "bg-[#f5e6d2]",
    sideText: "text-[#56362d]",
    avatar: "bg-[#c98974] text-white",
    rule: "border-[#b96e5c]",
  },
  "sector-orange": {
    accent: "text-[#f08a3c]",
    accentText: "text-white",
    header: "bg-[#303335]",
    headerText: "text-white",
    side: "bg-[#303335]",
    sideText: "text-white",
    avatar: "bg-[#f08a3c] text-white",
    rule: "border-[#f08a3c]",
  },
  "sector-yellow": {
    accent: "text-[#d9a900]",
    accentText: "text-[#25282a]",
    header: "bg-[#25282a]",
    headerText: "text-white",
    side: "bg-[#25282a]",
    sideText: "text-white",
    avatar: "bg-[#f1c928] text-[#25282a]",
    rule: "border-[#e0b720]",
  },
  "sector-turquoise": {
    accent: "text-[#148f98]",
    accentText: "text-white",
    header: "bg-[#13949d]",
    headerText: "text-white",
    side: "bg-[#dff4f3]",
    sideText: "text-[#19555a]",
    avatar: "bg-[#b5e7e4] text-[#125b60]",
    rule: "border-[#3eb2b8]",
  },
  "sector-green": {
    accent: "text-[#56a66d]",
    accentText: "text-white",
    header: "bg-[#213f35]",
    headerText: "text-white",
    side: "bg-[#e3f0e6]",
    sideText: "text-[#294e3b]",
    avatar: "bg-[#79bd8c] text-[#173528]",
    rule: "border-[#58a96f]",
  },
};

function getTheme(templateId: string): ResumeTheme {
  if (themes[templateId]) return themes[templateId];
  if (templateId.includes("modern"))
    return {
      ...themes.default,
      header: "bg-[#a63d42]",
      headerText: "text-white",
      side: "bg-[#f6e7e7]",
      rule: "border-[#bd5a5f]",
      accent: "text-[#a63d42]",
    };
  if (templateId.includes("industrial") || templateId.includes("corporate"))
    return {
      ...themes.navy,
      header: "bg-[#26373e]",
      side: "bg-[#26373e]",
      rule: "border-[#6eb3a4]",
    };
  if (
    templateId.includes("creative") ||
    templateId.includes("visionary") ||
    templateId.includes("color")
  )
    return themes.creative;
  if (
    templateId.includes("clean") ||
    templateId.includes("essential") ||
    templateId.includes("elegant")
  )
    return themes.ats;
  return themes.default;
}

function getResumePresentation(data: ResumeData) {
  const languageText = LANGUAGE_FIELDS.map((field) => data[field]).join("\n");
  const persianCharacters =
    languageText.match(PERSIAN_SCRIPT_PATTERN)?.length ?? 0;
  const latinCharacters = languageText.match(LATIN_SCRIPT_PATTERN)?.length ?? 0;
  const isPersian =
    persianCharacters === 0 && latinCharacters === 0
      ? true
      : persianCharacters >= latinCharacters;
  return {
    dir: isPersian ? ("rtl" as const) : ("ltr" as const),
    labels: isPersian ? resumeLabels.fa : resumeLabels.en,
  };
}

const LANGUAGE_SEPARATOR_PATTERN = /\r?\n|[|،,؛;]/;
const ENGLISH_PROFICIENCY_LABELS: Record<string, string> = {
  "مقدماتی": "Elementary proficiency",
  "توانایی کاری محدود": "Limited working proficiency",
  "توانایی کاری حرفه‌ای": "Professional working proficiency",
  "تسلط کامل حرفه‌ای": "Full professional proficiency",
  "زبان مادری یا دوزبانه": "Native or bilingual proficiency",
};

function getLanguageItems(
  languages: string,
  direction: "rtl" | "ltr" = "rtl",
) {
  return languages
    .split(LANGUAGE_SEPARATOR_PATTERN)
    .map((language) => language.trim())
    .filter(Boolean)
    .map((language) => {
      if (direction === "rtl") return language;
      return Object.entries(ENGLISH_PROFICIENCY_LABELS).reduce(
        (localized, [persian, english]) => localized.replace(persian, english),
        language,
      );
    });
}

function LanguageList({
  languages,
  direction,
  className,
}: {
  languages: string;
  direction: "rtl" | "ltr";
  className?: string;
}) {
  return (
    <ul className={cn("m-0 grid list-none gap-[.55em] p-0", className)}>
      {getLanguageItems(languages, direction).map((language, index) => (
        <li dir="auto" key={`${language}-${index}`}>
          {language}
        </li>
      ))}
    </ul>
  );
}

function formatDateRange(
  item: Pick<ResumeExperience | ResumeEducation, "startDate" | "endDate" | "isCurrent">,
  direction: "rtl" | "ltr",
) {
  const endDate = item.isCurrent
    ? direction === "ltr"
      ? "Present"
      : "امروز"
    : item.endDate;
  return [item.startDate, endDate].filter(Boolean).join(" – ");
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

function documentClass(compact: boolean | undefined) {
  return cn(
    "relative box-border aspect-[210/297] w-full overflow-hidden bg-white text-start text-[#31413e] shadow-[0_14px_45px_rgba(26,51,47,.12)]",
    compact
      ? "max-w-[300px] text-[4px] shadow-[0_8px_24px_rgba(26,51,47,.12)]"
      : "max-w-[720px] text-[10px]",
    "print:relative print:m-0 print:h-[297mm] print:min-h-[297mm] print:w-[210mm] print:max-w-none print:break-after-page print:shadow-none print:last:break-after-auto print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]",
  );
}

function ProfilePhoto({
  data,
  className,
}: {
  data: ResumeData;
  className: string;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full font-extrabold [&_img]:size-full [&_img]:object-cover",
        className,
      )}
    >
      {data.photoUrl ? (
        <Image
          src={data.photoUrl}
          alt={`تصویر ${data.fullName}`}
          width={240}
          height={240}
          unoptimized
        />
      ) : (
        getInitials(data.fullName)
      )}
    </div>
  );
}

function ContactDetails({
  data,
  className,
}: {
  data: ResumeData;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-[.7em] [&_span]:flex [&_span]:items-center [&_span]:gap-[.7em]",
        className,
      )}
    >
      {data.email && (
        <span>
          <Mail size="1.1em" />
          {data.email}
        </span>
      )}
      {data.phone && (
        <span>
          <Phone size="1.1em" />
          <bdi dir="ltr" className="text-left">
            {data.phone}
          </bdi>
        </span>
      )}
      {data.location && (
        <span>
          <MapPin size="1.1em" />
          {data.location}
        </span>
      )}
      {data.website && (
        <span>
          <Globe2 size="1.1em" />
          {data.website}
        </span>
      )}
    </div>
  );
}

function SectionHeading({
  children,
  theme,
}: {
  children: string;
  theme: ResumeTheme;
}) {
  return (
    <h2
      className={cn(
        "mb-[1.1em] border-b pb-[.55em] text-[1.25em] font-extrabold",
        theme.accent,
        theme.rule,
      )}
    >
      {children}
    </h2>
  );
}

function Experience({
  data,
  title,
  direction,
  theme,
  hideTitle = false,
}: {
  data: ResumeData;
  title: string;
  direction: "rtl" | "ltr";
  theme: ResumeTheme;
  hideTitle?: boolean;
}) {
  const experiences = getResumeExperiences(data);
  if (!experiences.length) return null;
  return (
    <section>
      {!hideTitle && <SectionHeading theme={theme}>{title}</SectionHeading>}
      <div className="grid gap-[2em]">
        {experiences.map((experience) => {
          const bullets = experience.description
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);
          return (
            <article key={experience.id}>
              <div className="mb-[1em] flex items-start justify-between gap-[1.5em]">
                <div>
                  <h3 className="m-0 text-[1.15em]">
                    {experience.jobTitle}
                  </h3>
                  <strong
                    className={cn(
                      "mt-[.35em] block text-[.9em]",
                      theme.accent,
                    )}
                  >
                    {[experience.company, experience.location]
                      .filter(Boolean)
                      .join("، ")}
                  </strong>
                </div>
                <time className="shrink-0 text-[.78em] text-[#758582]">
                  {formatDateRange(experience, direction)}
                </time>
              </div>
              <ul className="m-0 grid gap-[.55em] pr-[1.6em] text-[.88em] leading-[1.85]">
                {bullets.map((bullet, index) => (
                  <li key={`${experience.id}-${index}`}>{bullet}</li>
                ))}
              </ul>
              {experience.technologies && (
                <p
                  className={cn(
                    "mb-0 mt-[.8em] text-[.76em] leading-[1.7]",
                    theme.accent,
                  )}
                >
                  {experience.technologies}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function EducationEntries({
  data,
  direction,
  className,
}: {
  data: ResumeData;
  direction: "rtl" | "ltr";
  className?: string;
}) {
  return (
    <div className={cn("grid gap-[1.2em]", className)}>
      {getResumeEducations(data).map((education) => (
        <article key={education.id}>
          <strong className="block text-[.92em]">
            {education.credential}
          </strong>
          {education.institution && (
            <span className="mt-[.25em] block text-[.82em]">
              {education.institution}
            </span>
          )}
          {(education.startDate ||
            education.endDate ||
            education.isCurrent) && (
            <time className="mt-[.3em] block text-[.72em] text-[#758582]">
              {formatDateRange(education, direction)}
            </time>
          )}
        </article>
      ))}
    </div>
  );
}

function StandardResume({
  templateId,
  data,
  compact,
  continuation,
}: ResumeDocumentProps) {
  const theme = getTheme(templateId);
  const presentation = getResumePresentation(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  return (
    <article dir={presentation.dir} className={documentClass(compact)}>
      {!continuation && (
        <header
          className={cn(
            "flex min-h-[19%] items-center gap-[2em] px-[5%] py-[4%]",
            theme.header,
            theme.headerText,
          )}
        >
          <ProfilePhoto
            data={data}
            className={cn("size-[7.5em]", theme.avatar)}
          />
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[2.4em] leading-tight">
              {data.fullName || "\u00a0"}
            </h1>
            <p
              className={cn(
                "mb-0 mt-[.55em] text-[1.05em] font-bold",
                theme.headerText,
              )}
            >
              {data.jobTitle || "\u00a0"}
            </p>
          </div>
          <ContactDetails
            data={data}
            className="max-w-[35%] text-[.72em] leading-[1.5]"
          />
        </header>
      )}
      <div
        className={cn(
          "grid grid-cols-[31%_1fr]",
          continuation ? "min-h-full" : "min-h-[81%]",
        )}
      >
        <aside
          className={cn(
            "grid content-start gap-[3em] p-[11%]",
            theme.side,
            theme.sideText,
          )}
        >
          {skills.length > 0 && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.skills}
            </SectionHeading>
            <div className="flex flex-wrap gap-[.65em]">
              {skills.map((skill) => (
                <span
                  className="rounded-full border border-current/20 bg-white/55 px-[.8em] py-[.45em] text-[.78em]"
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>}
          {getResumeEducations(data).length > 0 && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.education}
            </SectionHeading>
            <EducationEntries
              data={data}
              direction={presentation.dir}
              className="text-[.82em] leading-[1.9]"
            />
          </section>}
          {data.languages && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.languages}
            </SectionHeading>
            <LanguageList
              languages={data.languages}
              direction={presentation.dir}
              className="text-[.82em] leading-[1.9]"
            />
          </section>}
        </aside>
        <main className="grid content-start gap-[3.2em] p-[6%]">
          {!continuation && data.summary && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.about}
            </SectionHeading>
            <p className="m-0 text-[.9em] leading-[2]">{data.summary}</p>
          </section>}
          <Experience
            data={data}
            title={presentation.labels.experience}
            direction={presentation.dir}
            theme={theme}
            hideTitle={continuation}
          />
        </main>
      </div>
    </article>
  );
}

function TwoColumnResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const baseTheme = getTheme(templateId);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const sectorDarkColor = ["black", "blue", "purple", "yellow"].includes(
    colorId || getDefaultResumeColor(templateId),
  );
  const theme =
    templateId === "sector-yellow"
      ? {
          ...baseTheme,
          accent: palette.text,
          avatar: palette.background,
          header: palette.background,
          headerText: sectorDarkColor ? "text-white" : "text-[#25282a]",
          rule: palette.border,
          side: palette.softBackground,
          sideText: "text-[#25282a]",
        }
      : baseTheme;
  const presentation = getResumePresentation(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        !continuation && "grid grid-rows-[20%_80%]",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-[1.2%]", theme.avatar)} />
      {!continuation && (
        <header
          className={cn(
            "flex h-full items-center gap-[2em] overflow-hidden px-[5%] py-[4%]",
            theme.header,
            theme.headerText,
          )}
        >
          <ProfilePhoto
            data={data}
            className={cn(
              "size-[8em] border-[.5em]",
              templateId === "sector-yellow"
                ? palette.border
                : "border-white/35",
              theme.avatar,
            )}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 className="m-0 line-clamp-2 text-[2.5em] leading-tight">
              {data.fullName || "\u00a0"}
            </h1>
            <p
              className={cn(
                "mb-0 mt-[.55em] truncate text-[1.05em] font-bold",
                theme.accent,
              )}
            >
              {data.jobTitle || "\u00a0"}
            </p>
          </div>
        </header>
      )}
      <div className="grid h-full grid-cols-[34%_1fr] overflow-hidden">
        <aside
          className={cn(
            "grid min-h-0 content-start gap-[3em] overflow-hidden p-[12%]",
            theme.side,
            theme.sideText,
          )}
        >
          {!continuation && (
            <section>
              <SectionHeading theme={theme}>
                {presentation.labels.contact}
              </SectionHeading>
              <ContactDetails
                data={data}
                className="break-all text-[.76em] leading-[1.65]"
              />
            </section>
          )}
          {skills.length > 0 && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.skills}
            </SectionHeading>
            <div className="grid gap-[1em]">
              {skills.map((skill, index) => (
                <div className="grid gap-[.4em]" key={skill}>
                  <span className="text-[.78em]">{skill}</span>
                  <i className="h-[.35em] overflow-hidden rounded-full bg-current/15">
                    <b
                      className={cn(
                        "block h-full rounded-full bg-current",
                        index % 4 === 0
                          ? "w-full"
                          : index % 4 === 1
                            ? "w-4/5"
                            : index % 4 === 2
                              ? "w-3/5"
                              : "w-2/5",
                      )}
                    />
                  </i>
                </div>
              ))}
            </div>
          </section>}
          {data.languages && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.languages}
            </SectionHeading>
            <LanguageList
              languages={data.languages}
              direction={presentation.dir}
              className="text-[.82em] leading-[1.9]"
            />
          </section>}
        </aside>
        <main className="grid min-h-0 content-start gap-[3em] overflow-hidden p-[7%]">
          {!continuation && data.summary && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.about}
            </SectionHeading>
            <p className="m-0 text-[.9em] leading-[2]">{data.summary}</p>
          </section>}
          <Experience
            data={data}
            title={presentation.labels.experience}
            direction={presentation.dir}
            theme={theme}
            hideTitle={continuation}
          />
          {getResumeEducations(data).length > 0 && <section>
            <SectionHeading theme={theme}>
              {presentation.labels.education}
            </SectionHeading>
            <EducationEntries
              data={data}
              direction={presentation.dir}
              className="text-[.86em] leading-[1.9]"
            />
          </section>}
        </main>
      </div>
    </article>
  );
}

function OneColumnResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const theme = {
    ...themes.ats,
    accent: palette.text,
    rule: palette.border,
  };
  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        !continuation && "grid grid-rows-[22%_78%]",
      )}
    >
      <div
        className={cn("absolute inset-x-0 top-0 h-[1%]", palette.background)}
      />
      {!continuation && (
        <header className="flex h-full items-center gap-[2.4em] border-b border-[#dce5df] px-[7%] py-[4.5%]">
          <ProfilePhoto
            data={data}
            className={cn(
              "size-[8.5em] border-[.45em]",
              palette.border,
              palette.softBackground,
              palette.text,
            )}
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 className="m-0 line-clamp-2 text-[2.7em] leading-tight text-[#19312f]">
              {data.fullName || "\u00a0"}
            </h1>
            <p
              className={cn(
                "mb-0 mt-[.7em] truncate text-[1.1em] font-bold",
                palette.text,
              )}
            >
              {data.jobTitle || "\u00a0"}
            </p>
          </div>
          <ContactDetails
            data={data}
            className="max-w-[34%] break-all text-[.72em] leading-[1.55] text-[#60716e]"
          />
        </header>
      )}
      <main className="grid h-full content-start gap-[2.7em] overflow-hidden px-[7%] py-[5%]">
        {!continuation && data.summary && (
          <section>
            <SectionHeading theme={theme}>
              {presentation.labels.about}
            </SectionHeading>
            <p className="m-0 text-[.9em] leading-[2]">{data.summary}</p>
          </section>
        )}
        <Experience
          data={data}
          title={presentation.labels.experience}
          direction={presentation.dir}
          theme={theme}
          hideTitle={continuation}
        />
        {getResumeEducations(data).length > 0 && (
          <section>
            <SectionHeading theme={theme}>
              {presentation.labels.education}
            </SectionHeading>
            <EducationEntries
              data={data}
              direction={presentation.dir}
              className="text-[.86em] leading-[1.9]"
            />
          </section>
        )}
        {skills.length > 0 && (
          <section>
            <SectionHeading theme={theme}>
              {presentation.labels.skills}
            </SectionHeading>
            <div className="flex flex-wrap gap-[.7em]">
              {skills.map((skill) => (
                <span
                  className={cn(
                    "rounded-full border px-[1em] py-[.5em] text-[.78em]",
                    palette.border,
                    palette.softBackground,
                  )}
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
        {data.languages && (
          <section>
            <SectionHeading theme={theme}>
              {presentation.labels.languages}
            </SectionHeading>
            <LanguageList
              languages={data.languages}
              direction={presentation.dir}
              className="text-[.82em] leading-[1.9]"
            />
          </section>
        )}
      </main>
    </article>
  );
}

function TimelineClassicResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const experiences = getResumeExperiences(data);
  return (
    <article
      dir={presentation.dir}
      className={cn(documentClass(compact), "px-[7%] py-[5%] text-[#303532]")}
    >
      {!continuation && (
        <header className="grid justify-items-center text-center">
          <ProfilePhoto
            data={data}
            className={cn(
              "size-[8em] rounded-[1.1em] border-[.45em]",
              palette.border,
              palette.softBackground,
            )}
          />
          <h1 className="mb-0 mt-[.7em] text-[2.8em] leading-tight">
            {data.fullName || "\u00a0"}
          </h1>
          <p className="mb-0 mt-[.55em] text-[.82em] text-[#747b77]">
            {[data.jobTitle, data.location].filter(Boolean).join("  |  ")}
            {data.phone && (
              <>
                {data.jobTitle || data.location ? "  |  " : ""}
                <bdi dir="ltr">{data.phone}</bdi>
              </>
            )}
          </p>
        </header>
      )}
      <div
        className={cn(
          "grid grid-cols-[27%_1fr] gap-[5%]",
          continuation ? "mt-0" : "mt-[5em]",
        )}
      >
        <aside
          className={cn(
            "grid content-start gap-[3.4em] border-[#d9ddda]",
            presentation.dir === "rtl"
              ? "border-l pl-[10%]"
              : "border-r pr-[10%]",
          )}
        >
          {!continuation && (
            <section>
              <h2 className="m-0 flex items-center gap-[.7em] text-[1em] tracking-[.12em]">
                <CircleUserRound size="1.25em" />
                {presentation.labels.contact}
              </h2>
              <ContactDetails
                data={data}
                className="mt-[1.5em] break-all text-[.76em] leading-[1.8]"
              />
            </section>
          )}
          {skills.length > 0 && <section>
            <h2 className="m-0 text-[1em] tracking-[.12em]">
              {presentation.labels.skills}
            </h2>
            <div className="mt-[1.5em] grid gap-[1.2em]">
              {skills.map((skill, index) => (
                <div className="grid gap-[.45em]" key={skill}>
                  <span className="text-[.8em]">{skill}</span>
                  <i className="h-[.25em] bg-[#e4e7e5]">
                    <b
                      className={cn(
                        "block h-full",
                        palette.background,
                        index % 3 === 0
                          ? "w-full"
                          : index % 3 === 1
                            ? "w-4/5"
                            : "w-3/5",
                      )}
                    />
                  </i>
                </div>
              ))}
            </div>
          </section>}
          {data.languages && (
            <section>
              <h2 className="m-0 text-[1em] tracking-[.12em]">
                {presentation.labels.languages}
              </h2>
              <LanguageList
                languages={data.languages}
                direction={presentation.dir}
                className="mt-[1.4em] text-[.78em] leading-[1.9]"
              />
            </section>
          )}
        </aside>
        <main className="grid content-start gap-[3.2em]">
          {!continuation && data.summary && <section>
            <h2
              className={cn(
                "m-0 flex items-center gap-[.7em] text-[1.05em] tracking-[.1em]",
                palette.text,
              )}
            >
              <CircleUserRound size="1.3em" />
              {presentation.labels.about}
            </h2>
            <p className="mb-0 mt-[1.3em] text-[.84em] leading-[1.95]">
              {data.summary}
            </p>
          </section>}
          {experiences.length > 0 && <section>
            {!continuation && <h2
              className={cn(
                "m-0 flex items-center gap-[.7em] text-[1.05em] tracking-[.1em]",
                palette.text,
              )}
            >
              <BriefcaseBusiness size="1.3em" />
              {presentation.labels.experience}
            </h2>}
            <div className="mt-[1.5em] grid gap-[1.8em]">
              {experiences.map((experience) => (
                <article
                  className={cn(
                    "relative",
                    presentation.dir === "rtl"
                      ? "border-r pr-[2em]"
                      : "border-l pl-[2em]",
                    palette.border,
                  )}
                  key={experience.id}
                >
                  <i
                    className={cn(
                      "absolute top-[.3em] size-[.8em] rounded-full border-[.2em] border-white",
                      presentation.dir === "rtl"
                        ? "-right-[.45em]"
                        : "-left-[.45em]",
                      palette.dot,
                    )}
                  />
                  <div className="flex items-start justify-between gap-[1em]">
                    <div>
                      <h3 className="m-0 text-[1.05em]">
                        {experience.jobTitle}
                      </h3>
                      <strong
                        className={cn(
                          "mt-[.35em] block text-[.82em]",
                          palette.text,
                        )}
                      >
                        {[experience.company, experience.location]
                          .filter(Boolean)
                          .join("، ")}
                      </strong>
                    </div>
                    <time className="shrink-0 text-[.72em] text-[#89918d]">
                      {formatDateRange(experience, presentation.dir)}
                    </time>
                  </div>
                  <ul
                    className={cn(
                      "mb-0 mt-[1.2em] grid gap-[.55em] text-[.8em] leading-[1.8]",
                      presentation.dir === "rtl"
                        ? "pr-[1.4em]"
                        : "pl-[1.4em]",
                    )}
                  >
                    {experience.description
                      .split("\n")
                      .map((bullet) => bullet.trim())
                      .filter(Boolean)
                      .map((bullet, index) => (
                        <li key={`${experience.id}-${index}`}>{bullet}</li>
                      ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>}
          {getResumeEducations(data).length > 0 && (
            <section>
            <h2
              className={cn(
                "m-0 flex items-center gap-[.7em] text-[1.05em] tracking-[.1em]",
                palette.text,
              )}
            >
              <GraduationCap size="1.3em" />
              {presentation.labels.education}
            </h2>
            <EducationEntries
              data={data}
              direction={presentation.dir}
              className="mt-[1.3em] text-[.84em] leading-[1.9]"
            />
            </section>
          )}
        </main>
      </div>
    </article>
  );
}

function OrangeLineHeading({
  children,
  palette,
}: {
  children: string;
  palette: (typeof colorPalettes)[ResumeColorId];
}) {
  return (
    <div className={cn("flex items-center gap-[2em]", palette.text)}>
      <h2 className="m-0 shrink-0 text-[1.45em] font-bold">{children}</h2>
      <i className={cn("h-[.3em] flex-1", palette.background)} aria-hidden="true" />
    </div>
  );
}

function OrangePillResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const labels =
    presentation.dir === "ltr"
      ? { experience: "Professional Experience" }
      : { experience: "سوابق حرفه‌ای" };

  return (
    <article
      dir={presentation.dir}
      className={cn(documentClass(compact), "px-[3.5%] text-[#151515]")}
    >
      {!continuation && (
        <header
          className={cn(
            "-mr-[3.65%] mt-[8%] flex h-[6.5%] items-center justify-between gap-[3em] rounded-l-full px-[8%] text-white",
            palette.background,
          )}
        >
          <h1 className="m-0 truncate text-[2.25em] font-bold">
            {data.fullName || "\u00a0"}
          </h1>
          <div className="grid shrink-0 grid-cols-2 gap-x-[1.6em] gap-y-[.35em] text-[.68em] leading-[1.35]">
            <span className="col-span-2">{data.location}</span>
            <span>
              <bdi dir="ltr" className="text-left">
                {data.phone}
              </bdi>
            </span>
            <span>{data.email}</span>
          </div>
        </header>
      )}
      <main
        className={cn(
          "grid content-start gap-[2.5em] px-[8%] pb-[7%]",
          continuation ? "h-full pt-[7%]" : "pt-[4%]",
        )}
      >
        {!continuation && data.summary && (
          <p className="m-0 text-[.85em] font-semibold leading-[1.35]">
            {data.summary}
          </p>
        )}
        {experiences.length > 0 && (
          <section>
            {!continuation && (
              <OrangeLineHeading palette={palette}>{labels.experience}</OrangeLineHeading>
            )}
            <div
              className={cn(
                "grid gap-[1.35em]",
                !continuation && "mt-[1.25em]",
              )}
            >
              {experiences.map((experience) => {
                const bullets = experience.description
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean);
                return (
                  <article key={experience.id}>
                    <h3 className="m-0 text-[.9em] font-bold">
                      {experience.jobTitle}
                    </h3>
                    <div className="mt-[.25em] flex items-start justify-between gap-[2em] text-[.72em] italic">
                      <span>
                        {[experience.company, experience.location]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      <time className="shrink-0">
                        {formatDateRange(experience, presentation.dir)}
                      </time>
                    </div>
                    <ul
                      className={cn(
                        "mb-0 mt-[.55em] grid gap-[.3em] text-[.72em] leading-[1.45] marker:text-current",
                        presentation.dir === "rtl"
                          ? "pr-[1.7em]"
                          : "pl-[1.7em]",
                      )}
                    >
                      {bullets.map((bullet, index) => (
                        <li key={`${experience.id}-${index}`}>{bullet}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {educations.length > 0 && (
          <section>
            <OrangeLineHeading palette={palette}>
              {presentation.labels.education}
            </OrangeLineHeading>
            <EducationEntries
              data={data}
              direction={presentation.dir}
              className="mt-[1.2em] text-[.76em] leading-[1.45]"
            />
          </section>
        )}
        {data.languages && (
          <section>
            <OrangeLineHeading palette={palette}>
              {presentation.labels.languages}
            </OrangeLineHeading>
            <LanguageList
              languages={data.languages}
              direction={presentation.dir}
              className="mt-[1.1em] grid-cols-2 gap-x-[3em] text-[.74em] leading-[1.45]"
            />
          </section>
        )}
        {skills.length > 0 && (
          <section>
            <OrangeLineHeading palette={palette}>{presentation.labels.skills}</OrangeLineHeading>
            <ul
              className={cn(
                "mb-0 mt-[1.1em] grid grid-cols-2 gap-x-[4em] gap-y-[.45em] text-[.74em] leading-[1.45] marker:text-current",
                presentation.dir === "rtl" ? "pr-[1.7em]" : "pl-[1.7em]",
              )}
            >
              {skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </article>
  );
}

function RedAdministrativeResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const sectionLabels =
    presentation.dir === "ltr"
      ? { profile: "Profile", experience: "Employment History" }
      : { profile: "پروفایل", experience: "سوابق شغلی" };

  return (
    <article
      dir={presentation.dir}
      className={cn(documentClass(compact), "text-[#171717]")}
    >
      {!continuation && (
        <>
          <header className={cn("flex h-[14.5%] items-center gap-[2.2em] px-[7%] text-white", palette.background)}>
            <ProfilePhoto
              data={data}
              className="size-[7.2em] bg-white/20 text-white"
            />
            <div className="min-w-0">
              <h1 className="m-0 text-[3em] font-extrabold italic leading-none">
                {data.fullName || "\u00a0"}
              </h1>
              <p className="mb-0 mt-[1em] text-[.72em] font-semibold uppercase tracking-[.28em] text-white/85">
                {data.jobTitle || "\u00a0"}
              </p>
            </div>
          </header>
          <div className="grid h-[6%] grid-cols-3 items-center gap-[2em] border-b border-[#e4e4e4] px-[7%] text-[.62em] text-[#252525]">
            <span className="flex min-w-0 items-center gap-[.7em] truncate">
              <Mail className={cn("shrink-0", palette.text)} size="1.15em" />
              {data.email}
            </span>
            <span className="flex min-w-0 items-center gap-[.7em] truncate">
              <MapPin className={cn("shrink-0", palette.text)} size="1.15em" />
              {data.location}
            </span>
            <span className="flex min-w-0 items-center gap-[.7em] truncate">
              <Phone className={cn("shrink-0", palette.text)} size="1.15em" />
              <bdi dir="ltr" className="text-left">
                {data.phone}
              </bdi>
            </span>
          </div>
        </>
      )}
      <div
        className={cn(
          "grid grid-cols-[72%_28%] px-[7%] pb-[6%]",
          continuation ? "h-full pt-[6%]" : "h-[79.5%] pt-[3.2%]",
        )}
      >
        <main
          className={cn(
            "grid content-start gap-[2.4em]",
            presentation.dir === "rtl" ? "pl-[6%]" : "pr-[6%]",
          )}
        >
          {!continuation && data.summary && (
            <section>
              <h2 className="m-0 text-[1.3em] font-extrabold italic">
                {sectionLabels.profile}
              </h2>
              <p className="mb-0 mt-[.8em] text-[.82em] leading-[1.75]">
                {data.summary}
              </p>
            </section>
          )}
          {experiences.length > 0 && (
            <section>
              {!continuation && (
                <h2 className="m-0 text-[1.3em] font-extrabold italic">
                  {sectionLabels.experience}
                </h2>
              )}
              <div
                className={cn(
                  "grid gap-[1.55em]",
                  !continuation && "mt-[.8em]",
                )}
              >
                {experiences.map((experience) => {
                  const bullets = experience.description
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean);
                  return (
                    <article key={experience.id}>
                      <h3 className="m-0 text-[.98em] font-semibold">
                        {[experience.jobTitle, experience.company, experience.location]
                          .filter(Boolean)
                          .join(", ")}
                      </h3>
                      <time className="mt-[.3em] block text-[.62em] italic text-[#9a9a9a]">
                        {formatDateRange(experience, presentation.dir)}
                      </time>
                      <ul
                        className={cn(
                          "mb-0 mt-[.6em] grid gap-[.3em] text-[.76em] leading-[1.55]",
                          presentation.dir === "rtl"
                            ? "pr-[1.55em]"
                            : "pl-[1.55em]",
                        )}
                      >
                        {bullets.map((bullet, index) => (
                          <li key={`${experience.id}-${index}`}>{bullet}</li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </main>
        <aside
          className={cn(
            "grid content-start gap-[3em] border-[#dfdfdf]",
            presentation.dir === "rtl"
              ? "border-r pr-[14%]"
              : "border-l pl-[14%]",
          )}
        >
          {skills.length > 0 && (
            <section>
              <h2 className="m-0 text-[1.25em] font-extrabold italic">
                {presentation.labels.skills}
              </h2>
              <div className="mt-[1em] grid gap-[1em]">
                {skills.map((skill, index) => (
                  <div className="grid gap-[.45em]" key={skill}>
                    <span className="text-[.76em] leading-[1.35]">{skill}</span>
                    <i className="flex h-[.38em] gap-[.22em]" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, barIndex) => (
                        <b
                          className={cn(
                            "h-full flex-1 -skew-x-[18deg]",
                            barIndex < 5 - (index % 3)
                              ? palette.background
                              : "bg-[#eeeeee]",
                          )}
                          key={barIndex}
                        />
                      ))}
                    </i>
                  </div>
                ))}
              </div>
            </section>
          )}
          {educations.length > 0 && (
            <section>
              <h2 className="m-0 text-[1.25em] font-extrabold italic">
                {presentation.labels.education}
              </h2>
              <EducationEntries
                data={data}
                direction={presentation.dir}
                className="mt-[1em] text-[.78em] leading-[1.6]"
              />
            </section>
          )}
          {data.languages && (
            <section>
              <h2 className="m-0 text-[1.25em] font-extrabold italic">
                {presentation.labels.languages}
              </h2>
              <LanguageList
                languages={data.languages}
                direction={presentation.dir}
                className="mt-[1em] text-[.76em] leading-[1.7]"
              />
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}

function BannerModernResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  return (
    <article
      dir={presentation.dir}
      className={cn(documentClass(compact), "p-[6%] text-[#28322f]")}
    >
      {!continuation && (
        <header className="grid h-[20%] grid-cols-[26%_1fr] overflow-hidden">
          <div className="overflow-hidden bg-[#e9eeeb]">
            {data.photoUrl ? (
              <Image
                className="size-full object-cover"
                src={data.photoUrl}
                alt={`تصویر ${data.fullName}`}
                width={300}
                height={300}
                unoptimized
              />
            ) : (
              <span className="grid size-full place-items-center text-[2em] font-extrabold text-[#63706c]">
                {getInitials(data.fullName)}
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex min-w-0 flex-col justify-center px-[8%] text-white",
              palette.background,
            )}
          >
            <h1 className="m-0 line-clamp-2 text-[2.7em] leading-tight">
              {data.fullName || "\u00a0"}
            </h1>
            <p className="mb-0 mt-[.5em] text-[1.15em]">
              {data.jobTitle}
            </p>
            <ContactDetails
              data={data}
              className="mt-[2em] grid-cols-2 text-[.7em]"
            />
          </div>
        </header>
      )}
      <div
        className={cn(
          "grid grid-cols-[25%_1fr] gap-[6%]",
          continuation ? "mt-0" : "mt-[4em]",
        )}
      >
        <aside className="grid content-start gap-[3em]">
          {skills.length > 0 && (
            <section>
            <h2 className={cn("m-0 text-[1.1em]", palette.text)}>
              {presentation.labels.skills}
            </h2>
            <div className="mt-[1.3em] grid gap-[1em]">
              {skills.map((skill, index) => (
                <div className="grid gap-[.35em]" key={skill}>
                  <span className="text-[.8em]">{skill}</span>
                  <i className="flex gap-[.25em]">
                    {Array.from({ length: 5 }, (_, dotIndex) => (
                      <b
                        className={cn(
                          "h-[.28em] flex-1 rounded-full",
                          dotIndex <= 4 - (index % 3)
                            ? palette.dot
                            : "bg-[#dce1de]",
                        )}
                        key={dotIndex}
                      />
                    ))}
                  </i>
                </div>
              ))}
            </div>
            </section>
          )}
          {data.languages && (
            <section>
              <h2 className={cn("m-0 text-[1.1em]", palette.text)}>
                {presentation.labels.languages}
              </h2>
              <LanguageList
                languages={data.languages}
                direction={presentation.dir}
                className="mt-[1.2em] text-[.8em] leading-[1.9]"
              />
            </section>
          )}
        </aside>
        <main className="grid content-start gap-[3em]">
          {!continuation && data.summary && (
            <section>
            <h2 className={cn("m-0 text-[1.35em]", palette.text)}>
              {presentation.labels.about}
            </h2>
            <p className="mb-0 mt-[1em] text-[.86em] leading-[1.9]">
              {data.summary}
            </p>
            </section>
          )}
          <Experience
            data={data}
            title={presentation.labels.experience}
            direction={presentation.dir}
            theme={{
              ...themes.ats,
              accent: palette.text,
              rule: palette.border,
            }}
            hideTitle={continuation}
          />
          {getResumeEducations(data).length > 0 && (
            <section>
            <h2 className={cn("m-0 text-[1.35em]", palette.text)}>
              {presentation.labels.education}
            </h2>
            <EducationEntries
              data={data}
              direction={presentation.dir}
              className="mt-[1em] text-[.86em] leading-[1.9]"
            />
            </section>
          )}
        </main>
      </div>
    </article>
  );
}

function EditorialSidebarResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const experiences = getResumeExperiences(data);
  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        "grid grid-cols-[1fr_26%] gap-[5%] px-[7%] py-[5.5%] text-[#333936]",
      )}
    >
      <main className="grid content-start gap-[3.2em]">
        {!continuation && (
          <header className="flex items-center gap-[2em]">
            <ProfilePhoto
              data={data}
              className={cn(
                "size-[8em] border-[.4em]",
                palette.border,
                palette.softBackground,
              )}
            />
            <div className="min-w-0">
              <h1 className="m-0 line-clamp-2 text-[2.5em] leading-tight">
                {data.fullName || "\u00a0"}
              </h1>
              <p className={cn("mb-0 mt-[.5em] text-[1em]", palette.text)}>
                {data.jobTitle}
              </p>
              <ContactDetails
                data={data}
                className="mt-[1.2em] grid-cols-2 text-[.65em] text-[#737c78]"
              />
            </div>
          </header>
        )}
        {!continuation && data.summary && (
          <section>
            <h2 className={cn("m-0 text-[1.25em]", palette.text)}>
              {presentation.labels.about}
            </h2>
            <p className="mb-0 mt-[1em] text-[.84em] leading-[1.95]">
              {data.summary}
            </p>
          </section>
        )}
        {experiences.length > 0 && <section>
          {!continuation && <h2 className={cn("m-0 text-[1.25em]", palette.text)}>
            {presentation.labels.experience}
          </h2>}
          <div className="mt-[1.4em] grid gap-[1.8em]">
            {experiences.map((experience) => (
              <article
                className="grid grid-cols-[24%_1fr] gap-[4%]"
                key={experience.id}
              >
                <time className={cn("text-[.74em]", palette.text)}>
                  {formatDateRange(experience, presentation.dir)}
                </time>
                <div>
                  <h3 className="m-0 text-[1.05em]">
                    {experience.jobTitle}
                  </h3>
                  <strong className="mt-[.4em] block text-[.8em] text-[#737c78]">
                    {[experience.company, experience.location]
                      .filter(Boolean)
                      .join("، ")}
                  </strong>
                  <ul className="mb-0 mt-[1em] grid gap-[.45em] pr-[1.3em] text-[.78em] leading-[1.8]">
                    {experience.description
                      .split("\n")
                      .map((bullet) => bullet.trim())
                      .filter(Boolean)
                      .map((bullet, index) => (
                        <li key={`${experience.id}-${index}`}>{bullet}</li>
                      ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>}
        {getResumeEducations(data).length > 0 && (
          <section>
          <h2 className={cn("m-0 text-[1.25em]", palette.text)}>
            {presentation.labels.education}
          </h2>
          <EducationEntries
            data={data}
            direction={presentation.dir}
            className="mt-[1em] text-[.84em] leading-[1.9]"
          />
          </section>
        )}
      </main>
      <aside className="grid content-start gap-[3em]">
        {skills.length > 0 && (
          <section>
          <h2 className={cn("m-0 text-[1.15em]", palette.text)}>
            {presentation.labels.skills}
          </h2>
          <div className="mt-[1.4em] grid gap-[1.3em]">
            {skills.map((skill, index) => (
              <div className="grid gap-[.45em]" key={skill}>
                <span className="text-[.8em]">{skill}</span>
                <span className="flex gap-[.35em]">
                  {Array.from({ length: 8 }, (_, dotIndex) => (
                    <i
                      className={cn(
                        "size-[.45em] rounded-full",
                        dotIndex < 8 - (index % 4)
                          ? palette.dot
                          : "bg-[#dfe3e1]",
                      )}
                      key={dotIndex}
                    />
                  ))}
                </span>
              </div>
            ))}
          </div>
          </section>
        )}
        {data.languages && (
          <section>
            <h2 className={cn("m-0 text-[1.15em]", palette.text)}>
              {presentation.labels.languages}
            </h2>
            <LanguageList
              languages={data.languages}
              direction={presentation.dir}
              className="mt-[1.2em] text-[.78em] leading-[1.9]"
            />
          </section>
        )}
      </aside>
    </article>
  );
}

export function ResumeDocumentPage(props: ResumeDocumentProps) {
  if (props.templateId === "timeline-classic")
    return <TimelineClassicResume {...props} />;
  if (props.templateId === "banner-modern")
    return <BannerModernResume {...props} />;
  if (props.templateId === "red-administrative")
    return <RedAdministrativeResume {...props} />;
  if (props.templateId === "orange-pill")
    return <OrangePillResume {...props} />;
  if (props.templateId === "editorial-sidebar")
    return <EditorialSidebarResume {...props} />;
  if (props.templateId === "simple-one-column")
    return <OneColumnResume {...props} />;
  return twoColumnTemplates.has(props.templateId) ? (
    <TwoColumnResume {...props} />
  ) : (
    <StandardResume {...props} />
  );
}

export function ResumeDocument({
  onPaginationReady,
  ...props
}: ResumeDocumentProps & { onPaginationReady?: () => void }) {
  const { candidate, pages, probeRef } = useRenderedResumePagination(
    props.data,
    props.templateId,
  );

  useEffect(() => {
    if (!candidate) onPaginationReady?.();
  }, [candidate, onPaginationReady]);

  return (
    <>
      <div className="grid w-full gap-5 print:block">
        {pages.map((pageData, index) => (
          <ResumeDocumentPage
            {...props}
            data={pageData}
            continuation={index > 0}
            key={`${props.templateId}-${index}`}
          />
        ))}
      </div>
      {candidate && (
        <div
          ref={probeRef}
          className="invisible fixed top-0 left-[-10000px] w-[720px] pointer-events-none print:hidden"
          data-resume-pagination-probe
        >
          <ResumeDocumentPage
            {...props}
            data={candidate.page}
            continuation={candidate.boundary > 0}
            key={candidate.key}
          />
        </div>
      )}
    </>
  );
}
