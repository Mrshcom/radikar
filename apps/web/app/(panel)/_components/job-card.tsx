"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Bookmark,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Eye,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import type { Job } from "../_data/jobs";
import { Modal } from "./ui";
import { cn } from "@/lib/cn";
import { formatPersianNumber, toPersianDigits } from "@/lib/fa-number";
import { sanitizeRemoteImageSource } from "@radicar/validators";

const toneStyles: Record<
  Job["tone"],
  { logo: string }
> = {
  violet: {
    logo: "border-[#ded7eb] bg-[#f4f1f8] text-[#7057a6]",
  },
  green: {
    logo: "border-[#cce4da] bg-[#eaf5f0] text-[#087157]",
  },
  navy: {
    logo: "border-[#d4e1ea] bg-[#f0f5f8] text-[#47769e]",
  },
  coral: {
    logo: "border-[#efd9ce] bg-[#fbf2ed] text-[#b86643]",
  },
};

export type JobDetailsData = Pick<
  Job,
  "company" | "role" | "match" | "place" | "age" | "reason"
> & {
  description?: string;
  sourceUrl?: string;
};

type JobCardData = Job & {
  id?: string;
  description?: string;
  sourceUrl?: string;
};

export function JobLogo({
  company,
  letter,
  logoUrl: rawLogoUrl,
  tone = "green",
  variant = "card",
}: {
  company: string;
  letter?: string;
  logoUrl?: string;
  tone?: Job["tone"];
  variant?: "card" | "board";
}) {
  const [failedLogoUrl, setFailedLogoUrl] = useState("");
  const logoUrl = sanitizeRemoteImageSource(rawLogoUrl);
  const showLogo = Boolean(logoUrl && failedLogoUrl !== logoUrl);
  const logoLetter = letter || Array.from(company.trim())[0] || "م";

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border font-extrabold",
        variant === "board"
          ? "size-7 rounded-lg text-[9px]"
          : "size-11 rounded-xl text-[16px]",
        toneStyles[tone].logo,
      )}
      aria-hidden={!showLogo}
    >
      {showLogo ? (
        <Image
          className="size-full bg-white object-contain"
          src={logoUrl}
          alt={`نشان ${company}`}
          width={48}
          height={48}
          unoptimized
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedLogoUrl(logoUrl)}
        />
      ) : (
        logoLetter
      )}
    </div>
  );
}

export function JobDetailsModal({
  job,
  onClose,
}: {
  job: JobDetailsData;
  onClose: () => void;
}) {
  return (
    <Modal
      title={job.role}
      description={[job.company, job.place].filter(Boolean).join(" · ")}
      headerClassName="!items-start border-b border-[#e7ece8] pb-4"
      headerActions={
        <>
          <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#edf7f2] px-3 text-[9px] font-extrabold whitespace-nowrap text-[#0b7b5e]">
            <Target size={14} /> {formatPersianNumber(job.match)}٪ تطابق
          </span>
          {job.age && (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#f2f5f2] px-3 text-[8px] whitespace-nowrap text-[#71817e]">
              <Clock3 size={13} /> {toPersianDigits(job.age)}
            </span>
          )}
        </>
      }
      onClose={onClose}
    >
      <div className="grid gap-4 pt-4">
        {job.reason && (
          <section className="rounded-xl border border-[#dcebe4] bg-[#f2f9f5] p-3.5">
            <h3 className="m-0 flex items-center gap-1.5 text-[11px] text-[#176f59]">
              <Sparkles size={15} /> خلاصهٔ تطابق
            </h3>
            <p
              className="mb-0 mt-2 whitespace-pre-wrap text-[10px] leading-[1.9] text-[#60756f]"
              dir="auto"
            >
              {job.reason}
            </p>
          </section>
        )}
        <section className="rounded-xl border border-[#e2e8e3] bg-[#fbfcfa] p-4">
          <h3 className="flex flex-wrap items-center m-0 text-[11px] text-[#19312f]">
            <span className="min-w-0 flex-1">متن کامل آگهی</span>
            {job.sourceUrl && (
              <a
                className="inline-flex min-h-8 w-fit items-center gap-2 rounded-[8px] px-2 text-[9px] font-bold text-[#0f7b62] no-underline transition-colors duration-200 hover:bg-[#dfeee7]"
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                مشاهده منبع آگهی <ExternalLink size={15} />
              </a>
            )}
          </h3>
          <p
            className="mb-0 mt-3 max-h-[45vh] overflow-y-auto whitespace-pre-wrap pl-2 text-[10px] text-justify leading-[2] text-[#526662]"
            dir="auto"
          >
            {job.description?.trim() || "متن کامل این آگهی ذخیره نشده است."}
          </p>
        </section>
      </div>
    </Modal>
  );
}

