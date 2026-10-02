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

  return (
    <>
      <article className="flex min-h-[250px] min-w-0 flex-col rounded-2xl border border-[#d9e6df] bg-white p-5 transition-colors hover:border-[#9ac8b8]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <JobLogo company={listing.companyName} logoUrl={listing.companyLogoUrl || undefined} tone="green" />
            <div className="min-w-0">
              <strong className="block truncate text-[10px] font-bold text-[#314943]" dir="auto">
                {listing.companyName}
              </strong>
              {listing.location && (
                <span className="mt-1 flex items-center gap-1 truncate text-[8px] text-[#899791]" dir="auto">
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
        <p className="mt-3 line-clamp-2 min-h-9 text-[9px] leading-[1.9] text-[#687a75]" dir="auto">
          {summary || listing.employmentType || listing.workplaceType || "جزئیات آگهی را مشاهده کن."}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#e7ece8] pt-4">
          <span className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-[#edf7f2] px-2 text-[8px] font-extrabold text-[#0b7b5e]">
            <Sparkles size={12} /> پیشنهاد جدید
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[8px] font-bold text-[#60716e] hover:bg-[#f3f6f4] hover:text-[#0f7b62]"
              type="button"
              onClick={() => setDetailsOpen(true)}
            >
              جزئیات
            </button>
            <button
              className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[8px] font-bold text-[#0b795d] hover:bg-[#edf7f2]"
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
