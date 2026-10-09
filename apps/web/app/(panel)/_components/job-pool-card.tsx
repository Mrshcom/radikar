"use client";

import { Bookmark, MapPin, Sparkles, Target } from "lucide-react";
import { JobDetailsModal, JobLogo } from "./job-card";
import { cn } from "@/lib/cn";
import type { PublicJobPoolListing } from "@/lib/job-pool";
import { useState } from "react";

export function JobPoolCard({
  listing,
  saved,
  saving,
  onSave,
  onAnalyze,
}: {
  listing: PublicJobPoolListing;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
  onAnalyze: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const summary = listing.skills.slice(0, 4).join(" · ");
  const deadlineLabel =
    listing.deadlineDays != null && listing.deadlineDays >= 0 && listing.deadlineDays <= 3
      ? `${listing.deadlineDays.toLocaleString("fa-IR")} روز تا پایان فرصت`
      : null;

  return (
    <>
      <article className="group flex min-h-[250px] min-w-0 flex-col rounded-2xl border border-[#dde5df] bg-white p-5 pb-4 transition-colors duration-200 hover:border-[#bcd2c8]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <JobLogo company={listing.companyName} logoUrl={listing.companyLogoUrl || undefined} tone="green" />
            <div className="min-w-0">
              <strong className="block truncate text-[12px] font-bold text-[#314943]" dir="auto">
                {listing.companyName}
              </strong>
              {listing.location && (
                <span className="mt-1 flex items-center gap-1 truncate text-[10px] text-[#899791]" dir="auto">
                  <MapPin size={11} /> {listing.location}
                </span>
              )}
            </div>
          </div>
          <button
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg border border-transparent bg-transparent transition-colors hover:border-[#dce8e2] hover:bg-[#f5f8f6]",
              saved ? "text-[#0f7b62]" : "text-[#879793] hover:text-[#0f7b62]",
            )}
            type="button"
            onClick={onSave}
            disabled={saving}
            aria-label={saved ? "حذف از ذخیره‌ها" : "ذخیره فرصت"}
          >
            <Bookmark className={saved ? "fill-current" : undefined} size={17} />
          </button>
        </div>

        <h3 className="mb-0 mt-5 line-clamp-2 text-[14px] font-semibold leading-[1.7] text-[#18332f]" dir="auto">
          {listing.title}
        </h3>
        <div className="mt-3 flex min-h-[54px] items-start gap-2 border-r-2 border-[#78bba5] bg-[#f7faf8] px-3 py-2.5 text-[10px] leading-[1.8] text-[#687a75]">
          <Sparkles className="mt-0.5 shrink-0 text-[#45987d]" size={13} />
          <p className="m-0 line-clamp-2" dir="auto">
            {summary || listing.employmentType || listing.workplaceType || "جزئیات آگهی را مشاهده کن."}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e7ece8] pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex min-h-7 items-center gap-1.5 rounded-lg bg-[#edf7f2] px-2.5 text-[10px] text-[#0b7b5e]">
              <Sparkles size={12} /> پیشنهاد جدید
            </span>
            {deadlineLabel && (
              <span className="inline-flex min-h-7 rounded-lg bg-[#fff1d9] px-2.5 text-[9px] font-bold text-[#a87529]">
                {deadlineLabel}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[10px] text-[#60716e] transition-colors duration-200 hover:bg-[#f3f6f4] hover:text-[#0f7b62]"
              type="button"
              onClick={() => setDetailsOpen(true)}
            >
              جزئیات
            </button>
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[10px] text-[#0b795d] transition-colors duration-200 hover:bg-[#edf7f2]"
              type="button"
              onClick={onAnalyze}
              disabled={saving || !listing.description}
            >
              <Target size={13} /> تحلیل با رزومه
            </button>
          </div>
        </div>
      </article>
      {detailsOpen && (
        <JobDetailsModal
          job={{
            company: listing.companyName,
            role: listing.title,
            match: 0,
            place: listing.location || "",
            age: listing.postedAt
              ? new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(listing.postedAt))
              : "",
            reason: summary,
            description: listing.description || undefined,
            sourceUrl: listing.canonicalUrl,
          }}
          onClose={() => setDetailsOpen(false)}
        />
      )}
    </>
  );
}
