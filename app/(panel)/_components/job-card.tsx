"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, ChevronLeft, Target } from "lucide-react";
import type { Job } from "../_data/jobs";

export function JobCard({ job, saved = false, onSave }: { job: Job; saved?: boolean; onSave?: () => void }) {
  return <article className="job-card">
    <div className="job-card-top"><div className={`brand-logo ${job.tone}`}>{job.letter}</div><div className="job-top-actions"><span className="match-pill"><Target size={13} /> تطابق {job.match}٪</span>{onSave && <button className={`save-job ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? "حذف از ذخیره‌ها" : "ذخیره فرصت"}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}</button>}</div></div>
    <h4>{job.role}</h4><strong className="company-name">{job.company}</strong><p>{job.place}</p>
    <div className="job-card-foot"><small>{job.age}</small><Link href="/match">آماده‌سازی رزومه <ChevronLeft size={15} /></Link></div>
  </article>;
}
