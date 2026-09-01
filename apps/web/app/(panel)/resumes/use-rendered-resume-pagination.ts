"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { paginateResumeData, type ResumeData } from "./resume-data";
import {
  getRenderedPageLayout,
  PAGE_BOTTOM_RESERVE,
  PAGE_TOP_RESERVE,
} from "./resume-pagination-layout";
import {
  getResumeFlowSections,
  getResumePaginationFlows,
  getResumePaginationProfile,
  type ResumePaginationFlow,
  type ResumePaginationProfile,
  type ResumePaginationSection,
} from "./resume-pagination-profile.ts";
import { createContinuationResumePage } from "./resume-section-flow.ts";
import {
  syncRenderedResumeSectionHeadings,
  syncResumeSectionHeadingVisibility,
} from "./resume-section-heading-visibility";

const MAX_PAGINATION_PASSES = 160;
const FORWARD_TEXT_CHUNK_SIZE = 24;
const BACKFILL_ITEM_WORD_COUNT = 4;

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean);
}

function joinWords(items: string[]) {
  return items.join(" ").trim();
}

function sectionItems(
  section: "summary" | "skills" | "languages",
  value: string,
) {
  if (section === "summary") return words(value);
  return value
    .split(section === "skills" ? /[،,]/ : /\r?\n|[|،,؛;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinSectionItems(
  section: "summary" | "skills" | "languages",
  items: string[],
) {
  if (section === "summary") return joinWords(items);
  return items.join(section === "skills" ? ", " : " | ");
}

function moveStringSectionForward(
  currentPage: ResumeData,
  nextPage: ResumeData,
  section: "summary" | "skills" | "languages",
) {
  const currentItems = sectionItems(section, currentPage[section]);
  if (!currentItems.length) return false;
  const nextItems = sectionItems(section, nextPage[section]);
  const moveCount =
    section === "summary"
      ? Math.min(
          FORWARD_TEXT_CHUNK_SIZE,
          Math.max(1, currentItems.length - 1),
        )
      : 1;
  const splitAt = Math.max(0, currentItems.length - moveCount);
  currentPage[section] = joinSectionItems(
    section,
    currentItems.slice(0, splitAt),
  );
  nextPage[section] = joinSectionItems(section, [
    ...currentItems.slice(splitAt),
    ...nextItems,
  ]);
  return true;
}

function moveStringSectionBack(
  previousPage: ResumeData,
  nextPage: ResumeData,
  section: "summary" | "skills" | "languages",
) {
  const nextItems = sectionItems(section, nextPage[section]);
  if (!nextItems.length) return false;
  const previousItems = sectionItems(section, previousPage[section]);
  previousPage[section] = joinSectionItems(section, [
    ...previousItems,
    nextItems[0],
  ]);
  nextPage[section] = joinSectionItems(section, nextItems.slice(1));
  return true;
}

function appendText(first: string, second: string) {
  return [first.trim(), second.trim()].filter(Boolean).join(" ");
}

function schedulePaginationUpdate(update: () => void) {
  const frameId = window.requestAnimationFrame(update);
  return () => window.cancelAnimationFrame(frameId);
}

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
    page.experiences
      .map((item) => `${item.id}:${item.description}:${item.technologies}`)
      .join(","),
    page.projects
      .map(
        (item) =>
          `${item.id}:${item.url}:${item.description}:${item.technologies}`,
      )
      .join(","),
    page.educations
      .map(
        (item) =>
          `${item.id}:${item.institution}:${item.credential}:${item.startDate}:${item.endDate}`,
      )
      .join(","),
    page.education,
    page.skills,
    page.languages,
  ].join("|");
}

function getPagesLayoutKey(pages: ResumeData[]) {
  return pages.map(getPageContentKey).join("\n--- page ---\n");
}

function hasWorkContent(page: ResumeData) {
  return page.experiences.length > 0 || page.projects.length > 0;
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
  if (
    section === "summary" ||
    section === "skills" ||
    section === "languages"
  ) {
    return moveStringSectionForward(currentPage, nextPage, section);
  }
  if (section === "experiences") {
    const item = currentPage.experiences.at(-1);
    if (!item) return false;
    const descriptionWords = words(item.description);
    if (descriptionWords.length > BACKFILL_ITEM_WORD_COUNT + 1) {
      const moveCount = Math.min(
        FORWARD_TEXT_CHUNK_SIZE,
        descriptionWords.length - BACKFILL_ITEM_WORD_COUNT,
      );
      const splitAt = descriptionWords.length - moveCount;
      currentPage.experiences[currentPage.experiences.length - 1] = {
        ...item,
        description: joinWords(descriptionWords.slice(0, splitAt)),
        technologies: "",
      };
      const existing = nextPage.experiences[0];
      if (existing?.id === item.id) {
        nextPage.experiences[0] = {
          ...existing,
          description: appendText(
            joinWords(descriptionWords.slice(splitAt)),
            existing.description,
          ),
        };
      } else {
        nextPage.experiences.unshift({
          ...item,
          description: joinWords(descriptionWords.slice(splitAt)),
        });
      }
      return true;
    }
    currentPage.experiences.pop();
    nextPage.experiences.unshift(item);
    return true;
  }
  if (section === "projects") {
    const item = currentPage.projects.at(-1);
    if (!item) return false;
    const descriptionWords = words(item.description);
    if (descriptionWords.length > BACKFILL_ITEM_WORD_COUNT + 1) {
      const moveCount = Math.min(
        FORWARD_TEXT_CHUNK_SIZE,
        descriptionWords.length - BACKFILL_ITEM_WORD_COUNT,
      );
      const splitAt = descriptionWords.length - moveCount;
      currentPage.projects[currentPage.projects.length - 1] = {
        ...item,
        description: joinWords(descriptionWords.slice(0, splitAt)),
        technologies: "",
      };
      const existing = nextPage.projects[0];
      if (existing?.id === item.id) {
        nextPage.projects[0] = {
          ...existing,
          description: appendText(
            joinWords(descriptionWords.slice(splitAt)),
            existing.description,
          ),
        };
      } else {
        nextPage.projects.unshift({
          ...item,
          url: "",
          description: joinWords(descriptionWords.slice(splitAt)),
        });
      }
      return true;
    }
    currentPage.projects.pop();
    nextPage.projects.unshift(item);
    return true;
  }
  if (section === "educations") {
    const education = currentPage.educations.pop();
    if (education) {
      nextPage.educations.unshift(education);
      return true;
    }
    const legacyItems = currentPage.education
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const legacyItem = legacyItems.pop();
    if (!legacyItem) return false;
    currentPage.education = legacyItems.join("\n");
    nextPage.education = [legacyItem, nextPage.education.trim()]
      .filter(Boolean)
      .join("\n");
    return true;
  }
  return false;
}

function moveSectionBack(
  previousPage: ResumeData,
  nextPage: ResumeData,
  section: ResumePaginationSection,
) {
  if (
    section === "summary" ||
    section === "skills" ||
    section === "languages"
  ) {
    return moveStringSectionBack(previousPage, nextPage, section);
  }
  if (section === "experiences") {
    const item = nextPage.experiences[0];
    if (!item) return false;
    const previousItem = previousPage.experiences.at(-1);
    const descriptionWords = words(item.description);
    if (previousItem?.id === item.id && descriptionWords.length) {
      const [word, ...remainingWords] = descriptionWords;
      previousPage.experiences[previousPage.experiences.length - 1] = {
        ...previousItem,
        description: appendText(previousItem.description, word),
        technologies:
          remainingWords.length > 0 ? previousItem.technologies : item.technologies,
      };
      if (remainingWords.length) {
        nextPage.experiences[0] = {
          ...item,
          description: joinWords(remainingWords),
        };
      } else {
        nextPage.experiences.shift();
      }
      return true;
    }
    if (descriptionWords.length > BACKFILL_ITEM_WORD_COUNT) {
      const movedWords = descriptionWords.slice(0, BACKFILL_ITEM_WORD_COUNT);
      nextPage.experiences[0] = {
        ...item,
        description: joinWords(
          descriptionWords.slice(BACKFILL_ITEM_WORD_COUNT),
        ),
      };
      previousPage.experiences.push({
        ...item,
        description: joinWords(movedWords),
        technologies: "",
      });
      return true;
    }
    nextPage.experiences.shift();
    previousPage.experiences.push(item);
    return true;
  }
  if (section === "projects") {
    const item = nextPage.projects[0];
    if (!item) return false;
    const previousItem = previousPage.projects.at(-1);
    const descriptionWords = words(item.description);
    if (previousItem?.id === item.id && descriptionWords.length) {
      const [word, ...remainingWords] = descriptionWords;
      previousPage.projects[previousPage.projects.length - 1] = {
        ...previousItem,
        description: appendText(previousItem.description, word),
        technologies:
          remainingWords.length > 0 ? previousItem.technologies : item.technologies,
      };
      if (remainingWords.length) {
        nextPage.projects[0] = {
          ...item,
          description: joinWords(remainingWords),
        };
      } else {
        nextPage.projects.shift();
      }
      return true;
    }
    if (descriptionWords.length > BACKFILL_ITEM_WORD_COUNT) {
      const movedWords = descriptionWords.slice(0, BACKFILL_ITEM_WORD_COUNT);
      nextPage.projects[0] = {
        ...item,
        url: "",
        description: joinWords(
          descriptionWords.slice(BACKFILL_ITEM_WORD_COUNT),
        ),
      };
      previousPage.projects.push({
        ...item,
        description: joinWords(movedWords),
        technologies: "",
      });
      return true;
    }
    nextPage.projects.shift();
    previousPage.projects.push(item);
    return true;
  }
  if (section === "educations") {
    const education = nextPage.educations.shift();
    if (education) {
      previousPage.educations.push(education);
      return true;
    }
    const legacyItems = nextPage.education
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const legacyItem = legacyItems.shift();
    if (!legacyItem) return false;
    previousPage.education = [previousPage.education.trim(), legacyItem]
      .filter(Boolean)
      .join("\n");
    nextPage.education = legacyItems.join("\n");
    return true;
  }
  return false;
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
  if (
    section === "educations" &&
    pages.slice(boundary + 1).some(hasWorkContent)
  ) {
    return null;
  }
  if (!section || !moveSectionBack(previousPage, nextPage, section)) {
    return null;
  }

  const nextPages = [...pages];
  nextPages[boundary] = previousPage;
  nextPages[boundary + 1] = nextPage;
  if (!hasPageContent(nextPage)) nextPages.splice(boundary + 1, 1);
  return nextPages;
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
    .find((item) => hasSectionContent(currentPage, item));
  if (!section || !moveSectionForward(currentPage, nextPage, section)) {
    return null;
  }

  const nextPages = [...pages];
  nextPages[pageIndex] = currentPage;
  if (existingNext) nextPages[pageIndex + 1] = nextPage;
  else nextPages.push(nextPage);
  return nextPages;
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
      pagination.passCount >= MAX_PAGINATION_PASSES
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
        return schedulePaginationUpdate(() =>
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
          }),
        );
      }

      return schedulePaginationUpdate(() =>
        setPagination((current) => {
          const blockedBoundaries = new Set(
            current.sourceKey === sourceKey ? current.blockedBoundaries : [],
          );
          blockedBoundaries.delete(`${overflow.pageIndex}:${overflow.flow}`);
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
        }),
      );
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
      ? candidateFlows.every((flow) => flow.fits)
      : candidateLayout.fits;
    const candidateLayoutKey = getPagesLayoutKey(candidate.pages);

    return schedulePaginationUpdate(() =>
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
      }),
    );
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

export { PAGE_BOTTOM_RESERVE, PAGE_TOP_RESERVE };
