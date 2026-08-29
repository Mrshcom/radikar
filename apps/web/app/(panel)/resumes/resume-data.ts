import { enforceResumeSectionFlow } from "./resume-section-flow.ts";
import {
  getResumePaginationProfile,
  getResumeSectionFlow,
} from "./resume-pagination-profile.ts";

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

export type ResumeProject = {
  id: string;
  name: string;
  role: string;
  url: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  technologies: string;
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
  projects: ResumeProject[];
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
  if (templateId === "matrix-dark") return "mint";
  if (templateId === "navy-reference-simple") return "blue";
  if (templateId === "timeline-classic") return "black";
  if (templateId === "red-administrative") return "coral";
  if (templateId === "orange-pill") return "sand";
  if (templateId === "editorial-sidebar") return "coral";
  if (templateId === "profile-band") return "blue";
  if (templateId === "designer-sidebar") return "yellow";
  if (templateId === "dark-sidebar-timeline") return "gray";
  if (templateId === "centerline-marketing") return "cyan";
  if (templateId === "pastel-graduate") return "coral";
  if (templateId === "split-profile") return "mint";
  if (templateId === "corporate-competencies") return "blue";
  if (templateId === "angular-technical") return "sand";
  if (templateId === "sector-yellow") return "yellow";
  return "mint";
}

export function supportsResumeColors(templateId: string) {
  return [
    "simple-one-column",
    "navy-reference-simple",
    "timeline-classic",
    "matrix-dark",
    "banner-modern",
    "red-administrative",
    "orange-pill",
    "editorial-sidebar",
    "profile-band",
    "designer-sidebar",
    "dark-sidebar-timeline",
    "centerline-marketing",
    "pastel-graduate",
    "split-profile",
    "corporate-competencies",
    "angular-technical",
    "sector-yellow",
  ].includes(templateId);
}

