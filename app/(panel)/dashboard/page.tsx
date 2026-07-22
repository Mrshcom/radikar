"use client";

import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, ChevronLeft, FileCheck2, Gauge, MessageSquareText, MoreHorizontal, Sparkles, WandSparkles, Zap } from "lucide-react";
import { CircularProgress } from "../_components/circular-progress";
import { JobCard } from "../_components/job-card";
import { SectionTitle } from "../_components/ui";
import { useToast } from "../_components/panel-shell";
import { jobs, recentApplications } from "../_data/jobs";

export default function DashboardPage() {
  const notify = useToast();
  return <>
    <SectionTitle eyebrow="یکشنبه، ۲۲ تیر" title="سلام سینا، برای فرصت بعدی آماده‌ای؟" description="امروز ۱۲ فرصت تازه با پروفایل حرفه‌ای تو پیدا کردیم." action={<Link className="primary-btn" href="/match">تحلیل شغل جدید</Link>} />
    <section className="hero-grid">
      <div className="career-card"><div className="career-copy"><span className="soft-badge"><Sparkles size={14} /> وضعیت پروفایل حرفه‌ای</span><h2>رزومه‌ات قدرتمند است،<br />اما هنوز جا برای درخشیدن دارد.</h2><p>با اضافه‌کردن دو دستاورد عددی، شانس دیده‌شدن رزومه‌ات بیشتر می‌شود.</p><Link className="light-btn" href="/resumes">بهبود رزومه <ArrowLeft size={17} /></Link></div><CircularProgress className="score-ring" value={82} label="امتیاز رزومه ۸۲ از ۱۰۰" strokeWidth={8} startAngle={-125}><strong>۸۲</strong><span>از ۱۰۰</span></CircularProgress><div className="career-dots" /></div>
      <div className="ai-card"><div className="icon-tile mint"><WandSparkles size={22} /></div><span className="new-label">پیشنهاد امروز</span><h3>رزومه را برای یک شغل خاص آماده کن</h3><p>شرح شغل را وارد کن تا نسخه‌ای دقیق و متناسب با آن بسازیم.</p><Link className="wide-outline" href="/match">شروع تطبیق هوشمند <ChevronLeft size={17} /></Link></div>
    </section>
    <section className="stats-row"><div className="stat-card"><div className="icon-tile peach"><BriefcaseBusiness size={20} /></div><div><span>فرصت‌های ذخیره‌شده</span><strong>۲۴</strong><small className="positive">۶ مورد جدید این هفته</small></div></div><div className="stat-card"><div className="icon-tile lavender"><FileCheck2 size={20} /></div><div><span>اپلای‌های فعال</span><strong>۸</strong><small>در ۴ مرحله مختلف</small></div></div><div className="stat-card"><div className="icon-tile sky"><MessageSquareText size={20} /></div><div><span>دعوت به مصاحبه</span><strong>۳</strong><small className="positive">نرخ پاسخ ۲۷٪</small></div></div><div className="stat-card"><div className="icon-tile lemon"><Zap size={20} /></div><div><span>نسخه‌های اختصاصی</span><strong>۱۲</strong><small>این ماه</small></div></div></section>
    <section className="dashboard-columns">
      <div className="panel applications-panel"><div className="panel-head"><div><h3>آخرین اپلای‌ها</h3><p>وضعیت درخواست‌های اخیرت</p></div><Link className="text-btn" href="/applications">مشاهده همه <ChevronLeft size={16} /></Link></div><div className="application-list">{recentApplications.map((item) => <div className="application-row" key={item.company}><div className="company-logo">{item.logo}</div><div className="job-main"><strong>{item.role}</strong><span>{item.company}</span></div><span className={`stage ${item.stageClass}`}>{item.stage}</span><span className="date-cell">{item.date}</span><button className="icon-button" aria-label="گزینه‌های بیشتر" onClick={() => notify(`جزئیات اپلای ${item.company} آماده مشاهده است`)}><MoreHorizontal size={18} /></button></div>)}</div></div>
      <div className="panel weekly-panel"><div className="panel-head"><div><h3>عملکرد این هفته</h3><p>از ۱۶ تا ۲۲ تیر</p></div><div className="icon-tile sky"><Gauge size={20} /></div></div><div className="weekly-bars">{[42, 66, 38, 82, 55, 94, 64].map((value, index) => <div className="bar-wrap" key={index}><span style={{ height: `${value}%` }} className={index === 5 ? "active" : ""} /><small>{["ش", "ی", "د", "س", "چ", "پ", "ج"][index]}</small></div>)}</div><div className="weekly-summary"><div><strong>۱۱</strong><span>اپلای</span></div><div><strong>۳</strong><span>پاسخ</span></div><div><strong>۱</strong><span>مصاحبه</span></div></div></div>
    </section>
    <section className="panel jobs-panel"><div className="panel-head"><div><h3>فرصت‌های مناسب برای تو</h3><p>براساس مهارت‌ها، سابقه و ترجیحات شغلی</p></div><Link className="text-btn" href="/jobs">همه فرصت‌ها <ChevronLeft size={16} /></Link></div><div className="job-cards">{jobs.map((job) => <JobCard key={job.company} job={job} />)}</div></section>
  </>;
}
