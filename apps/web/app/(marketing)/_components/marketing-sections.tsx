import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  MessageSquareText,
  Target,
  WandSparkles,
} from "lucide-react";

const shell = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0f7b62] px-6 text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,123,98,.2)] transition hover:-translate-y-0.5 hover:bg-[#0b6954] focus:outline-none focus:ring-4 focus:ring-[#0f7b62]/20";

export function MarketingHeader() {
  return (
    <header className="relative z-20 bg-[#f7f8fa] px-4 pt-4 sm:px-7 sm:pt-5">
      <div className={`${shell} flex h-[68px] items-center justify-between gap-6 rounded-full border border-[#e9eeeb] bg-white/90 px-3 shadow-[0_7px_24px_rgba(25,49,47,.07)] backdrop-blur-xl sm:px-5`}>
        <Link href="/" className="flex items-center gap-3" aria-label="رادیکار">
          <span className="grid size-10 place-items-center rounded-[13px] bg-[#1e5a49] text-white shadow-[0_8px_16px_rgba(25,74,59,.18)]">
            <Image src="/logo.svg" alt="" width={24} height={24} />
          </span>
          <span>
            <strong className="block text-base font-black leading-tight text-[#19312f]">رادیکار</strong>
            <small className="block text-[8px] text-[#9aa7a2]">همراه حرفه‌ای تو کار</small>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-xs font-medium text-[#526461] lg:flex" aria-label="ناوبری اصلی">
          <a href="#features" className="transition hover:text-[#0f7b62]">ویژگی‌ها</a>
          <a href="#how-it-works" className="transition hover:text-[#0f7b62]">نحوه کار</a>
          <a href="#pricing" className="transition hover:text-[#0f7b62]">قیمت‌گذاری</a>
          <a href="#demo" className="transition hover:text-[#0f7b62]">دموی محصول</a>
          <a href="#faq" className="transition hover:text-[#0f7b62]">سوالات متداول</a>
        </nav>
        <Link href="/login" className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#2d705e] px-5 text-[11px] font-bold text-white transition hover:bg-[#1e5a49]">ساخت اولین رزومه</Link>
      </div>
    </header>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[650px] overflow-hidden bg-[#f7f8fa] pb-20 pt-20 sm:min-h-[760px] sm:pt-28">
      <div className="pointer-events-none absolute -right-52 -top-48 size-[600px] rounded-full bg-[#e7f1ec] blur-3xl" />
      <div dir="ltr" className={`${shell} relative grid items-center gap-16 lg:grid-cols-[1.08fr_.92fr]`}>
        <ProductPreview />
        <div dir="rtl" className="order-first text-right lg:order-last">
          <h1 className="m-0 text-[clamp(34px,4.6vw,61px)] font-black leading-[1.45] tracking-[-1.4px] text-[#303536]">پایان سردرگمی در مسیر شغلی؛<br /><span className="relative inline-block text-[#2d705e] after:absolute after:bottom-1 after:right-0 after:-z-0 after:h-3 after:w-full after:rounded-sm after:bg-[#dceee6]">با دستیار هوشمند حرفه‌ای خود</span> حرکت کن</h1>
          <p className="mt-6 max-w-[530px] text-sm leading-[2.25] text-[#71807c] sm:text-[15px]">رادیکار اطلاعات حرفه‌ای‌ات را یک‌بار می‌گیرد و از همان‌جا رزومهٔ اختصاصی هر موقعیت را می‌سازد، میزان تطابق تو با هر آگهی را تحلیل می‌کند و تا لحظهٔ مصاحبه کنارت می‌ماند.</p>
          <ul className="mt-7 grid gap-3 text-[12px] font-bold text-[#394844]"><li className="flex items-center justify-end gap-2"><span>ساخت رزومهٔ حرفه‌ای و هدفمند</span><BadgeCheck size={17} className="text-[#2d705e]" /></li><li className="flex items-center justify-end gap-2"><span>تحلیل هوشمند میزان تطابق با فرصت‌های شغلی</span><BadgeCheck size={17} className="text-[#2d705e]" /></li><li className="flex items-center justify-end gap-2"><span>آمادگی برای مصاحبه با کمک هوش مصنوعی</span><BadgeCheck size={17} className="text-[#2d705e]" /></li></ul>
          <Link href="/login" className={`${primaryButton} mt-8 rounded-full bg-[#2d705e] px-7`}>ساخت اولین رزومه <ArrowLeft size={17} /></Link>
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  const labels = [
    ["مهارت‌های فنی", "right-[2%] top-[17%]"],
    ["سوابق شغلی", "left-[1%] top-[43%]"],
    ["دستاوردها", "left-[8%] bottom-[16%]"],
    ["آگهی هدف", "right-[1%] bottom-[27%]"],
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <div className="absolute inset-[7%] rounded-full border border-[#dce8e2]" />
      <div className="absolute inset-[20%] rounded-full border border-[#e5ece8]" />
      <div className="absolute inset-[33%] rounded-full bg-[#e7f1ec]/75 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-[-3deg] rounded-[26px] border border-white bg-white p-5 shadow-[0_25px_55px_rgba(27,55,50,.14)] sm:p-6">
        <div className="flex items-center justify-between border-b border-[#edf1ed] pb-4">
          <span className="grid size-9 place-items-center rounded-xl bg-[#2d705e] text-white"><FileText size={17} /></span>
          <div className="space-y-2"><div className="mr-auto h-2 w-24 rounded-full bg-[#293c38]" /><div className="h-1.5 w-16 rounded-full bg-[#cddbd4]" /></div>
        </div>
        <div className="mt-5 h-2 w-20 rounded-full bg-[#2d705e]/85" />
        <div className="mt-3 space-y-2"><i className="block h-1.5 rounded-full bg-[#e5ece7]" /><i className="block h-1.5 w-[87%] rounded-full bg-[#e5ece7]" /><i className="block h-1.5 w-[64%] rounded-full bg-[#e5ece7]" /></div>
        <div className="mt-6 rounded-2xl bg-[#e5f2ec] p-4">
          <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-[#2d705e]">تطابق با موقعیت هدف</span><strong className="text-2xl font-black text-[#2d705e]">۹۲٪</strong></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full w-[92%] rounded-full bg-[#2d705e]" /></div>
          <span className="mt-2 block text-[8px] text-[#779087]">۲ پیشنهاد برای رسیدن به ۱۰۰٪</span>
        </div>
      </div>
      {labels.map(([label, position]) => (
        <span key={label} className={`absolute ${position} rounded-full border border-[#e6ece7] bg-white px-4 py-2 text-[10px] font-bold text-[#52615d] shadow-[0_8px_18px_rgba(27,55,50,.08)]`}>
          {label} <i className="mr-1 inline-block size-1.5 rounded-full bg-[#7bc2a4]" />
        </span>
      ))}
    </div>
  );
}

export function TrustStrip() {
  return (
    <section className="border-y border-[#e5ebe5] bg-white/60">
      <div className={`${shell} grid grid-cols-2 divide-x divide-x-reverse divide-[#e5ebe5] sm:grid-cols-4`}>
        {["رزومه حرفه‌ای", "تطبیق هوشمند", "پیگیری اپلای", "آمادگی مصاحبه"].map((item) => <span key={item} className="px-4 py-5 text-center text-[11px] font-bold text-[#70817c]">{item}</span>)}
      </div>
    </section>
  );
}

const workflow = [
  { icon: FileText, number: "۰۱", title: "پروفایل حرفه‌ای‌ات را بساز", text: "سوابق، مهارت‌ها، پروژه‌ها و اهداف شغلی‌ات را یک‌بار در پایگاه دانش ذخیره کن." },
  { icon: BriefcaseBusiness, number: "۰۲", title: "فرصت شغلی را وارد کن", text: "لینک یا متن آگهی را اضافه کن تا نیازمندی‌ها و مهارت‌هایش تحلیل شود." },
  { icon: WandSparkles, number: "۰۳", title: "رزومه اختصاصی بگیر", text: "رزومه فارسی یا انگلیسی متناسب با همان موقعیت را بساز و بازبینی کن." },
  { icon: MessageSquareText, number: "۰۴", title: "تا مصاحبه همراهت بمان", text: "مراحل اپلای را دنبال کن و برای سوالات واقعی مصاحبه تمرین کن." },
];

export function WorkflowSection() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className={shell}>
        <SectionIntro eyebrow="مسیر ساده تا فرصت بهتر" title="از اطلاعات پراکنده تا یک مسیر شغلی روشن" text="رادیکار کارهای مهم کاریابی را در یک جریان ساده و قابل پیگیری کنار هم می‌گذارد." />
        <div className="mt-14 grid gap-4 md:grid-cols-4">
          {workflow.map(({ icon: Icon, number, title, text }) => (
            <article key={number} className="rounded-3xl border border-[#e2eae3] bg-white p-6 shadow-[0_12px_35px_rgba(27,55,50,.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(27,55,50,.09)]">
              <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#e8f4ee] text-[#0f7b62]"><Icon size={20} /></span><span className="text-xs font-black text-[#d0ddd6]">{number}</span></div>
              <h3 className="mt-8 text-sm font-black text-[#19312f]">{title}</h3>
              <p className="mb-0 mt-3 text-[11px] leading-7 text-[#7b8b87]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: FileText, title: "رزومه حرفه‌ای", text: "قالب‌های فارسی و انگلیسی با پیش‌نمایش دقیق و خروجی PDF." },
  { icon: Target, title: "تطبیق هوشمند", text: "امتیاز تطبیق، مهارت‌های منطبق و شکاف‌های مهم هر آگهی." },
  { icon: BarChart3, title: "مدیریت اپلای", text: "فرصت‌ها و مراحل درخواست‌هایت را در یک برد ساده دنبال کن." },
  { icon: MessageSquareText, title: "آمادگی مصاحبه", text: "تمرین سوال‌های مرتبط با موقعیت شغلی و دریافت بازخورد." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#f7f8fa] py-24 sm:py-32">
      <div className={shell}>
        <SectionIntro eyebrow="ویژگی‌ها" title="رادیکار فقط رزومه‌ساز نیست" text="یک سیستم‌عامل کامل برای مسیر شغلی؛ از ثبت اطلاعات تا پیگیری نتیجهٔ مصاحبه." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-[#e2eae3] bg-white p-6 shadow-[0_10px_28px_rgba(27,55,50,.035)] transition hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(27,55,50,.08)]">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#e8f4ee] text-[#2d705e]"><Icon size={21} /></span>
              <h3 className="mt-8 text-sm font-black text-[#19312f]">{title}</h3>
              <p className="mb-0 mt-3 text-[11px] leading-7 text-[#7b8b87]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DemoSection() {
  return (
    <section id="demo" className="py-24 sm:py-32">
      <div className={`${shell} grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]`}>
        <div>
          <SectionIntro eyebrow="دموی محصول" title="قبل از اپلای، شانس خودت را بهتر بشناس" text="آگهی را وارد کن و ببین رزومه‌ات کجا قوی است و کجا باید بهتر شود." />
          <Link href="/login" className={`${primaryButton} mt-7`}>تحلیل اولین فرصت <ArrowLeft size={16} /></Link>
        </div>
        <div className="rounded-[28px] border border-[#e3ebe5] bg-white p-5 shadow-[0_20px_60px_rgba(27,55,50,.08)] sm:p-7">
          <div className="flex items-center justify-between border-b border-[#edf1ed] pb-5"><strong className="text-[12px] text-[#19312f]">تحلیل موقعیت شغلی</strong><span className="rounded-full bg-[#e8f4ee] px-3 py-1 text-[9px] font-bold text-[#0f7b62]">تحلیل کامل شد</span></div>
          <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_170px]">
            <div><span className="text-[10px] text-[#899791]">Senior Product Designer · دورکاری</span><Metric label="مهارت‌های منطبق" value="۱۲ مورد" width="82%" /><Metric label="نیاز به تقویت" value="۳ مورد" width="35%" accent /></div>
            <div className="grid place-items-center rounded-2xl bg-[#f1f7f3] p-5 text-center"><div><span className="text-[10px] text-[#6e8079]">امتیاز تطبیق</span><strong className="mt-2 block text-4xl font-black text-[#0f7b62]">۸۶٪</strong><span className="mt-2 block text-[9px] text-[#81918b]">شانس خوب برای شروع</span></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, width, accent = false }: { label: string; value: string; width: string; accent?: boolean }) {
  return <div className="mt-6 text-[#19312f]"><div className="mb-2 flex justify-between text-[10px]"><span>{label}</span><span className={accent ? "text-[#b3832e]" : "text-[#0f7b62]"}>{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-[#edf2ee]"><div className={`h-full rounded-full ${accent ? "bg-[#e6c76e]" : "bg-[#0f7b62]"}`} style={{ width }} /></div></div>;
}

const templates = ["رزومه مینیمال", "رزومه رسمی", "ATS Friendly", "رزومه خلاقانه"];

export function TemplatesSection() {
  return (
    <section id="templates" className="bg-[#eef4ef] py-24 sm:py-32">
      <div className={shell}>
        <SectionIntro eyebrow="قالب‌ها" title="ظاهر دقیق، محتوای هدفمند" text="قالبی انتخاب کن که تجربه‌ات را واضح و حرفه‌ای نشان دهد." />
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {templates.map((name, index) => <Link href="/login" key={name} className="group rounded-3xl border border-[#dce7de] bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`aspect-[.72] rounded-2xl p-4 ${index % 2 ? "bg-[#f8f1e3]" : "bg-[#f2f6f2]"}`}><div className="h-3 w-1/2 rounded-full bg-[#19312f]" /><div className="mt-2 h-1.5 w-2/3 rounded-full bg-[#c4d2c9]" /><div className="mt-8 h-2 w-1/3 rounded-full bg-[#0f7b62]" /><div className="mt-3 space-y-2"><i className="block h-1 rounded-full bg-[#d5dfd7]" /><i className="block h-1 w-4/5 rounded-full bg-[#d5dfd7]" /><i className="block h-1 w-3/5 rounded-full bg-[#d5dfd7]" /></div></div><span className="mt-3 block text-center text-[10px] font-black text-[#526461] transition group-hover:text-[#0f7b62]">{name}</span></Link>)}
        </div>
      </div>
    </section>
  );
}

const plans = [
  { name: "رایگان", description: "برای شروع و ساخت اولین رزومه", price: "رایگان", items: ["۱ رزومه", "۵ اعتبار هوشمند", "۱ تحلیل شغلی"] },
  { name: "جست‌وجوی شغلی", description: "برای اپلای هدفمند و فعال", price: "۴۹۹٬۰۰۰", items: ["۵ رزومه", "۴۰ اعتبار هوشمند", "۱۵ تحلیل شغلی", "۵ تمرین مصاحبه"], featured: true },
  { name: "حرفه‌ای", description: "برای استفاده حرفه‌ای و مستمر", price: "۷۹۹٬۰۰۰", items: ["رزومه نامحدود", "۱۵۰ اعتبار هوشمند", "۵۰ تحلیل شغلی", "۱۵ تمرین مصاحبه"] },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className={shell}>
        <SectionIntro eyebrow="شفاف و قابل انتخاب" title="پلنی برای مرحله‌ای که در آن هستی" text="با امکانات کافی شروع کن و هر زمان لازم بود مسیرت را ارتقا بده." />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => <article key={plan.name} className={`relative rounded-3xl border p-7 ${plan.featured ? "border-[#0f7b62] bg-[#0f7b62] text-white shadow-[0_20px_50px_rgba(15,123,98,.2)]" : "border-[#e2eae3] bg-white text-[#19312f]"}`}><h3 className="text-lg font-black">{plan.name}</h3>{plan.featured && <span className="absolute left-5 top-5 rounded-full bg-[#f1d17c] px-3 py-1 text-[9px] font-black text-[#5e4b1d]">پیشنهاد رادیکار</span>}<p className={`mt-2 text-[11px] ${plan.featured ? "text-white/65" : "text-[#81908b]"}`}>{plan.description}</p><div className="mt-8"><strong className="text-2xl font-black">{plan.price}</strong>{plan.price !== "رایگان" && <span className="mr-1 text-[10px] opacity-60">تومان / ماه</span>}</div><Link href="/login" className={`mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-2xl text-[11px] font-bold ${plan.featured ? "bg-white text-[#0f7b62]" : "border border-[#dce6df] bg-white text-[#29423e]"}`}>شروع کن</Link><ul className={`mt-7 space-y-3 p-0 text-[11px] ${plan.featured ? "text-white/80" : "text-[#647772]"}`}>{plan.items.map((item) => <li key={item} className="flex items-center gap-2"><Check size={13} className={plan.featured ? "text-[#f1d17c]" : "text-[#0f7b62]"} />{item}</li>)}</ul></article>)}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  ["آیا شروع کار رایگان است؟", "بله، پلن رایگان برای ساخت اولین رزومه و تجربه قابلیت‌های اصلی در دسترس است."],
  ["رزومه فارسی و انگلیسی پشتیبانی می‌شود؟", "بله، می‌توانی رزومه را با چیدمان فارسی یا انگلیسی بسازی و خروجی بگیری."],
  ["اطلاعات حرفه‌ای من کجا استفاده می‌شود؟", "اطلاعات در حساب کاربری‌ات برای ساخت رزومه، تحلیل فرصت‌ها و پیشنهادهای مرتبط استفاده می‌شود."],
  ["آیا می‌توانم برای هر شغل رزومه جدا داشته باشم؟", "بله، پایگاه دانش تو یک منبع مشترک است و می‌توانی برای هر فرصت نسخه اختصاصی بسازی."],
];

export function FaqSection() {
  return (
    <section id="faq" className="bg-[#f0f5f1] py-24 sm:py-32">
      <div className={`${shell} grid gap-12 lg:grid-cols-[.75fr_1.25fr]`}>
        <SectionIntro eyebrow="سوال‌های متداول" title="هنوز سوالی داری؟" text="اگر جواب سوالت اینجا نیست، از طریق پشتیبانی با ما در ارتباط باش." />
        <div className="space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-[#dfe9e1] bg-white px-5 py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-xs font-black text-[#29423e]"><span>{question}</span><ChevronDown size={16} className="shrink-0 text-[#0f7b62] transition-transform group-open:rotate-180" /></summary><p className="mb-0 mt-3 border-t border-[#edf1ed] pt-3 text-[11px] leading-7 text-[#7b8b87]">{answer}</p></details>)}</div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[30px] bg-[#0f7b62] px-7 py-14 text-center text-white shadow-[0_24px_70px_rgba(15,123,98,.2)] sm:px-12">
        <h2 className="text-3xl font-black leading-[1.5] sm:text-4xl">قدم بعدی شغلی‌ات را هوشمندانه شروع کن</h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-white/70">ساخت اولین رزومه‌ات رایگان است. همین امروز مسیر حرفه‌ای‌ات را مرتب کن.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/login" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-[#0f7b62] transition hover:-translate-y-0.5">رایگان شروع کن <ArrowLeft size={17} /></Link></div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#e3ebe4] bg-white py-8">
      <div className={`${shell} flex flex-col items-center justify-between gap-5 text-[10px] text-[#82908b] sm:flex-row`}>
        <div className="flex items-center gap-3"><Image src="/logo.svg" alt="" width={22} height={22} /><span>رادیکار؛ دستیار هوشمند مسیر شغلی</span></div>
        <div className="flex flex-wrap justify-center gap-5"><Link href="/privacy" className="hover:text-[#0f7b62]">حریم خصوصی</Link><Link href="/terms" className="hover:text-[#0f7b62]">شرایط استفاده</Link><span>تمامی حقوق محفوظ است © ۱۴۰۵</span></div>
      </div>
    </footer>
  );
}

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="max-w-xl"><span className="text-[10px] font-black text-[#0f7b62]">{eyebrow}</span><h2 className="mt-3 text-3xl font-black leading-[1.5] text-[#19312f] sm:text-4xl">{title}</h2><p className="mb-0 mt-4 text-sm leading-8 text-[#71817c]">{text}</p></div>;
}
