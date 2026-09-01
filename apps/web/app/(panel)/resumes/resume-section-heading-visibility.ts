import type { ResumeData } from "./resume-data";

type ResumeHeadingSection =
  | "contact"
  | "summary"
  | "experiences"
  | "projects"
  | "educations"
  | "skills"
  | "languages";

const SECTION_HEADING_ALIASES: Record<ResumeHeadingSection, string[]> = {
  contact: ["Contact", "Contact Information", "اطلاعات تماس", "تماس"],
  summary: [
    "About Me",
    "Summary",
    "Profile",
    "Professional Profile",
    "درباره من",
    "پروفایل",
    "پروفایل حرفه‌ای",
    "خلاصه",
  ],
  experiences: [
    "Experience",
    "Work Experience",
    "Professional Experience",
    "Employment History",
    "سوابق حرفه‌ای",
    "سوابق شغلی",
    "تجربه حرفه‌ای",
  ],
  projects: ["Projects", "Project", "پروژه‌ها", "پروژه ها", "پروژه"],
  educations: ["Education", "تحصیلات"],
  skills: ["Skills", "Top Skills", "مهارت‌ها", "مهارت ها", "مهارت"],
  languages: ["Languages", "Language", "زبان‌ها", "زبان ها", "زبان"],
};

function normalizeHeading(value: string) {
  return value
    .normalize("NFKC")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\s\-_–—:]+/g, "")
    .toLocaleLowerCase("en");
}

const SECTION_BY_HEADING = new Map(
  Object.entries(SECTION_HEADING_ALIASES).flatMap(([section, aliases]) =>
    aliases.map(
      (alias) =>
        [normalizeHeading(alias), section as ResumeHeadingSection] as const,
    ),
  ),
);

function getHeadingSection(text: string) {
  return SECTION_BY_HEADING.get(normalizeHeading(text));
}

function pageHasSection(page: ResumeData, section: ResumeHeadingSection) {
  switch (section) {
    case "contact":
      return Boolean(
        page.email || page.phone || page.location || page.website,
      );
    case "summary":
      return Boolean(page.summary.trim());
    case "experiences":
      return page.experiences.length > 0;
    case "projects":
      return page.projects.length > 0;
    case "educations":
      return page.educations.length > 0 || Boolean(page.education.trim());
    case "skills":
      return Boolean(page.skills.trim());
    case "languages":
      return Boolean(page.languages.trim());
  }
}

export function getContinuedResumeSections(previousPages: ResumeData[]) {
  return new Set(
    (Object.keys(SECTION_HEADING_ALIASES) as ResumeHeadingSection[]).filter(
      (section) => previousPages.some((page) => pageHasSection(page, section)),
    ),
  );
}

export function syncResumeSectionHeadingVisibility(
  pageElement: HTMLElement,
  previousPages: ResumeData[],
  previousHeadingTexts: Set<string> = new Set(),
) {
  const continuedSections = getContinuedResumeSections(previousPages);

  pageElement.querySelectorAll<HTMLElement>("h2").forEach((heading) => {
    const text = heading.textContent?.trim() ?? "";
    const section = getHeadingSection(text);
    const repeated = section
      ? continuedSections.has(section)
      : previousHeadingTexts.has(normalizeHeading(text));
    const headingBlock =
      heading.closest<HTMLElement>("[data-resume-section-heading]") ?? heading;

    headingBlock.hidden = repeated;
    headingBlock.classList.toggle("!hidden", repeated);
    headingBlock.toggleAttribute("data-resume-continuation-heading", repeated);
  });
}

export function syncRenderedResumeSectionHeadings(
  pageElements: HTMLElement[],
  pages: ResumeData[],
) {
  const seenHeadingTexts = new Set<string>();

  pageElements.forEach((pageElement, pageIndex) => {
    syncResumeSectionHeadingVisibility(
      pageElement,
      pages.slice(0, pageIndex),
      seenHeadingTexts,
    );

    pageElement.querySelectorAll<HTMLElement>("h2").forEach((heading) => {
      const text = heading.textContent?.trim();
      if (text) seenHeadingTexts.add(normalizeHeading(text));
    });
  });
}
