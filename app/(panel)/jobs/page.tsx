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
      setError(event instanceof Error ? event.message : "خواندن فرصت‌های ذخیره‌شده ناموفق بود.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    jobStore.list()
      .then((records) => {
        if (active) setJobs(records);
      })
      .catch((event: unknown) => {
        if (active) setError(event instanceof Error ? event.message : "خواندن فرصت‌های ذخیره‌شده ناموفق بود.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("fa");
    return jobs.filter((job) => {
      const matchesQuery = !normalizedQuery || [job.role, job.company, job.description, job.reason]
        .some((value) => value?.toLocaleLowerCase("fa").includes(normalizedQuery));
      const matchesCategory = category === "همه"
        || (category === "داخل ایران" && /ایران|تهران|کرج|اصفهان|شیراز|مشهد/i.test(job.place))
        || (category === "بین‌المللی" && Boolean(job.place) && !/ایران|تهران|کرج|اصفهان|شیراز|مشهد/i.test(job.place))
        || (category === "دورکاری" && /remote|دورکاری/i.test(job.place));
      return matchesQuery && matchesCategory && job.match >= minMatch;
    });
  }, [category, jobs, minMatch, query]);

  const toggleSave = async (job: JobRecord) => {
    const updated = { ...job, saved: !job.saved, updatedAt: new Date().toISOString() };
    await jobStore.put(updated);
    setJobs((current) => current.map((item) => item.id === updated.id ? updated : item));
    notify(updated.saved ? "فرصت شغلی ذخیره شد" : "فرصت از ذخیره‌ها حذف شد");
  };

  return <><SectionTitle title="فرصت‌های شغلی" description="فقط فرصت‌هایی نمایش داده می‌شوند که از یک آگهی واقعی وارد و تحلیل کرده‌ای." action={<button className={`secondary-btn ${filtersOpen ? "selected" : ""}`} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={18} /> فیلترها</button>} /><div className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="جست‌وجوی فرصت شغلی" placeholder="عنوان شغل، شرکت یا مهارت..." /></div>{filtersOpen && <div className="filter-panel"><label>حداقل تطابق {minMatch}٪<input type="range" min="0" max="95" value={minMatch} onChange={(event) => setMinMatch(Number(event.target.value))} /></label></div>}<div className="job-results-head"><strong>{loading ? "در حال خواندن فرصت‌ها" : `${visibleJobs.length} فرصت ذخیره‌شده`}</strong><div>{["همه", "داخل ایران", "بین‌المللی", "دورکاری"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>{error ? <div className="empty-results"><Search size={34} /><h3>خواندن فرصت‌ها ناموفق بود</h3><p>{error}</p><button className="secondary-btn" onClick={loadJobs}>تلاش دوباره</button></div> : loading ? <JobCardsSkeleton count={6} /> : visibleJobs.length ? <div className="job-list-page">{visibleJobs.map((job) => <JobCard key={job.id} job={job} saved={job.saved} onSave={() => void toggleSave(job)} />)}</div> : <div className="empty-results"><Search size={34} /><h3>{jobs.length ? "فرصتی با این فیلتر پیدا نشد" : "هنوز فرصت شغلی وارد نکرده‌ای"}</h3><p>{jobs.length ? "عبارت جست‌وجو یا فیلترها را تغییر بده." : "در بخش تطبیق هوشمند، متن یا لینک یک آگهی واقعی را تحلیل کن."}</p>{!jobs.length && <Link className="secondary-btn" href="/match">وارد کردن آگهی شغلی</Link>}</div>}</>;
}
