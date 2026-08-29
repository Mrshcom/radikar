"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { paginateResumeData, type ResumeData } from "./resume-data";
import {
  getRenderedPageLayout,
  PAGE_BOTTOM_RESERVE,
} from "./resume-pagination-layout";
import {
  getResumeFlowSections,
  getResumePaginationFlows,
  getResumePaginationProfile,
  type ResumePaginationFlow,
  type ResumePaginationProfile,
  type ResumePaginationSection,
} from "./resume-pagination-profile.ts";
import {
  createContinuationResumePage,
  enforceResumeSectionFlow,
} from "./resume-section-flow.ts";
import {
  syncRenderedResumeSectionHeadings,
  syncResumeSectionHeadingVisibility,
} from "./resume-section-heading-visibility";

const MAX_SYNCHRONOUS_PAGINATION_PASSES = 30;

type RebalanceCandidate = {
  boundary: number;
  blockKey: string;
  flow: ResumePaginationFlow;
  key: string;
  page: ResumeData;
  pages: ResumeData[];
};

type PaginationState = {
  sourceKey: string;
  pages: ResumeData[];
  blockedBoundaries: Set<string>;
  blockedOverflowFlows: Set<string>;
  passCount: number;
  visitedLayouts: Set<string>;
};

function hasPageContent(page: ResumeData) {
  return Boolean(
    page.summary.trim() ||
      page.experiences.length ||
      page.educations.length ||
      page.education.trim() ||
      page.projects.length ||
      page.skills.trim() ||
      page.languages.trim(),
  );
}

function getPageContentKey(page: ResumeData) {
  return [
    page.summary,
    page.experiences.map((item) => item.id).join(","),
    page.projects.map((item) => item.id).join(","),
    page.educations.map((item) => item.id).join(","),
    page.education,
    page.skills,
    page.languages,
  ].join("|");
}

function getPagesLayoutKey(pages: ResumeData[]) {
  return pages.map(getPageContentKey).join("\n--- page ---\n");
}

function normalizeSectionFlow(
  pages: ResumeData[],
  profile: ResumePaginationProfile | undefined,
) {
  return profile?.sidebar.includes("educations")
    ? pages
    : enforceResumeSectionFlow(pages);
}

function hasSectionContent(page: ResumeData, section: ResumePaginationSection) {
  if (section === "summary") return Boolean(page.summary.trim());
  if (section === "experiences") return page.experiences.length > 0;
  if (section === "projects") return page.projects.length > 0;
  if (section === "educations") {
    return page.educations.length > 0 || Boolean(page.education.trim());
  }
  return Boolean(page[section].trim());
}

function clonePage(page: ResumeData): ResumeData {
  return {
    ...page,
    experiences: [...page.experiences],
    projects: [...page.projects],
    educations: [...page.educations],
  };
}

function moveSectionForward(
  currentPage: ResumeData,
  nextPage: ResumeData,
  section: ResumePaginationSection,
) {
  if (section === "summary") return false;
  if (section === "experiences") {
    const item = currentPage.experiences.pop();
    if (!item) return false;
    nextPage.experiences.unshift(item);
    return true;
  }
  if (section === "projects") {
    const item = currentPage.projects.pop();
    if (!item) return false;
    nextPage.projects.unshift(item);
    return true;
  }
  if (section === "educations") {
    if (!hasSectionContent(currentPage, section)) return false;
    if (hasSectionContent(nextPage, section)) return false;
    nextPage.educations = currentPage.educations;
    nextPage.education = currentPage.education;
    currentPage.educations = [];
    currentPage.education = "";
    return true;
  }
  if (!currentPage[section].trim() || nextPage[section].trim()) return false;
  nextPage[section] = currentPage[section];
  currentPage[section] = "";
  return true;
}

function moveSectionBack(
  previousPage: ResumeData,
  nextPage: ResumeData,
  section: ResumePaginationSection,
) {
  if (section === "summary") return false;
  if (section === "experiences") {
    const item = nextPage.experiences.shift();
    if (!item) return false;
    previousPage.experiences.push(item);
    return true;
  }
  if (section === "projects") {
    const item = nextPage.projects.shift();
    if (!item) return false;
    previousPage.projects.push(item);
    return true;
  }
  if (section === "educations") {
    if (!hasSectionContent(nextPage, section)) return false;
    if (hasSectionContent(previousPage, section)) return false;
    previousPage.educations = nextPage.educations;
    previousPage.education = nextPage.education;
    nextPage.educations = [];
    nextPage.education = "";
    return true;
  }
  if (!nextPage[section].trim() || previousPage[section].trim()) return false;
  previousPage[section] = nextPage[section];
  nextPage[section] = "";
  return true;
}

