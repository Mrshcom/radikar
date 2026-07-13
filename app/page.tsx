"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  Bookmark,
  BookmarkCheck,
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
  Layers3,
  LayoutDashboard,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

type PageKey = "dashboard" | "resumes" | "match" | "jobs" | "applications" | "interview";
type Notify = (message: string) => void;

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

function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="بستن"><X size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}

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

function Dashboard({ onNavigate, notify }: { onNavigate: (page: PageKey) => void; notify: Notify }) {
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
                <button className="icon-button" aria-label="گزینه‌های بیشتر" onClick={() => notify(`جزئیات اپلای ${item.company} آماده مشاهده است`)}><MoreHorizontal size={18} /></button>
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

function JobCard({ job, onMatch, saved = false, onSave }: { job: (typeof jobs)[number]; onMatch: () => void; saved?: boolean; onSave?: () => void }) {
  return (
    <article className="job-card">
      <div className="job-card-top"><div className={`brand-logo ${job.tone}`}>{job.letter}</div><div className="job-top-actions"><span className="match-pill"><Target size={13} /> تطابق {job.match}٪</span>{onSave && <button className={`save-job ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? "حذف از ذخیره‌ها" : "ذخیره فرصت"}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}</button>}</div></div>
      <h4>{job.role}</h4><strong className="company-name">{job.company}</strong>
      <p>{job.place}</p>
      <div className="job-card-foot"><small>{job.age}</small><button onClick={onMatch}>آماده‌سازی رزومه <ChevronLeft size={15} /></button></div>
    </article>
  );
}

function Resumes({ notify }: { notify: Notify }) {
  const [created, setCreated] = useState(false);
  const [dialog, setDialog] = useState<"create" | "edit" | "templates" | null>(null);
  const [resumeName, setResumeName] = useState("مدیر محصول — نسخه جدید");
  const [selectedTemplate, setSelectedTemplate] = useState("مینیمال ATS");

  const saveResume = () => {
    setCreated(true);
    setDialog(null);
    notify(`رزومه «${resumeName}» ذخیره شد`);
  };

  return (
    <>
      <SectionTitle title="رزومه‌های من" description="رزومه مادر و نسخه‌های اختصاصی هر فرصت را اینجا مدیریت کن." action={<button className="primary-btn" onClick={() => setDialog("create")}><FilePlus2 size={18} /> رزومه جدید</button>} />
      {created && <div className="success-banner"><CheckCircle2 size={20} /><div><strong>نسخه تازه آماده شد</strong><span>یک پیش‌نویس جدید براساس رزومه مادر ساخته شد.</span></div><button onClick={() => setCreated(false)}><X size={18} /></button></div>}
      <div className="resume-grid">
        <article className="resume-card featured">
          <div className="resume-preview classic"><div className="paper-head"><span>سینا احمدی</span><small>PRODUCT MANAGER</small></div><i /><i /><i /><b /><i /><i /></div>
          <div className="resume-info"><div><span className="base-label">رزومه مادر</span><h3>مدیر محصول — فارسی</h3><p>آخرین ویرایش: امروز، ۱۰:۴۵</p></div><button className="secondary-btn" onClick={() => setDialog("edit")}>ویرایش رزومه</button></div>
        </article>
        <article className="resume-card">
          <div className="resume-preview modern"><div className="preview-side" /><div className="preview-lines"><b /><i /><i /><strong /><i /><i /><strong /><i /></div></div>
          <div className="resume-info"><div><span className="match-label">تطبیق ۹۱٪</span><h3>برای مدیر محصول ارشد</h3><p>دیجی‌کالا · ۲۲ تیر</p></div><button className="icon-button" onClick={() => setDialog("edit")} aria-label="ویرایش"><MoreHorizontal size={19} /></button></div>
        </article>
        <article className="resume-card">
          <div className="resume-preview minimal"><div className="paper-head"><span>SINA AHMADI</span><small>SENIOR PRODUCT MANAGER</small></div><i /><i /><b /><i /><i /><b /><i /></div>
          <div className="resume-info"><div><span className="match-label">تطبیق ۸۶٪</span><h3>Senior Product Manager</h3><p>Snapp! · ۲۰ تیر</p></div><button className="icon-button" onClick={() => setDialog("edit")} aria-label="ویرایش"><MoreHorizontal size={19} /></button></div>
        </article>
        <button className="new-resume-card" onClick={() => setDialog("create")}><span><Plus size={26} /></span><strong>ساخت رزومه جدید</strong><small>از صفر یا با یکی از قالب‌ها</small></button>
      </div>
      <div className="panel templates-strip"><div className="panel-head"><div><h3>قالب‌های پیشنهادی</h3><p>قالب‌های استاندارد برای حوزه محصول و فناوری</p></div><button className="text-btn" onClick={() => setDialog("templates")}>دیدن همه قالب‌ها <ChevronLeft size={16} /></button></div><div className="template-chips">{["مینیمال ATS", "مدرن محصول", "مدیریتی بین‌المللی", "تک‌ستونه فارسی"].map((template) => <button key={template} onClick={() => { setSelectedTemplate(template); setDialog("create"); }}>{template}</button>)}</div></div>

      {dialog === "create" && <Modal title="ساخت رزومه جدید" description="نام و قالب اولیه را انتخاب کن؛ بعداً همه بخش‌ها قابل ویرایش‌اند." onClose={() => setDialog(null)}><div className="form-stack"><label>نام رزومه<input value={resumeName} onChange={(event) => setResumeName(event.target.value)} /></label><label>قالب<select value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}><option>مینیمال ATS</option><option>مدرن محصول</option><option>مدیریتی بین‌المللی</option><option>تک‌ستونه فارسی</option></select></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setDialog(null)}>انصراف</button><button className="primary-btn" onClick={saveResume} disabled={!resumeName.trim()}><FilePlus2 size={17} /> ساخت پیش‌نویس</button></div></div></Modal>}
      {dialog === "edit" && <Modal title="ویرایش رزومه مادر" description="این تغییرات در دموی فعلی داخل همین جلسه نگهداری می‌شوند." onClose={() => setDialog(null)}><div className="form-stack"><label>عنوان حرفه‌ای<input defaultValue="مدیر محصول ارشد" /></label><label>خلاصه حرفه‌ای<textarea defaultValue="مدیر محصول با بیش از ۶ سال تجربه در طراحی و رشد محصولات دیجیتال داده‌محور." /></label><label>دستاورد شاخص<textarea defaultValue="افزایش ۲۸ درصدی نرخ فعال‌سازی با بازطراحی جریان ورود کاربران." /></label><div className="modal-actions"><button className="secondary-btn" onClick={() => notify("پیش‌نمایش PDF آماده شد")}>پیش‌نمایش</button><button className="primary-btn" onClick={() => { setDialog(null); notify("تغییرات رزومه ذخیره شد"); }}>ذخیره تغییرات</button></div></div></Modal>}
      {dialog === "templates" && <Modal title="کتابخانه قالب‌ها" description="قالب مناسب با بازار و نوع موقعیت را انتخاب کن." onClose={() => setDialog(null)}><div className="template-modal-grid">{["مینیمال ATS", "مدرن محصول", "مدیریتی بین‌المللی", "تک‌ستونه فارسی", "استارتاپی", "Executive"].map((template) => <button key={template} onClick={() => { setSelectedTemplate(template); setDialog("create"); }}><Layers3 size={22} /><strong>{template}</strong><span>انتخاب قالب</span></button>)}</div></Modal>}
    </>
  );
}

function MatchPage({ notify }: { notify: Notify }) {
  const [description, setDescription] = useState("ما به دنبال یک مدیر محصول ارشد با حداقل ۵ سال تجربه در توسعه محصولات دیجیتال، تحلیل داده و رهبری تیم‌های چندتخصصی هستیم...");
  const [analyzed, setAnalyzed] = useState(true);
  const [tailored, setTailored] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumePicker, setResumePicker] = useState(false);
  const [baseResume, setBaseResume] = useState("مدیر محصول — فارسی");
  const fileInput = useRef<HTMLInputElement>(null);

  const analyze = () => {
    setAnalyzing(true);
    setAnalyzed(false);
    window.setTimeout(() => { setAnalyzing(false); setAnalyzed(true); notify("تحلیل تطابق با موفقیت به‌روز شد"); }, 900);
  };

  const loadFile = (file?: File) => {
    if (!file) return;
    setDescription(`شرح شغل از فایل «${file.name}» استخراج شد.\n\nتجربه مدیریت محصول، تحلیل داده، طراحی آزمایش A/B، کار با تیم‌های فنی و توانایی تعریف و پایش شاخص‌های کلیدی موردنیاز است.`);
    setAnalyzed(false);
    notify("فایل شرح شغل اضافه شد");
  };

  return (
    <>
      <SectionTitle title="تطبیق هوشمند با شغل" description="شرح شغل را وارد کن تا نقاط قوت، شکاف‌ها و بهترین نسخه رزومه مشخص شود." />
      {tailored && <div className="success-banner"><CheckCircle2 size={20} /><div><strong>نسخه اختصاصی ساخته شد</strong><span>پیش‌نویس جدید در بخش رزومه‌های من ذخیره شد.</span></div><button onClick={() => setTailored(false)}><X size={18} /></button></div>}
      <div className="match-layout">
        <section className="panel match-input-panel">
          <div className="step-label"><span>۱</span><div><strong>اطلاعات فرصت شغلی</strong><small>متن آگهی را وارد یا از فایل استخراج کن</small></div></div>
          <label>شرح شغل</label>
          <textarea value={description} onChange={(event) => { setDescription(event.target.value); setAnalyzed(false); }} />
          <input className="visually-hidden" ref={fileInput} type="file" accept=".txt,.pdf,.doc,.docx" onChange={(event) => loadFile(event.target.files?.[0])} />
          <div className="input-actions"><button className="secondary-btn" onClick={() => fileInput.current?.click()}><FileText size={17} /> افزودن فایل</button><span>{description.length} نویسه</span></div>
          <label>رزومه مبنا</label>
          <button className="resume-select" onClick={() => setResumePicker((value) => !value)}><div className="mini-file"><FileText size={18} /></div><div><strong>{baseResume}</strong><span>رزومه مبنا · ویرایش امروز</span></div><ChevronLeft size={18} /></button>
          {resumePicker && <div className="resume-picker">{["مدیر محصول — فارسی", "Senior Product Manager — English", "رزومه کوتاه ATS"].map((resume) => <button key={resume} className={baseResume === resume ? "active" : ""} onClick={() => { setBaseResume(resume); setResumePicker(false); setAnalyzed(false); }}><FileText size={16} />{resume}{baseResume === resume && <Check size={15} />}</button>)}</div>}
          <button className="primary-btn analyze-btn" disabled={!description.trim() || analyzing} onClick={analyze}><Sparkles size={18} /> {analyzing ? "در حال تحلیل..." : analyzed ? "تحلیل مجدد" : "تحلیل تطابق"}</button>
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
              <button className="primary-btn full" onClick={() => { setTailored(true); notify("نسخه اختصاصی در رزومه‌های من ذخیره شد"); }}><WandSparkles size={18} /> ساخت رزومه اختصاصی</button>
            </>
          ) : <div className="empty-analysis"><Target size={44} /><h3>آماده تحلیل</h3><p>شرح شغل را وارد کن تا گزارش تطبیق ساخته شود.</p></div>}
        </section>
      </div>
    </>
  );
}

function JobsPage({ onNavigate, notify }: { onNavigate: (page: PageKey) => void; notify: Notify }) {
  const allJobs = [...jobs, { company: "Miro", role: "Product Manager, AI", match: 79, place: "Remote · اروپا", age: "۲ روز پیش", tone: "violet", letter: "M" }];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("همه");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const filteredJobs = allJobs.filter((job) => {
    const matchesQuery = `${job.company} ${job.role} ${job.place}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "همه" || (category === "داخل ایران" && job.place.includes("تهران")) || (category === "بین‌المللی" && !job.place.includes("تهران")) || (category === "دورکاری" && job.place.includes("Remote"));
    return matchesQuery && matchesCategory;
  });

  const toggleSave = (company: string) => {
    setSavedJobs((current) => current.includes(company) ? current.filter((item) => item !== company) : [...current, company]);
    notify(savedJobs.includes(company) ? "فرصت از ذخیره‌ها حذف شد" : "فرصت شغلی ذخیره شد");
  };

  return (
    <>
      <SectionTitle title="فرصت‌های شغلی" description="پیشنهادهایی که با مسیر حرفه‌ای و ترجیحات تو هم‌خوانی دارند." action={<button className={`secondary-btn ${filtersOpen ? "selected" : ""}`} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={18} /> فیلترها</button>} />
      <div className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="جست‌وجوی فرصت شغلی" placeholder="عنوان شغل، شرکت یا مهارت..." /><button className="primary-btn" onClick={() => notify(`${filteredJobs.length} نتیجه پیدا شد`)}>جست‌وجو</button></div>
      {filtersOpen && <div className="filter-panel"><label>حداقل تطابق<input type="range" min="60" max="95" defaultValue="75" /></label><label><input type="checkbox" defaultChecked /> فقط فرصت‌های جدید</label><label><input type="checkbox" /> فقط شرکت‌های تاییدشده</label></div>}
      <div className="job-results-head"><strong>{filteredJobs.length} فرصت پیشنهادی</strong><div>{["همه", "داخل ایران", "بین‌المللی", "دورکاری"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      {filteredJobs.length ? <div className="job-list-page">{filteredJobs.map((job) => <JobCard key={job.company} job={job} saved={savedJobs.includes(job.company)} onSave={() => toggleSave(job.company)} onMatch={() => onNavigate("match")} />)}</div> : <div className="empty-results"><Search size={34} /><h3>فرصتی پیدا نشد</h3><p>عبارت جست‌وجو یا فیلترها را تغییر بده.</p><button className="secondary-btn" onClick={() => { setQuery(""); setCategory("همه"); }}>پاک‌کردن فیلترها</button></div>}
    </>
  );
}

function ApplicationsPage({ notify }: { notify: Notify }) {
  const [columns, setColumns] = useState([
    { title: "ذخیره‌شده", items: [{ name: "مدیر محصول ارشد", company: "دیجی‌کالا", match: "۹۱٪" }, { name: "Product Lead", company: "Careem", match: "۸۲٪" }] },
    { title: "ارسال‌شده", items: [{ name: "Product Manager", company: "Quera", match: "۸۴٪" }] },
    { title: "در حال بررسی", items: [{ name: "Senior Product Manager", company: "زرین‌پال", match: "۸۸٪" }] },
    { title: "مصاحبه", items: [{ name: "Product Lead", company: "فلایتیو", match: "۹۰٪" }] },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newCompany, setNewCompany] = useState("");

  const addApplication = () => {
    if (!newRole.trim() || !newCompany.trim()) return;
    setColumns((current) => current.map((column, index) => index === 0 ? { ...column, items: [...column.items, { name: newRole, company: newCompany, match: "—" }] } : column));
    setAddOpen(false); setNewRole(""); setNewCompany(""); notify("اپلای جدید به ستون ذخیره‌شده اضافه شد");
  };

  const advance = (columnIndex: number, itemIndex: number) => {
    if (columnIndex >= columns.length - 1) { notify("این اپلای در آخرین مرحله قرار دارد"); return; }
    const item = columns[columnIndex].items[itemIndex];
    setColumns((current) => current.map((column, index) => {
      if (index === columnIndex) return { ...column, items: column.items.filter((_, i) => i !== itemIndex) };
      if (index === columnIndex + 1) return { ...column, items: [...column.items, item] };
      return column;
    }));
    notify(`اپلای به مرحله «${columns[columnIndex + 1].title}» منتقل شد`);
  };

  const total = columns.reduce((sum, column) => sum + column.items.length, 0);
  return (
    <>
      <SectionTitle title="پیگیری اپلای‌ها" description="تمام فرصت‌ها را از ذخیره تا پیشنهاد همکاری در یک مسیر ببین." action={<button className="primary-btn" onClick={() => setAddOpen(true)}><Plus size={18} /> افزودن اپلای</button>} />
      <div className="pipeline-summary"><span><i className="dot blue-dot" /> {total} اپلای فعال</span><span>نرخ پاسخ <strong>۲۷٪</strong></span><span>میانگین پاسخ <strong>۶ روز</strong></span></div>
      <div className="kanban">{columns.map((column, columnIndex) => <section className="kanban-column" key={column.title}><div className="kanban-head"><strong>{column.title}</strong><span>{column.items.length}</span></div>{column.items.map((item, itemIndex) => <article className="kanban-card" key={`${item.company}-${item.name}`}><div><span className="tiny-company">{item.company.slice(0, 1)}</span><small>{item.company}</small><button onClick={() => advance(columnIndex, itemIndex)} aria-label="انتقال به مرحله بعد"><ArrowLeft size={17} /></button></div><h3>{item.name}</h3><span className="match-pill"><Target size={12} /> تطابق {item.match}</span><footer><Clock3 size={13} /> به‌روزرسانی همین حالا</footer></article>)}</section>)}</div>
      {addOpen && <Modal title="افزودن اپلای" description="فرصت را ثبت کن تا در مسیر پیگیری قرار بگیرد." onClose={() => setAddOpen(false)}><div className="form-stack"><label>عنوان موقعیت<input value={newRole} onChange={(event) => setNewRole(event.target.value)} placeholder="مثلاً Product Manager" /></label><label>نام شرکت<input value={newCompany} onChange={(event) => setNewCompany(event.target.value)} placeholder="مثلاً دیجی‌کالا" /></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setAddOpen(false)}>انصراف</button><button className="primary-btn" onClick={addApplication} disabled={!newRole.trim() || !newCompany.trim()}>افزودن به برد</button></div></div></Modal>}
    </>
  );
}

function InterviewPage({ notify }: { notify: Notify }) {
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("مصاحبه Product Lead فلایتیو");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(false);
  const startPractice = (selectedMode: string) => { setMode(selectedMode); setStarted(true); setFeedback(false); setAnswer(""); };
  return (
    <>
      <SectionTitle title="آمادگی مصاحبه" description="با سؤال‌های شخصی‌سازی‌شده برای رزومه و موقعیت موردنظرت تمرین کن." />
      <div className="interview-hero">
        <div><span className="soft-badge"><Sparkles size={14} /> تمرین پیشنهادی</span><h2>مصاحبه Product Lead فلایتیو</h2><p>۱۲ سؤال تخصصی و رفتاری براساس شرح شغل و رزومه‌ای که ارسال کرده‌ای.</p><div className="interview-meta"><span><Clock3 size={15} /> حدود ۲۵ دقیقه</span><span><MessageSquareText size={15} /> بازخورد هوشمند</span></div><button className="light-btn" onClick={() => startPractice("مصاحبه Product Lead فلایتیو")}>{started ? "ادامه تمرین" : "شروع مصاحبه آزمایشی"} <ArrowLeft size={17} /></button></div><div className="orb"><MessageSquareText size={40} /></div>
      </div>
      {started && <section className="panel interview-session"><div className="session-head"><div><span className="great-label">جلسه فعال</span><h3>{mode}</h3></div><button className="icon-button" onClick={() => setStarted(false)}><X size={19} /></button></div><div className="question-box"><span>سؤال ۱ از ۵</span><h2>از موقعیتی بگو که بین نیاز کاربر و هدف کسب‌وکار تعارض وجود داشت؛ چطور تصمیم گرفتی؟</h2></div><label>پاسخ تو<textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setFeedback(false); }} placeholder="پاسخت را با ساختار موقعیت، وظیفه، اقدام و نتیجه بنویس..." /></label>{feedback && <div className="feedback-box"><CheckCircle2 size={19} /><div><strong>شروع خوبی بود</strong><p>تصمیمت روشن است؛ برای قوی‌ترشدن پاسخ، نتیجه را با یک عدد یا شاخص محصول کامل کن.</p></div></div>}<div className="session-actions"><button className="secondary-btn" onClick={() => { setAnswer(""); setFeedback(false); notify("سؤال بعدی نمایش داده شد"); }}>سؤال بعدی <ArrowLeft size={16} /></button><button className="primary-btn" disabled={!answer.trim()} onClick={() => setFeedback(true)}><Sparkles size={17} /> دریافت بازخورد</button></div></section>}
      <div className="practice-grid"><article className="panel"><div className="icon-tile lavender"><CircleUserRound size={22} /></div><h3>سؤال‌های رفتاری</h3><p>تمرین پاسخ با چارچوب STAR و دریافت پیشنهاد برای بهترشدن روایت.</p><button className="text-btn" onClick={() => startPractice("سؤال‌های رفتاری")}>شروع تمرین <ChevronLeft size={16} /></button></article><article className="panel"><div className="icon-tile mint"><BriefcaseBusiness size={22} /></div><h3>سؤال‌های تخصصی محصول</h3><p>مسئله‌های واقعی درباره استراتژی، متریک، اولویت‌بندی و کشف محصول.</p><button className="text-btn" onClick={() => startPractice("سؤال‌های تخصصی محصول")}>مشاهده سؤال‌ها <ChevronLeft size={16} /></button></article><article className="panel"><div className="icon-tile peach"><FileCheck2 size={22} /></div><h3>مرور رزومه ارسالی</h3><p>نقاطی که احتمال دارد مصاحبه‌گر درباره آن‌ها عمیق‌تر سؤال کند.</p><button className="text-btn" onClick={() => startPractice("مرور رزومه ارسالی")}>مرور نکات <ChevronLeft size={16} /></button></article></div>
    </>
  );
}

export default function Home() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [toast, setToast] = useState("");
  const [globalDialog, setGlobalDialog] = useState<"search" | "settings" | "plan" | null>(null);
  const title = useMemo(() => menuItems.find((item) => item.id === activePage)?.label, [activePage]);
  const notify = (message: string) => setToast(message);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setGlobalDialog("search"); }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  const content = {
    dashboard: <Dashboard onNavigate={setActivePage} notify={notify} />,
    resumes: <Resumes notify={notify} />,
    match: <MatchPage notify={notify} />,
    jobs: <JobsPage onNavigate={setActivePage} notify={notify} />,
    applications: <ApplicationsPage notify={notify} />,
    interview: <InterviewPage notify={notify} />,
  }[activePage];

  return (
    <div className="app-shell" dir="rtl">
      <aside className="sidebar">
        <button className="brand" onClick={() => setActivePage("dashboard")}><span><Sparkles size={19} /></span><div><strong>مسیر</strong><small>همراه حرفه‌ای تو</small></div></button>
        <nav aria-label="منوی اصلی">
          <span className="nav-caption">فضای کاری</span>
          {menuItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setActivePage(item.id)}><Icon size={19} /><span>{item.label}</span>{item.id === "jobs" && <em>۱۲</em>}</button>; })}
        </nav>
        <div className="sidebar-upgrade"><div className="upgrade-icon"><Sparkles size={18} /></div><strong>۷۰٪ از سهمیه این ماه</strong><p>۱۵ تحلیل هوشمند دیگر باقی مانده است.</p><div><i /></div><button onClick={() => setGlobalDialog("plan")}>مشاهده پلن حرفه‌ای</button></div>
        <div className="sidebar-user"><div className="avatar">سا</div><div><strong>سینا احمدی</strong><span>پلن حرفه‌ای</span></div><button aria-label="تنظیمات" onClick={() => setGlobalDialog("settings")}><Settings size={18} /></button></div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand"><span><Sparkles size={17} /></span><strong>مسیر</strong></div>
          <span className="current-page">{title}</span>
          <div className="topbar-actions"><button className="search-button" onClick={() => setGlobalDialog("search")}><Search size={18} /><span>جست‌وجو...</span><kbd>⌘ K</kbd></button><button className="notification-button" onClick={() => setNoticeOpen((value) => !value)} aria-label="اعلان‌ها"><Bell size={19} /><i /></button>{noticeOpen && <div className="notice-popover"><strong>یک فرصت تازه برای تو</strong><p>موقعیت Product Lead با تطابق ۸۹٪ پیدا شد.</p><button onClick={() => { setActivePage("jobs"); setNoticeOpen(false); }}>مشاهده فرصت</button></div>}</div>
        </header>
        <div className="content">{content}</div>
      </main>

      <nav className="mobile-nav" aria-label="منوی موبایل">{menuItems.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setActivePage(item.id)}><Icon size={19} /><span>{item.label.split(" ")[0]}</span></button>; })}</nav>
      {toast && <div className="toast" role="status"><CheckCircle2 size={19} />{toast}</div>}
      {globalDialog === "search" && <Modal title="جست‌وجوی سریع" description="مستقیم به هر بخش یا اقدام برو." onClose={() => setGlobalDialog(null)}><div className="command-search"><div><Search size={18} /><input autoFocus placeholder="مثلاً رزومه، فرصت شغلی یا مصاحبه..." /></div>{menuItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setActivePage(item.id); setGlobalDialog(null); }}><Icon size={18} /><span>{item.label}</span><ChevronLeft size={16} /></button>; })}</div></Modal>}
      {globalDialog === "settings" && <Modal title="تنظیمات پروفایل" description="ترجیحات کاری برای پیشنهادهای دقیق‌تر استفاده می‌شوند." onClose={() => setGlobalDialog(null)}><div className="form-stack"><label>نام و نام خانوادگی<input defaultValue="سینا احمدی" /></label><label>عنوان هدف<input defaultValue="Senior Product Manager" /></label><label>نوع همکاری<select defaultValue="هیبرید"><option>هیبرید</option><option>دورکاری</option><option>حضوری</option></select></label><div className="modal-actions"><button className="secondary-btn" onClick={() => setGlobalDialog(null)}>انصراف</button><button className="primary-btn" onClick={() => { setGlobalDialog(null); notify("تنظیمات پروفایل ذخیره شد"); }}>ذخیره تنظیمات</button></div></div></Modal>}
      {globalDialog === "plan" && <Modal title="پلن حرفه‌ای مسیر" description="امکانات فعال حساب و سهمیه ماهانه تو." onClose={() => setGlobalDialog(null)}><div className="plan-card"><div><Sparkles size={23} /><strong>حرفه‌ای</strong><span>فعال تا ۲۲ مرداد</span></div><ul><li><Check size={15} /> ۵۰ تحلیل هوشمند در ماه</li><li><Check size={15} /> رزومه و خروجی PDF نامحدود</li><li><Check size={15} /> تمرین مصاحبه و بازخورد</li><li><Check size={15} /> پیگیری نامحدود اپلای‌ها</li></ul><button className="primary-btn full" onClick={() => { setGlobalDialog(null); notify("صفحه مدیریت اشتراک آماده شد"); }}>مدیریت اشتراک</button></div></Modal>}
    </div>
  );
}
