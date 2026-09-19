"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { type ResumeColorId, type ResumeData } from "./resume-data";
import { ResumeDocumentPage } from "./resume-document";
import { useRenderedResumePagination } from "./use-rendered-resume-pagination";
import { ResumePaginationProbe } from "./resume-pagination-components";
import { normalizeResumeDataInput } from "@/lib/resume-input";

const DOCUMENT_WIDTH = 793.700787;
const DOCUMENT_HEIGHT = DOCUMENT_WIDTH * (297 / 210);

export function ScaledResumePreview({
  templateId,
  data,
  colorId,
  showAllPages = false,
}: {
  templateId: string;
  data: ResumeData;
  colorId?: ResumeColorId;
  showAllPages?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const safeData = useMemo(() => normalizeResumeDataInput(data), [data]);
  const { candidate, pages, pagesRef, probeRef, isSettled } =
    useRenderedResumePagination(safeData, templateId);
  const visiblePages = showAllPages ? pages : pages.slice(0, 1);
  const pageStackHeight =
    visiblePages.length * DOCUMENT_HEIGHT +
    Math.max(visiblePages.length - 1, 0) * 20;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const updateScale = () =>
      setScale(Math.min(root.clientWidth / DOCUMENT_WIDTH, 1));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative w-full overflow-hidden"
      data-resume-scale-container
    >
      <div
        ref={pagesRef}
        className="relative mx-auto"
        style={{
          width: scale ? DOCUMENT_WIDTH * scale : 0,
          height: scale ? pageStackHeight * scale : 0,
          visibility: scale && isSettled ? "visible" : "hidden",
        }}
      >
        <div
          className="absolute top-0 left-0 grid w-[793.700787px] origin-top-left gap-5"
          style={{ transform: `scale(${scale})` }}
        >
          {visiblePages.map((pageData, index) => (
            <ResumeDocumentPage
              templateId={templateId}
              data={pageData}
              colorId={colorId}
              continuation={index > 0}
              key={`${templateId}-${index}`}
            />
          ))}
        </div>
      </div>
      {scale && !isSettled && (
        <div
          aria-label="در حال آماده‌سازی پیش‌نمایش رزومه"
          className="absolute inset-0 rounded-[10px] border border-[#dfe8e2] bg-white p-4 shadow-inner"
          role="status"
        >
          <div className="h-full rounded-lg bg-[linear-gradient(110deg,#edf2ee_20%,#ffffff_42%,#edf2ee_64%)] bg-[length:220%_100%] animate-[shimmer_1.35s_ease-in-out_infinite]" />
        </div>
      )}
      {candidate && (
        <ResumePaginationProbe probeRef={probeRef}>
          <ResumeDocumentPage
            templateId={templateId}
            data={candidate.page}
            colorId={colorId}
            continuation={candidate.boundary > 0}
            key={candidate.key}
          />
        </ResumePaginationProbe>
      )}
    </div>
  );
}