function moveFirstBlockBack(
  pages: ResumeData[],
  boundary: number,
  flow: ResumePaginationFlow,
  profile: ResumePaginationProfile | undefined,
) {
  const current = pages[boundary];
  const next = pages[boundary + 1];
  if (!current || !next) return null;

  const previousPage = clonePage(current);
  const nextPage = clonePage(next);
  const section = getResumeFlowSections(profile, flow).find((item) =>
    hasSectionContent(nextPage, item),
  );
  if (!section || !moveSectionBack(previousPage, nextPage, section)) {
    return null;
  }

  const nextPages = [...pages];
  nextPages[boundary] = previousPage;
  nextPages[boundary + 1] = nextPage;
  if (!hasPageContent(nextPage)) nextPages.splice(boundary + 1, 1);
  return normalizeSectionFlow(nextPages, profile);
}

function moveLastBlockForward(
  pages: ResumeData[],
  pageIndex: number,
  flow: ResumePaginationFlow,
  profile: ResumePaginationProfile | undefined,
) {
  const current = pages[pageIndex];
  if (!current) return null;

  const currentPage = clonePage(current);
  const existingNext = pages[pageIndex + 1];
  const nextPage = existingNext
    ? clonePage(existingNext)
    : createContinuationResumePage(current);
  const section = [...getResumeFlowSections(profile, flow)]
    .reverse()
    .find((item) => item !== "summary" && hasSectionContent(currentPage, item));
  if (!section || !moveSectionForward(currentPage, nextPage, section)) {
    return null;
  }

  const nextPages = [...pages];
  nextPages[pageIndex] = currentPage;
  if (existingNext) nextPages[pageIndex + 1] = nextPage;
  else nextPages.push(nextPage);
  return normalizeSectionFlow(nextPages, profile);
}

function getCandidate(
  pages: ResumeData[],
  blockedBoundaries: Set<string>,
  profile: ResumePaginationProfile | undefined,
): RebalanceCandidate | null {
  for (let boundary = 0; boundary < pages.length - 1; boundary += 1) {
    for (const flow of getResumePaginationFlows(profile)) {
      const blockKey = `${boundary}:${flow}`;
      if (blockedBoundaries.has(blockKey)) continue;
      const candidatePages = moveFirstBlockBack(
        pages,
        boundary,
        flow,
        profile,
      );
      if (!candidatePages) continue;
      if (getPagesLayoutKey(candidatePages) === getPagesLayoutKey(pages)) {
        continue;
      }
      const candidatePage = candidatePages[boundary];
      return {
        boundary,
        blockKey,
        flow,
        key: `${boundary}|${flow}|${getPageContentKey(candidatePage)}`,
        page: candidatePage,
        pages: candidatePages,
      };
    }
  }
  return null;
}

function getRenderedFlow(
  page: HTMLElement,
  element: HTMLElement,
): ResumePaginationFlow {
  if (element === page) return "page";
  const declaredFlow = element.dataset.resumeFlow;
  if (declaredFlow === "main" || declaredFlow === "sidebar") {
    return declaredFlow;
  }
  return element.tagName === "ASIDE" ? "sidebar" : "main";
}

