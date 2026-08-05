"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { JobCard } from "../_components/job-card";
import { JobCardsSkeleton } from "../_components/loading-skeletons";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { jobStore } from "@/lib/data/stores";
import type { JobRecord } from "@/lib/data/models";
import { formatPersianNumber } from "@/lib/fa-number";

export default function JobsPage() {
  const notify = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("همه");
  const [minMatch, setMinMatch] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    try {
      setJobs(await jobStore.list());
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
    jobStore
      .list()
      .then((records) => {
        if (active) setJobs(records);
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
    return jobs.filter((job) => {
      const matchesQuery =
        !normalizedQuery ||
        [job.role, job.company, job.description, job.reason].some((value) =>
          value?.toLocaleLowerCase("fa").includes(normalizedQuery),
        );
      const matchesCategory =
        category === "همه" ||
        (category === "داخل ایران" &&
          /ایران|تهران|کرج|اصفهان|شیراز|مشهد/i.test(job.place)) ||
        (category === "بین‌المللی" &&
          Boolean(job.place) &&
          !/ایران|تهران|کرج|اصفهان|شیراز|مشهد/i.test(job.place)) ||
        (category === "دورکاری" && /remote|دورکاری/i.test(job.place));
      return matchesQuery && matchesCategory && job.match >= minMatch;
    });
  }, [category, jobs, minMatch, query]);

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
            className={`${secondaryButton} ${filtersOpen ? "border-[#c5e0d5] bg-[#e9f5ef] text-[#0f7b62]" : ""}`}
            onClick={() => setFiltersOpen((value) => !value)}
          >
            <SlidersHorizontal size={18} /> فیلترها
          </button>
        }
      />
      <div className="flex h-[57px] items-center gap-[10px] rounded-[14px] border border-[#e7ebe6] bg-white py-2 pl-2 pr-[11px] shadow-[0_12px_36px_rgba(27,55,50,.055)]">
        <Search size={19} />
        <input
          className="h-full flex-1 border-0 bg-transparent text-[12px] outline-0 placeholder:text-right"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="جست‌وجوی فرصت شغلی"
          placeholder="عنوان شغل، شرکت یا مهارت..."
        />
      </div>
      {filtersOpen && (
        <div className="mt-3 flex items-center gap-6 rounded-[13px] border border-[#e7ebe6] bg-white px-[17px] py-[14px] shadow-[0_12px_36px_rgba(27,55,50,.055)] max-[560px]:flex-col max-[560px]:items-start">
          <label className="flex items-center gap-[7px] text-[9px] text-[#657572]">
            حداقل تطابق {formatPersianNumber(minMatch)}٪
            <input
              className="w-[110px] accent-[#0f7b62]"
              type="range"
              min="0"
              max="95"
              value={minMatch}
              onChange={(event) => setMinMatch(Number(event.target.value))}
            />
          </label>
        </div>
      )}
      <div className="flex items-center justify-between py-5 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-3">
        <strong className="text-[11px]">
          {loading
            ? "در حال خواندن فرصت‌ها"
            : `${formatPersianNumber(visibleJobs.length)} فرصت ذخیره‌شده`}
        </strong>
        <div className="flex gap-1.5 overflow-x-auto">
          {["همه", "داخل ایران", "بین‌المللی", "دورکاری"].map((item) => (
            <button
              key={item}
              className={`shrink-0 rounded-lg border px-3 py-2 text-[8px] ${category === item ? "border-[#9dcdbd] bg-[#edf6f1] text-[#0f7b62]" : "border-[#e6ebe6] bg-white text-[#788784]"}`}
              onClick={() => setCategory(item)}
            >
              {item}
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
