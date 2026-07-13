"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileText,
  Gauge,
  LayoutDashboard,
  ListFilter,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

type PageKey = "dashboard" | "resumes" | "match" | "jobs" | "applications" | "interview";

const menuItems: { id: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "نمای کلی", icon: LayoutDashboard },
  { id: "resumes", label: "رزومه‌های من", icon: FileText },
  { id: "match", label: "تطبیق با شغل", icon: Target },
  { id: "jobs", label: "فرصت‌های شغلی", icon: BriefcaseBusiness },
  { id: "applications", label: "پیگیری اپلای‌ها", icon: BarChart3 },
  { id: "interview", label: "آمادگی مصاحبه", icon: MessageSquareText },
];

const jobs = [
  { company: "دیجی‌کالا", role: "مدیر محصول ارشد", match: 91, place: "تهران · هیبرید", age: "۲ ساعت پیش", tone: "coral", letter: "د" },
  { company: "Snapp!", role: "Senior Product Manager", match: 86, place: "تهران · حضوری", age: "امروز", tone: "green", letter: "S" },
  { company: "Careem", role: "Product Lead — Growth", match: 82, place: "دبی · هیبرید", age: "۱ روز پیش", tone: "navy", letter: "C" },
];

const applications = [
  { company: "فلایتیو", role: "Product Lead", stage: "مصاحبه فنی", stageClass: "violet", date: "۲۲ تیر", logo: "ف" },
  { company: "زرین‌پال", role: "Senior Product Manager", stage: "بررسی رزومه", stageClass: "amber", date: "۲۰ تیر", logo: "ز" },
  { company: "Quera", role: "Product Manager", stage: "ارسال شده", stageClass: "blue", date: "۱۸ تیر", logo: "Q" },
];

