"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { JobCard } from "../_components/job-card";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { jobs, type Job } from "../_data/jobs";

const allJobs: Job[] = [...jobs, { company: "Miro", role: "Product Manager, AI", match: 79, place: "Remote · اروپا", age: "۲ روز پیش", tone: "violet", letter: "M" }];

export default function JobsPage() {
  const notify = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("همه");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const filteredJobs = allJobs.filter((job) => `${job.company} ${job.role} ${job.place}`.toLowerCase().includes(query.toLowerCase()) && (category === "همه" || (category === "داخل ایران" && job.place.includes("تهران")) || (category === "بین‌المللی" && !job.place.includes("تهران")) || (category === "دورکاری" && job.place.includes("Remote"))));
  const toggleSave = (company: string) => { const saved = savedJobs.includes(company); setSavedJobs((current) => saved ? current.filter((item) => item !== company) : [...current, company]); notify(saved ? "فرصت از ذخیره‌ها حذف شد" : "فرصت شغلی ذخیره شد"); };

  return <><SectionTitle title="فرصت‌های شغلی" description="پیشنهادهایی که با مسیر حرفه‌ای و ترجیحات تو هم‌خوانی دارند." action={<button className={`secondary-btn ${filtersOpen ? "selected" : ""}`} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={18} /> فیلترها</button>} /><div className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="جست‌وجوی فرصت شغلی" placeholder="عنوان شغل، شرکت یا مهارت..." /><button className="primary-btn" onClick={() => notify(`${filteredJobs.length} نتیجه پیدا شد`)}>جست‌وجو</button></div>{filtersOpen && <div className="filter-panel"><label>حداقل تطابق<input type="range" min="60" max="95" defaultValue="75" /></label><label><input type="checkbox" defaultChecked /> فقط فرصت‌های جدید</label><label><input type="checkbox" /> فقط شرکت‌های تاییدشده</label></div>}<div className="job-results-head"><strong>{filteredJobs.length} فرصت پیشنهادی</strong><div>{["همه", "داخل ایران", "بین‌المللی", "دورکاری"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>{filteredJobs.length ? <div className="job-list-page">{filteredJobs.map((job) => <JobCard key={job.company} job={job} saved={savedJobs.includes(job.company)} onSave={() => toggleSave(job.company)} />)}</div> : <div className="empty-results"><Search size={34} /><h3>فرصتی پیدا نشد</h3><p>عبارت جست‌وجو یا فیلترها را تغییر بده.</p><button className="secondary-btn" onClick={() => { setQuery(""); setCategory("همه"); }}>پاک‌کردن فیلترها</button></div>}</>;
}