export function JobCard({
  job,
  saved = false,
  onSave,
}: {
  job: JobCardData;
  saved?: boolean;
  onSave?: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const insight = job.reason?.trim() || job.description?.trim();

  return (
    <>
      <article className="group flex min-h-[255px] min-w-0 flex-col rounded-2xl border border-[#dde5df] bg-white p-5 transition-colors duration-200 hover:border-[#bcd2c8]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <JobLogo
              company={job.company}
              letter={job.letter}
              logoUrl={job.logoUrl}
              tone={job.tone}
            />
            <div className="min-w-0">
              <strong
                className="block truncate text-[10px] font-bold text-[#314943]"
                dir="auto"
              >
                {job.company}
              </strong>
              {job.place && (
                <span
                  className="mt-1 flex items-center gap-1 truncate text-[8px] text-[#899791]"
                  dir="auto"
                >
                  <MapPin size={11} />
                  {job.place}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-lg bg-[#edf7f2] px-2.5 text-[8px] font-extrabold text-[#0b7b5e]">
              <Target size={13} /> {formatPersianNumber(job.match)}٪ تطابق
            </span>
            {onSave && (
              <button
                className={cn(
                  "grid size-8 place-items-center rounded-lg border border-transparent bg-transparent transition-colors duration-200 hover:border-[#dce8e2] hover:bg-[#f5f8f6]",
                  saved
                    ? "text-[#0f7b62]"
                    : "text-[#879793] hover:text-[#0f7b62]",
                )}
                onClick={onSave}
                aria-label={saved ? "حذف از ذخیره‌ها" : "ذخیره فرصت"}
              >
                <Bookmark
                  className={saved ? "fill-current" : undefined}
                  size={17}
                />
              </button>
            )}
          </div>
        </div>

        <h4
          className="mb-0 mt-5 line-clamp-2 text-[14px] font-semibold leading-[1.7] tracking-[-.15px] text-[#18332f]"
          dir="auto"
        >
          {job.role}
        </h4>
        {insight && (
          <div className="mt-3 flex items-start gap-2 border-r-2 border-[#78bba5] bg-[#f7faf8] px-3 py-2.5 text-[8px] leading-[1.8] text-[#687a75]">
            <Sparkles className="mt-0.5 shrink-0 text-[#45987d]" size={13} />
            <p className="m-0 line-clamp-2" dir="auto">
              {insight}
            </p>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ece8] pt-4">
          <small className="flex items-center gap-1.5 text-[8px] text-[#8c9a97]">
            <Clock3 size={12} />
            {job.age ? toPersianDigits(job.age) : "تازه ثبت‌شده"}
          </small>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[8px] font-bold text-[#60716e] transition-colors duration-200 hover:bg-[#f3f6f4] hover:text-[#0f7b62]"
              type="button"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye size={14} /> نمایش کامل آگهی
            </button>
            <Link
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[8px] font-bold text-[#0b795d] no-underline transition-colors duration-200 hover:bg-[#edf7f2]"
              href={
                job.id ? `/match?job=${encodeURIComponent(job.id)}` : "/match"
              }
            >
              تطبیق مجدد <ChevronLeft size={14} />
            </Link>
          </div>
        </div>
      </article>
      {detailsOpen && (
        <JobDetailsModal job={job} onClose={() => setDetailsOpen(false)} />
      )}
    </>
  );
}
