"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import {
  CalendarRange,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { JobCard } from "../_components/job-card";
import { JalaliDatePicker } from "../_components/jalali-date-picker";
import { JobCardsSkeleton } from "../_components/loading-skeletons";
import { SectionTitle } from "../_components/ui";
import { useToast } from "@/app/_components/toast";
import { applicationStore, jobStore } from "@/lib/data/stores";
import type { ApplicationRecord, JobRecord } from "@/lib/data/models";
import { formatPersianNumber } from "@/lib/fa-number";
import {
  jobFilterParsers,
  jobFilterUrlKeys,
  type JobScope,
} from "@/lib/job-filter-search-params";
import {
  matchesJobCategory,
  type JobCategory,
} from "@/lib/job-category";
import { prioritizeSavedJobs } from "@/lib/job-order";
import { hasJobActivityInDateRange } from "@/lib/job-application-filter";

const categoryOptions: Array<{ id: JobScope; label: string }> = [
  { id: "all", label: "همه" },
  { id: "domestic", label: "داخل ایران" },
  { id: "international", label: "بین‌المللی" },
  { id: "remote", label: "دورکاری" },
];

export default function JobsPage() {
  const notify = useToast();
  const [urlFilters, setUrlFilters] = useQueryStates(jobFilterParsers, {
    urlKeys: jobFilterUrlKeys,
    history: "replace",
    shallow: true,
    scroll: false,
  });
  const { query, scope, minMatch, fromDate, toDate } = urlFilters;
  const activeDetailedFilterCount =
    Number(minMatch > 0) + Number(Boolean(fromDate || toDate));
  const hasActiveFilters = activeDetailedFilterCount > 0;
  const [filtersOpen, setFiltersOpen] = useState(hasActiveFilters);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const [jobRecords, applicationRecords] = await Promise.all([
        jobStore.list(),
        applicationStore.list(),
      ]);
      setJobs(jobRecords);
      setApplications(applicationRecords);
    } catch (event) {
      const message =
        event instanceof Error
          ? event.message
          : "خواندن فرصت‌های ذخیره‌شده ناموفق بود.";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([jobStore.list(), applicationStore.list()])
      .then(([jobRecords, applicationRecords]) => {
        if (active) {
          setJobs(jobRecords);
          setApplications(applicationRecords);
        }
      })
      .catch((event: unknown) => {
        if (active) {
          const message =
            event instanceof Error
              ? event.message
              : "خواندن فرصت‌های ذخیره‌شده ناموفق بود.";
          setError(message);
          notify(message, "error");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [notify]);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fa");
    const selectedCategory: JobCategory | undefined =
      scope === "all" ? undefined : scope;
    const filteredJobs = jobs.filter((job) => {
      const matchesQuery =
        !normalizedQuery ||
        [job.role, job.company, job.description, job.reason].some((value) =>
          value?.toLocaleLowerCase("fa").includes(normalizedQuery),
        );
      const matchesCategory =
        !selectedCategory || matchesJobCategory(job, selectedCategory);
      return (
        matchesQuery &&
        matchesCategory &&
        job.match >= minMatch &&
        hasJobActivityInDateRange(job, applications, fromDate, toDate)
      );
    });
    return prioritizeSavedJobs(filteredJobs);
  }, [applications, fromDate, jobs, minMatch, query, scope, toDate]);

  const clearFilters = () => {
    void setUrlFilters({ minMatch: 0, fromDate: "", toDate: "" });
  };

  const toggleSave = async (job: JobRecord) => {
    try {
      const updated = {
        ...job,
        saved: !job.saved,
        updatedAt: new Date().toISOString(),
      };
      await jobStore.put(updated);
      setJobs((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      notify(updated.saved ? "فرصت شغلی ذخیره شد" : "فرصت از ذخیره‌ها حذف شد");
    } catch {
      notify("تغییر وضعیت ذخیره فرصت شغلی ناموفق بود.", "error");
    }
  };

  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold text-[#526461] no-underline";
  const emptyState =
    "flex min-h-[300px] flex-col items-center justify-center rounded-[15px] border border-dashed border-[#dce3dc] text-[#8b9996] [&_h3]:mb-[3px] [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:text-[#19312f] [&_p]:mb-[14px] [&_p]:mt-0 [&_p]:text-[9px]";

  return (
    <>
      <SectionTitle
        title="فرصت‌های شغلی"
        description="فقط فرصت‌هایی نمایش داده می‌شوند که از یک آگهی واقعی وارد و تحلیل کرده‌ای."
        action={
          <button
            className={`${secondaryButton} relative ${filtersOpen ? "border-[#c5e0d5] bg-[#e9f5ef] text-[#0f7b62]" : ""}`}
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            aria-label={
              activeDetailedFilterCount
                ? `فیلترها، ${formatPersianNumber(activeDetailedFilterCount)} فیلتر فعال`
                : "فیلترها"
            }
          >
            <SlidersHorizontal size={18} />
            {activeDetailedFilterCount > 0 && (
              <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full border-2 border-white bg-[#0f7b62] text-[7px] font-extrabold leading-none text-white">
                {formatPersianNumber(activeDetailedFilterCount)}
              </span>
            )}
            فیلترها
          </button>
        }
      />
      <div className="flex h-[57px] items-center gap-[10px] rounded-xl border border-[#e1e7e3] bg-white py-2 pl-2 pr-[11px] transition-colors focus-within:border-[#a9cfc0]">
        <Search size={19} />
        <input
          className="h-full flex-1 border-0 bg-transparent text-[12px] outline-0 placeholder:text-right"
          value={query}
          onChange={(event) =>
            void setUrlFilters({ query: event.target.value })
          }
          aria-label="جست‌وجوی فرصت شغلی"
          placeholder="عنوان شغل، شرکت یا مهارت..."
        />
      </div>
      {filtersOpen && (
        <div className="mt-3 rounded-xl border border-[#e1e7e3] bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#edf1ee] pb-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#304943]">
              <SlidersHorizontal size={16} className="text-[#0f7b62]" />
              فیلترهای پیشرفته
            </div>
            {hasActiveFilters && (
              <button
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-bold text-[#70807c] transition-colors hover:bg-[#f2f6f4] hover:text-[#0f7b62]"
                type="button"
                onClick={clearFilters}
              >
                <RotateCcw size={13} /> پاک‌کردن
              </button>
            )}
          </div>
          <div className="grid items-end gap-4 min-[860px]:grid-cols-[minmax(360px,520px)_260px]">
            <fieldset className="m-0 grid gap-2 border-0 p-0">
              <legend className="mb-2 flex items-center gap-1.5 text-[9px] font-semibold text-[#536562]">
                <CalendarRange size={14} className="text-[#0f7b62]" /> بازه
                تاریخ اپلای
              </legend>
              <div className="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
                <label className="grid gap-1.5 text-[8px] text-[#7a8985]">
                  از تاریخ
                  <JalaliDatePicker
                    ariaLabel="از تاریخ"
                    value={fromDate}
                    max={toDate || undefined}
                    onChange={(value) => void setUrlFilters({ fromDate: value })}
                  />
                </label>
                <label className="grid gap-1.5 text-[8px] text-[#7a8985]">
                  تا تاریخ
                  <JalaliDatePicker
                    ariaLabel="تا تاریخ"
                    value={toDate}
                    min={fromDate || undefined}
                    onChange={(value) => void setUrlFilters({ toDate: value })}
                  />
                </label>
              </div>
            </fieldset>
            <label className="grid w-full max-w-[260px] gap-2 text-[9px] font-semibold text-[#536562]">
              <span className="flex items-center justify-between gap-3">
                حداقل تطابق
                <strong className="rounded-md bg-[#edf7f2] px-2 py-1 text-[9px] text-[#0f7b62]">
                  {formatPersianNumber(minMatch)}٪
                </strong>
              </span>
              <input
                className="h-4 w-full cursor-pointer appearance-none bg-transparent accent-[#0f7b62] outline-none ring-0 [-webkit-tap-highlight-color:transparent] focus:appearance-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&::-moz-focus-outer]:border-0 [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#0f7b62] [&::-moz-range-thumb]:outline-none [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border [&::-moz-range-track]:border-[#e2eee9] [&::-moz-range-track]:bg-[#f6faf8] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-[#e2eee9] [&::-webkit-slider-runnable-track]:bg-[#f6faf8] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[#0f7b62] [&::-webkit-slider-thumb]:outline-none focus-visible:[&::-moz-range-thumb]:border-2 focus-visible:[&::-moz-range-thumb]:border-[#b7ddd0] focus-visible:[&::-webkit-slider-thumb]:border-2 focus-visible:[&::-webkit-slider-thumb]:border-[#b7ddd0]"
                type="range"
                min="0"
                max="95"
                value={minMatch}
                onChange={(event) =>
                  void setUrlFilters({ minMatch: Number(event.target.value) })
                }
              />
            </label>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between py-5 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-3">
        <strong className="text-[11px]">
          {loading
            ? "در حال خواندن فرصت‌ها"
            : `${formatPersianNumber(visibleJobs.length)} فرصت ذخیره‌شده`}
        </strong>
        <div className="flex gap-1.5 overflow-x-auto">
          {categoryOptions.map((item) => (
            <button
              key={item.id}
              className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] ${scope === item.id ? "border-[#9dcdbd] bg-[#edf6f1] text-[#0f7b62]" : "border-[#e6ebe6] bg-white text-[#788784]"}`}
              onClick={() => void setUrlFilters({ scope: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <div className={emptyState}>
          <Search size={34} />
          <h3>خواندن فرصت‌ها ناموفق بود</h3>
          <p>{error}</p>
          <button className={secondaryButton} onClick={loadJobs}>
            تلاش دوباره
          </button>
        </div>
      ) : loading ? (
        <JobCardsSkeleton count={6} />
      ) : visibleJobs.length ? (
        <div className="grid grid-cols-3 gap-3 max-[1120px]:grid-cols-2 max-[560px]:grid-cols-1">
          {visibleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={job.saved}
              onSave={() => void toggleSave(job)}
            />
          ))}
        </div>
      ) : (
        <div className={emptyState}>
          <Search size={34} />
          <h3>
            {jobs.length
              ? "فرصتی با این فیلتر پیدا نشد"
              : "هنوز فرصت شغلی وارد نکرده‌ای"}
          </h3>
          <p>
            {jobs.length
              ? "عبارت جست‌وجو یا فیلترها را تغییر بده."
              : "در بخش تطبیق هوشمند، متن یا لینک یک آگهی واقعی را تحلیل کن."}
          </p>
          {!jobs.length && (
            <Link className={secondaryButton} href="/match">
              وارد کردن آگهی شغلی
            </Link>
          )}
        </div>
      )}
    </>
  );
}
