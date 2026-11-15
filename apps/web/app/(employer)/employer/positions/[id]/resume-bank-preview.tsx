"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/app/(panel)/_components/ui";
import { useEmployerBankResume, useEmployerBankResumeFile, type EmployerBankResume } from "@/lib/employer";

export function EmployerBankResumePreview({ resume, onClose }: { resume: EmployerBankResume; onClose: () => void }) {
  const text = useEmployerBankResume(resume.id);
  const file = useEmployerBankResumeFile(resume.id, resume.hasOriginalFile);
  const pdfRef = useRef<HTMLIFrameElement>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const isPdf = resume.fileName.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!file.data) return;
    const nextUrl = URL.createObjectURL(file.data);
    if (pdfRef.current) pdfRef.current.src = nextUrl;
    if (downloadRef.current) downloadRef.current.href = nextUrl;
    return () => URL.revokeObjectURL(nextUrl);
  }, [file.data]);

  return (
    <Modal
      title={`پیش‌نمایش رزومه ${resume.name || resume.fileName}`}
      onClose={onClose}
      wide
      showCloseButton
      modalClassName="max-h-[calc(100dvh-16px)] p-3 pb-3 max-[560px]:p-2.5 max-[560px]:pb-2.5"
    >
      <div className="mt-2">
        {file.isLoading && <p className="text-sm text-[#60766a]">در حال دریافت فایل اصلی...</p>}
        {file.error && (
          <p role="alert" className="rounded-xl bg-[#fff4ec] p-4 text-sm text-[#a25635]">
            {file.error.message}
          </p>
        )}
        {isPdf && file.data && (
          <iframe
            ref={pdfRef}
            className="h-[calc(100dvh-106px)] w-full rounded-xl border border-[#dfe9e3] bg-white"
            title={`پیش‌نمایش ${resume.fileName}`}
          />
        )}
        {!isPdf && file.data && (
          <a
            ref={downloadRef}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f7b62] px-4 text-sm font-bold text-white no-underline"
            download={resume.fileName}
          >
            <Download size={17} /> دریافت فایل اصلی
          </a>
        )}
        {(!isPdf || !resume.hasOriginalFile) && (
          <div className="mt-4 max-h-[55vh] overflow-auto rounded-xl border border-[#e1ebe4] bg-[#fbfdfb] p-5 text-sm leading-8 text-[#253c32]">
            {text.isLoading ? (
              "در حال دریافت متن رزومه..."
            ) : text.data?.resumeText ? (
              <pre className="m-0 whitespace-pre-wrap break-words font-[inherit]" dir="auto">
                {text.data.resumeText}
              </pre>
            ) : (
              <p>{text.data?.extractionError || "متنی از این رزومه استخراج نشده است."}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