export function useRenderedResumePagination(
  data: ResumeData,
  templateId: string,
) {
  const sourceKey = JSON.stringify([templateId, data]);
  const profile = getResumePaginationProfile(templateId);
  const initialPages = useMemo(
    () => paginateResumeData(data, templateId),
    [data, templateId],
  );
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    sourceKey,
    pages: initialPages,
    blockedBoundaries: new Set(),
    blockedOverflowFlows: new Set(),
    passCount: 0,
    visitedLayouts: new Set([getPagesLayoutKey(initialPages)]),
  }));
  const pages =
    pagination.sourceKey === sourceKey ? pagination.pages : initialPages;
  const probeRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const candidate = useMemo(
    () =>
      getCandidate(
        pages,
        pagination.sourceKey === sourceKey
          ? pagination.blockedBoundaries
          : new Set(),
        profile,
      ),
    [
      pages,
      pagination.blockedBoundaries,
      pagination.sourceKey,
      profile,
      sourceKey,
    ],
  );

  useLayoutEffect(() => {
    if (
      pagination.sourceKey === sourceKey &&
      pagination.passCount >= MAX_SYNCHRONOUS_PAGINATION_PASSES
    ) {
      return;
    }

    const renderedPages = Array.from(
      pagesRef.current?.querySelectorAll<HTMLElement>(
        ":scope > [data-resume-print-page] > article, :scope > div > article",
      ) ?? [],
    );
    syncRenderedResumeSectionHeadings(renderedPages, pages);
    const blockedOverflowFlows =
      pagination.sourceKey === sourceKey
        ? pagination.blockedOverflowFlows
        : new Set<string>();
    const overflow = renderedPages
      .flatMap((page, pageIndex) => {
        const layout = getRenderedPageLayout(page);
        return layout.overflowingFlows.map(({ element }) => {
          const flow = getRenderedFlow(page, element);
          return { flow, key: `${pageIndex}:${flow}`, pageIndex };
        });
      })
      .find(({ key }) => !blockedOverflowFlows.has(key));

    if (overflow) {
      const nextPages = moveLastBlockForward(
        pages,
        overflow.pageIndex,
        overflow.flow,
        profile,
      );
      const currentLayoutKey = getPagesLayoutKey(pages);
      const orderedLayoutKey = nextPages
        ? getPagesLayoutKey(nextPages)
        : currentLayoutKey;
      const visitedLayouts =
        pagination.sourceKey === sourceKey
          ? pagination.visitedLayouts
          : new Set([currentLayoutKey]);

      if (
        !nextPages ||
        orderedLayoutKey === currentLayoutKey ||
        visitedLayouts.has(orderedLayoutKey)
      ) {
        setPagination((current) => {
          const nextBlocked = new Set(
            current.sourceKey === sourceKey
              ? current.blockedOverflowFlows
              : [],
          );
          if (nextBlocked.has(overflow.key)) return current;
          nextBlocked.add(overflow.key);
          return {
            sourceKey,
            pages,
            blockedBoundaries:
              current.sourceKey === sourceKey
                ? current.blockedBoundaries
                : new Set(),
            blockedOverflowFlows: nextBlocked,
            passCount:
              current.sourceKey === sourceKey ? current.passCount + 1 : 1,
            visitedLayouts:
              current.sourceKey === sourceKey
                ? current.visitedLayouts
                : new Set([currentLayoutKey]),
          };
        });
        return;
      }

      setPagination((current) => {
        const blockedBoundaries = new Set(
          current.sourceKey === sourceKey ? current.blockedBoundaries : [],
        );
        blockedBoundaries.add(`${overflow.pageIndex}:${overflow.flow}`);
        const nextVisitedLayouts = new Set(
          current.sourceKey === sourceKey
            ? current.visitedLayouts
            : [currentLayoutKey],
        );
        nextVisitedLayouts.add(orderedLayoutKey);
        return {
          sourceKey,
          pages: nextPages,
          blockedBoundaries,
          blockedOverflowFlows: new Set(),
          passCount:
            current.sourceKey === sourceKey ? current.passCount + 1 : 1,
          visitedLayouts: nextVisitedLayouts,
        };
      });
      return;
    }

    const probe = probeRef.current;
    const page = probe?.firstElementChild;
    if (!candidate || !(page instanceof HTMLElement)) return;

    syncResumeSectionHeadingVisibility(
      page,
      candidate.pages.slice(0, candidate.boundary),
    );

    const candidateLayout = getRenderedPageLayout(page);
    const candidateFlows = candidateLayout.flows.filter(
      ({ element }) => getRenderedFlow(page, element) === candidate.flow,
    );
    const fits = candidateFlows.length
      ? candidateFlows.every(
          ({ contentBottom }) =>
            contentBottom <= candidateLayout.safeBottom,
        )
      : candidateLayout.fits;
    const candidateLayoutKey = getPagesLayoutKey(candidate.pages);

    setPagination((current) => {
      const currentLayoutKey = getPagesLayoutKey(pages);
      const visitedLayouts =
        current.sourceKey === sourceKey
          ? current.visitedLayouts
          : new Set([currentLayoutKey]);
      if (!fits || visitedLayouts.has(candidateLayoutKey)) {
        const blockedBoundaries = new Set(
          current.sourceKey === sourceKey ? current.blockedBoundaries : [],
        );
        if (blockedBoundaries.has(candidate.blockKey)) return current;
        blockedBoundaries.add(candidate.blockKey);
        return {
          sourceKey,
          pages,
          blockedBoundaries,
          blockedOverflowFlows:
            current.sourceKey === sourceKey
              ? current.blockedOverflowFlows
              : new Set(),
          passCount:
            current.sourceKey === sourceKey ? current.passCount + 1 : 1,
          visitedLayouts,
        };
      }

      const nextVisitedLayouts = new Set(visitedLayouts);
      nextVisitedLayouts.add(candidateLayoutKey);
      return {
        sourceKey,
        pages: candidate.pages,
        blockedBoundaries:
          current.sourceKey === sourceKey
            ? current.blockedBoundaries
            : new Set(),
        blockedOverflowFlows: new Set(),
        passCount:
          current.sourceKey === sourceKey ? current.passCount + 1 : 1,
        visitedLayouts: nextVisitedLayouts,
      };
    });
  }, [
    candidate,
    pages,
    pagination.blockedOverflowFlows,
    pagination.passCount,
    pagination.sourceKey,
    pagination.visitedLayouts,
    profile,
    sourceKey,
  ]);

  return { candidate, pages, pagesRef, probeRef };
}

export { PAGE_BOTTOM_RESERVE };