export const resumeTemplates = [
  {
    id: "matrix-dark",
    name: "ماتریکس دارک",
    subtitle: "فضای ترمینالی، اکسنت نئونی و کارت‌های فنی",
    tag: "خلاق",
  },
  {
    id: "simple-one-column",
    name: "ساده تک‌ستونه",
    subtitle: "چیدمان خطی، خلوت و مناسب رزومه رسمی",
    tag: "پیشنهادی",
  },
  {
    id: "navy-reference-simple",
    name: "ساده سرمه‌ای",
    subtitle: "هدر سرمه‌ای و چیدمان دقیق تاریخ‌محور",
    tag: "ساده",
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
    id: "profile-band",
    name: "نوار هویتی کلاسیک",
    subtitle: "هدر نواری، عکس دایره‌ای و سوابق تاریخ‌محور",
    tag: "حرفه‌ای",
  },
  {
    id: "designer-sidebar",
    name: "طراح سایدبار کلاسیک",
    subtitle: "پرتره دایره‌ای، اطلاعات کناری و بدنه تحریریه‌ای",
    tag: "خلاق",
  },
  {
    id: "dark-sidebar-timeline",
    name: "سایدبار تیره تایم‌لاین",
    subtitle: "ستون تیره، سوابق خطی و مهارت‌های نواری",
    tag: "مدرن",
  },
  {
    id: "centerline-marketing",
    name: "دوستونه خط مرکزی",
    subtitle: "هدر رسمی، ستون‌های متقارن و جداکننده نقطه‌دار",
    tag: "حرفه‌ای",
  },
  {
    id: "pastel-graduate",
    name: "پاستلی فارغ‌التحصیل",
    subtitle: "پس‌زمینه لطیف، سایدبار روشن و تیترهای نواری",
    tag: "مدرن",
  },
  {
    id: "split-profile",
    name: "پروفایل دو‌بخشی",
    subtitle: "هویت مینیمال، ستون رنگی و سوابق تفصیلی",
    tag: "خلاق",
  },
  {
    id: "corporate-competencies",
    name: "سازمانی شایستگی‌ها",
    subtitle: "نوارهای رسمی، سوابق متراکم و پنل توانمندی‌ها",
    tag: "سازمانی",
  },
  {
    id: "angular-technical",
    name: "فنی زاویه‌دار",
    subtitle: "سایدبار مورب، پرتره برجسته و سوابق تایم‌لاین‌دار",
    tag: "مدرن",
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
  "matrix-dark",
  "simple-one-column",
  "navy-reference-simple",
  "timeline-classic",
  "banner-modern",
  "red-administrative",
  "orange-pill",
  "editorial-sidebar",
  "profile-band",
  "designer-sidebar",
  "dark-sidebar-timeline",
  "centerline-marketing",
  "pastel-graduate",
  "split-profile",
  "corporate-competencies",
  "angular-technical",
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
  projects: [],
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

export function getResumeProjects(data: ResumeData): ResumeProject[] {
  if (!Array.isArray(data.projects)) return [];
  return data.projects.filter(
    (project) =>
      project.name.trim() ||
      project.role.trim() ||
      project.url.trim() ||
      project.startDate.trim() ||
      project.endDate.trim() ||
      project.description.trim() ||
      project.technologies.trim(),
  );
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

function projectWeight(project: ResumeProject) {
  const descriptionLines = project.description
    .split("\n")
    .filter((line) => line.trim()).length;
  return (
    2 +
    Math.max(descriptionLines, Math.ceil(project.description.length / 180)) +
    (project.url.trim() ? 0.5 : 0) +
    (project.technologies.trim() ? 1 : 0)
  );
}

type OneColumnPageDraft = {
  experiences: ResumeExperience[];
  educations: ResumeEducation[];
  projects: ResumeProject[];
  skills: string;
  languages: string;
  usedCapacity: number;
};

function paginateOneColumnResume(data: ResumeData): ResumeData[] {
  const firstPageCapacity = 26;
  const continuationPageCapacity = 34;
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const projects = getResumeProjects(data);
  const summaryWeight = data.summary.trim()
    ? 2 + Math.ceil(data.summary.length / 350)
    : 0;
  const pages: OneColumnPageDraft[] = [
    {
      experiences: [],
      educations: [],
      projects: [],
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
      projects: [],
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

  for (const project of projects) {
    const headingWeight = currentPage().projects.length ? 0 : 2;
    reserveBlock(headingWeight + projectWeight(project));
    currentPage().projects.push(project);
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
    projects: page.projects,
    skills: page.skills,
    languages: page.languages,
  }));
}

export function paginateResumeData(
  data: ResumeData,
  templateId?: string,
): ResumeData[] {
  const isOneColumnTemplate = [
    "simple-one-column",
    "navy-reference-simple",
  ].includes(templateId || "");
  if (isOneColumnTemplate) {
    return enforceResumeSectionFlow(paginateOneColumnResume(data));
  }
  const isEditorialTemplate = templateId === "editorial-sidebar";
  const isTimelineTemplate = templateId === "timeline-classic";
  const isOrangePillTemplate = templateId === "orange-pill";
  const isProfileBandTemplate = templateId === "profile-band";
  const firstPageCapacity = isEditorialTemplate
    ? 27
    : isTimelineTemplate
      ? 27
      : isOrangePillTemplate
        ? 30
      : isProfileBandTemplate
          ? 30
          : 22;
  const continuationPageCapacity =
    isEditorialTemplate ||
    isOrangePillTemplate ||
    isProfileBandTemplate
      ? 32
      : 30;
  const paginationProfile = getResumePaginationProfile(templateId);
  const experiences = getResumeExperiences(data);
  const educations = getResumeEducations(data);
  const projects = getResumeProjects(data);
  const summaryWeight = data.summary.trim()
    ? 2 + Math.ceil(data.summary.length / 350)
    : 0;
  const summaryIsInMain =
    getResumeSectionFlow(paginationProfile, "summary") !== "sidebar";
  const educationsAreInMain =
    getResumeSectionFlow(paginationProfile, "educations") !== "sidebar";
  const skillsAreInMain =
    getResumeSectionFlow(paginationProfile, "skills") !== "sidebar";
  const languagesAreInMain =
    getResumeSectionFlow(paginationProfile, "languages") !== "sidebar";
  const mainSummaryWeight = summaryIsInMain ? summaryWeight : 0;
  const trailingContentWeight =
    (educationsAreInMain && educations.length
      ? Math.min(5, educations.length * 1.5)
      : 0) +
    (skillsAreInMain && data.skills.trim() ? 2 : 0) +
    (languagesAreInMain && data.languages.trim() ? 1 : 0);
  const totalWeight =
    mainSummaryWeight +
    trailingContentWeight +
    projects.reduce((total, project) => total + projectWeight(project), 0) +
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
        ? firstPageCapacity - mainSummaryWeight
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
  const pageProjects: ResumeProject[][] = pages.map(() => []);
  let projectPageIndex = pages.length - 1;
  let projectPageWeight =
    pages[projectPageIndex].reduce(
      (total, experience) => total + experienceWeight(experience),
      0,
    ) + (projectPageIndex === 0 ? mainSummaryWeight : 0);
  for (const project of projects) {
    const weight = projectWeight(project);
    const capacity =
      projectPageIndex === 0 ? firstPageCapacity : continuationPageCapacity;
    if (projectPageWeight && projectPageWeight + weight > capacity) {
      pages.push([]);
      pageProjects.push([]);
      projectPageIndex += 1;
      projectPageWeight = 0;
    }
    pageProjects[projectPageIndex].push(project);
    projectPageWeight += weight;
  }
  const lastPageExperienceWeight = pages.at(-1)!.reduce(
    (total, experience) => total + experienceWeight(experience),
    0,
  ) + pageProjects.at(-1)!.reduce(
    (total, project) => total + projectWeight(project),
    0,
  );
  const lastPageBaseWeight =
    lastPageExperienceWeight + (pages.length === 1 ? mainSummaryWeight : 0);
  const lastPageCapacity =
    pages.length === 1 ? firstPageCapacity : continuationPageCapacity;
  if (
    trailingContentWeight &&
    lastPageBaseWeight + trailingContentWeight > lastPageCapacity
  ) {
    pages.push([]);
    pageProjects.push([]);
  }

  const paginated = pages.map((pageExperiences, index) => {
    const isFirst = index === 0;
    const isLast = index === pages.length - 1;
    return {
      ...data,
      summary: isFirst ? data.summary : "",
      experiences: pageExperiences,
      projects: pageProjects[index] ?? [],
      experienceTitle: "",
      company: "",
      experienceDate: "",
      experience: "",
      education:
        educationsAreInMain && isLast
          ? data.education
          : !educationsAreInMain && isFirst
            ? data.education
            : "",
      educations:
        educationsAreInMain && isLast
          ? educations
          : !educationsAreInMain && isFirst
            ? educations
            : [],
      skills:
        skillsAreInMain && isLast
          ? data.skills
          : !skillsAreInMain && isFirst
            ? data.skills
            : "",
      languages:
        languagesAreInMain && isLast
          ? data.languages
          : !languagesAreInMain && isFirst
            ? data.languages
            : "",
    };
  });

  return educationsAreInMain
    ? enforceResumeSectionFlow(paginated)
    : paginated;
}

export function hasResumeContent(
  resume: Partial<ResumeData> | undefined,
): resume is ResumeData {
  if (!resume) return false;
  return Object.entries(resume).some(
    ([key, value]) =>
      key !== "photoUrl" &&
      ((typeof value === "string" && value.trim().length > 0) ||
        (Array.isArray(value) && value.length > 0)),
  );
}