function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  return (
    <>
      <SectionTitle
        eyebrow="یکشنبه، ۲۲ تیر"
        title="سلام سینا، برای فرصت بعدی آماده‌ای؟"
        description="امروز ۱۲ فرصت تازه با پروفایل حرفه‌ای تو پیدا کردیم."
        action={<button className="primary-btn" onClick={() => onNavigate("match")}><Plus size={18} /> تحلیل شغل جدید</button>}
      />

      <section className="hero-grid">
        <div className="career-card">
          <div className="career-copy">
            <span className="soft-badge"><Sparkles size={14} /> وضعیت پروفایل حرفه‌ای</span>
            <h2>رزومه‌ات قدرتمند است،<br />اما هنوز جا برای درخشیدن دارد.</h2>
            <p>با اضافه‌کردن دو دستاورد عددی، شانس دیده‌شدن رزومه‌ات بیشتر می‌شود.</p>
            <button className="light-btn" onClick={() => onNavigate("resumes")}>بهبود رزومه <ArrowLeft size={17} /></button>
          </div>
          <div className="score-ring" aria-label="امتیاز رزومه ۸۲ از ۱۰۰">
            <div><strong>۸۲</strong><span>از ۱۰۰</span></div>
          </div>
          <div className="career-dots" />
        </div>

        <div className="ai-card">
          <div className="icon-tile mint"><WandSparkles size={22} /></div>
          <span className="new-label">پیشنهاد امروز</span>
          <h3>رزومه را برای یک شغل خاص آماده کن</h3>
          <p>شرح شغل را وارد کن تا نسخه‌ای دقیق و متناسب با آن بسازیم.</p>
          <button className="wide-outline" onClick={() => onNavigate("match")}>شروع تطبیق هوشمند <ChevronLeft size={17} /></button>
        </div>
      </section>

      <section className="stats-row">
        <div className="stat-card"><div className="icon-tile peach"><BriefcaseBusiness size={20} /></div><div><span>فرصت‌های ذخیره‌شده</span><strong>۲۴</strong><small className="positive">۶ مورد جدید این هفته</small></div></div>
        <div className="stat-card"><div className="icon-tile lavender"><FileCheck2 size={20} /></div><div><span>اپلای‌های فعال</span><strong>۸</strong><small>در ۴ مرحله مختلف</small></div></div>
        <div className="stat-card"><div className="icon-tile sky"><MessageSquareText size={20} /></div><div><span>دعوت به مصاحبه</span><strong>۳</strong><small className="positive">نرخ پاسخ ۲۷٪</small></div></div>
        <div className="stat-card"><div className="icon-tile lemon"><Zap size={20} /></div><div><span>نسخه‌های اختصاصی</span><strong>۱۲</strong><small>این ماه</small></div></div>
      </section>

      <section className="dashboard-columns">
        <div className="panel applications-panel">
          <div className="panel-head"><div><h3>آخرین اپلای‌ها</h3><p>وضعیت درخواست‌های اخیرت</p></div><button className="text-btn" onClick={() => onNavigate("applications")}>مشاهده همه <ChevronLeft size={16} /></button></div>
          <div className="application-list">
            {applications.map((item) => (
              <div className="application-row" key={item.company}>
                <div className="company-logo">{item.logo}</div>
                <div className="job-main"><strong>{item.role}</strong><span>{item.company}</span></div>
                <span className={`stage ${item.stageClass}`}>{item.stage}</span>
                <span className="date-cell">{item.date}</span>
                <button className="icon-button" aria-label="گزینه‌های بیشتر"><MoreHorizontal size={18} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel weekly-panel">
          <div className="panel-head"><div><h3>عملکرد این هفته</h3><p>از ۱۶ تا ۲۲ تیر</p></div><div className="icon-tile sky"><Gauge size={20} /></div></div>
          <div className="weekly-bars">
            {[42, 66, 38, 82, 55, 94, 64].map((value, index) => <div className="bar-wrap" key={index}><span style={{ height: `${value}%` }} className={index === 5 ? "active" : ""} /><small>{["ش", "ی", "د", "س", "چ", "پ", "ج"][index]}</small></div>)}
          </div>
          <div className="weekly-summary"><div><strong>۱۱</strong><span>اپلای</span></div><div><strong>۳</strong><span>پاسخ</span></div><div><strong>۱</strong><span>مصاحبه</span></div></div>
        </div>
      </section>

      <section className="panel jobs-panel">
        <div className="panel-head"><div><h3>فرصت‌های مناسب برای تو</h3><p>براساس مهارت‌ها، سابقه و ترجیحات شغلی</p></div><button className="text-btn" onClick={() => onNavigate("jobs")}>همه فرصت‌ها <ChevronLeft size={16} /></button></div>
        <div className="job-cards">
          {jobs.map((job) => <JobCard key={job.company} job={job} onMatch={() => onNavigate("match")} />)}
        </div>
      </section>
    </>
  );
}

function JobCard({ job, onMatch }: { job: (typeof jobs)[number]; onMatch: () => void }) {
  return (
    <article className="job-card">
      <div className="job-card-top"><div className={`brand-logo ${job.tone}`}>{job.letter}</div><span className="match-pill"><Target size={13} /> تطابق {job.match}٪</span></div>
      <h4>{job.role}</h4><strong className="company-name">{job.company}</strong>
      <p>{job.place}</p>
      <div className="job-card-foot"><small>{job.age}</small><button onClick={onMatch}>آماده‌سازی رزومه <ChevronLeft size={15} /></button></div>
    </article>
  );
}

function Resumes() {
  const [created, setCreated] = useState(false);
  return (
    <>
      <SectionTitle title="رزومه‌های من" description="رزومه مادر و نسخه‌های اختصاصی هر فرصت را اینجا مدیریت کن." action={<button className="primary-btn" onClick={() => setCreated(true)}><FilePlus2 size={18} /> رزومه جدید</button>} />
      {created && <div className="success-banner"><CheckCircle2 size={20} /><div><strong>نسخه تازه آماده شد</strong><span>یک پیش‌نویس جدید براساس رزومه مادر ساخته شد.</span></div><button onClick={() => setCreated(false)}><X size={18} /></button></div>}
      <div className="resume-grid">
        <article className="resume-card featured">
          <div className="resume-preview classic"><div className="paper-head"><span>سینا احمدی</span><small>PRODUCT MANAGER</small></div><i /><i /><i /><b /><i /><i /></div>
          <div className="resume-info"><div><span className="base-label">رزومه مادر</span><h3>مدیر محصول — فارسی</h3><p>آخرین ویرایش: امروز، ۱۰:۴۵</p></div><button className="secondary-btn">ویرایش رزومه</button></div>
        </article>
        <article className="resume-card">
          <div className="resume-preview modern"><div className="preview-side" /><div className="preview-lines"><b /><i /><i /><strong /><i /><i /><strong /><i /></div></div>
          <div className="resume-info"><div><span className="match-label">تطبیق ۹۱٪</span><h3>برای مدیر محصول ارشد</h3><p>دیجی‌کالا · ۲۲ تیر</p></div><button className="icon-button"><MoreHorizontal size={19} /></button></div>
        </article>
        <article className="resume-card">
          <div className="resume-preview minimal"><div className="paper-head"><span>SINA AHMADI</span><small>SENIOR PRODUCT MANAGER</small></div><i /><i /><b /><i /><i /><b /><i /></div>
          <div className="resume-info"><div><span className="match-label">تطبیق ۸۶٪</span><h3>Senior Product Manager</h3><p>Snapp! · ۲۰ تیر</p></div><button className="icon-button"><MoreHorizontal size={19} /></button></div>
        </article>
        <button className="new-resume-card" onClick={() => setCreated(true)}><span><Plus size={26} /></span><strong>ساخت رزومه جدید</strong><small>از صفر یا با یکی از قالب‌ها</small></button>
      </div>
      <div className="panel templates-strip"><div className="panel-head"><div><h3>قالب‌های پیشنهادی</h3><p>قالب‌های استاندارد برای حوزه محصول و فناوری</p></div><button className="text-btn">دیدن همه قالب‌ها <ChevronLeft size={16} /></button></div><div className="template-chips"><span>مینیمال ATS</span><span>مدرن محصول</span><span>مدیریتی بین‌المللی</span><span>تک‌ستونه فارسی</span></div></div>
    </>
  );
}

function MatchPage() {
  const [description, setDescription] = useState("ما به دنبال یک مدیر محصول ارشد با حداقل ۵ سال تجربه در توسعه محصولات دیجیتال، تحلیل داده و رهبری تیم‌های چندتخصصی هستیم...");
  const [analyzed, setAnalyzed] = useState(true);
  const [tailored, setTailored] = useState(false);

  return (
    <>
      <SectionTitle title="تطبیق هوشمند با شغل" description="شرح شغل را وارد کن تا نقاط قوت، شکاف‌ها و بهترین نسخه رزومه مشخص شود." />
      {tailored && <div className="success-banner"><CheckCircle2 size={20} /><div><strong>نسخه اختصاصی ساخته شد</strong><span>پیش‌نویس جدید در بخش رزومه‌های من ذخیره شد.</span></div><button onClick={() => setTailored(false)}><X size={18} /></button></div>}
      <div className="match-layout">
        <section className="panel match-input-panel">
          <div className="step-label"><span>۱</span><div><strong>اطلاعات فرصت شغلی</strong><small>متن آگهی را وارد یا از فایل استخراج کن</small></div></div>
          <label>شرح شغل</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          <div className="input-actions"><button className="secondary-btn"><FileText size={17} /> افزودن فایل</button><span>{description.length} نویسه</span></div>
          <label>رزومه مبنا</label>
          <button className="resume-select"><div className="mini-file"><FileText size={18} /></div><div><strong>مدیر محصول — فارسی</strong><span>رزومه مادر · ویرایش امروز</span></div><ChevronLeft size={18} /></button>
          <button className="primary-btn analyze-btn" disabled={!description.trim()} onClick={() => setAnalyzed(true)}><Sparkles size={18} /> تحلیل تطابق</button>
        </section>

        <section className="panel analysis-panel">
          {analyzed ? (
            <>
              <div className="analysis-head"><div className="large-score"><strong>۹۱</strong><span>٪ تطابق</span></div><div><span className="great-label">تطابق عالی</span><h2>مدیر محصول ارشد</h2><p>دیجی‌کالا · تهران</p></div></div>
              <div className="score-breakdown">
                {[{ label: "مهارت‌های کلیدی", value: 94 }, { label: "سابقه مرتبط", value: 88 }, { label: "کلمات کلیدی ATS", value: 84 }].map((item) => <div key={item.label}><div><span>{item.label}</span><strong>{item.value}٪</strong></div><i><b style={{ width: `${item.value}%` }} /></i></div>)}
              </div>
              <div className="keywords-block"><h3>آنچه به‌خوبی پوشش داده‌ای</h3><div><span><Check size={14} /> استراتژی محصول</span><span><Check size={14} /> تحلیل داده</span><span><Check size={14} /> Agile</span><span><Check size={14} /> رهبری تیم</span></div></div>
              <div className="gap-block"><h3>فرصت‌های بهبود</h3><p><Sparkles size={16} /> عبارت «آزمایش A/B» در آگهی مهم است؛ یکی از تجربه‌های مرتبطت را برجسته کن.</p><p><Sparkles size={16} /> دو دستاورد رزومه بدون عدد و نتیجه قابل سنجش هستند.</p></div>
              <button className="primary-btn full" onClick={() => setTailored(true)}><WandSparkles size={18} /> ساخت رزومه اختصاصی</button>
            </>
          ) : <div className="empty-analysis"><Target size={44} /><h3>آماده تحلیل</h3><p>شرح شغل را وارد کن تا گزارش تطبیق ساخته شود.</p></div>}
        </section>
      </div>
    </>
  );
}

function JobsPage({ onNavigate }: { onNavigate: (page: PageKey) => void }) {
  const allJobs = [...jobs, { company: "Miro", role: "Product Manager, AI", match: 79, place: "Remote · اروپا", age: "۲ روز پیش", tone: "violet", letter: "M" }];
  return (
    <>
      <SectionTitle title="فرصت‌های شغلی" description="پیشنهادهایی که با مسیر حرفه‌ای و ترجیحات تو هم‌خوانی دارند." action={<button className="secondary-btn"><ListFilter size={18} /> فیلترها</button>} />
      <div className="search-box"><Search size={19} /><input aria-label="جست‌وجوی فرصت شغلی" placeholder="عنوان شغل، شرکت یا مهارت..." /><button className="primary-btn">جست‌وجو</button></div>
      <div className="job-results-head"><strong>۱۲ فرصت پیشنهادی</strong><div><span className="active">همه</span><span>داخل ایران</span><span>بین‌المللی</span><span>دورکاری</span></div></div>
      <div className="job-list-page">{allJobs.map((job) => <JobCard key={job.company} job={job} onMatch={() => onNavigate("match")} />)}</div>
    </>
  );
}

function ApplicationsPage() {
  const columns = [
    { title: "ذخیره‌شده", count: 4, items: [{ name: "مدیر محصول ارشد", company: "دیجی‌کالا", match: "۹۱٪" }, { name: "Product Lead", company: "Careem", match: "۸۲٪" }] },
    { title: "ارسال‌شده", count: 3, items: [{ name: "Product Manager", company: "Quera", match: "۸۴٪" }] },
    { title: "در حال بررسی", count: 2, items: [{ name: "Senior Product Manager", company: "زرین‌پال", match: "۸۸٪" }] },
    { title: "مصاحبه", count: 1, items: [{ name: "Product Lead", company: "فلایتیو", match: "۹۰٪" }] },
  ];
  return (
    <>
      <SectionTitle title="پیگیری اپلای‌ها" description="تمام فرصت‌ها را از ذخیره تا پیشنهاد همکاری در یک مسیر ببین." action={<button className="primary-btn"><Plus size={18} /> افزودن اپلای</button>} />
      <div className="pipeline-summary"><span><i className="dot blue-dot" /> ۱۰ اپلای فعال</span><span>نرخ پاسخ <strong>۲۷٪</strong></span><span>میانگین پاسخ <strong>۶ روز</strong></span></div>
      <div className="kanban">{columns.map((column) => <section className="kanban-column" key={column.title}><div className="kanban-head"><strong>{column.title}</strong><span>{column.count}</span></div>{column.items.map((item) => <article className="kanban-card" key={item.company}><div><span className="tiny-company">{item.company.slice(0, 1)}</span><small>{item.company}</small><button><MoreHorizontal size={17} /></button></div><h3>{item.name}</h3><span className="match-pill"><Target size={12} /> تطابق {item.match}</span><footer><Clock3 size={13} /> به‌روزرسانی ۲ روز پیش</footer></article>)}</section>)}</div>
    </>
  );
}

function InterviewPage() {
  const [started, setStarted] = useState(false);
  return (
    <>
      <SectionTitle title="آمادگی مصاحبه" description="با سؤال‌های شخصی‌سازی‌شده برای رزومه و موقعیت موردنظرت تمرین کن." />
      <div className="interview-hero">
        <div><span className="soft-badge"><Sparkles size={14} /> تمرین پیشنهادی</span><h2>مصاحبه Product Lead فلایتیو</h2><p>۱۲ سؤال تخصصی و رفتاری براساس شرح شغل و رزومه‌ای که ارسال کرده‌ای.</p><div className="interview-meta"><span><Clock3 size={15} /> حدود ۲۵ دقیقه</span><span><MessageSquareText size={15} /> بازخورد هوشمند</span></div><button className="light-btn" onClick={() => setStarted(true)}>{started ? "تمرین در حال آماده‌سازی..." : "شروع مصاحبه آزمایشی"} <ArrowLeft size={17} /></button></div><div className="orb"><MessageSquareText size={40} /></div>
      </div>
      <div className="practice-grid"><article className="panel"><div className="icon-tile lavender"><CircleUserRound size={22} /></div><h3>سؤال‌های رفتاری</h3><p>تمرین پاسخ با چارچوب STAR و دریافت پیشنهاد برای بهترشدن روایت.</p><button className="text-btn">شروع تمرین <ChevronLeft size={16} /></button></article><article className="panel"><div className="icon-tile mint"><BriefcaseBusiness size={22} /></div><h3>سؤال‌های تخصصی محصول</h3><p>مسئله‌های واقعی درباره استراتژی، متریک، اولویت‌بندی و کشف محصول.</p><button className="text-btn">مشاهده سؤال‌ها <ChevronLeft size={16} /></button></article><article className="panel"><div className="icon-tile peach"><FileCheck2 size={22} /></div><h3>مرور رزومه ارسالی</h3><p>نقاطی که احتمال دارد مصاحبه‌گر درباره آن‌ها عمیق‌تر سؤال کند.</p><button className="text-btn">مرور نکات <ChevronLeft size={16} /></button></article></div>
    </>
  );
}

export default function Home() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [noticeOpen, setNoticeOpen] = useState(true);
  const title = useMemo(() => menuItems.find((item) => item.id === activePage)?.label, [activePage]);

  const content = {
    dashboard: <Dashboard onNavigate={setActivePage} />,
    resumes: <Resumes />,
    match: <MatchPage />,
    jobs: <JobsPage onNavigate={setActivePage} />,
    applications: <ApplicationsPage />,
    interview: <InterviewPage />,
  }[activePage];

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar">
        <button className="brand" onClick={() => setActivePage("dashboard")}><span><Sparkles size={19} /></span><div><strong>مسیر</strong><small>همراه حرفه‌ای تو</small></div></button>
        <nav aria-label="منوی اصلی">
          <span className="nav-caption">فضای کاری</span>
          {menuItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setActivePage(item.id)}><Icon size={19} /><span>{item.label}</span>{item.id === "jobs" && <em>۱۲</em>}</button>; })}
        </nav>
        <div className="sidebar-upgrade"><div className="upgrade-icon"><Sparkles size={18} /></div><strong>۷۰٪ از سهمیه این ماه</strong><p>۱۵ تحلیل هوشمند دیگر باقی مانده است.</p><div><i /></div><button>مشاهده پلن حرفه‌ای</button></div>
        <div className="sidebar-user"><div className="avatar">سا</div><div><strong>سینا احمدی</strong><span>پلن حرفه‌ای</span></div><button aria-label="تنظیمات"><Settings size={18} /></button></div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand"><span><Sparkles size={17} /></span><strong>مسیر</strong></div>
          <span className="current-page">{title}</span>
          <div className="topbar-actions"><button className="search-button"><Search size={18} /><span>جست‌وجو...</span><kbd>⌘ K</kbd></button><button className="notification-button" onClick={() => setNoticeOpen((value) => !value)} aria-label="اعلان‌ها"><Bell size={19} /><i /></button>{noticeOpen && <div className="notice-popover"><strong>یک فرصت تازه برای تو</strong><p>موقعیت Product Lead با تطابق ۸۹٪ پیدا شد.</p><button onClick={() => { setActivePage("jobs"); setNoticeOpen(false); }}>مشاهده فرصت</button></div>}</div>
        </header>
        <div className="content">{content}</div>
      </main>

      <nav className="mobile-nav" aria-label="منوی موبایل">{menuItems.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setActivePage(item.id)}><Icon size={19} /><span>{item.label.split(" ")[0]}</span></button>; })}</nav>
    </div>
  );
}
