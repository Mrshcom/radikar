import type { ResumeData, ResumeEducation } from "./resume-data.ts";

function hasWorkContent(page: ResumeData) {
  return page.experiences.length > 0 || page.projects.length > 0;
}

export function createContinuationResumePage(source: ResumeData): ResumeData {
  return {
    ...source,
    summary: "",
    experienceTitle: "",
    company: "",
    experienceDate: "",
    experience: "",
    education: "",
    experiences: [],
    projects: [],
    educations: [],
    skills: "",
    languages: "",
  };
}

/**
 * Keeps trailing resume sections out of an unfinished multi-page work flow.
 * Education may share the final work page when it fits, but it must never
 * appear before a later page that still contains experience or projects.
 */
export function enforceResumeSectionFlow(pages: ResumeData[]): ResumeData[] {
  const workPageIndexes = pages.flatMap((page, index) =>
    hasWorkContent(page) ? [index] : [],
  );
  const educationPageIndexes = pages.flatMap((page, index) =>
    page.educations.length > 0 || page.education.trim() ? [index] : [],
  );
  if (!educationPageIndexes.length) return pages;

  const lastWorkPageIndex = workPageIndexes.at(-1) ?? -1;
  const interruptsWorkSequence = educationPageIndexes.some(
    (index) => index < lastWorkPageIndex,
  );
  const splitsEducationSection = educationPageIndexes.length > 1;
  if (!interruptsWorkSequence && !splitsEducationSection) return pages;

  const educationPageIndex = interruptsWorkSequence
    ? lastWorkPageIndex
    : educationPageIndexes[0];
  const deferredEducations: ResumeEducation[] = [];
  let deferredLegacyEducation = "";
  let trailingSourcePageIndex = -1;
  const normalizedPages = pages.map((page, index) => {
    if (!educationPageIndexes.includes(index)) {
      return page;
    }

    trailingSourcePageIndex = index;
    deferredEducations.push(...page.educations);
    if (!deferredLegacyEducation && page.education.trim()) {
      deferredLegacyEducation = page.education;
    }
    return { ...page, education: "", educations: [] };
  });

  if (!normalizedPages[educationPageIndex]) {
    normalizedPages.push(
      createContinuationResumePage(normalizedPages[lastWorkPageIndex]),
    );
  }
  const educationPage = normalizedPages[educationPageIndex];
  const trailingSource = normalizedPages[trailingSourcePageIndex];
  const deferredSkills = trailingSource?.skills ?? "";
  const deferredLanguages = trailingSource?.languages ?? "";
  if (trailingSource && trailingSourcePageIndex !== educationPageIndex) {
    normalizedPages[trailingSourcePageIndex] = {
      ...trailingSource,
      skills: "",
      languages: "",
    };
  }
  normalizedPages[educationPageIndex] = {
    ...educationPage,
    education: educationPage.education || deferredLegacyEducation,
    educations: [...deferredEducations, ...educationPage.educations],
    skills: educationPage.skills || deferredSkills,
    languages: educationPage.languages || deferredLanguages,
  };

  return normalizedPages;
}

export function hasResumeSectionFlowViolation(pages: ResumeData[]) {
  const workPageIndexes = pages.flatMap((page, index) =>
    hasWorkContent(page) ? [index] : [],
  );
  const educationPageIndexes = pages.flatMap((page, index) =>
    page.educations.length > 0 || page.education.trim() ? [index] : [],
  );
  if (educationPageIndexes.length > 1) return true;
  if (!workPageIndexes.length || !educationPageIndexes.length) return false;
  return educationPageIndexes[0] < workPageIndexes.at(-1)!;
}
