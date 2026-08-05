export type ResumeExperience = {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  technologies: string;
};

export type ResumeEducation = {
  id: string;
  institution: string;
  credential: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export type ResumeData = {
  fullName: string;
  jobTitle: string;
  photoUrl: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experienceTitle: string;
  company: string;
  experienceDate: string;
  experience: string;
  education: string;
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  skills: string;
  languages: string;
};

export type ResumeLanguage = "fa" | "en";
export type ResumeColorId =
  | "mint"
  | "yellow"
  | "cyan"
  | "sand"
  | "gray"
  | "coral"
  | "blue"
  | "purple"
  | "black";

export const resumeColorOptions: Array<{
  id: ResumeColorId;
  label: string;
  swatch: string;
}> = [
  { id: "mint", label: "سبز نعنایی", swatch: "bg-[#42ddb0]" },
  { id: "yellow", label: "سبز اصلی", swatch: "bg-[#0f7b62]" },
  { id: "cyan", label: "فیروزه‌ای", swatch: "bg-[#78d8eb]" },
  { id: "sand", label: "کرم", swatch: "bg-[#f2c979]" },
  { id: "gray", label: "خاکستری", swatch: "bg-[#d8d8d5]" },
  { id: "coral", label: "مرجانی", swatch: "bg-[#e86f73]" },
  { id: "blue", label: "آبی", swatch: "bg-[#278fdf]" },
  { id: "purple", label: "بنفش", swatch: "bg-[#7140bd]" },
  { id: "black", label: "مشکی", swatch: "bg-[#111111]" },
];

export function getDefaultResumeColor(templateId: string): ResumeColorId {
  if (templateId === "timeline-classic") return "black";
  if (templateId === "red-administrative") return "coral";
  if (templateId === "orange-pill") return "sand";
  if (templateId === "editorial-sidebar") return "coral";
  if (templateId === "sector-yellow") return "yellow";
  return "mint";
}

export function supportsResumeColors(templateId: string) {
  return [
    "simple-one-column",
    "timeline-classic",
    "banner-modern",
    "red-administrative",
    "orange-pill",
    "editorial-sidebar",
    "sector-yellow",
  ].includes(templateId);
}

export const resumeTemplates = [
  {
    id: "simple-one-column",
    name: "ساده تک‌ستونه",
    subtitle: "چیدمان خطی، خلوت و مناسب رزومه رسمی",
    tag: "پیشنهادی",
  },
  {
    id: "timeline-classic",
    name: "تایم‌لاین کلاسیک",
    subtitle: "هویت مرکزی، جزئیات کناری و سوابق خطی",
    tag: "حرفه‌ای",
  },
  {
    id: "banner-modern",
    name: "هدر رنگی مدرن",
    subtitle: "عکس بزرگ و هدر رنگی با بدنه خوانا",
    tag: "مدرن",
  },
  {
    id: "red-administrative",
    name: "اداری قرمز",
    subtitle: "هدر قرمز، سوابق خوانا و مهارت‌های نواری",
    tag: "حرفه‌ای",
  },
  {
    id: "orange-pill",
    name: "مینیمال نارنجی",
    subtitle: "هدر کپسولی و بخش‌بندی خطی متراکم",
    tag: "مدرن",
  },
  {
    id: "editorial-sidebar",
    name: "تحریریه‌ای ظریف",
    subtitle: "چیدمان محتوایی با مهارت‌های امتیازی",
    tag: "خلاق",
  },
  {
    id: "ats",
    name: "مینیمال ATS",
    subtitle: "ساده و مناسب سیستم‌های استخدام",
    tag: "پیشنهادی",
  },
  {
    id: "emerald",
    name: "مدرن سبز",
    subtitle: "حرفه‌ای برای محصول و مارکتینگ",
    tag: "مدرن",
  },
  {
    id: "classic",
    name: "کلاسیک رسمی",
    subtitle: "مناسب شرکت‌های رسمی و حقوقی",
    tag: "رسمی",
  },
  {
    id: "navy",
    name: "دو ستونه حرفه‌ای",
    subtitle: "خوانا با تفکیک دقیق اطلاعات",
    tag: "محبوب",
  },
  {
    id: "creative",
    name: "خلاق مرجانی",
    subtitle: "مناسب طراحی و صنایع خلاق",
    tag: "خلاق",
  },
  {
    id: "executive",
    name: "مدیریتی Executive",
    subtitle: "ویژه مدیران ارشد و رهبران",
    tag: "مدیریتی",
  },
  {
    id: "tech",
    name: "تکنولوژی",
    subtitle: "برای توسعه‌دهندگان و متخصصان داده",
    tag: "فنی",
  },
  {
    id: "academic",
    name: "دانشگاهی",
    subtitle: "مناسب پژوهش، تدریس و اپلای",
    tag: "آکادمیک",
  },
  {
    id: "global",
    name: "بین‌المللی Clean",
    subtitle: "استاندارد اپلای خارج از ایران",
    tag: "English-ready",
  },
  {
    id: "persian",
    name: "فارسی اصیل",
    subtitle: "راست‌چین با هویت ایرانی",
    tag: "فارسی",
  },
  {
    id: "two-professional",
    name: "حرفه‌ای دوبلین",
    subtitle: "نوار تمام‌قد برای هویت، تماس و مهارت‌ها",
    tag: "حرفه‌ای",
  },
  {
    id: "two-clean",
    name: "مینیمال برلین",
    subtitle: "تک‌رنگ، خلوت و مبتنی بر تایپوگرافی",
    tag: "مینیمال",
  },
  {
    id: "two-corporate",
    name: "سازمانی نیویورک",
    subtitle: "ساختار رسمی و دقیق برای مسیر شغلی",
    tag: "شرکتی",
  },
  {
    id: "two-clear",
    name: "شفاف وین",
    subtitle: "هدر سبز برجسته با بدنه دو ستونه روشن",
    tag: "خوانا",
  },
  {
    id: "two-balanced",
    name: "متوازن سیدنی",
    subtitle: "بدنه سفید در کنار نوار تیره اطلاعات",
    tag: "متعادل",
  },
  {
    id: "two-essential",
    name: "ضروری استکهلم",
    subtitle: "چیدمان سفید، مینیمال و بسیار کاربردی",
    tag: "کاربردی",
  },
  {
    id: "two-polished",
    name: "آراسته پاریس",
    subtitle: "ستون مهارت باریک با تایپوگرافی ظریف",
    tag: "شیک",
  },
  {
    id: "two-harmonized",
    name: "هماهنگ میلان",
    subtitle: "فضای گرم با امتیازهای نقطه‌ای مهارت",
    tag: "هماهنگ",
  },
  {
    id: "two-defined",
    name: "متمایز تورنتو",
    subtitle: "نام بزرگ و بخش‌های ماژولار وب‌محور",
    tag: "دیجیتال",
  },
  {
    id: "two-industrial",
    name: "صنعتی آمستردام",
    subtitle: "کنتراست تیره و ساختار فنی قدرتمند",
    tag: "صنعتی",
  },
  {
    id: "two-elegant",
    name: "ظریف بارسلونا",
    subtitle: "فضای سفید و ستون مهارت باریک",
    tag: "ظریف",
  },
  {
    id: "two-modern",
    name: "مدرن توکیو",
    subtitle: "هدر قرمز و نمایش خطی سطح مهارت‌ها",
    tag: "مدرن",
  },
  {
    id: "two-creative",
    name: "خلاق لیسبون",
    subtitle: "پرتره برجسته و فرم‌های ارگانیک رنگی",
    tag: "خلاق",
  },
  {
    id: "two-visionary",
    name: "آینده‌نگر ریو",
    subtitle: "بافت گرم، هویت مرکزی و فرم‌های سیال",
    tag: "آینده‌نگر",
  },
  {
    id: "two-color-splash",
    name: "رنگی کیپ‌تاون",
    subtitle: "تایپوگرافی جسور روی لکه‌های رنگی",
    tag: "رنگی",
  },
  {
    id: "photo-creative",
    name: "پرتره ارگانیک",
    subtitle: "پرتره بزرگ، ساختار تحریریه‌ای و فرم‌های گیاهی",
    tag: "خلاق",
  },
  {
    id: "sector-orange",
    name: "نارنجی استودیو",
    subtitle: "ستون ذغالی و تیترهای نواری نارنجی",
    tag: "رنگی",
  },
  {
    id: "sector-yellow",
    name: "حرفه‌ای چندتمی",
    subtitle: "یک چیدمان حرفه‌ای با ۹ رنگ‌بندی قابل انتخاب",
    tag: "حرفه‌ای",
  },
  {
    id: "sector-turquoise",
    name: "فیروزه‌ای پزشکی",
    subtitle: "ستون هویتی رنگی و بدنه سفید خوانا",
    tag: "رنگی",
  },
  {
    id: "sector-green",
    name: "سبز مالی",
    subtitle: "هدر تیره، نوار تماس و بخش‌بندی سبز",
    tag: "رنگی",
  },
] as const;

const selectableTemplateIds = new Set([
  "simple-one-column",
  "timeline-classic",
  "banner-modern",
  "red-administrative",
  "orange-pill",
  "editorial-sidebar",
  "sector-yellow",
]);

export const selectableResumeTemplates = resumeTemplates.filter((template) =>
  selectableTemplateIds.has(template.id),
);

export const emptyResumeData: ResumeData = {
  fullName: "",
  jobTitle: "",
  photoUrl: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  experienceTitle: "",
  company: "",
  experienceDate: "",
  experience: "",
  education: "",
  experiences: [],
  educations: [],
  skills: "",
  languages: "",
};

export function getResumeExperiences(data: ResumeData): ResumeExperience[] {
  if (Array.isArray(data.experiences) && data.experiences.length)
    return data.experiences;
  if (
    !data.experienceTitle.trim() &&
    !data.company.trim() &&
    !data.experienceDate.trim() &&
    !data.experience.trim()
  )
    return [];
  const [startDate = "", endDate = ""] = data.experienceDate.split(
    /\s+(?:تا|–|—|-)\s+/,
    2,
  );
  const isCurrent = /(?:امروز|اکنون|حال حاضر|present|current)/i.test(endDate);
  return [
    {
      id: "legacy-experience",
      jobTitle: data.experienceTitle,
      company: data.company,
      location: "",
      startDate: startDate.trim(),
      endDate: isCurrent ? "" : endDate.trim(),
      isCurrent,
      description: data.experience,
      technologies: "",
    },
  ];
}

export function getResumeEducations(data: ResumeData): ResumeEducation[] {
  if (Array.isArray(data.educations) && data.educations.length)
    return data.educations;
  if (!data.education.trim()) return [];
  return data.education
    .split("\n")
    .map((education) => education.trim())
    .filter(Boolean)
    .map((credential, index) => ({
      id: `legacy-education-${index}`,
      institution: "",
      credential,
      startDate: "",
      endDate: "",
      isCurrent: false,
    }));
}

function experienceWeight(experience: ResumeExperience) {
  const descriptionLines = experience.description
    .split("\n")
    .filter((line) => line.trim()).length;
  return (
    2 +
    Math.max(descriptionLines, Math.ceil(experience.description.length / 180)) +
    (experience.technologies.trim() ? 1 : 0)
  );
}

type OneColumnPageDraft = {
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  skills: string;
  languages: string;
  usedCapacity: number;
};

function paginateOneColumnResume(data: ResumeData): ResumeData[] {
  const firstPageCapacity = 26;
  const continuationPageCapacity = 34;
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const summaryWeight = data.summary.trim()
    ? 2 + Math.ceil(data.summary.length / 350)
    : 0;
  const pages: OneColumnPageDraft[] = [
    {
      experiences: [],
      educations: [],
      skills: "",
      languages: "",
      usedCapacity: summaryWeight,
    },
  ];
  const currentPage = () => pages.at(-1)!;
  const currentCapacity = () =>
    pages.length === 1 ? firstPageCapacity : continuationPageCapacity;
  const startPage = () => {
    pages.push({
      experiences: [],
      educations: [],
      skills: "",
      languages: "",
      usedCapacity: 0,
    });
  };
  const reserveBlock = (weight: number) => {
    if (currentPage().usedCapacity + weight > currentCapacity()) startPage();
    currentPage().usedCapacity += weight;
  };

  for (const experience of experiences) {
    const weight = experienceWeight(experience);
    reserveBlock(weight);
    currentPage().experiences.push(experience);
  }

  for (const education of educations) {
    const headingWeight = currentPage().educations.length ? 0 : 2;
    const educationWeight = headingWeight + 1.5;
    reserveBlock(educationWeight);
    currentPage().educations.push(education);
  }

  if (data.skills.trim()) {
    const skillCount = data.skills
      .split(/،|,/)
      .map((skill) => skill.trim())
      .filter(Boolean).length;
    reserveBlock(2 + Math.ceil(skillCount / 4) * 1.5);
    currentPage().skills = data.skills;
  }

  if (data.languages.trim()) {
    const languageCount = data.languages
      .split(/\r?\n|[|،,؛;]/)
      .map((language) => language.trim())
      .filter(Boolean).length;
    reserveBlock(2 + Math.max(languageCount, 1) * 1.2);
    currentPage().languages = data.languages;
  }

  return pages.map((page, index) => ({
    ...data,
    summary: index === 0 ? data.summary : "",
    experiences: page.experiences,
    experienceTitle: "",
    company: "",
    experienceDate: "",
    experience: "",
    education: "",
    educations: page.educations,
    skills: page.skills,
    languages: page.languages,
  }));
}

export function paginateResumeData(
  data: ResumeData,
  templateId?: string,
): ResumeData[] {
  const isOneColumnTemplate = templateId === "simple-one-column";
  if (isOneColumnTemplate) return paginateOneColumnResume(data);
  const isOrangePillTemplate = templateId === "orange-pill";
  const isEditorialTemplate = templateId === "editorial-sidebar";
  const isTimelineTemplate = templateId === "timeline-classic";
  const firstPageCapacity = isEditorialTemplate
    ? 27
    : isTimelineTemplate
      ? 27
      : isOrangePillTemplate
        ? 30
    : 22;
  const continuationPageCapacity =
    isEditorialTemplate || isOrangePillTemplate ? 32 : 30;
  const usesIndependentSidebar = Boolean(
    templateId &&
      templateId !== "simple-one-column" &&
      templateId !== "orange-pill",
  );
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const summaryWeight = data.summary.trim()
    ? 2 + Math.ceil(data.summary.length / 350)
    : 0;
  const trailingContentWeight =
    (educations.length ? Math.min(5, educations.length * 1.5) : 0) +
    (usesIndependentSidebar ? 0 : data.skills.trim() ? 2 : 0) +
    (usesIndependentSidebar ? 0 : data.languages.trim() ? 1 : 0);
  const totalWeight =
    summaryWeight +
    trailingContentWeight +
    experiences.reduce(
      (total, experience) => total + experienceWeight(experience),
      0,
    );

  if (totalWeight <= firstPageCapacity) return [data];

  const pages: ResumeExperience[][] = [];
  let currentPage: ResumeExperience[] = [];
  let currentWeight = 0;
  for (const experience of experiences) {
    const weight = experienceWeight(experience);
    const capacity =
      pages.length === 0
        ? firstPageCapacity - summaryWeight
        : continuationPageCapacity;
    if (currentPage.length && currentWeight + weight > capacity) {
      pages.push(currentPage);
      currentPage = [];
      currentWeight = 0;
    }
    currentPage.push(experience);
    currentWeight += weight;
  }
  if (currentPage.length) pages.push(currentPage);
  if (!pages.length) pages.push([]);
  if (usesIndependentSidebar) {
    const firstExperienceWeight = pages[0].reduce(
      (total, experience) => total + experienceWeight(experience),
      0,
    );
    const firstEducationCount =
      pages.length === 1
        ? Math.min(
            educations.length,
            Math.max(
              0,
              Math.floor(
                (firstPageCapacity - summaryWeight - firstExperienceWeight) /
                  1.5,
              ),
            ),
          )
        : 0;
    const remainingEducations = educations.slice(firstEducationCount);
    const lastExperienceWeight = pages.at(-1)!.reduce(
      (total, experience) => total + experienceWeight(experience),
      0,
    );
    const remainingEducationWeight = remainingEducations.length * 1.5;
    const lastPageCapacity =
      pages.length === 1 ? firstPageCapacity : continuationPageCapacity;
    if (
      remainingEducations.length &&
      lastExperienceWeight + remainingEducationWeight > lastPageCapacity
    ) {
      pages.push([]);
    }

    return pages.map((pageExperiences, index) => {
      const isFirst = index === 0;
      const isLast = index === pages.length - 1;
      const pageEducations = isFirst
        ? educations.slice(0, firstEducationCount)
        : isLast
          ? remainingEducations
          : [];
      return {
        ...data,
        summary: isFirst ? data.summary : "",
        experiences: pageExperiences,
        experienceTitle: "",
        company: "",
        experienceDate: "",
        experience: "",
        education: "",
        educations: pageEducations,
        skills: isFirst ? data.skills : "",
        languages: isFirst ? data.languages : "",
      };
    });
  }
  const lastPageExperienceWeight = pages.at(-1)!.reduce(
    (total, experience) => total + experienceWeight(experience),
    0,
  );
  const lastPageBaseWeight =
    lastPageExperienceWeight + (pages.length === 1 ? summaryWeight : 0);
  const lastPageCapacity =
    pages.length === 1 ? firstPageCapacity : continuationPageCapacity;
  if (lastPageBaseWeight + trailingContentWeight > lastPageCapacity) {
    pages.push([]);
  }

  return pages.map((pageExperiences, index) => {
    const isFirst = index === 0;
    const isLast = index === pages.length - 1;
    return {
      ...data,
      summary: isFirst ? data.summary : "",
      experiences: pageExperiences,
      experienceTitle: "",
      company: "",
      experienceDate: "",
      experience: "",
      education: isLast ? data.education : "",
      educations: isLast ? educations : [],
      skills: isLast ? data.skills : "",
      languages: isLast ? data.languages : "",
    };
  });
}

export function hasResumeContent(
  resume: Partial<ResumeData> | undefined,
): resume is ResumeData {
  if (!resume) return false;
  return Object.entries(resume).some(
    ([key, value]) =>
      key !== "photoUrl" &&
      typeof value === "string" &&
      value.trim().length > 0,
  );
}
