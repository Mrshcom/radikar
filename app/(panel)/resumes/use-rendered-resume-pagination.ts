"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { paginateResumeData, type ResumeData } from "./resume-data";

const PAGE_BOTTOM_RESERVE = 36;
const CONTENT_SELECTOR = "h1,h2,h3,p,li,time,strong,img";

type RebalanceCandidate = {
  boundary: number;
  key: string;
  page: ResumeData;
  pages: ResumeData[];
};

function hasPageContent(page: ResumeData) {
  return Boolean(
    page.summary.trim() ||
      page.experiences.length ||
      page.educations.length ||
      page.skills.trim() ||
      page.languages.trim(),
  );
}

function moveFirstBlockBack(
  pages: ResumeData[],
  boundary: number,
): ResumeData[] | null {
  const current = pages[boundary];
  const next = pages[boundary + 1];
  if (!current || !next) return null;

  const previousPage: ResumeData = {
    ...current,
    experiences: [...current.experiences],
    educations: [...current.educations],
  };
  const nextPage: ResumeData = {
    ...next,
    experiences: [...next.experiences],
    educations: [...next.educations],
  };

  if (nextPage.experiences.length) {
    previousPage.experiences.push(nextPage.experiences.shift()!);
  } else if (nextPage.educations.length) {
    previousPage.educations.push(nextPage.educations.shift()!);
  } else if (nextPage.skills.trim()) {
    previousPage.skills = nextPage.skills;
    nextPage.skills = "";
  } else if (nextPage.languages.trim()) {
    previousPage.languages = nextPage.languages;
    nextPage.languages = "";
  } else {
    return null;
  }

  const nextPages = [...pages];
  nextPages[boundary] = previousPage;
  nextPages[boundary + 1] = nextPage;
  if (!hasPageContent(nextPage)) nextPages.splice(boundary + 1, 1);
  return nextPages;
}

function getCandidate(
  pages: ResumeData[],
  blockedBoundaries: Set<number>,
): RebalanceCandidate | null {
  for (let boundary = 0; boundary < pages.length - 1; boundary += 1) {
    if (blockedBoundaries.has(boundary)) continue;
    const candidatePages = moveFirstBlockBack(pages, boundary);
    if (!candidatePages) continue;
    const candidatePage = candidatePages[boundary];
    const key = [
      boundary,
      candidatePage.experiences.map((item) => item.id).join(","),
      candidatePage.educations.map((item) => item.id).join(","),
      candidatePage.skills,
      candidatePage.languages,
    ].join("|");
    return { boundary, key, page: candidatePage, pages: candidatePages };
  }
  return null;
}

export function useRenderedResumePagination(
  data: ResumeData,
  templateId: string,
) {
  const sourceKey = JSON.stringify([templateId, data]);
  const initialPages = useMemo(
    () => paginateResumeData(data, templateId),
    [data, templateId],
  );
  const [pagination, setPagination] = useState(() => ({
    sourceKey,
    pages: initialPages,
    blockedBoundaries: new Set<number>(),
  }));
  const pages = pagination.sourceKey === sourceKey ? pagination.pages : initialPages;
  const probeRef = useRef<HTMLDivElement>(null);
  const candidate = useMemo(
    () =>
      getCandidate(
        pages,
        pagination.sourceKey === sourceKey
          ? pagination.blockedBoundaries
          : new Set<number>(),
      ),
    [pages, pagination.blockedBoundaries, pagination.sourceKey, sourceKey],
  );

  useLayoutEffect(() => {
    const probe = probeRef.current;
    const page = probe?.firstElementChild;
    if (!candidate || !(page instanceof HTMLElement)) return;

    const pageRect = page.getBoundingClientRect();
    const contentElements = Array.from(
      page.querySelectorAll<HTMLElement>(CONTENT_SELECTOR),
    ).filter((element) => element.offsetParent !== null);
    const contentBottom = contentElements.reduce(
      (bottom, element) => Math.max(bottom, element.getBoundingClientRect().bottom),
      pageRect.top,
    );
    const fits = contentBottom <= pageRect.bottom - PAGE_BOTTOM_RESERVE;

    if (fits) {
      setPagination({
        sourceKey,
        pages: candidate.pages,
        blockedBoundaries: new Set(),
      });
      return;
    }
    setPagination((current) => {
      const next = new Set(
        current.sourceKey === sourceKey
          ? current.blockedBoundaries
          : [],
      );
      next.add(candidate.boundary);
      return {
        sourceKey,
        pages,
        blockedBoundaries: next,
      };
    });
  }, [candidate, pages, sourceKey]);

  return { candidate, pages, probeRef };
}

export { PAGE_BOTTOM_RESERVE };
