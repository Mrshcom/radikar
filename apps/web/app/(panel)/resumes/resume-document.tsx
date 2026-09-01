"use client";

import {
  BriefcaseBusiness,
  CircleUserRound,
  Code2,
  Globe2,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Puzzle,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, type ReactNode, type SVGProps } from "react";
import {
  getDefaultResumeColor,
  getResumeEducations,
  getResumeExperiences,
  getResumeProjects,
  type ResumeColorId,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeProject,
} from "./resume-data";
import { cn } from "@/lib/cn";
import { useRenderedResumePagination } from "./use-rendered-resume-pagination";
import {
  ResumePaginationProbe,
  ResumePrintPage,
} from "./resume-pagination-components";
import { normalizeResumeDataInput } from "@/lib/resume-input";
import { sanitizeImportedUrl } from "@radicar/validators";

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
    projects: "پروژه‌ها",
    skills: "مهارت‌ها",
  },
  en: {
    about: "About Me",
    contact: "Contact Information",
    education: "Education",
    experience: "Professional Experience",
    languages: "Languages",
    projects: "Projects",
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

const navyReferenceAccents: Record<
  ResumeColorId,
  {
    background: string;
    border: string;
    text: string;
    headerText: string;
  }
> = {
  mint: {
    background: "bg-[#42ddb0]",
    border: "border-[#159f7b]",
    text: "text-[#13765f]",
    headerText: "text-[#173f37]",
  },
  yellow: {
    background: "bg-[#0f7b62]",
    border: "border-[#0f7b62]",
    text: "text-[#0f7b62]",
    headerText: "text-white",
  },
  cyan: {
    background: "bg-[#78d8eb]",
    border: "border-[#288da2]",
    text: "text-[#147f95]",
    headerText: "text-[#173f48]",
  },
  sand: {
    background: "bg-[#f2c979]",
    border: "border-[#b47d27]",
    text: "text-[#9c6d20]",
    headerText: "text-[#4c3919]",
  },
  gray: {
    background: "bg-[#d8d8d5]",
    border: "border-[#777d79]",
    text: "text-[#646966]",
    headerText: "text-[#303633]",
  },
  coral: {
    background: "bg-[#e86f73]",
    border: "border-[#cc5a60]",
    text: "text-[#cc5a60]",
    headerText: "text-white",
  },
  blue: {
    background: "bg-[#303d60]",
    border: "border-[#303d60]",
    text: "text-[#303d60]",
    headerText: "text-white",
  },
  purple: {
    background: "bg-[#7140bd]",
    border: "border-[#7140bd]",
    text: "text-[#6335a9]",
    headerText: "text-white",
  },
  black: {
    background: "bg-[#171717]",
    border: "border-[#171717]",
    text: "text-[#171717]",
    headerText: "text-white",
  },
};

const matrixAccents: Record<
  ResumeColorId,
  { text: string; border: string; background: string; softBackground: string }
> = {
  mint: {
    text: "text-[#00f5a0]",
    border: "border-[#00f5a0]",
    background: "bg-[#00f5a0]",
    softBackground: "bg-[#00f5a0]/10",
  },
  yellow: {
    text: "text-[#36d98b]",
    border: "border-[#36d98b]",
    background: "bg-[#36d98b]",
    softBackground: "bg-[#36d98b]/10",
  },
  cyan: {
    text: "text-[#25dcff]",
    border: "border-[#25dcff]",
    background: "bg-[#25dcff]",
    softBackground: "bg-[#25dcff]/10",
  },
  sand: {
    text: "text-[#ffc45c]",
    border: "border-[#ffc45c]",
    background: "bg-[#ffc45c]",
    softBackground: "bg-[#ffc45c]/10",
  },
  gray: {
    text: "text-[#d6dcda]",
    border: "border-[#d6dcda]",
    background: "bg-[#d6dcda]",
    softBackground: "bg-[#d6dcda]/10",
  },
  coral: {
    text: "text-[#ff7181]",
    border: "border-[#ff7181]",
    background: "bg-[#ff7181]",
    softBackground: "bg-[#ff7181]/10",
  },
  blue: {
    text: "text-[#5db4ff]",
    border: "border-[#5db4ff]",
    background: "bg-[#5db4ff]",
    softBackground: "bg-[#5db4ff]/10",
  },
  purple: {
    text: "text-[#ad85ff]",
    border: "border-[#ad85ff]",
    background: "bg-[#ad85ff]",
    softBackground: "bg-[#ad85ff]/10",
  },
  black: {
    text: "text-[#f1f4f3]",
    border: "border-[#f1f4f3]",
    background: "bg-[#f1f4f3]",
    softBackground: "bg-[#f1f4f3]/10",
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
  const projectText = getResumeProjects(data)
    .flatMap((project) => [
      project.name,
      project.role,
      project.description,
      project.technologies,
    ])
    .join("\n");
  const languageText = [
    ...LANGUAGE_FIELDS.map((field) => data[field]),
    projectText,
  ].join("\n");
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
  emphasizeName = true,
}: {
  languages: string;
  direction: "rtl" | "ltr";
  className?: string;
  emphasizeName?: boolean;
}) {
  return (
    <ul className={cn("m-0 grid list-none gap-[.55em] p-0", className)}>
      {getLanguageItems(languages, direction).map((language, index) => {
        const parts = emphasizeName
          ? language.match(/^(.+?)(\s+[—–-]\s+.*)$/)
          : null;

        return (
          <li dir="auto" key={`${language}-${index}`}>
            {parts ? (
              <>
                <strong>{parts[1]}</strong>
                <span>{parts[2]}</span>
              </>
            ) : (
              language
            )}
          </li>
        );
      })}
    </ul>
  );
}

function formatDateRange(
  item: Pick<
    ResumeExperience | ResumeEducation | ResumeProject,
    "startDate" | "endDate" | "isCurrent"
  >,
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

function ResumeFullName({ fullName }: { fullName: string }) {
  const normalizedName = fullName.trim();
  const characterCount = Array.from(normalizedName).length;

  return (
    <span
      className={cn(
        "block max-w-full whitespace-normal text-clip break-words leading-[1.08] [overflow-wrap:anywhere]",
        characterCount > 34
          ? "text-[.68em]"
          : characterCount > 26
            ? "text-[.78em]"
            : characterCount > 20
              ? "text-[.88em]"
              : "text-[1em]",
      )}
      data-resume-full-name="true"
    >
      {normalizedName || "\u00a0"}
    </span>
  );
}

function documentClass(compact: boolean | undefined) {
  return cn(
    "relative box-border aspect-[210/297] w-full overflow-hidden bg-white !py-[4.535%] text-start text-[#31413e] shadow-[0_14px_45px_rgba(26,51,47,.12)] [&[dir=rtl]]:font-resume-rtl [&[dir=ltr]]:font-resume-latin",
    compact
      ? "max-w-[300px] text-[4px] shadow-[0_8px_24px_rgba(26,51,47,.12)]"
      : "max-w-[793.700787px] text-[11.023622px]",
    "print:relative print:m-0 print:h-[297mm] print:min-h-[297mm] print:w-[210mm] print:max-w-none print:break-after-page print:!py-[9.525mm] print:shadow-none print:last:break-after-auto print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]",
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
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full font-extrabold [&_img]:size-full [&_img]:object-cover",
        className,
      )}
    >
      <span>{getInitials(data.fullName)}</span>
      {data.photoUrl && (
        <Image
          className="absolute inset-0"
          src={data.photoUrl}
          alt={`تصویر ${data.fullName}`}
          width={240}
          height={240}
          unoptimized
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

function getPhoneHref(phone: string) {
  const latinDigits = phone
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  return `tel:${latinDigits.replace(/(?!^\+)[^\d]/g, "")}`;
}

function getExternalHref(value: string) {
  return sanitizeImportedUrl(value) || undefined;
}

function getLinkedInProfileLabel(direction: "rtl" | "ltr") {
  return direction === "ltr" ? "LinkedIn Profile" : "لینک پروفایل لینکدین";
}

function ResumeContactLink({
  value,
  type,
  direction = "rtl",
  className,
}: {
  value: string;
  type: "phone" | "website";
  direction?: "rtl" | "ltr";
  className?: string;
}) {
  const external = type === "website";
  return (
    <a
      className={cn(
        "text-inherit no-underline",
        external && "block min-w-0 flex-1 text-start",
        className,
      )}
      data-resume-linkedin={external || undefined}
      dir={external ? direction : "ltr"}
      href={external ? getExternalHref(value) : getPhoneHref(value)}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={(event) => event.stopPropagation()}
    >
      {external ? getLinkedInProfileLabel(direction) : value}
    </a>
  );
}

function ResumeSkillBullet({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-[.5em]", className)}
      data-resume-skill-bullet
    >
      <i
        aria-hidden="true"
        className="size-[.42em] shrink-0 rounded-full bg-current"
      />
      <span className="min-w-0">{children}</span>
    </span>
  );
}

function ContactDetails({
  data,
  direction,
  className,
}: {
  data: ResumeData;
  direction: "rtl" | "ltr";
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
          <ResumeContactLink value={data.phone} type="phone" className="text-left" />
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
          <ResumeContactLink
            value={data.website}
            type="website"
            direction={direction}
          />
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

function InlineEducationDetails({
  education,
  direction,
  className,
  contentClassName,
  credentialClassName,
  institutionClassName,
  dateClassName,
}: {
  education: ResumeEducation;
  direction: "rtl" | "ltr";
  className?: string;
  contentClassName?: string;
  credentialClassName?: string;
  institutionClassName?: string;
  dateClassName?: string;
}) {
  const hasDate = Boolean(
    education.startDate || education.endDate || education.isCurrent,
  );
  const hasInstitution = Boolean(education.institution?.trim());

  if (!hasDate) {
    return (
      <div
        className={cn(
          "flex min-w-0 flex-wrap items-baseline gap-x-[.8em] gap-y-[.15em]",
          className,
          contentClassName,
        )}
        data-resume-education-inline
      >
        <strong
          className={cn(
            "max-w-full shrink-0",
            credentialClassName || "text-[.92em]",
          )}
        >
          {education.credential}
        </strong>
        {hasInstitution && (
          <span
            className={cn(
              "max-w-full shrink-0",
              institutionClassName || "text-[.82em]",
            )}
          >
            {education.institution}
          </span>
        )}
      </div>
    );
  }

  if (!hasInstitution) {
    return (
      <div
        className={cn(
          "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[1.15em] gap-y-[.2em]",
          className,
          contentClassName,
        )}
        data-resume-education-inline
      >
        <strong
          className={cn("min-w-0", credentialClassName || "text-[.92em]")}
        >
          {education.credential}
        </strong>
        <time
          className={cn(
            "shrink-0 whitespace-nowrap",
            dateClassName || "text-[.72em] text-[#758582]",
          )}
        >
          {formatDateRange(education, direction)}
        </time>
      </div>
    );
  }

  return (
    <div
      className={cn("@container min-w-0", className)}
      data-resume-education-inline
    >
      <div
        className={cn(
          "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-[1.15em] gap-y-[.2em] @min-[22rem]:grid-cols-[max-content_minmax(0,1fr)_auto]",
          contentClassName,
        )}
      >
        <strong
          className={cn(
            "col-span-2 min-w-0 @min-[22rem]:col-span-1",
            credentialClassName || "text-[.92em]",
          )}
        >
          {education.credential}
        </strong>
        <span
          className={cn(
            "col-start-1 row-start-2 min-w-0 @min-[22rem]:col-start-2 @min-[22rem]:row-start-1",
            institutionClassName || "text-[.82em]",
          )}
        >
          {education.institution}
        </span>
        <time
          className={cn(
            "col-start-2 row-start-2 shrink-0 whitespace-nowrap @min-[22rem]:col-start-3 @min-[22rem]:row-start-1",
            dateClassName || "text-[.72em] text-[#758582]",
          )}
        >
          {formatDateRange(education, direction)}
        </time>
      </div>
    </div>
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
          <InlineEducationDetails
            education={education}
            direction={direction}
          />
        </article>
      ))}
    </div>
  );
}

function ProjectEntries({
  data,
  direction,
  className,
}: {
  data: ResumeData;
  direction: "rtl" | "ltr";
  className?: string;
}) {
  return (
    <div className={cn("grid gap-[1.25em]", className)}>
      {getResumeProjects(data).map((project) => {
        const bullets = project.description
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
        return (
          <article key={project.id}>
            <div className="flex items-start justify-between gap-[1em]">
              <div className="min-w-0">
                <strong className="block text-[.92em] text-inherit">
                  {project.name}
                </strong>
                {project.role && (
                  <span className="mt-[.25em] block text-[.78em] font-semibold text-inherit">
                    {project.role}
                  </span>
                )}
              </div>
              {(project.startDate || project.endDate || project.isCurrent) && (
                <time className="shrink-0 text-[.7em] text-inherit">
                  {formatDateRange(project, direction)}
                </time>
              )}
            </div>
            {project.url && (
              <a
                className="mt-[.35em] block truncate text-[.72em] text-inherit no-underline"
                dir="ltr"
                href={getExternalHref(project.url)}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                {project.url}
              </a>
            )}
            {bullets.length > 0 && (
              <ul
                className={cn(
                  "mb-0 mt-[.55em] grid gap-[.35em] text-[.78em] text-inherit leading-[1.55]",
                  direction === "rtl" ? "pr-[1.35em]" : "pl-[1.35em]",
                )}
              >
                {bullets.map((bullet, index) => (
                  <li key={`${project.id}-${index}`}>{bullet}</li>
                ))}
              </ul>
            )}
            {project.technologies && (
              <p className="mb-0 mt-[.55em] text-[.7em] text-inherit leading-[1.5]">
                {project.technologies}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function ProjectSection({
  data,
  direction,
  heading,
  className,
}: {
  data: ResumeData;
  direction: "rtl" | "ltr";
  heading: ReactNode;
  className?: string;
}) {
  if (!getResumeProjects(data).length) return null;
  return (
    <section className={className}>
      {heading && <div className="mb-[1em]">{heading}</div>}
      <ProjectEntries
        data={data}
        direction={direction}
      />
    </section>
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
            <h1 className="m-0 text-[2.2em] leading-tight">
              <ResumeFullName fullName={data.fullName} />
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
            direction={presentation.dir}
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
          data-resume-flow="sidebar"
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
                  <ResumeSkillBullet>{skill}</ResumeSkillBullet>
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
        <main data-resume-flow="main" className="grid content-start gap-[3.2em] p-[6%]">
          {data.summary && <section>
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
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <SectionHeading theme={theme}>
                {presentation.labels.projects}
              </SectionHeading>
            }
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
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        !continuation && "grid grid-rows-[15%_85%]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn("absolute inset-y-0 start-0 w-[34%]", theme.side)}
      />
      <div
        className={cn(
          "absolute inset-x-0 z-2 h-[1.2%]",
          templateId === "sector-yellow" ? "top-[2.34%]" : "top-0",
          theme.avatar,
        )}
      />
      {!continuation && (
        <header
          className={cn(
            "relative z-1 flex h-full items-center gap-[2em] overflow-hidden px-[5%] py-[2%]",
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
            <h1 className="m-0 text-[2.3em] leading-tight">
              <ResumeFullName fullName={data.fullName} />
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
      <div className="relative z-1 grid h-full grid-cols-[34%_1fr] overflow-hidden text-[.86em]">
        <aside
          data-resume-flow="sidebar"
          className={cn(
            "grid min-h-0 content-start gap-[1.7em] overflow-hidden px-[12%] py-[8%]",
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
                direction={presentation.dir}
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
                  <span className="block h-[.35em] overflow-hidden rounded-full bg-current/15">
                    <span
                      className={cn(
                        "block h-full rounded-full",
                        palette.background,
                        index % 4 === 0
                          ? "w-full"
                          : index % 4 === 1
                            ? "w-4/5"
                            : index % 4 === 2
                              ? "w-3/5"
                              : "w-2/5",
                      )}
                    />
                  </span>
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
        <main
          data-resume-flow="main"
          className={cn(
            "grid min-h-0 content-start gap-[2.2em] overflow-hidden px-[7%] pb-[1%]",
            continuation ? "pt-[1%]" : "pt-[2.2%]",
          )}
        >
          {data.summary && <section>
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
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <SectionHeading theme={theme}>
                {presentation.labels.projects}
              </SectionHeading>
            }
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
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
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
            <h1 className="m-0 text-[2.3em] leading-tight text-[#19312f]">
              <ResumeFullName fullName={data.fullName} />
            </h1>
            <p
              className={cn(
                "mb-0 mt-[.7em] truncate text-[1.05em] font-bold",
                palette.text,
              )}
            >
              {data.jobTitle || "\u00a0"}
            </p>
          </div>
          <ContactDetails
            data={data}
            direction={presentation.dir}
            className="max-w-[34%] break-all text-[.72em] leading-[1.55] text-[#60716e]"
          />
        </header>
      )}
      <main
        className={cn(
          "grid h-full content-start gap-[.5em] overflow-hidden px-[7%] text-[.86em]",
          continuation ? "py-[5%]" : "py-[1%]",
        )}
      >
        {data.summary && (
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
        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <SectionHeading theme={theme}>
              {presentation.labels.projects}
            </SectionHeading>
          }
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
                  <ResumeSkillBullet>{skill}</ResumeSkillBullet>
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

function NavyReferenceHeading({
  icon,
  children,
  accent,
}: {
  icon: ReactNode;
  children: string;
  accent: (typeof navyReferenceAccents)[ResumeColorId];
}) {
  return (
    <div
      data-resume-section-heading
      className={cn(
        "flex items-center gap-[.65em] border-b-[.15em] pb-[.35em]",
        accent.border,
        accent.text,
      )}
    >
      <span aria-hidden="true" className="grid size-[1.35em] place-items-center">
        {icon}
      </span>
      <h2 className="m-0 text-[1.24em] font-semibold uppercase leading-none tracking-[.02em]">
        {children}
      </h2>
    </div>
  );
}

function NavyReferenceResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const accent =
    navyReferenceAccents[colorId || getDefaultResumeColor(templateId)];
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const languages = getLanguageItems(data.languages, presentation.dir);
  const bodyInset = presentation.dir === "rtl" ? "pr-[22%]" : "pl-[22%]";
  const datePosition = presentation.dir === "rtl" ? "right-0" : "left-0";

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        compact ? "!text-[4.8px]" : "!text-[13.2px]",
        "!bg-[#fbfaf8] !text-[#303d60]",
      )}
    >
      {!continuation && (
        <header
          className={cn(
            "absolute inset-x-0 top-0 h-[19.2%] overflow-hidden px-[8.35%] pt-[4.6em]",
            accent.background,
            accent.headerText,
          )}
        >
          <h1 className="m-0 text-[2.35em] font-semibold leading-none tracking-[-.025em]">
            <ResumeFullName fullName={data.fullName} />
          </h1>
          <p className="mb-0 mt-[.55em] truncate text-[1.55em] font-normal leading-none">
            {data.jobTitle || "\u00a0"}
          </p>
          <div className="mt-[1.55em] flex min-w-0 flex-wrap items-center gap-x-[.8em] gap-y-[.35em] text-[.92em] leading-none">
            {[data.email, data.phone, data.location, data.website]
              .filter(Boolean)
              .map((value, index) => (
                <span className="inline-flex min-w-0 items-center gap-[.8em]" key={`${value}-${index}`}>
                  {index > 0 && <i aria-hidden="true" className="size-[.3em] shrink-0 rounded-full bg-white" />}
                  {value === data.phone ? (
                    <ResumeContactLink value={value} type="phone" className="text-left" />
                  ) : value === data.website ? (
                    <ResumeContactLink value={value} type="website" direction={presentation.dir} />
                  ) : (
                    <span className="truncate">{value}</span>
                  )}
                </span>
              ))}
          </div>
        </header>
      )}

      <main
        data-resume-flow="main"
        className={cn(
          "absolute inset-x-0 bottom-0 grid content-start gap-[2.65em] overflow-hidden px-[8.35%] pb-[6.5%]",
          continuation ? "top-0 pt-[6.5%]" : "top-[19.2%] pt-[3.4%]",
        )}
      >
        {data.summary && (
          <section>
            <NavyReferenceHeading accent={accent} icon={<CircleUserRound className="size-full" />}>
              {presentation.dir === "ltr" ? "Summary" : presentation.labels.about}
            </NavyReferenceHeading>
            <div className="mt-[1em] whitespace-pre-line text-[.96em] leading-[1.36]">
              {data.summary}
            </div>
          </section>
        )}

        {experiences.length > 0 && (
          <section>
            {!continuation && (
              <NavyReferenceHeading accent={accent} icon={<BriefcaseBusiness className="size-full" />}>
                {presentation.dir === "ltr" ? "Experience" : presentation.labels.experience}
              </NavyReferenceHeading>
            )}
            <div className={cn("grid gap-[1.55em]", !continuation && "mt-[1em]") }>
              {experiences.map((experience) => (
                <article className={cn("relative min-h-[3em]", bodyInset)} key={experience.id}>
                  <div className={cn("absolute top-0 w-[19%] text-[.92em] leading-[1.35] text-[#596889]", datePosition)}>
                    <time className="block">{formatDateRange(experience, presentation.dir)}</time>
                    {experience.location && <span className="mt-[.18em] block">{experience.location}</span>}
                  </div>
                  <div className="text-[.96em] leading-[1.32]">
                    <p className="m-0">
                      <strong>{experience.jobTitle}</strong>
                      {experience.company && <>, {experience.company}</>}
                    </p>
                    {experience.description
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .map((item, index) => (
                        <p className="m-0" key={`${experience.id}-description-${index}`}>{item}</p>
                      ))}
                    {experience.technologies && <p className="m-0">{experience.technologies}</p>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <NavyReferenceHeading accent={accent} icon={<Code2 className="size-full" />}>
              {presentation.labels.projects}
            </NavyReferenceHeading>
          }
          className="text-[.96em] leading-[1.35]"
        />

        {educations.length > 0 && (
          <section>
            <NavyReferenceHeading accent={accent} icon={<GraduationCap className="size-full" />}>
              {presentation.dir === "ltr" ? "Education" : presentation.labels.education}
            </NavyReferenceHeading>
            <div className="mt-[1em] grid gap-[.55em]">
              {educations.map((education) => (
                <article className={cn("relative min-h-[1.6em] text-[.96em] leading-[1.28]", bodyInset)} key={education.id}>
                  <time className={cn("absolute top-0 w-[19%] whitespace-nowrap text-[#596889]", datePosition)}>
                    {formatDateRange(education, presentation.dir)}
                  </time>
                  <p className="m-0">
                    <strong>{education.credential}</strong>
                    {education.institution && <>, {education.institution}</>}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section>
            <NavyReferenceHeading accent={accent} icon={<Puzzle className="size-full" />}>
              {presentation.dir === "ltr" ? "Top Skills" : presentation.labels.skills}
            </NavyReferenceHeading>
            <div className="mt-[1em] flex flex-wrap gap-[.75em]">
              {skills.map((skill) => (
                <span
                  className={cn(
                    "rounded-[.25em] px-[.9em] py-[.55em] text-[.86em] font-semibold leading-none",
                    accent.background,
                    accent.headerText,
                  )}
                  key={skill}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {languages.length > 0 && (
          <section>
            <NavyReferenceHeading accent={accent} icon={<Globe2 className="size-full" />}>
              {presentation.dir === "ltr" ? "Languages" : presentation.labels.languages}
            </NavyReferenceHeading>
            <div className="mt-[1em] grid grid-cols-2 gap-x-[4em] gap-y-[.8em] text-[.92em] leading-[1.25]">
              {languages.map((language, index) => {
                const parts = language.match(/^(.+?)(?:\s+[—–-]\s+)(.*)$/);
                return (
                  <div dir="auto" key={`${language}-${index}`}>
                    <strong className="block">{parts?.[1] || language}</strong>
                    {parts?.[2] && <span className="block">{parts[2]}</span>}
                  </div>
                );
              })}
            </div>
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
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "px-[7%] py-[5%] text-[#303532]",
      )}
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
          <h1 className="mb-0 mt-[.7em] text-[2.3em] leading-tight">
            <ResumeFullName fullName={data.fullName} />
          </h1>
          <p className="mb-0 mt-[.55em] text-[1.05em] text-[#747b77]">
            {[data.jobTitle, data.location].filter(Boolean).join("  |  ")}
            {data.phone && (
              <>
                {data.jobTitle || data.location ? "  |  " : ""}
                <ResumeContactLink value={data.phone} type="phone" />
              </>
            )}
          </p>
        </header>
      )}
      <div
        className={cn(
          "grid grid-cols-[27%_1fr] gap-[5%]",
          continuation ? "mt-0" : "mt-[3.5em]",
        )}
      >
        <aside
          data-resume-flow="sidebar"
          className={cn(
            "grid content-start gap-[2.5em] border-[#d9ddda]",
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
                direction={presentation.dir}
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
        <main data-resume-flow="main" className="grid content-start gap-[2.4em]">
          {data.summary && <section>
            <h2
              className={cn(
                "m-0 flex items-center gap-[.7em] text-[1.05em] tracking-[.1em]",
                palette.text,
              )}
            >
              <CircleUserRound size="1.3em" />
              {presentation.labels.about}
            </h2>
            <p className="mb-0 mt-[1.3em] text-[.76em] leading-[1.6]">
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
            <div className="mt-[1.5em] grid gap-[1.3em]">
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
                      "mb-0 mt-[1.2em] grid gap-[.55em] text-[.78em] leading-[1.52]",
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
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <h2
                className={cn(
                  "m-0 flex items-center gap-[.7em] text-[1.05em] tracking-[.1em]",
                  palette.text,
                )}
              >
                <BriefcaseBusiness size="1.3em" />
                {presentation.labels.projects}
              </h2>
            }
          />
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
              className="mt-[1.3em] text-[.76em] leading-[1.5]"
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
    <div
      data-resume-section-heading
      className={cn("flex items-center gap-[2em]", palette.text)}
    >
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
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "px-[3.5%] text-[#151515]",
      )}
    >
      {!continuation && (
        <>
          <header
            className={cn(
              "-mr-[3.65%] mt-[8%] flex h-[6.5%] items-center rounded-l-full px-[8%] text-white",
              palette.background,
            )}
          >
            <h1 className="m-0 text-[2.3em] font-bold">
              <ResumeFullName fullName={data.fullName} />
            </h1>
          </header>
          <div className="mx-[8%] mt-[1.3em] flex flex-wrap items-center gap-x-[2em] gap-y-[.65em] text-[.68em] leading-[1.35] text-[#4b4b4b]">
            {data.location && <span>{data.location}</span>}
            {data.phone && (
              <span>
                <ResumeContactLink value={data.phone} type="phone" />
              </span>
            )}
            {data.email && <span dir="ltr">{data.email}</span>}
            {data.website && (
              <span>
                <ResumeContactLink
                  value={data.website}
                  type="website"
                  direction={presentation.dir}
                />
              </span>
            )}
          </div>
        </>
      )}
      <main
        className={cn(
          "grid content-start gap-[2.5em] px-[8%] pb-[7%]",
          continuation ? "h-full pt-[7%]" : "pt-[4%]",
        )}
      >
        {data.summary && (
          <p className="m-0 text-justify text-[.907em] font-normal leading-[1.45]">
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
        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <OrangeLineHeading palette={palette}>
              {presentation.labels.projects}
            </OrangeLineHeading>
          }
        />
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
              className="mb-0 mt-[1.1em] grid list-none grid-cols-2 gap-x-[4em] gap-y-[.45em] p-0 text-[.74em] leading-[1.45]"
            >
              {skills.map((skill) => (
                <li key={skill}>
                  <ResumeSkillBullet>{skill}</ResumeSkillBullet>
                </li>
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
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "text-[#171717]",
      )}
    >
      {!continuation && (
        <>
          <header className={cn("flex h-[14.5%] items-center gap-[2.2em] px-[7%] text-white", palette.background)}>
            <ProfilePhoto
              data={data}
              className="size-[7.2em] bg-white/20 text-white"
            />
            <div className="min-w-0">
              <h1 className="m-0 text-[2.3em] font-extrabold italic leading-none">
                <ResumeFullName fullName={data.fullName} />
              </h1>
              <p className="mb-0 mt-[1em] text-[1.05em] font-semibold uppercase tracking-[.04em] text-white/85">
                {data.jobTitle || "\u00a0"}
              </p>
            </div>
          </header>
          <div className="grid h-[6%] grid-cols-4 items-center gap-[1.4em] border-b border-[#e4e4e4] px-[7%] text-[.62em] text-[#252525]">
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
              <ResumeContactLink value={data.phone} type="phone" className="text-left" />
            </span>
            {data.website && (
              <span className="flex min-w-0 items-center gap-[.7em] truncate" dir="ltr">
                <Globe2 className={cn("shrink-0", palette.text)} size="1.15em" />
                <ResumeContactLink
                  value={data.website}
                  type="website"
                  direction={presentation.dir}
                  className="truncate"
                />
              </span>
            )}
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
          {data.summary && (
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
                      <div className="flex items-start justify-between gap-[1.5em]">
                        <h3 className="m-0 min-w-0 text-[.98em] font-semibold">
                          {[experience.jobTitle, experience.company, experience.location]
                            .filter(Boolean)
                            .join(", ")}
                        </h3>
                        <time className="shrink-0 pt-[.2em] text-[.62em] italic text-[#9a9a9a]">
                          {formatDateRange(experience, presentation.dir)}
                        </time>
                      </div>
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
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <h2 className="m-0 text-[1.3em] font-extrabold italic">
                {presentation.labels.projects}
              </h2>
            }
          />
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
                    <span className="text-[.76em] leading-[1.35]">
                      {skill}
                    </span>
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
              <div className="mt-[1em] grid gap-[1.4em] text-[.78em] leading-[1.6]">
                {educations.map((education) => (
                  <article key={education.id}>
                    <InlineEducationDetails
                      education={education}
                      direction={presentation.dir}
                      credentialClassName="text-[1em]"
                      institutionClassName="text-[1em]"
                      dateClassName="text-[.82em] text-[#71807b]"
                    />
                  </article>
                ))}
              </div>
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
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "px-[6%] py-[3%] text-[#28322f]",
      )}
    >
      {!continuation && (
        <header className="grid h-[20%] grid-cols-[26%_1fr] overflow-hidden">
          <div className="relative grid overflow-hidden bg-[#e9eeeb]">
            <span className="grid size-full place-items-center text-[2em] font-extrabold text-[#63706c]">
              {getInitials(data.fullName)}
            </span>
            {data.photoUrl && (
              <Image
                className="absolute inset-0 size-full object-cover"
                src={data.photoUrl}
                alt={`تصویر ${data.fullName}`}
                width={300}
                height={300}
                unoptimized
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>
          <div
            className={cn(
              "flex min-w-0 flex-col justify-center px-[8%] text-white",
              palette.background,
            )}
          >
            <h1 className="m-0 text-[2.3em] leading-tight">
              <ResumeFullName fullName={data.fullName} />
            </h1>
            <p className="mb-0 mt-[.5em] text-[1.05em]">
              {data.jobTitle}
            </p>
            <ContactDetails
              data={data}
              direction={presentation.dir}
              className="mt-[2em] grid-cols-2 text-[.7em]"
            />
          </div>
        </header>
      )}
      <div
        className={cn(
          "grid grid-cols-[25%_1fr] gap-[6%] text-[.86em]",
          continuation ? "mt-0" : "mt-[1.2em]",
        )}
      >
        <aside data-resume-flow="sidebar" className="grid content-start gap-[1.7em]">
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
                          "h-[3px] flex-1 rounded-full",
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
        <main data-resume-flow="main" className="grid content-start gap-[.7em]">
          {data.summary && (
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
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <h2 className={cn("m-0 text-[1.35em]", palette.text)}>
                {presentation.labels.projects}
              </h2>
            }
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
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "grid grid-cols-[1fr_26%] gap-[5%] px-[7%] py-[5.5%] text-[#333936]",
      )}
    >
      <main data-resume-flow="main" className="grid content-start gap-[2.4em]">
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
              <h1 className="m-0 text-[2.3em] leading-tight">
                <ResumeFullName fullName={data.fullName} />
              </h1>
              <p className={cn("mb-0 mt-[.5em] text-[1.05em]", palette.text)}>
                {data.jobTitle}
              </p>
              <ContactDetails
                data={data}
                direction={presentation.dir}
                className="mt-[1.2em] grid-cols-2 text-[.65em] text-[#737c78]"
              />
            </div>
          </header>
        )}
        {data.summary && (
          <section>
            <h2 className={cn("m-0 text-[1.25em]", palette.text)}>
              {presentation.labels.about}
            </h2>
            <p className="mb-0 mt-[1em] text-[.76em] leading-[1.6]">
              {data.summary}
            </p>
          </section>
        )}
        {experiences.length > 0 && <section>
          {!continuation && <h2 className={cn("m-0 text-[1.25em]", palette.text)}>
            {presentation.labels.experience}
          </h2>}
          <div className="mt-[1.4em] grid gap-[1.3em]">
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
        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <h2 className={cn("m-0 text-[1.25em]", palette.text)}>
              {presentation.labels.projects}
            </h2>
          }
        />
        {getResumeEducations(data).length > 0 && (
          <section>
          <h2 className={cn("m-0 text-[1.25em]", palette.text)}>
            {presentation.labels.education}
          </h2>
          <EducationEntries
            data={data}
            direction={presentation.dir}
            className="mt-[1em] text-[.76em] leading-[1.5]"
          />
          </section>
        )}
      </main>
      <aside data-resume-flow="sidebar" className="grid content-start gap-[3em]">
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

function ProfileBandHeading({
  children,
  palette,
}: {
  children: string;
  palette: (typeof colorPalettes)[ResumeColorId];
}) {
  return (
    <h2
      className={cn(
        "m-0 border-t-[.22em] pt-[.45em] text-[1.25em] font-bold",
        palette.border,
        palette.text,
      )}
    >
      {children}
    </h2>
  );
}

function DesignerSidebarHeading({
  children,
  palette,
  ruled = false,
}: {
  children: string;
  palette: (typeof colorPalettes)[ResumeColorId];
  ruled?: boolean;
}) {
  return (
    <h2
      className={cn(
        "m-0 pb-[.35em] text-[1.35em] font-bold",
        palette.text,
        ruled && "border-b",
        ruled && palette.border,
      )}
    >
      {children}
    </h2>
  );
}

function DesignerSidebarResume({
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
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "relative grid grid-cols-[34%_66%] text-[#222]",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-[34%] border-e border-[#d9dcda] bg-white"
      >
        {!continuation && (
          <i
            className={cn(
              "absolute inset-x-0 top-0 h-[16%]",
              palette.softBackground,
            )}
          />
        )}
      </div>
      <aside data-resume-flow="sidebar" className="relative z-1 px-[10%] pb-[8%] pt-[4%]">
        {!continuation && (
          <>
            <ProfilePhoto
              data={data}
              className={cn(
                "relative z-1 mx-auto size-[12em] rounded-full border-[.35em] bg-white shadow-sm",
                palette.border,
              )}
            />
            <div className="mt-[1.4em] grid gap-[1.1em] text-[.72em] leading-[1.5]">
              {data.email && (
                <p className="m-0" dir="ltr">
                  {data.email}
                </p>
              )}
              {data.website && (
                <p className="m-0" dir="ltr">
                  <ResumeContactLink
                    value={data.website}
                    type="website"
                    direction={presentation.dir}
                  />
                </p>
              )}
              {data.location && (
                <p className="m-0" dir="auto">
                  {data.location}
                </p>
              )}
              {data.phone && (
                <p className="m-0">
                  <ResumeContactLink value={data.phone} type="phone" className="text-left" />
                </p>
              )}
            </div>
          </>
        )}
        {getResumeEducations(data).length > 0 && (
              <section className="mt-[2.4em]">
                <DesignerSidebarHeading palette={palette}>
                  {presentation.labels.education}
                </DesignerSidebarHeading>
                <EducationEntries
                  data={data}
                  direction={presentation.dir}
                  className="mt-[1.2em] text-[.78em] leading-[1.5]"
                />
              </section>
        )}
        {skills.length > 0 && (
              <section className="mt-[2.4em]">
                <DesignerSidebarHeading palette={palette} ruled>
                  {presentation.labels.skills}
                </DesignerSidebarHeading>
                <ul className="m-0 mt-[1em] grid list-none gap-[.8em] p-0 text-[.72em]">
                  {skills.map((skill, index) => (
                    <li className="grid gap-[.4em]" key={skill}>
                      <span>{skill}</span>
                      <i className={cn("block h-[3px] w-full", palette.softBackground)}>
                        <b
                          className={cn(
                            "block h-full",
                            index % 3 === 0
                              ? "w-full"
                              : index % 3 === 1
                                ? "w-[88%]"
                                : "w-3/4",
                            palette.background,
                          )}
                        />
                      </i>
                    </li>
                  ))}
                </ul>
              </section>
        )}
        {data.languages && (
              <section className="mt-[2.4em]">
                <DesignerSidebarHeading palette={palette} ruled>
                  {presentation.labels.languages}
                </DesignerSidebarHeading>
                <LanguageList
                  languages={data.languages}
                  direction={presentation.dir}
                  className="mt-[1em] text-[.72em] leading-[1.5]"
                />
              </section>
        )}
      </aside>

      <main data-resume-flow="main" className={cn("px-[10%] pb-[8%]", continuation ? "pt-[8%]" : "pt-[6%]") }>
        {!continuation && (
          <>
            <header className="border-b border-[#9aa39f] pb-[1.1em]">
              <h1 className={cn("m-0 text-[2.3em] font-bold uppercase", palette.text)}>
                <ResumeFullName fullName={data.fullName} />
              </h1>
              <div className="mt-[.45em] flex items-center gap-[1em]">
                <p className="m-0 text-[1.05em] tracking-[.04em]">{data.jobTitle}</p>
                <i className={cn("h-[2.2em] flex-1", palette.background)} />
              </div>
            </header>
          </>
        )}
        {data.summary && (
          <section
            className={cn(
              "border-b border-[#aeb5b1] pb-[1.5em]",
              continuation ? "" : "mt-[2.8em]",
            )}
          >
            <DesignerSidebarHeading palette={palette}>
              {presentation.dir === "ltr" ? "About Me" : "درباره من"}
            </DesignerSidebarHeading>
            <p className="mb-0 mt-[.9em] text-[.75em] leading-[1.55]">
              {data.summary}
            </p>
          </section>
        )}
        {experiences.length > 0 && (
          <section className={continuation ? "" : "mt-[2em]"}>
            {!continuation && (
              <DesignerSidebarHeading palette={palette}>
                {presentation.labels.experience}
              </DesignerSidebarHeading>
            )}
            <div className={cn("grid gap-[1.5em]", !continuation && "mt-[1.2em]") }>
              {experiences.map((experience) => (
                <article className="border-b border-[#b8bdbb] pb-[1.3em] text-[.72em] leading-[1.5]" key={experience.id}>
                  <h3 className="m-0 font-bold uppercase">{experience.jobTitle}</h3>
                  <p className="mb-0 mt-[.25em]">
                    {[experience.company, formatDateRange(experience, presentation.dir)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mb-0 mt-[.65em] whitespace-pre-line">{experience.description}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <DesignerSidebarHeading palette={palette}>
              {presentation.labels.projects}
            </DesignerSidebarHeading>
          }
          className={continuation ? "mt-[1.5em]" : "mt-[2em]"}
        />
      </main>
      <i className={cn("absolute inset-x-0 bottom-[1.5%] h-[2.5%]", palette.background)} />
    </article>
  );
}

function DarkTimelineHeading({
  children,
  palette,
}: {
  children: string;
  palette: (typeof colorPalettes)[ResumeColorId];
}) {
  return (
    <h2
      className={cn(
        "m-0 border-b pb-[.45em] text-[1.05em] font-bold uppercase",
        palette.border,
      )}
    >
      {children}
    </h2>
  );
}

function DarkSidebarTimelineResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const palette =
    colorPalettes[colorId || getDefaultResumeColor(templateId)];
  const skillBarClassName =
    (colorId || getDefaultResumeColor(templateId)) === "gray"
      ? "bg-[#646966]"
      : palette.background;
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "grid grid-cols-[31%_69%] text-[#444]",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-[31%] bg-[#414143]"
      />
      <aside data-resume-flow="sidebar" className="relative z-1 bg-[#414143] px-[9%] pb-[8%] pt-[5%] text-white">
        {!continuation && (
          <>
            <ProfilePhoto
              data={data}
              className={cn(
                "mx-auto size-[10.5em] rounded-full border-[.4em] bg-white",
                palette.border,
              )}
            />
            {(data.website || data.email || data.location) && (
              <section className="mt-[2em] border-b border-white/70 pb-[2em] text-[.72em] leading-[1.7]">
                <h2 className="mb-[.8em] mt-0 text-[1.35em] font-bold uppercase">
                  {presentation.dir === "ltr" ? "Additional Details" : "اطلاعات تکمیلی"}
                </h2>
                {data.website && (
                  <p className="m-0 break-all" dir="ltr">
                    <ResumeContactLink
                      value={data.website}
                      type="website"
                      direction={presentation.dir}
                    />
                  </p>
                )}
                {data.email && <p className="mb-0 mt-[.7em] break-all" dir="ltr">{data.email}</p>}
                {data.location && <p className="mb-0 mt-[.7em]">{data.location}</p>}
              </section>
            )}
          </>
        )}
        {data.summary && (
          <section
            className={cn(
              "border-b border-white/70 pb-[2em]",
              continuation ? "mt-[2em]" : "mt-[3em]",
            )}
          >
            <h2 className="m-0 text-[1em] font-bold uppercase">
              {presentation.dir === "ltr" ? "About Me" : "درباره من"}
            </h2>
            <p className="mb-0 mt-[.9em] text-[.72em] leading-[1.65] text-white/90">
              {data.summary}
            </p>
          </section>
        )}
        {data.languages && (
              <section className="mt-[2em] border-b border-white/70 pb-[2em]">
                <h2 className="mb-[.9em] mt-0 text-[1em] font-bold uppercase">
                  {presentation.labels.languages}
                </h2>
                <LanguageList
                  languages={data.languages}
                  direction={presentation.dir}
                  className="grid-cols-2 text-[.68em] leading-[1.5] marker:text-white"
                />
              </section>
        )}
      </aside>

      <main data-resume-flow="main" className={cn("relative z-1 px-[7%] pb-[7%]", continuation ? "pt-[7%]" : "pt-[5%]") }>
        {!continuation && (
          <header className="grid grid-cols-[1fr_auto] items-start gap-[2em]">
            <div>
              <h1 className="m-0 text-[2.3em] font-black uppercase leading-[1.05]">
                <ResumeFullName fullName={data.fullName} />
              </h1>
              <p className="mb-0 mt-[.7em] text-[1.05em] uppercase tracking-[.04em]">
                {data.jobTitle}
              </p>
            </div>
            <div className="grid gap-[.55em] text-[.62em] leading-[1.3]">
              {data.location && <span>{data.location}</span>}
              {data.phone && <ResumeContactLink value={data.phone} type="phone" className="text-left" />}
              {data.email && <span dir="ltr">{data.email}</span>}
            </div>
          </header>
        )}

        {experiences.length > 0 && (
          <section className={continuation ? "" : "mt-[4em]"}>
            {!continuation && (
              <DarkTimelineHeading palette={palette}>
                {presentation.labels.experience}
              </DarkTimelineHeading>
            )}
            <div className={cn("grid gap-[1.5em]", !continuation && "mt-[1.4em]") }>
              {experiences.map((experience) => (
                <article className="grid grid-cols-[9em_1fr] gap-[1.5em] text-[.68em] leading-[1.5]" key={experience.id}>
                  <div>
                    <strong className="block uppercase">{experience.company}</strong>
                    <span className="block">{experience.location}</span>
                    <time>{formatDateRange(experience, presentation.dir)}</time>
                  </div>
                  <div className="relative ps-[1.7em]">
                    <i aria-hidden="true" className={cn("absolute start-0 top-[.4em] bottom-0 border-s", palette.border)} />
                    <i aria-hidden="true" className={cn("absolute -start-[.4em] top-0 size-[.8em] rounded-full", palette.background)} />
                    <strong className="block">{experience.jobTitle}</strong>
                    <p className="mb-0 mt-[.45em] whitespace-pre-line text-[#777]">{experience.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <DarkTimelineHeading palette={palette}>
              {presentation.labels.projects}
            </DarkTimelineHeading>
          }
          className="mt-[3em]"
        />

        {educations.length > 0 && (
          <section className="mt-[3em]">
            <DarkTimelineHeading palette={palette}>
              {presentation.labels.education}
            </DarkTimelineHeading>
            <div className="mt-[1.3em] grid gap-[1.2em]">
              {educations.map((education) => (
                <article
                  className="relative ps-[1.7em] text-[.68em] leading-[1.5]"
                  key={education.id}
                >
                  <i aria-hidden="true" className={cn("absolute start-0 top-[.4em] bottom-0 border-s", palette.border)} />
                  <i aria-hidden="true" className={cn("absolute -start-[.4em] top-0 size-[.8em] rounded-full", palette.background)} />
                  <InlineEducationDetails
                    education={education}
                    direction={presentation.dir}
                    credentialClassName="text-[1em]"
                    institutionClassName="text-[1em]"
                    dateClassName="text-[1em] text-inherit"
                  />
                </article>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section className="mt-[3em]">
            <DarkTimelineHeading palette={palette}>
              {presentation.labels.skills}
            </DarkTimelineHeading>
            <div className="mt-[1.3em] grid grid-cols-2 gap-x-[4em] gap-y-[1em] text-[.66em] uppercase">
              {skills.map((skill, index) => (
                <div key={skill}>
                  <span>{skill}</span>
                  <span className="mt-[.35em] flex h-[4px] bg-[#d0d2d1]">
                    <i className={cn(index % 3 === 2 ? "w-3/4" : "w-[88%]", skillBarClassName)} />
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </article>
  );
}

function MatrixHeading({
  children,
  accent,
}: {
  children: string;
  accent: (typeof matrixAccents)[ResumeColorId];
}) {
  return (
    <h2 className="m-0 flex items-center gap-[.65em] border-b border-white/10 pb-[.8em] text-[1.02em] font-extrabold">
      <span aria-hidden="true" className={accent.text}>
        &gt;
      </span>
      <span className={accent.text}>{children}</span>
      <span aria-hidden="true" className="text-[.75em] text-white/25">
        {"{}"}
      </span>
    </h2>
  );
}

function MatrixDarkResume({
  templateId,
  data,
  compact,
  colorId,
  continuation,
}: ResumeDocumentProps) {
  const presentation = getResumePresentation(data);
  const accent =
    matrixAccents[colorId || getDefaultResumeColor(templateId)];
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const projects = getResumeProjects(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const contactLabel =
    presentation.dir === "ltr" ? "Contact" : "اطلاعات تماس";
  const stackLabel = presentation.dir === "ltr" ? "Tech Stack" : "مهارت‌ها";

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        compact ? "!text-[4.8px]" : "!text-[13.2px]",
        "grid grid-cols-[29%_71%] !bg-[#0e0f16] !text-[#aeb2c2] [&[dir=ltr]]:!font-matrix",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-[29%] border-e border-white/10 bg-[#090a10]"
      />
      <aside data-resume-flow="sidebar" className="relative z-1 min-h-0 px-[8%] pb-[7%] pt-[4%]">
        {!continuation && (
          <>
            <header className="text-center">
              <ProfilePhoto
                data={data}
                className={cn(
                  "mx-auto size-[8.4em] border-[.22em] bg-[#161824] shadow-[0_0_1.4em_rgba(0,245,160,.16)]",
                  accent.border,
                )}
              />
              <h1 className="mx-0 mb-0 mt-[1em] text-[1.55em] font-black leading-[1.15] text-white">
                <ResumeFullName fullName={data.fullName} />
              </h1>
              <p
                className={cn(
                  "mx-auto mb-0 mt-[.65em] max-w-[16em] text-[.7em] font-bold leading-[1.45] tracking-[.08em]",
                  accent.text,
                )}
              >
                {data.jobTitle || "\u00a0"}
              </p>
            </header>

            {(data.email || data.phone || data.location || data.website) && (
              <section className="mt-[2.8em] border-t border-white/10 pt-[1.8em]">
                <MatrixHeading accent={accent}>{contactLabel}</MatrixHeading>
                <div className="mt-[1.25em] grid gap-[.85em] text-[.68em] leading-[1.35]">
                  {data.phone && (
                    <span className="flex min-w-0 items-center gap-[.8em]">
                      <Phone className={cn("shrink-0", accent.text)} size="1.05em" />
                      <ResumeContactLink value={data.phone} type="phone" className="truncate text-left" />
                    </span>
                  )}
                  {data.email && (
                    <span className="flex min-w-0 items-center gap-[.8em]" dir="ltr">
                      <Mail className={cn("shrink-0", accent.text)} size="1.05em" />
                      <span className="truncate">{data.email}</span>
                    </span>
                  )}
                  {data.location && (
                    <span className="flex min-w-0 items-center gap-[.8em]">
                      <MapPin className={cn("shrink-0", accent.text)} size="1.05em" />
                      <span className="truncate">{data.location}</span>
                    </span>
                  )}
                  {data.website && (
                    <span className="flex min-w-0 items-center gap-[.8em]" dir="ltr">
                      <Globe2 className={cn("shrink-0", accent.text)} size="1.05em" />
                      <ResumeContactLink
                        value={data.website}
                        type="website"
                        direction={presentation.dir}
                        className="truncate"
                      />
                    </span>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {skills.length > 0 && (
              <section className="mt-[2.5em] border-t border-white/10 pt-[1.8em]">
                <MatrixHeading accent={accent}>{stackLabel}</MatrixHeading>
                <div className="mt-[1.2em] flex flex-wrap gap-[.55em]">
                  {skills.map((skill) => (
                    <span
                      className={cn(
                        "rounded-[.35em] border border-current/25 px-[.72em] py-[.42em] text-[.62em] leading-none",
                        accent.text,
                        accent.softBackground,
                      )}
                      key={skill}
                    >
                      <ResumeSkillBullet>{skill}</ResumeSkillBullet>
                    </span>
                  ))}
                </div>
              </section>
        )}

        {data.languages && (
              <section className="mt-[2.5em] border-t border-white/10 pt-[1.8em]">
                <MatrixHeading accent={accent}>
                  {presentation.labels.languages}
                </MatrixHeading>
                <LanguageList
                  languages={data.languages}
                  direction={presentation.dir}
                  className={cn(
                    "mt-[1.2em] gap-[.8em] text-[.66em] [&_li]:flex [&_li]:items-center [&_li]:justify-between [&_li]:gap-[.8em] [&_span]:rounded-[.3em] [&_span]:border [&_span]:border-current/25 [&_span]:px-[.55em] [&_span]:py-[.3em]",
                    accent.text,
                  )}
                />
              </section>
        )}
      </aside>

      <main
        data-resume-flow="main"
        className={cn(
          "relative z-1 grid min-h-0 content-start gap-[2.1em] bg-[#11121a] px-[5.3%] pb-[5%]",
          continuation ? "pt-[4%]" : "pt-[3%]",
        )}
      >
        {data.summary && (
          <section>
            <MatrixHeading accent={accent}>
              {presentation.dir === "ltr" ? "Professional Profile" : "پروفایل حرفه‌ای"}
            </MatrixHeading>
            <p className="mb-0 mt-[1.15em] text-justify text-[.72em] leading-[1.8] text-[#aeb2c2]">
              {data.summary}
            </p>
          </section>
        )}

        {experiences.length > 0 && (
          <section>
            <MatrixHeading accent={accent}>
              {presentation.labels.experience}
            </MatrixHeading>
            <div className="mt-[1.2em] grid gap-[1.15em]">
              {experiences.map((experience) => {
                const bullets = experience.description
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean);
                return (
                  <article
                    className={cn(
                      "relative border-s-[.22em] ps-[1.35em] text-[.7em] leading-[1.55]",
                      accent.border,
                    )}
                    key={experience.id}
                  >
                    <div className="flex items-start justify-between gap-[1.2em]">
                      <div className="min-w-0">
                        <h3 className="m-0 text-[1.15em] font-extrabold text-white">
                          {experience.jobTitle}
                        </h3>
                        <p className={cn("mb-0 mt-[.3em] font-bold", accent.text)}>
                          {[experience.company, experience.location]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <time
                        className={cn(
                          "shrink-0 rounded-[.35em] border border-current/30 px-[.7em] py-[.3em] text-[.88em] leading-none",
                          accent.text,
                          accent.softBackground,
                        )}
                      >
                        {formatDateRange(experience, presentation.dir)}
                      </time>
                    </div>
                    {bullets.length > 0 && (
                      <ul className="mb-0 mt-[.75em] grid list-none gap-[.45em] p-0">
                        {bullets.map((bullet, index) => (
                          <li className="relative ps-[1.35em]" key={`${experience.id}-${index}`}>
                            <span
                              aria-hidden="true"
                              className={cn("absolute start-0 top-0 font-black", accent.text)}
                            >
                              ›
                            </span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                    {experience.technologies && (
                      <div className="mt-[.75em] flex flex-wrap gap-[.45em]">
                        {experience.technologies
                          .split(/،|,/)
                          .map((technology) => technology.trim())
                          .filter(Boolean)
                          .map((technology) => (
                            <span
                              className={cn(
                                "rounded-[.3em] border border-current/20 px-[.55em] py-[.28em] text-[.82em]",
                                accent.text,
                                accent.softBackground,
                              )}
                              key={technology}
                            >
                              {technology}
                            </span>
                          ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <MatrixHeading accent={accent}>
              {presentation.labels.projects}
            </MatrixHeading>
            <div className="mt-[1.2em] grid grid-cols-2 gap-[.8em]">
              {projects.map((project, index) => (
                <article
                  className="rounded-[.7em] border border-white/10 bg-[#1a1b27] p-[1.1em] text-[.66em] leading-[1.55] shadow-[inset_0_1px_0_rgba(255,255,255,.025)]"
                  key={project.id}
                >
                  <div className="flex items-start gap-[.65em]">
                    <i
                      aria-hidden="true"
                      className={cn(
                        "mt-[.45em] size-[.48em] shrink-0 rounded-full",
                        index % 2 === 0 ? accent.background : "bg-[#25dcff]",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-[1.08em] text-white">
                        {project.name}
                      </strong>
                      {project.role && (
                        <span className="mt-[.3em] block font-bold text-inherit">
                          {project.role}
                        </span>
                      )}
                    </div>
                  </div>
                  {project.description && (
                    <p className="mb-0 mt-[.7em] whitespace-pre-line">
                      {project.description}
                    </p>
                  )}
                  {project.url && (
                    <a
                      className="mt-[.65em] block truncate text-inherit no-underline"
                      dir="ltr"
                      href={getExternalHref(project.url)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {project.url}
                    </a>
                  )}
                  {project.technologies && (
                    <div className="mt-[.7em] flex flex-wrap gap-[.4em]">
                      {project.technologies
                        .split(/،|,/)
                        .map((technology) => technology.trim())
                        .filter(Boolean)
                        .map((technology) => (
                          <span
                            className="rounded-[.3em] border border-current/20 px-[.5em] py-[.25em] text-inherit"
                            key={technology}
                          >
                            {technology}
                          </span>
                        ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {educations.length > 0 && (
          <section>
            <MatrixHeading accent={accent}>
              {presentation.labels.education}
            </MatrixHeading>
            <div className="mt-[1.2em] grid gap-[.8em]">
              {educations.map((education) => (
                <article
                  className="flex items-center gap-[1em] rounded-[.7em] border border-white/10 bg-[#1a1b27] p-[1.1em] text-[.68em]"
                  key={education.id}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-[2.5em] shrink-0 place-items-center rounded-[.45em] font-black text-[#0e0f16]",
                      accent.background,
                    )}
                  >
                    ◈
                  </span>
                  <InlineEducationDetails
                    education={education}
                    direction={presentation.dir}
                    className="flex-1"
                    credentialClassName="text-[1.05em] text-white"
                    institutionClassName="text-[1em]"
                    dateClassName={cn("text-[1em] font-bold", accent.text)}
                  />
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </article>
  );
}

function CenterlineHeading({
  children,
  palette,
  markerSide = "end",
}: {
  children: string;
  palette: (typeof colorPalettes)[ResumeColorId];
  markerSide?: "start" | "end";
}) {
  return (
    <div data-resume-section-heading className="relative">
      <h2
        className={cn(
          "m-0 text-[1.05em] font-bold uppercase tracking-[.18em]",
          palette.text,
        )}
      >
        {children}
      </h2>
      <i
        className={cn(
          "absolute top-1/2 z-1 size-[.55em] -translate-y-1/2 rounded-full",
          markerSide === "end"
            ? "end-[calc(-2em-.275em-.5px)]"
            : "start-[calc(-2em-.275em+.5px)]",
          palette.dot,
        )}
      />
    </div>
  );
}

function CenterlineMarketingResume({
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

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "px-[5%] pb-[7%] pt-[4%] text-[#333]",
      )}
    >
      {!continuation && (
        <header
          className={cn(
            "flex h-[12%] flex-col items-center justify-center text-center text-white",
            palette.background,
          )}
        >
          <h1 className="m-0 text-[2.3em] font-normal uppercase tracking-[.16em]">
            <ResumeFullName fullName={data.fullName} />
          </h1>
          <p className="mb-0 mt-[.45em] text-[1.05em] uppercase tracking-[.04em]">
            {data.jobTitle}
          </p>
        </header>
      )}

      <div
        className={cn(
          "relative grid grid-cols-2 gap-[4em] px-[3%]",
          continuation ? "pt-[7%]" : "pt-[4%]",
          "after:absolute after:inset-y-0 after:start-1/2 after:w-px after:bg-[#d9dddb] after:content-['']",
        )}
      >
        <aside data-resume-flow="sidebar" className="grid content-start gap-[2.8em] text-end">
          {!continuation && (
            <ProfilePhoto
              data={data}
              className={cn(
                "mx-auto size-[8em] rounded-full border-[.35em] bg-white shadow-md",
                palette.border,
              )}
            />
          )}
          {data.summary && (
            <section>
              <CenterlineHeading palette={palette}>
                {presentation.dir === "ltr" ? "Summary" : "خلاصه"}
              </CenterlineHeading>
              <p className="mb-0 mt-[1.1em] text-[.72em] leading-[1.55]">
                {data.summary}
              </p>
            </section>
          )}
          {educations.length > 0 && (
                <section>
                  <CenterlineHeading palette={palette}>
                    {presentation.labels.education}
                  </CenterlineHeading>
                  <div className="mt-[1.1em] grid gap-[1em] text-[.7em] leading-[1.5]">
                    {educations.map((education) => (
                      <article key={education.id}>
                        <InlineEducationDetails
                          education={education}
                          direction={presentation.dir}
                          credentialClassName="text-[1em]"
                          institutionClassName="text-[1em]"
                          dateClassName="text-[1em] text-inherit"
                        />
                      </article>
                    ))}
                  </div>
                </section>
          )}
          {skills.length > 0 && (
                <section>
                  <CenterlineHeading palette={palette}>
                    {presentation.labels.skills}
                  </CenterlineHeading>
                  <div className="mt-[1.2em] grid gap-[.75em] text-[.68em]">
                    {skills.map((skill, index) => (
                      <div className="grid grid-cols-[1fr_7em_2.5em] items-center gap-[.7em]" key={skill}>
                        <span>{skill}</span>
                        <span className="h-[3px] bg-[#e1e4e2]">
                          <i className={cn("block h-full", index % 3 === 1 ? "w-3/4" : "w-[88%]", palette.background)} />
                        </span>
                        <strong className={palette.text}>{index % 3 === 1 ? "75%" : "90%"}</strong>
                      </div>
                    ))}
                  </div>
                </section>
          )}
          {data.languages && (
                <section>
                  <CenterlineHeading palette={palette}>
                    {presentation.labels.languages}
                  </CenterlineHeading>
                  <LanguageList
                    languages={data.languages}
                    direction={presentation.dir}
                    className="mt-[1em] text-[.7em] leading-[1.5]"
                  />
                </section>
          )}
        </aside>

        <main data-resume-flow="main" className="grid content-start gap-[2.8em]">
          {!continuation && (
            <section>
              <CenterlineHeading markerSide="start" palette={palette}>
                {presentation.dir === "ltr" ? "Contact" : "اطلاعات تماس"}
              </CenterlineHeading>
              <div className="mt-[1.1em] grid gap-[.5em] text-[.7em] leading-[1.4]">
                {data.phone && <ResumeContactLink value={data.phone} type="phone" className="text-left" />}
                {data.email && <span dir="ltr">{data.email}</span>}
                {data.location && <span>{data.location}</span>}
                {data.website && (
                  <ResumeContactLink
                    value={data.website}
                    type="website"
                    direction={presentation.dir}
                  />
                )}
              </div>
            </section>
          )}
          {experiences.length > 0 && (
            <section>
              {!continuation && (
                <CenterlineHeading markerSide="start" palette={palette}>
                  {presentation.labels.experience}
                </CenterlineHeading>
              )}
              <div className={cn("grid gap-[1.35em]", !continuation && "mt-[1.1em]") }>
                {experiences.map((experience) => (
                  <article className="text-[.7em] leading-[1.5]" key={experience.id}>
                    <time className={cn("font-bold", palette.text)}>
                      {formatDateRange(experience, presentation.dir)}
                    </time>
                    <strong className="mt-[.25em] block">{experience.jobTitle}</strong>
                    <span className="block">{[experience.company, experience.location].filter(Boolean).join(", ")}</span>
                    <p className="mb-0 mt-[.55em] whitespace-pre-line text-[#666]">{experience.description}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <CenterlineHeading markerSide="start" palette={palette}>
                {presentation.labels.projects}
              </CenterlineHeading>
            }
          />
        </main>
      </div>
    </article>
  );
}

function PastelBandHeading({
  children,
  palette,
}: {
  children: string;
  palette: (typeof colorPalettes)[ResumeColorId];
}) {
  return (
    <h2
      className={cn(
        "m-0 px-[.8em] py-[.35em] text-[1em] font-bold uppercase tracking-[.12em] text-white",
        palette.background,
      )}
    >
      {children}
    </h2>
  );
}

function PastelTimelineBlock({
  children,
  className,
  palette,
}: {
  children: ReactNode;
  className?: string;
  palette: (typeof colorPalettes)[ResumeColorId];
}) {
  return (
    <div className={cn("relative", className)}>
      <i
        aria-hidden="true"
        className={cn(
          "absolute start-[calc(-5.7%-.275em)] top-[.275em] size-[.55em] border bg-white/70",
          palette.border,
        )}
      />
      {children}
    </div>
  );
}

function PastelGraduateResume({
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

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        "grid grid-cols-[31%_69%] text-[#2b2928]",
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        palette.softBackground,
      )}
    >
      <aside data-resume-flow="sidebar" className="mx-[13%] bg-white/55 px-[8%] pb-[8%] pt-[5%]">
        {!continuation && (
          <>
            <ProfilePhoto
              data={data}
              className="mx-auto size-[12em] rounded-full border-[.35em] border-white bg-white shadow-sm"
            />
            <section className="mt-[3em]">
              <h2 className={cn("m-0 border-b pb-[.35em] text-[1em] font-bold uppercase tracking-[.12em]", palette.border)}>
                {presentation.dir === "ltr" ? "Contact" : "اطلاعات تماس"}
              </h2>
              <div className="mt-[1em] grid gap-[.8em] text-[.72em] leading-[1.4]">
                {data.phone && <ResumeContactLink value={data.phone} type="phone" className="text-left" />}
                {data.email && <span dir="ltr" className="break-all">{data.email}</span>}
                {data.location && <span>{data.location}</span>}
                {data.website && (
                  <ResumeContactLink
                    value={data.website}
                    type="website"
                    direction={presentation.dir}
                    className="break-all"
                  />
                )}
              </div>
            </section>
          </>
        )}
        {skills.length > 0 && (
              <section className="mt-[3em]">
                <h2 className={cn("m-0 border-b pb-[.35em] text-[1em] font-bold uppercase tracking-[.12em]", palette.border)}>
                  {presentation.labels.skills}
                </h2>
                <ul className="mb-0 mt-[1em] grid list-none gap-[.65em] p-0 text-[.76em] leading-[1.4]">
                  {skills.map((skill) => (
                    <li key={skill}>
                      <ResumeSkillBullet>{skill}</ResumeSkillBullet>
                    </li>
                  ))}
                </ul>
              </section>
        )}
        {data.languages && (
              <section className="mt-[3em]">
                <h2 className={cn("m-0 border-b pb-[.35em] text-[1em] font-bold uppercase tracking-[.12em]", palette.border)}>
                  {presentation.labels.languages}
                </h2>
                <LanguageList
                  languages={data.languages}
                  direction={presentation.dir}
                  className="mt-[1em] text-[.76em] leading-[1.55]"
                />
              </section>
        )}
      </aside>

      <main data-resume-flow="main" className={cn("px-[7%] pb-[7%]", continuation ? "pt-[7%]" : "pt-[9%]") }>
        {!continuation && (
          <header className="mb-[5em]">
            <h1 className="m-0 text-[2.3em] font-light uppercase tracking-[.16em]">
              <ResumeFullName fullName={data.fullName} />
            </h1>
            <p className="mb-0 mt-[1.2em] text-[1.05em] uppercase tracking-[.04em]">
              {data.jobTitle}
            </p>
          </header>
        )}

        <div className="relative">
          <i
            aria-hidden="true"
            className={cn(
              "absolute start-[calc(-5.7%-.5px)] bottom-[.55em] top-[.55em] w-px",
              palette.background,
            )}
          />
          {data.summary && (
            <PastelTimelineBlock className="mb-[3em]" palette={palette}>
              <section>
                <PastelBandHeading palette={palette}>
                  {presentation.dir === "ltr" ? "Professional Profile" : "پروفایل حرفه‌ای"}
                </PastelBandHeading>
                <p className="mb-0 mt-[1.5em] text-[.76em] leading-[1.6]">{data.summary}</p>
              </section>
            </PastelTimelineBlock>
          )}

          {experiences.length > 0 && (
            <PastelTimelineBlock palette={palette}>
              <section>
                {!continuation && (
                  <PastelBandHeading palette={palette}>{presentation.labels.experience}</PastelBandHeading>
                )}
                <div className={cn("grid gap-[1.35em]", !continuation && "mt-[1.5em]") }>
                  {experiences.map((experience) => (
                    <article className="text-[.78em] leading-[1.52]" key={experience.id}>
                      <strong className="block">{experience.company}</strong>
                      <span className="block">{experience.jobTitle}</span>
                      <time className="block">{formatDateRange(experience, presentation.dir)}</time>
                      <p className="mb-0 mt-[.65em] whitespace-pre-line">{experience.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            </PastelTimelineBlock>
          )}
          {getResumeProjects(data).length > 0 && (
            <PastelTimelineBlock className="mt-[3em]" palette={palette}>
              <ProjectSection
                data={data}
                direction={presentation.dir}
                heading={
                  <PastelBandHeading palette={palette}>
                    {presentation.labels.projects}
                  </PastelBandHeading>
                }
              />
            </PastelTimelineBlock>
          )}
          {educations.length > 0 && (
            <PastelTimelineBlock className="mt-[3em]" palette={palette}>
              <section>
                <PastelBandHeading palette={palette}>{presentation.labels.education}</PastelBandHeading>
                <div className="mt-[1.5em] grid gap-[1.2em] text-[.76em] leading-[1.5]">
                  {educations.map((education) => (
                    <article key={education.id}>
                      <InlineEducationDetails
                        education={education}
                        direction={presentation.dir}
                        credentialClassName="text-[1em]"
                        institutionClassName="text-[1em]"
                        dateClassName="text-[1em] text-inherit"
                      />
                    </article>
                  ))}
                </div>
              </section>
            </PastelTimelineBlock>
          )}
        </div>
      </main>
    </article>
  );
}

function SplitProfileHeading({ children }: { children: string }) {
  return (
    <h2 className="m-0 text-[1em] font-black uppercase tracking-[.12em] leading-[1.2]">
      {children}
    </h2>
  );
}

function LinkedInContactIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M5.4 8.4H2.2V21h3.2V8.4ZM3.8 3A1.9 1.9 0 1 0 3.8 6.8 1.9 1.9 0 0 0 3.8 3ZM21.8 13.8c0-3.8-2-5.6-4.8-5.6-2.2 0-3.2 1.2-3.8 2.1V8.4H10V21h3.2v-6.2c0-1.7.3-3.3 2.4-3.3 2 0 2.1 1.9 2.1 3.4V21h3.2l.9-7.2Z" />
    </svg>
  );
}

function SplitProfileResume({
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
  const contactItems = [
    {
      value: data.phone,
      Icon: Phone,
      forceLtr: true,
      href: data.phone ? getPhoneHref(data.phone) : "",
      external: false,
    },
    { value: data.email, Icon: Mail, forceLtr: true, href: "", external: false },
    { value: data.location, Icon: MapPin, forceLtr: false, href: "", external: false },
    {
      value: data.website,
      Icon: LinkedInContactIcon,
      forceLtr: true,
      href: data.website ? getExternalHref(data.website) : "",
      external: true,
    },
  ].filter((item) => item.value);

  return (
    <article
      dir="ltr"
      className={cn(
        documentClass(compact),
        "grid grid-cols-[61%_39%] text-[#292929]",
        presentation.dir === "rtl"
          ? "!font-resume-rtl"
          : "!font-resume-latin",
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 end-0 w-[39%]",
          palette.softBackground,
        )}
      />
      <div
        className={cn(
          "relative z-1 grid",
          continuation ? "grid-rows-1" : "grid-rows-[auto_1fr]",
        )}
        dir={presentation.dir}
      >
        {!continuation && (
          <header
            className={cn(
              "relative px-[7%] pb-[5%] pt-[8%] before:pointer-events-none before:absolute before:inset-0 before:bg-white/55 before:content-[''] [&>*]:relative [&>*]:z-[1]",
              palette.softBackground,
            )}
          >
              <h1 className="m-0 w-full text-[2.3em] font-black uppercase leading-[1.02]">
                <ResumeFullName fullName={data.fullName} />
              </h1>
              <p className="mb-0 mt-[.55em] text-[1.05em] uppercase tracking-[.04em]">
                {data.jobTitle}
              </p>
              <i className="mt-[.75em] block w-[3.2em] border-b-2 border-[#454545]" />
              <div className="mt-[2em] grid grid-cols-2 gap-x-[2.2em] gap-y-[1em] text-[.72em] leading-[1.4]">
                {contactItems.map(({ value, Icon, forceLtr, href, external }) => (
                  <div className="flex min-w-0 items-center gap-[.8em]" key={value}>
                    <i className={cn("grid size-[2em] shrink-0 place-items-center rounded-full text-white", palette.background)}>
                      <Icon aria-hidden="true" className="size-[1.15em]" strokeWidth={2.4} />
                    </i>
                    {href ? (
                      <a
                        className={cn(
                          "min-w-0 flex-1 truncate text-inherit no-underline",
                          external ? "text-start" : "text-left",
                        )}
                        data-resume-linkedin={external || undefined}
                        dir={external ? presentation.dir : "ltr"}
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer" : undefined}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {external
                          ? getLinkedInProfileLabel(presentation.dir)
                          : value}
                      </a>
                    ) : forceLtr ? (
                      <bdi dir="ltr" className="truncate text-left">{value}</bdi>
                    ) : (
                      <span className="truncate" dir="auto">{value}</span>
                    )}
                  </div>
                ))}
              </div>
          </header>
        )}

        <main data-resume-flow="main" className="px-[7%] pb-[6%] pt-[5.5%]">
          {experiences.length > 0 && (
            <section>
              {!continuation && (
                <SplitProfileHeading>{presentation.labels.experience}</SplitProfileHeading>
              )}
              <div
                className={cn(
                  "grid gap-[1.55em]",
                  !continuation && "mt-[1.5em] content-start",
                )}
              >
                {experiences.map((experience) => (
                  <article className="text-[.78em] leading-[1.52]" key={experience.id}>
                    <strong className="block">
                      {[experience.jobTitle, experience.company].filter(Boolean).join(" · ")}
                    </strong>
                    <time className="mt-[.2em] block italic">
                      {formatDateRange(experience, presentation.dir)}
                      {experience.location ? ` · ${experience.location}` : ""}
                    </time>
                    <ul className={cn("mb-0 mt-[.7em] grid gap-[.4em]", presentation.dir === "rtl" ? "pr-[1.35em]" : "pl-[1.35em]") }>
                      {experience.description
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((item, index) => <li key={`${experience.id}-${index}`}>{item}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <SplitProfileHeading>
                {presentation.labels.projects}
              </SplitProfileHeading>
            }
            className="mt-[3em]"
          />
        </main>
      </div>

      <aside
        data-resume-flow="sidebar"
        className="relative z-1 px-[10%] pb-[7%] pt-[4%]"
        dir={presentation.dir}
      >
        {!continuation && (
          <ProfilePhoto
            data={data}
            className="mx-auto size-[8.2em] rounded-full border-[.32em] border-white bg-transparent shadow-none [&_img]:rounded-full print:bg-transparent print:shadow-none"
          />
        )}
        {data.summary && (
          <section className={continuation ? "mt-[2em]" : "mt-[2.35em]"}>
            <SplitProfileHeading>
              {presentation.dir === "ltr" ? "Professional Profile" : "پروفایل حرفه‌ای"}
            </SplitProfileHeading>
            <p className="mb-0 mt-[1.1em] text-[.76em] leading-[1.6]">
              {data.summary}
            </p>
          </section>
        )}
        {educations.length > 0 && (
              <section className="mt-[3.4em]">
                <SplitProfileHeading>{presentation.labels.education}</SplitProfileHeading>
                <EducationEntries
                  data={data}
                  direction={presentation.dir}
                  className="mt-[1.1em] text-[.76em] leading-[1.5]"
                />
              </section>
        )}
        {skills.length > 0 && (
              <section className="mt-[3.4em]">
                <SplitProfileHeading>{presentation.labels.skills}</SplitProfileHeading>
                <ul className="mb-0 mt-[1.1em] grid list-none gap-[.55em] p-0 text-[.76em] leading-[1.4]">
                  {skills.map((skill) => (
                    <li key={skill}>
                      <ResumeSkillBullet>{skill}</ResumeSkillBullet>
                    </li>
                  ))}
                </ul>
              </section>
        )}
        {data.languages && (
              <section className="mt-[3.8em]">
                <SplitProfileHeading>{presentation.labels.languages}</SplitProfileHeading>
                <LanguageList
                  languages={data.languages}
                  direction={presentation.dir}
                  className="mt-[1.1em] text-[.76em] leading-[1.55]"
                />
              </section>
        )}
      </aside>
    </article>
  );
}

function CorporateBarHeading({
  children,
  palette,
}: {
  children: string;
  palette: (typeof colorPalettes)[ResumeColorId];
}) {
  return (
    <h2
      className={cn(
        "m-0 py-[.2em] text-center text-[1.08em] font-normal uppercase leading-[1.15] text-white",
        palette.background,
      )}
    >
      {children}
    </h2>
  );
}

function CorporateCompetenciesResume({
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
  const competencyGroupSize = Math.max(1, Math.ceil(skills.length / 3));
  const competencyGroups = [
    {
      title: presentation.dir === "ltr" ? "Design Expertise" : "تخصص‌های حرفه‌ای",
      items: skills.slice(0, competencyGroupSize),
    },
    {
      title: presentation.dir === "ltr" ? "Software Skills" : "مهارت‌های تخصصی",
      items: skills.slice(competencyGroupSize, competencyGroupSize * 2),
    },
    {
      title: presentation.dir === "ltr" ? "Leadership Strengths" : "توانمندی‌های رهبری",
      items: skills.slice(competencyGroupSize * 2),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        "px-[6.2%] pb-[4.5%] pt-[2.8%] text-[#171717]",
        compact ? "!text-[5.64px]" : "!text-[15.543307px]",
      )}
    >
      {!continuation && (
        <>
          <header className="py-[2.25em] text-center">
            <h1 className="m-0 text-[2.2em] font-black uppercase leading-none">
              <ResumeFullName fullName={data.fullName} />
            </h1>
            <div className="mx-auto mt-[1.55em] grid max-w-[48em] grid-cols-2 gap-x-[2em] gap-y-[.8em] text-[.78em] font-semibold">
              {data.location && (
                <span className="inline-flex min-w-0 items-center justify-center gap-[.5em]">
                  <i className="grid size-[2.1em] shrink-0 place-items-center rounded-full border border-[#4d4d4d]">
                    <MapPin aria-hidden="true" className="size-[1.05em]" />
                  </i>
                  {data.location}
                </span>
              )}
              {data.phone && (
                <span className="inline-flex min-w-0 items-center justify-center gap-[.5em]">
                  <i className="grid size-[2.1em] shrink-0 place-items-center rounded-full border border-[#4d4d4d]">
                    <Phone aria-hidden="true" className="size-[1.05em]" />
                  </i>
                  <ResumeContactLink value={data.phone} type="phone" className="text-left" />
                </span>
              )}
              {data.email && (
                <span className="inline-flex min-w-0 items-center justify-center gap-[.5em]" dir="ltr">
                  <i className="grid size-[2.1em] shrink-0 place-items-center rounded-full border border-[#4d4d4d]">
                    <Mail aria-hidden="true" className="size-[1.05em]" />
                  </i>
                  {data.email}
                </span>
              )}
              {data.website && (
                <span className="inline-flex min-w-0 items-center justify-center gap-[.5em]" dir="ltr">
                  <i className="grid size-[2.1em] shrink-0 place-items-center rounded-full border border-[#4d4d4d]">
                    <LinkedInContactIcon aria-hidden="true" className="block size-[1.05em] -translate-y-[.06em]" />
                  </i>
                  <ResumeContactLink
                    value={data.website}
                    type="website"
                    direction={presentation.dir}
                    className="truncate"
                  />
                </span>
              )}
            </div>
          </header>
        </>
      )}
      {data.summary && (
        <section className={continuation ? "mt-[1em]" : "mt-[1.35em]"}>
          <CorporateBarHeading palette={palette}>
            {presentation.dir === "ltr"
              ? "Professional Summary"
              : "خلاصه حرفه‌ای"}
          </CorporateBarHeading>
          <p className="mb-0 mt-[1.05em] min-h-[5em] text-[.9em] font-normal leading-[1.55]">
            {data.summary}
          </p>
        </section>
      )}

      <div className={continuation ? "pt-[5%]" : "mt-[2.35em]"}>
        {experiences.length > 0 && (
          <section>
            {!continuation && (
              <CorporateBarHeading palette={palette}>
                {presentation.labels.experience}
              </CorporateBarHeading>
            )}
            <div
              className={cn(
                "grid gap-[1.25em]",
                !continuation && "mt-[1.35em]",
                !continuation &&
                  skills.length > 0 &&
                  "grid-cols-[1fr_30%]",
              )}
              dir="ltr"
            >
              <div
                className="grid content-start gap-[1.15em]"
                dir={presentation.dir}
              >
                {experiences.map((experience) => (
                  <article
                    className="border-b border-[#cbcbcb] pb-[1.05em] text-[.88em] leading-[1.48]"
                    key={experience.id}
                  >
                    <strong className={cn("block", palette.text)}>
                      {experience.jobTitle}
                    </strong>
                    <p className="mb-0 mt-[.5em] font-bold">
                      {[experience.company, formatDateRange(experience, presentation.dir)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <ul className={cn("mb-0 mt-[.65em] grid gap-[.38em]", presentation.dir === "rtl" ? "pr-[1.35em]" : "pl-[1.35em]") }>
                      {experience.description
                        .split("\n")
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((item, index) => <li key={`${experience.id}-${index}`}>{item}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
              {!continuation && skills.length > 0 && (
                <aside
                  className={cn("min-h-[30em] px-[1em] py-[1.6em]", palette.softBackground)}
                  dir={presentation.dir}
                >
                  <h3 className="m-0 text-center text-[.76em] font-bold uppercase">
                    {presentation.dir === "ltr" ? "Core Competencies" : "شایستگی‌های کلیدی"}
                  </h3>
                  <div className="mt-[1.2em] grid gap-[1.25em]">
                    {competencyGroups.map((group) => (
                          <section className="border-b border-[#cbcbcb] pb-[1em] last:border-b-0" key={group.title}>
                            <h4 className={cn("m-0 pb-[.35em] text-[.86em] font-semibold", palette.text)}>
                              {group.title}
                            </h4>
                            <ul className="mb-0 mt-[.75em] grid list-none gap-[.55em] p-0 text-[.78em] leading-[1.45]">
                          {group.items.map((skill) => (
                            <li key={skill}>
                              <ResumeSkillBullet>{skill}</ResumeSkillBullet>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </section>
        )}

        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <CorporateBarHeading palette={palette}>
              {presentation.labels.projects}
            </CorporateBarHeading>
          }
          className="mt-[2.65em]"
        />

        {(educations.length > 0 || data.languages) && (
          <div className="mt-[2.65em] grid min-h-[10.5em] grid-cols-2 gap-[1.35em] pt-[.7em]" dir="ltr">
            {educations.length > 0 && (
              <section dir={presentation.dir}>
                <CorporateBarHeading palette={palette}>{presentation.labels.education}</CorporateBarHeading>
                <EducationEntries
                  data={data}
                  direction={presentation.dir}
                  className="mt-[.8em] text-[.85em] leading-[1.5]"
                />
              </section>
            )}
            {data.languages && (
              <section dir={presentation.dir}>
                <CorporateBarHeading palette={palette}>{presentation.labels.languages}</CorporateBarHeading>
                <LanguageList
                  languages={data.languages}
                  direction={presentation.dir}
                  className="mt-[.8em] grid-cols-2 text-[.85em] leading-[1.5]"
                  emphasizeName
                />
              </section>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ProfileBandResume({
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

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "px-[12%] pb-[8%] text-[#171717]",
      )}
    >
      {!continuation && (
        <>
          <header
            className={cn(
              "relative -mx-[15.8%] mt-[10%] flex h-[8.5%] items-center justify-center px-[18%] text-white",
              palette.background,
            )}
          >
            <ProfilePhoto
              data={data}
              className="absolute start-[12%] size-[8.5em] rounded-full border-[.45em] border-white/55 bg-[#e8ecea] shadow-sm"
            />
            <h1
              className="m-0 w-full min-w-0 break-words ps-[9.5em] text-center text-[2.3em] font-bold leading-[1.08] text-balance"
            >
              <ResumeFullName fullName={data.fullName} />
            </h1>
          </header>
          <div className="grid min-w-0 grid-cols-2 gap-[2em] py-[1.2em] ps-[13em] text-[.7em] leading-[1.5]">
            <div className="grid min-w-0 gap-[.65em]">
              {data.location && (
                <span className="flex min-w-0 items-center gap-[.65em]">
                  <MapPin className={cn("size-[1.15em] shrink-0", palette.text)} />
                  <span className="truncate">{data.location}</span>
                </span>
              )}
              {data.phone && (
                <span className="flex min-w-0 items-center gap-[.65em]">
                  <Phone className={cn("size-[1.15em] shrink-0", palette.text)} />
                  <ResumeContactLink
                    value={data.phone}
                    type="phone"
                    className="truncate text-left"
                  />
                </span>
              )}
            </div>
            <div className="grid min-w-0 gap-[.65em] text-end">
              {data.email && (
                <span className="flex min-w-0 items-center gap-[.65em]">
                  <Mail className={cn("size-[1.15em] shrink-0", palette.text)} />
                  <bdi className="truncate text-left" dir="ltr">
                    {data.email}
                  </bdi>
                </span>
              )}
              {data.website && (
                <span className="flex min-w-0 items-center gap-[.65em]">
                  <LinkedInContactIcon
                    className={cn("size-[1.15em] shrink-0", palette.text)}
                  />
                  <ResumeContactLink
                    value={data.website}
                    type="website"
                    direction={presentation.dir}
                    className="truncate"
                  />
                </span>
              )}
            </div>
          </div>
        </>
      )}

      <main
        className={cn(
          "grid content-start gap-[2.5em]",
          continuation ? "pt-[8%]" : "pt-[2.5em]",
        )}
      >
        {data.summary && (
          <p className="m-0 text-[.78em] font-normal leading-[1.55]">
            {data.summary}
          </p>
        )}

        {experiences.length > 0 && (
          <section>
            {!continuation && (
              <ProfileBandHeading palette={palette}>
                {presentation.labels.experience}
              </ProfileBandHeading>
            )}
            <div className={cn("grid gap-[1.25em]", !continuation && "mt-[1em]")}>
              {experiences.map((experience) => {
                const bullets = experience.description
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean);
                return (
                  <article
                    className="grid grid-cols-[7em_1fr] gap-[1.2em] text-[.75em] leading-[1.4]"
                    key={experience.id}
                  >
                    <time className="pt-[.1em] leading-[1.25]">
                      {formatDateRange(experience, presentation.dir)}
                    </time>
                    <div>
                      <div className="flex items-start justify-between gap-[1.5em]">
                        <strong>{experience.jobTitle}</strong>
                        <em className="text-end">
                          {[experience.company, experience.location]
                            .filter(Boolean)
                            .join(", ")}
                        </em>
                      </div>
                      {bullets.length > 0 && (
                        <ul
                          className={cn(
                            "mb-0 mt-[.45em] grid gap-[.25em] marker:font-bold",
                            palette.text,
                            presentation.dir === "rtl"
                              ? "pr-[1.5em]"
                              : "pl-[1.5em]",
                          )}
                        >
                          {bullets.map((bullet, index) => (
                            <li key={`${experience.id}-${index}`}>
                              <span className="text-[#171717]">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <ProjectSection
          data={data}
          direction={presentation.dir}
          heading={
            <ProfileBandHeading palette={palette}>
              {presentation.labels.projects}
            </ProfileBandHeading>
          }
        />

        {educations.length > 0 && (
          <section>
            <ProfileBandHeading palette={palette}>
              {presentation.labels.education}
            </ProfileBandHeading>
            <div className="mt-[1em] grid gap-[.8em]">
              {educations.map((education) => (
                <article
                  className="text-[.75em] leading-[1.45]"
                  key={education.id}
                >
                  <InlineEducationDetails
                    education={education}
                    direction={presentation.dir}
                    credentialClassName="text-[1em]"
                    institutionClassName="text-[1em]"
                    dateClassName="text-[1em] text-inherit"
                  />
                </article>
              ))}
            </div>
          </section>
        )}

        {skills.length > 0 && (
          <section>
            <ProfileBandHeading palette={palette}>
              {presentation.labels.skills}
            </ProfileBandHeading>
            <ul
              className="mb-0 mt-[1em] grid list-none grid-cols-2 gap-x-[3em] gap-y-[.45em] p-0 text-[.75em]"
            >
              {skills.map((skill) => (
                <li key={skill}>
                  <ResumeSkillBullet className="text-[#171717]">
                    {skill}
                  </ResumeSkillBullet>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.languages && (
          <section>
            <ProfileBandHeading palette={palette}>
              {presentation.labels.languages}
            </ProfileBandHeading>
            <LanguageList
              languages={data.languages}
              direction={presentation.dir}
              className="mt-[1em] grid-cols-2 gap-x-[3em] text-[.75em] leading-[1.5]"
            />
          </section>
        )}
      </main>
    </article>
  );
}

function AngularTechnicalHeading({
  children,
  icon,
  palette,
}: {
  children: string;
  icon: ReactNode;
  palette: (typeof colorPalettes)[ResumeColorId];
}) {
  return (
    <div
      data-resume-section-heading
      className={cn(
        "flex items-center gap-[.8em] border-b pb-[.5em]",
        palette.border,
      )}
    >
      <span className="grid size-[1.7em] shrink-0 place-items-center text-[#626565]">
        {icon}
      </span>
      <h2 className="m-0 text-[1.28em] font-bold text-[#5d5f60]">{children}</h2>
    </div>
  );
}

function AngularTechnicalEducation({
  educations,
  palette,
  presentation,
}: {
  educations: ResumeEducation[];
  palette: (typeof colorPalettes)[ResumeColorId];
  presentation: ReturnType<typeof getResumePresentation>;
}) {
  if (!educations.length) return null;

  return (
    <section>
      <AngularTechnicalHeading
        icon={<GraduationCap className="size-[1.2em]" />}
        palette={palette}
      >
        {presentation.labels.education}
      </AngularTechnicalHeading>
      <div className="mt-[1.35em] grid gap-[1.15em]">
        {educations.map((education) => (
          <article
            className="relative ps-[1.45em] text-[.74em] leading-[1.5]"
            key={education.id}
          >
            <i
              aria-hidden="true"
              className={cn(
                "absolute start-0 top-[.35em] bottom-0 border-s",
                palette.border,
              )}
            />
            <i
              aria-hidden="true"
              className={cn(
                "absolute -start-[.35em] top-0 size-[.7em] rounded-full",
                palette.dot,
              )}
            />
            <InlineEducationDetails
              education={education}
              direction={presentation.dir}
              credentialClassName="text-[1.05em]"
              institutionClassName="text-[1em] italic"
              dateClassName="text-[1em] text-inherit"
            />
          </article>
        ))}
      </div>
    </section>
  );
}

function AngularTechnicalResume({
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
  const projects = getResumeProjects(data);
  const skills = data.skills
    .split(/،|,/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  return (
    <article
      dir={presentation.dir}
      className={cn(
        documentClass(compact),
        compact ? "!text-[5.6px]" : "!text-[15.433071px]",
        "grid grid-cols-[38%_62%] text-[#5f6162]",
      )}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 start-0 w-[38%] bg-[#f4f4f4]"
      >
        {!continuation && (
          <i
            className={cn(
              "absolute inset-x-0 top-0 h-[27%]",
              presentation.dir === "rtl"
                ? "[clip-path:polygon(0_0,100%_0,100%_100%)]"
                : "[clip-path:polygon(0_0,100%_0,0_100%)]",
              palette.background,
            )}
          />
        )}
      </div>
      <aside data-resume-flow="sidebar" className="relative z-1 px-[12%] pb-[7%] pt-[5%]">
        {!continuation && (
          <>
            <ProfilePhoto
              data={data}
              className="relative z-1 mx-auto mt-[1em] size-[12em] rounded-full border-[.55em] border-white bg-white shadow-sm"
            />
            <header className="relative z-1 mt-[2.2em] text-center">
              <h1 className={cn("m-0 text-[2.25em] font-normal leading-[1.05]", palette.text)}>
                <ResumeFullName fullName={data.fullName} />
              </h1>
              <p className="mb-0 mt-[.65em] text-[1em]">{data.jobTitle}</p>
            </header>

            <section className="mt-[3.2em]">
              <AngularTechnicalHeading
                icon={<Phone className="size-[1.15em]" />}
                palette={palette}
              >
                {presentation.labels.contact}
              </AngularTechnicalHeading>
              <div className="mt-[1.25em] grid gap-[.9em] text-[.72em] leading-[1.45]">
                {data.phone && (
                  <span className="flex items-center gap-[.8em]">
                    <Phone className={cn("size-[1.2em] shrink-0", palette.text)} />
                    <ResumeContactLink value={data.phone} type="phone" />
                  </span>
                )}
                {data.email && (
                  <span className="flex items-center gap-[.8em]" dir="ltr">
                    <Mail className={cn("size-[1.2em] shrink-0", palette.text)} />
                    <span className="break-all">{data.email}</span>
                  </span>
                )}
                {data.location && (
                  <span className="flex items-center gap-[.8em]">
                    <MapPin className={cn("size-[1.2em] shrink-0", palette.text)} />
                    <span>{data.location}</span>
                  </span>
                )}
                {data.website && (
                  <span className="flex items-center gap-[.8em]" dir="ltr">
                    <Globe2 className={cn("size-[1.2em] shrink-0", palette.text)} />
                    <ResumeContactLink
                      value={data.website}
                      type="website"
                      direction={presentation.dir}
                      className="break-all"
                    />
                  </span>
                )}
              </div>
            </section>
          </>
        )}

        {data.summary && (
          <section className={continuation ? "mt-[2em]" : "mt-[3em]"}>
            <AngularTechnicalHeading
              icon={<UserRound className="size-[1.15em]" />}
              palette={palette}
            >
              {presentation.labels.about}
            </AngularTechnicalHeading>
            <p className="mb-0 mt-[1.15em] text-[.74em] leading-[1.75]">
              {data.summary}
            </p>
          </section>
        )}

        {skills.length > 0 && (
          <section className={continuation ? "mt-[2em]" : "mt-[3em]"}>
            <AngularTechnicalHeading
              icon={<Puzzle className="size-[1.15em]" />}
              palette={palette}
            >
              {presentation.labels.skills}
            </AngularTechnicalHeading>
            <ul className="mb-0 mt-[1.15em] grid list-none gap-[.65em] p-0 text-[.74em] leading-[1.45]">
              {skills.map((skill) => (
                <li key={skill}>
                  <ResumeSkillBullet>{skill}</ResumeSkillBullet>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.languages && (
          <section className="mt-[3em]">
            <AngularTechnicalHeading
              icon={<Globe2 className="size-[1.15em]" />}
              palette={palette}
            >
              {presentation.labels.languages}
            </AngularTechnicalHeading>
            <LanguageList
              languages={data.languages}
              direction={presentation.dir}
              emphasizeName
              className="mt-[1.1em] text-[.74em] leading-[1.55]"
            />
          </section>
        )}
      </aside>

      <main data-resume-flow="main" className={cn("grid content-start gap-[2.8em] px-[8%] pb-[7%]", continuation ? "pt-[7%]" : "pt-[6%]") }>
        {experiences.length > 0 && (
          <section>
            {!continuation && (
              <AngularTechnicalHeading
                icon={<BriefcaseBusiness className="size-[1.2em]" />}
                palette={palette}
              >
                {presentation.labels.experience}
              </AngularTechnicalHeading>
            )}
            <div className={cn("grid gap-[1.35em]", !continuation && "mt-[1.35em]") }>
              {experiences.map((experience) => (
                <article className="relative ps-[1.45em] text-[.74em] leading-[1.5]" key={experience.id}>
                  <i aria-hidden="true" className={cn("absolute start-0 top-[.35em] bottom-0 border-s", palette.border)} />
                  <i aria-hidden="true" className={cn("absolute -start-[.35em] top-0 size-[.7em] rounded-full", palette.dot)} />
                  <div className="flex items-start justify-between gap-[1.2em]">
                    <div>
                      <strong className="block text-[1.05em]">{experience.jobTitle}</strong>
                      <em className="mt-[.2em] block">{[experience.company, experience.location].filter(Boolean).join(" · ")}</em>
                    </div>
                    <time className="shrink-0">{formatDateRange(experience, presentation.dir)}</time>
                  </div>
                  <ul className={cn("mb-0 mt-[.65em] grid gap-[.35em]", presentation.dir === "rtl" ? "pr-[1.3em]" : "pl-[1.3em]") }>
                    {experience.description.split("\n").map((item) => item.trim()).filter(Boolean).map((item, index) => <li key={`${experience.id}-${index}`}>{item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <ProjectSection
            data={data}
            direction={presentation.dir}
            heading={
              <AngularTechnicalHeading
                icon={<Code2 className="size-[1.2em]" />}
                palette={palette}
              >
                {presentation.labels.projects}
              </AngularTechnicalHeading>
            }
          />
        )}

        <AngularTechnicalEducation
          educations={educations}
          palette={palette}
          presentation={presentation}
        />
      </main>
    </article>
  );
}

export function ResumeDocumentPage(inputProps: ResumeDocumentProps) {
  const props = {
    ...inputProps,
    data: normalizeResumeDataInput(inputProps.data),
  };
  if (props.templateId === "matrix-dark")
    return <MatrixDarkResume {...props} />;
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
  if (props.templateId === "profile-band")
    return <ProfileBandResume {...props} />;
  if (props.templateId === "designer-sidebar")
    return <DesignerSidebarResume {...props} />;
  if (props.templateId === "dark-sidebar-timeline")
    return <DarkSidebarTimelineResume {...props} />;
  if (props.templateId === "centerline-marketing")
    return <CenterlineMarketingResume {...props} />;
  if (props.templateId === "pastel-graduate")
    return <PastelGraduateResume {...props} />;
  if (props.templateId === "split-profile")
    return <SplitProfileResume {...props} />;
  if (props.templateId === "corporate-competencies")
    return <CorporateCompetenciesResume {...props} />;
  if (props.templateId === "angular-technical")
    return <AngularTechnicalResume {...props} />;
  if (props.templateId === "simple-one-column")
    return <OneColumnResume {...props} />;
  if (props.templateId === "navy-reference-simple")
    return <NavyReferenceResume {...props} />;
  return twoColumnTemplates.has(props.templateId) ? (
    <TwoColumnResume {...props} />
  ) : (
    <StandardResume {...props} />
  );
}

export function ResumeDocument(
  inputProps: ResumeDocumentProps & { onPaginationReady?: () => void },
) {
  const safeData = useMemo(
    () => normalizeResumeDataInput(inputProps.data),
    [inputProps.data],
  );
  const props = { ...inputProps, data: safeData };
  const { onPaginationReady } = inputProps;
  const { candidate, pages, pagesRef, probeRef } = useRenderedResumePagination(
    props.data,
    props.templateId,
  );

  useEffect(() => {
    if (!candidate) onPaginationReady?.();
  }, [candidate, onPaginationReady]);

  return (
    <>
      <div ref={pagesRef} className="grid w-full gap-5 print:block">
        {pages.map((pageData, index) => (
          <ResumePrintPage
            templateId={props.templateId}
            key={`${props.templateId}-${index}`}
          >
            <ResumeDocumentPage
              {...props}
              data={pageData}
              continuation={index > 0}
            />
          </ResumePrintPage>
        ))}
      </div>
      {candidate && (
        <ResumePaginationProbe probeRef={probeRef}>
          <ResumeDocumentPage
            {...props}
            data={candidate.page}
            continuation={candidate.boundary > 0}
            key={candidate.key}
          />
        </ResumePaginationProbe>
      )}
    </>
  );
}
