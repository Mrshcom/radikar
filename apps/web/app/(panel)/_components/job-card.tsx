"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
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
import { formatPersianNumber } from "@/lib/fa-number";
import { sanitizeRemoteImageSource } from "@radicar/validators";

const toneStyles: Record<
  Job["tone"],
  { logo: string; glow: string }
> = {
  violet: {
    logo: "bg-[#eee9f8] text-[#7057a6] ring-[#ded4f1]",
    glow: "bg-[#e8def8]",
  },
  green: {
    logo: "bg-[#d8eee5] text-[#087157] ring-[#c5e4d8]",
    glow: "bg-[#d6eee4]",
  },
  navy: {
    logo: "bg-[#e5eff7] text-[#47769e] ring-[#d1e3f0]",
    glow: "bg-[#dcebf6]",
  },
  coral: {
    logo: "bg-[#fae8dc] text-[#b86643] ring-[#f1d6c7]",
    glow: "bg-[#f8e1d4]",
  },
};

type JobCardData = Job & {
  id?: string;
  description?: string;
  sourceUrl?: string;
};

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
  const [failedLogoUrl, setFailedLogoUrl] = useState("");
  const logoLetter = job.letter || Array.from(job.company.trim())[0] || "م";
  const logoUrl = sanitizeRemoteImageSource(job.logoUrl);
  const showLogo = Boolean(logoUrl && failedLogoUrl !== logoUrl);
  const insight = job.reason?.trim() || job.description?.trim();
  const tone = toneStyles[job.tone];

  return (
    <>
      <article className="group relative flex min-h-[255px] min-w-0 flex-col overflow-hidden rounded-[20px] border border-[#e1e8e2] bg-white p-5 shadow-[0_10px_30px_rgba(27,55,50,.045)] transition duration-300 hover:border-[#cddfd6] hover:shadow-[0_20px_42px_rgba(27,55,50,.11)]">
        <span
          className={cn(
            "pointer-events-none absolute -top-14 -right-14 size-32 rounded-full opacity-45 blur-3xl",
            tone.glow,
          )}
          aria-hidden="true"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "grid size-12 shrink-0 place-items-center overflow-hidden rounded-[15px] text-[17px] font-extrabold ring-1 shadow-[0_8px_18px_rgba(25,55,48,.08)]",
                tone.logo,
              )}
              aria-hidden={!showLogo}
            >
              {showLogo ? (
                <Image
                  className="size-full bg-white object-contain p-1.5"
                  src={logoUrl}
                  alt={`نشان ${job.company}`}
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
            <div className="min-w-0">
              <strong
                className="block truncate text-[10px] text-[#405551]"
                dir="auto"
              >
                {job.company}
              </strong>
              {job.place && (
                <span
                  className="mt-1 flex items-center gap-1 truncate text-[8px] text-[#8a9995]"
                  dir="auto"
                >
                  <MapPin size={11} />
                  {job.place}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[#d5e9e1] bg-[#edf8f3] px-2.5 text-[8px] font-extrabold text-[#0b7b5e] shadow-[0_4px_10px_rgba(15,123,98,.06)]">
              <Target size={13} /> {formatPersianNumber(job.match)}٪ تطابق
            </span>
            {onSave && (
              <button
                className={cn(
                  "grid size-9 place-items-center rounded-xl border border-transparent bg-transparent transition-colors duration-200 hover:bg-[#edf7f2]",
                  saved
                    ? "text-[#0f7b62]"
                    : "text-[#879793] hover:text-[#0f7b62]",
                )}
                onClick={onSave}
                aria-label={saved ? "حذف از ذخیره‌ها" : "ذخیره فرصت"}
              >
                {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
              </button>
            )}
          </div>
        </div>

        <h4
          className="mb-0 mt-5 line-clamp-2 text-[14px] leading-[1.7] tracking-[-.15px] text-[#18332f]"
          dir="auto"
        >
          {job.role}
        </h4>
        {insight && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#e8eee9] bg-[#f7faf7] p-2.5 text-[8px] leading-[1.8] text-[#71827e]">
            <Sparkles className="mt-0.5 shrink-0 text-[#55a58a]" size={13} />
            <p className="m-0 line-clamp-2" dir="auto">
              {insight}
            </p>
          </div>
        )}

        <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e9eeea] pt-4">
          <small className="flex items-center gap-1.5 text-[8px] text-[#8c9a97]">
            <Clock3 size={12} />
            {job.age || "تازه ثبت‌شده"}
          </small>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-transparent bg-transparent px-2.5 text-[8px] font-bold text-[#60716e] transition-colors duration-200 hover:bg-[#f1f6f3] hover:text-[#0f7b62]"
              type="button"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye size={14} /> نمایش کامل آگهی
            </button>
            <Link
              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-transparent bg-transparent px-2.5 text-[8px] font-bold text-[#0b795d] no-underline transition-colors duration-200 hover:bg-[#edf7f2]"
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
        <Modal
          title={job.role}
          description={[job.company, job.place].filter(Boolean).join(" · ")}
          onClose={() => setDetailsOpen(false)}
        >
          <div className="grid gap-4 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#d5e9e1] bg-[#edf8f3] px-3 text-[9px] font-extrabold text-[#0b7b5e]">
                <Target size={14} /> {formatPersianNumber(job.match)}٪ تطابق
              </span>
              {job.age && (
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#f2f5f2] px-3 text-[8px] text-[#71817e]">
                  <Clock3 size={13} /> {job.age}
                </span>
              )}
            </div>
            {job.reason && (
              <section className="rounded-xl border border-[#dcebe4] bg-[#f2f9f5] p-3.5">
                <h3 className="m-0 flex items-center gap-1.5 text-[10px] text-[#176f59]">
                  <Sparkles size={15} /> خلاصهٔ تطابق
                </h3>
                <p
                  className="mb-0 mt-2 whitespace-pre-wrap text-[9px] leading-[1.9] text-[#60756f]"
                  dir="auto"
                >
                  {job.reason}
                </p>
              </section>
            )}
            <section className="rounded-xl border border-[#e2e8e3] bg-[#fbfcfa] p-4">
              <h3 className="m-0 text-[11px] text-[#19312f]">متن کامل آگهی</h3>
              <p
                className="mb-0 mt-3 max-h-[45vh] overflow-y-auto whitespace-pre-wrap pl-2 text-[10px] leading-[2] text-[#526662]"
                dir="auto"
              >
                {job.description?.trim() || "متن کامل این آگهی ذخیره نشده است."}
              </p>
            </section>
            {job.sourceUrl && (
              <a
                className="inline-flex min-h-10 w-fit items-center gap-2 rounded-[10px] border border-[#cfe3da] bg-[#edf7f2] px-3.5 text-[9px] font-bold text-[#0f7b62] no-underline transition-colors duration-200 hover:bg-[#dfeee7]"
                href={job.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                مشاهده منبع آگهی <ExternalLink size={15} />
              </a>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
