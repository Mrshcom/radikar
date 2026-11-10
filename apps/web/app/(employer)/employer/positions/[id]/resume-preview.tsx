"use client";

import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { Modal } from "@/app/(panel)/_components/ui";
import { useEmployerResume, useEmployerResumeFile, type EmployerCandidate } from "@/lib/employer";

export function EmployerResumePreview({
  positionId,
  candidate,
  onClose,
}: {
  positionId: string;
  candidate: EmployerCandidate;
  onClose: () => void;
}) {
  const isPdf = candidate.fileName.toLowerCase().endsWith(".pdf");
  const file = useEmployerResumeFile(positionId, candidate.id, candidate.hasOriginalFile);
  const text = useEmployerResume(positionId, !candidate.hasOriginalFile || !isPdf ? candidate.id : null);
  const pdfRef = useRef<HTMLIFrameElement>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!file.data) return;
    const url = URL.createObjectURL(file.data);
    if (pdfRef.current) pdfRef.current.src = url;
    if (downloadRef.current) downloadRef.current.href = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file.data]);

  return (
    <Modal
      title={candidate.fileName}
      description={isPdf && candidate.hasOriginalFile ? "پیش‌نمایش فایل اصلی PDF" : "نمایش رزومهٔ واردشده"}
      onClose={onClose}
      wide
      showCloseButton
      modalClassName="max-h-[calc(100dvh-16px)] p-3 pb-3 max-[560px]:p-2.5 max-[560px]:pb-2.5"
    >
      <div className="mt-2">
        {candidate.hasOriginalFile && file.isLoading && (
          <p className="text-sm text-[#60766a]">در حال دریافت فایل اصلی...</p>
        )}
        {file.error && (
          <p role="alert" className="rounded-xl bg-[#fff4ec] p-4 text-sm text-[#a25635]">
            {file.error.message}
          </p>
        )}
        {isPdf && file.data && (
          <iframe
            ref={pdfRef}
            title={`پیش‌نمایش ${candidate.fileName}`}
            className="h-[calc(100dvh-106px)] w-full rounded-xl border border-[#dfe9e3] bg-white"
          />
        )}
        {!isPdf && file.data && (
          <a
            ref={downloadRef}
            download={candidate.fileName}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0f7b62] px-4 text-sm font-bold text-white no-underline"
          >
            <Download size={17} /> دریافت فایل اصلی Word
          </a>
        )}
        {!isPdf && (
          <p className="text-xs leading-6 text-[#6d8176]">
            مرورگر فایل Word را مانند PDF نمایش نمی‌دهد؛ می‌توانی نسخهٔ اصلی را دریافت کنی یا متن استخراج‌شده را اینجا
            بخوانی.
          </p>
        )}
        {!candidate.hasOriginalFile && (
          <p className="rounded-xl bg-[#fff9ed] p-3 text-xs leading-6 text-[#8a6238]">
            این رزومه پیش از فعال‌شدن ذخیرهٔ فایل اصلی وارد شده است. برای دیدن خود فایل، آن را دوباره وارد کن؛ متن
            استخراج‌شده در ادامه نمایش داده می‌شود.
          </p>
        )}
        {(!isPdf || !candidate.hasOriginalFile) && (
          <div className="max-h-[55vh] overflow-auto rounded-xl border border-[#e1ebe4] bg-[#fbfdfb] p-5 text-sm leading-8 text-[#253c32]">
            {text.isLoading ? (
              "در حال دریافت متن رزومه..."
            ) : text.error ? (
              <p role="alert">{text.error.message}</p>
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
