import type { ReactNode, RefObject } from "react";

export function ResumePaginationProbe({
  children,
  probeRef,
}: {
  children: ReactNode;
  probeRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={probeRef}
      className="invisible fixed top-0 left-[-10000px] w-[793.700787px] pointer-events-none print:hidden"
      data-resume-pagination-probe
    >
      {children}
    </div>
  );
}

export function ResumePrintPage({
  children,
  templateId,
}: {
  children: ReactNode;
  templateId: string;
}) {
  return (
    <div
      className="contents print:block"
      data-resume-print-page
      data-resume-template={templateId}
    >
      {children}
    </div>
  );
}
