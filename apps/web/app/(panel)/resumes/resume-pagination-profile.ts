export type ResumePaginationSection =
  | "summary"
  | "experiences"
  | "projects"
  | "educations"
  | "skills"
  | "languages";

export type ResumePaginationFlow = "main" | "sidebar" | "page";

export type ResumePaginationProfile = {
  main: ResumePaginationSection[];
  sidebar: ResumePaginationSection[];
};

const DEFAULT_SECTION_ORDER: ResumePaginationSection[] = [
  "summary",
  "experiences",
  "projects",
  "educations",
  "skills",
  "languages",
];

const STANDARD_TWO_COLUMN_PROFILE: ResumePaginationProfile = {
  main: ["summary", "experiences", "projects", "educations"],
  sidebar: ["skills", "languages"],
};

const profiles: Record<string, ResumePaginationProfile> = {
  "sector-yellow": STANDARD_TWO_COLUMN_PROFILE,
  "timeline-classic": STANDARD_TWO_COLUMN_PROFILE,
  "banner-modern": STANDARD_TWO_COLUMN_PROFILE,
  "editorial-sidebar": STANDARD_TWO_COLUMN_PROFILE,
  "matrix-dark": STANDARD_TWO_COLUMN_PROFILE,
  "pastel-graduate": STANDARD_TWO_COLUMN_PROFILE,
  "designer-sidebar": {
    main: ["summary", "experiences", "projects"],
    sidebar: ["educations", "skills", "languages"],
  },
  "dark-sidebar-timeline": {
    main: ["experiences", "projects", "educations", "skills"],
    sidebar: ["summary", "languages"],
  },
  "centerline-marketing": {
    main: ["experiences", "projects"],
    sidebar: ["summary", "educations", "skills", "languages"],
  },
  "split-profile": {
    main: ["experiences", "projects"],
    sidebar: ["summary", "educations", "skills", "languages"],
  },
  "angular-technical": {
    main: ["experiences", "projects", "educations"],
    sidebar: ["summary", "skills", "languages"],
  },
};

export function getResumePaginationProfile(templateId?: string) {
  return templateId ? profiles[templateId] : undefined;
}

export function getResumePaginationFlows(
  profile: ResumePaginationProfile | undefined,
): ResumePaginationFlow[] {
  return profile ? ["main", "sidebar"] : ["page"];
}

export function getResumeFlowSections(
  profile: ResumePaginationProfile | undefined,
  flow: ResumePaginationFlow,
) {
  if (!profile || flow === "page") return DEFAULT_SECTION_ORDER;
  return profile[flow];
}

export function getResumeSectionFlow(
  profile: ResumePaginationProfile | undefined,
  section: ResumePaginationSection,
): ResumePaginationFlow {
  if (!profile) return "page";
  return profile.sidebar.includes(section) ? "sidebar" : "main";
}
