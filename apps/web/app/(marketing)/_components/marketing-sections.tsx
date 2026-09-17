"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Check, ChevronDown, CircleCheck, FileText, Layers3, MapPin, MousePointer2, Sparkles, Target, WandSparkles, Zap } from "lucide-react";
import { AnimatedNumber, BorderBeam, DotPattern, Marquee, Meteors } from "./magic-ui";

const shell = "mx-auto w-full max-w-[1180px] px-5 sm:px-8";
const prompts = ["فرصت‌های مناسب پروفایل من را پیدا کن", "این آگهی چقدر با تجربه من متناسب است؟", "برای این موقعیت یک رزومه اختصاصی بساز", "شغل‌های دورکاری مرتبط را پیشنهاد بده", "برای مصاحبه این شرکت آماده‌ام کن"];

export function MarketingHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between rounded-full border border-black/8 bg-[#fbfcf8]/80 px-3 shadow-[0_10px_40px_rgba(20,30,28,.08)] backdrop-blur-2xl">
        <Link href="/" className="flex items-center gap-1" aria-label="رادیکار">
          <span className="grid size-10 place-items-center">
            <Image src="/radikar-logo.png" alt="" width={50} height={50} priority />
          </span>
          <strong className="text-[17px] font-black text-[#173c30]">رادیکار</strong>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-[#61706c] md:flex" aria-label="ناوبری اصلی">
          <a href="#product">محصول</a>
          <a href="#how-it-works">چطور کار می‌کند؟</a>
          <a href="#features">امکانات</a>
          <a href="#pricing">تعرفه‌ها</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="ml-3 hidden text-[13px] font-bold text-[#586762] sm:block">ورود</Link>
          <Link href="/login" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#4da980]/35 bg-[linear-gradient(135deg,#1d7657,#0e513c)] px-5 text-[13px] font-black text-white shadow-[0_10px_28px_rgba(15,91,66,.2)]">
            شروع رایگان <ArrowLeft size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function HeroSection() {
  return <section className="relative overflow-hidden bg-[#fbfcf8] pb-20 pt-32 sm:pt-40"><div aria-hidden="true" className="absolute inset-x-0 top-0 h-[1000px] [mask-image:linear-gradient(to_bottom,black_0%,black_82%,transparent_100%)]"><Image src="/images/career-match-hero-v2.png" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-[.48] saturate-[.9]"/><div className="absolute inset-0 bg-white/15"/><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,252,248,.88)_0%,rgba(251,252,248,.62)_38%,rgba(251,252,248,.16)_70%,transparent_100%)]"/></div><DotPattern className="opacity-45"/><Meteors/><div className="absolute left-1/2 top-12 h-[500px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(172,245,207,.18),rgba(221,244,231,.1)_44%,transparent_72%)] blur-3xl"/><div className={`${shell} relative text-center`}><a href="#product" className="relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-black/8 bg-white/85 px-3 py-2 text-[10px] font-bold text-[#596762] shadow-sm backdrop-blur-sm"><span className="rounded-full bg-[#dffceb] px-2 py-1 text-[#087b4f]">جدید</span>دستیار هوشمند مسیر شغلی تو</a><h1 className="mx-auto mt-7 max-w-[980px] text-[clamp(32px,4.7vw,60px)] font-black leading-[1.35] tracking-[-1.8px] text-[#151c1b]">شغل مناسب را پیدا کن؛<br/><span className="mt-1 inline-block max-w-full px-2"><AnimatedNumber>با رزومه‌ای که برای همان شغل ساخته شده</AnimatedNumber></span></h1><p className="mx-auto mt-7 max-w-2xl text-[13px] leading-8 text-[#65736f] sm:text-[15px]">رادیکار فرصت‌های متناسب با تجربه‌ات را پیدا می‌کند، میزان تطابق تو را می‌سنجد و برای هر موقعیت، به‌صورت خودکار یک رزومه اختصاصی آماده می‌کند.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#4da980]/40 bg-[linear-gradient(135deg,#1d7a59_0%,#0f5b42_55%,#0b4433_100%)] px-7 text-sm font-black text-white shadow-[0_18px_48px_rgba(15,91,66,.22)]">فرصت مناسبم را پیدا کن <ArrowLeft size={16}/></Link><a href="#product" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-black/10 bg-white/75 px-6 text-xs font-black text-[#34413e] backdrop-blur-sm">نحوه کار را ببین <MousePointer2 size={15}/></a></div><div className="mt-6 flex flex-wrap justify-center gap-5 text-[10px] font-bold text-[#7a8783]">{["پیشنهاد شغل هوشمند","تطبیق دقیق با آگهی","رزومه خودکار برای هر فرصت"].map(x=><span key={x} className="flex items-center gap-1.5"><CircleCheck size={13} className="text-[#16a66c]"/>{x}</span>)}</div></div><div className="relative mx-auto mt-16 max-w-[1380px] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"><Marquee>{prompts.map((p,i)=><div key={p} className={`flex w-[285px] shrink-0 items-center gap-3 rounded-2xl border border-[#cfe2d7] p-3 shadow-sm ${["bg-[#eef8f2]","bg-[#e2f4e9]","bg-[#f7faf8]","bg-[#eaf6ef]","bg-white"][i]}`}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#176b4e] text-white"><Sparkles size={15}/></span><span className="text-[10px] font-bold text-[#394642]">{p}</span></div>)}</Marquee></div><ProductStage/></section>;
}

function ProductStage() {
  const navigation = [
    { label: "نمای کلی", icon: Layers3 },
    { label: "پایگاه دانش", icon: FileText },
    { label: "رزومه‌های من", icon: BadgeCheck },
    { label: "تطبیق شغلی", icon: Target },
    { label: "پیگیری اپلای", icon: BriefcaseBusiness },
    { label: "تمرین مصاحبه", icon: Sparkles },
  ];

  return (
    <div id="product" className={`${shell} relative mt-16 scroll-mt-24`}>
      <div className="relative overflow-hidden rounded-[30px] border border-[#55ac86]/50 bg-[linear-gradient(145deg,#1a624b_0%,#0e4032_48%,#08291f_100%)] p-2 shadow-[0_42px_110px_rgba(10,70,50,.25)] sm:p-3">
        <BorderBeam className="opacity-90" />
        <div aria-hidden="true" className="absolute -left-24 -top-24 size-64 rounded-full bg-[#8ce5b5]/15 blur-3xl" />
        <div className="relative flex h-10 items-center justify-between px-4">
          <div className="flex gap-1.5" dir="ltr">
            <i className="size-2 rounded-full bg-[#e96c5a]" />
            <i className="size-2 rounded-full bg-[#f0c65b]" />
            <i className="size-2 rounded-full bg-[#66d79b]" />
          </div>
          <span className="text-[8px] font-bold text-white/55">app.radikar.ir</span>
          <span />
        </div>

        <div className="relative grid min-h-[560px] overflow-hidden rounded-[22px] bg-[#f5f7f3] lg:grid-cols-[190px_1fr]">
          <aside className="hidden border-l border-black/6 bg-white p-4 lg:flex lg:flex-col">
            <div className="mb-7 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-[#164c3a]">
                <Image src="/radikar-logo.png" alt="" width={27} height={27} />
              </span>
              <div><strong className="block text-[11px]">رادیکار</strong><span className="text-[7px] text-[#98a49f]">پنل مسیر شغلی</span></div>
            </div>
            {navigation.map(({ label, icon: Icon }, index) => (
              <div key={label} className={`mb-1.5 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[9px] font-bold ${index === 3 ? "bg-[#e4f8ed] text-[#087b4f]" : "text-[#81908b]"}`}>
                <Icon size={13} /> {label}
              </div>
            ))}
            <div className="mt-auto rounded-2xl border border-[#dcebe3] bg-[#f5faf7] p-3">
              <div className="flex items-center justify-between text-[8px]"><strong className="text-[#36594c]">پلن حرفه‌ای</strong><span className="text-[#16805b]">۷۲٪</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dce8e1]"><i className="block h-full w-[72%] rounded-full bg-[#20a36f]" /></div>
              <span className="mt-2 block text-[7px] text-[#8a9893]">۱۸ تحلیل از ۲۵ تحلیل ماهانه</span>
            </div>
          </aside>

          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-[#87948f]">تحلیل فرصت شغلی</span><span className="rounded-full bg-[#e2f5ea] px-2 py-1 text-[7px] font-black text-[#0b7b54]">تحلیل کامل</span></div>
                <h3 className="mt-1 text-lg font-black text-[#18211f]">طراح محصول ارشد · دورکاری</h3>
                <div className="mt-2 flex flex-wrap gap-3 text-[8px] text-[#82908b]"><span className="flex items-center gap-1"><BriefcaseBusiness size={11}/> راهکارنو</span><span className="flex items-center gap-1"><MapPin size={11}/> تهران / دورکاری</span><span>تمام‌وقت</span><span>منتشرشده ۲ روز پیش</span></div>
              </div>
              <div className="hidden items-center gap-2 sm:flex"><span className="rounded-full bg-white px-3 py-2 text-[8px] font-bold shadow-sm">رزومه: محصول ۱۴۰۵</span><span className="rounded-full bg-white px-3 py-2 text-[8px] font-bold shadow-sm">تحلیل در ۴۸ ثانیه</span></div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_220px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <MiniCard
                  title="آنچه به‌خوبی پوشش داده‌ای"
                  icon={BadgeCheck}
                  green
                  items={["۵ سال تجربه طراحی محصول", "تسلط به Figma و Design System", "دستاوردهای عددی و قابل سنجش"]}
                />
                <MiniCard
                  title="فرصت‌های بهبود"
                  icon={Zap}
                  items={["تجربه SQL را شفاف‌تر کن", "اثرگذاری روی KPI محصول را اضافه کن", "کلیدواژه A/B Testing را پوشش بده"]}
                />
                <div className="col-span-full rounded-2xl border border-black/6 bg-white p-4">
                  <div className="flex items-center justify-between"><strong className="text-[9px]">جزئیات امتیاز تطابق</strong><span className="text-[8px] text-[#81908b]">براساس ۲۴ معیار آگهی</span></div>
                  <div className="mt-3 grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
                    <MatchMetric label="مهارت‌های تخصصی" value="۹۲٪" width="w-[92%]" />
                    <MatchMetric label="سابقه و سطح شغلی" value="۸۴٪" width="w-[84%]" />
                    <MatchMetric label="کلیدواژه‌های رزومه" value="۸۱٪" width="w-[81%]" />
                    <MatchMetric label="ترجیحات شغلی" value="۸۸٪" width="w-[88%]" />
                  </div>
                </div>
                <div className="col-span-full rounded-2xl border border-black/6 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#e3f5eb] text-[#16805b]"><FileText size={15}/></span><div><strong className="block text-[9px]">رزومه اختصاصی برای همین فرصت</strong><span className="mt-1 block text-[7px] text-[#84918d]">پایه: رزومه محصول ۱۴۰۵ · بدون تغییر اطلاعات واقعی</span></div></div><span className="rounded-full bg-[#e3f5eb] px-3 py-1.5 text-[8px] font-black text-[#087b5b]">آماده ساخت</span></div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3"><span className="rounded-xl bg-[#f4f7f5] px-3 py-2 text-[8px] text-[#586a63]">بازنویسی خلاصه حرفه‌ای</span><span className="rounded-xl bg-[#f4f7f5] px-3 py-2 text-[8px] text-[#586a63]">اولویت‌بندی تجربه‌های مرتبط</span><span className="rounded-xl bg-[#f4f7f5] px-3 py-2 text-[8px] text-[#586a63]">تنظیم مهارت‌ها و کلیدواژه‌ها</span></div>
                  <div className="mt-3 flex items-center justify-between"><span className="text-[7px] text-[#85928e]">نسخه جدید کنار رزومه اصلی ذخیره می‌شود.</span><button className="rounded-xl bg-[#176b4e] px-4 py-2.5 text-[9px] font-black text-white">ساخت نسخه اختصاصی</button></div>
                </div>
              </div>

              <div className="relative flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-[#57a984]/35 bg-[radial-gradient(circle_at_50%_15%,#236e53_0%,#124936_45%,#0b3529_100%)] p-5 text-center text-white shadow-[0_18px_45px_rgba(10,66,47,.22)]">
                <DotPattern className="invert opacity-[.06] [mask-image:none]" />
                <div aria-hidden="true" className="absolute -top-14 size-40 rounded-full bg-[#93ebbc]/15 blur-3xl" />
                <span className="relative text-[9px] text-white/60">امتیاز تطابق کلی</span>
                <div className="relative mx-auto mt-4 grid size-28 place-items-center rounded-full bg-[conic-gradient(#a6f1c8_0_86%,rgba(255,255,255,.11)_86%)] p-[8px] shadow-[0_0_45px_rgba(134,229,178,.16)]">
                  <div className="grid size-full place-items-center rounded-full bg-[#0f3e30]">
                    <strong className="text-3xl font-black">۸۶٪</strong>
                  </div>
                </div>
                <strong className="relative mt-4 text-xs text-[#d5f8e4]">تطابق عالی</strong>
                <span className="relative mt-1 text-[8px] text-white/45">شانس بالا برای عبور از غربال اولیه</span>
                <div className="relative mt-5 grid gap-2 border-t border-white/10 pt-4 text-right text-[8px]">
                  <div className="flex justify-between"><span className="text-white/55">معیارهای منطبق</span><strong>۲۱ از ۲۴</strong></div>
                  <div className="flex justify-between"><span className="text-white/55">مهارت کلیدی مشترک</span><strong>۱۲ مورد</strong></div>
                  <div className="flex justify-between"><span className="text-white/55">شکاف قابل بهبود</span><strong className="text-[#f0cf7b]">۳ مورد</strong></div>
                </div>
                <div className="relative mt-auto rounded-xl border border-white/10 bg-white/[.07] p-3 text-right"><span className="text-[7px] text-white/45">پیشنهاد رادیکار</span><p className="mb-0 mt-1 text-[8px] leading-5 text-white/75">با یک نسخه هدفمند از رزومه، امتیاز کلیدواژه‌ها تا ۹۰٪ بهتر می‌شود.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function MiniCard({title,icon:Icon,items,green=false}:{title:string;icon:typeof BadgeCheck;items:string[];green?:boolean}) {return <div className="rounded-2xl border border-black/6 bg-white p-4"><div className="flex items-center gap-2"><span className={`grid size-8 place-items-center rounded-xl ${green?"bg-[#dff5e8] text-[#0d8c5a]":"bg-[#fff3d9] text-[#9a7125]"}`}><Icon size={15}/></span><strong className="text-[9px]">{title}</strong></div><div className="mt-3 space-y-2">{items.map(x=><span key={x} className="flex items-start gap-2 text-[8px] leading-5 text-[#687872]"><i className={`mt-2 size-1 shrink-0 rounded-full ${green?"bg-[#25a16e]":"bg-[#d0a344]"}`}/>{x}</span>)}</div></div>}

function MatchMetric({label,value,width}:{label:string;value:string;width:string}) {return <div><div className="mb-1 flex justify-between text-[8px] text-[#66766f]"><span>{label}</span><strong className="text-[#275244]">{value}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-[#e8eeeb]"><i className={`block h-full rounded-full bg-[#249c6b] ${width}`} /></div></div>}

export function TrustStrip(){return <section className="border-y border-black/6 bg-white py-7"><div className={`${shell} flex flex-col items-center justify-between gap-5 sm:flex-row`}><span className="text-[10px] font-black text-[#7a8783]">تمام مسیر کاریابی، در یک فضای یکپارچه</span><div className="flex flex-wrap justify-center gap-7 text-[10px] font-black text-[#35423f]">{["رزومه هوشمند","تحلیل فرصت","مدیریت اپلای","تمرین مصاحبه"].map(x=><span key={x}>• {x}</span>)}</div></div></section>}

const workflow=[{icon:FileText,n:"۰۱",title:"پروفایل حرفه‌ای‌ات را بساز",text:"سوابق، مهارت‌ها و ترجیحات شغلی‌ات را یک‌بار وارد کن."},{icon:BriefcaseBusiness,n:"۰۲",title:"فرصت‌های مناسب را ببین",text:"رادیکار شغل‌های مرتبط را براساس تجربه و هدف تو پیشنهاد می‌دهد."},{icon:Target,n:"۰۳",title:"تطابق را دقیق بسنج",text:"برای هر آگهی، نقاط قوت و شکاف‌های مهم پروفایلت را ببین."},{icon:WandSparkles,n:"۰۴",title:"رزومه اختصاصی بگیر",text:"نسخه مناسب همان موقعیت به‌صورت خودکار ساخته و آماده ارسال می‌شود."}];
export function WorkflowSection(){return <section id="how-it-works" className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_-20%,#1b674e_0%,#0d3b2f_38%,#08251e_75%,#061b16_100%)] py-24 text-white sm:py-32"><DotPattern className="invert opacity-[.08] [mask-image:none]"/><div aria-hidden="true" className="absolute -left-32 top-1/3 size-80 rounded-full bg-[#43c98a]/10 blur-3xl"/><div className={`${shell} relative`}><SectionIntro eyebrow="از کشف فرصت تا اپلای" title="چهار قدم تا یک اپلای هوشمند و هدفمند" text="رادیکار فقط رزومه نمی‌سازد؛ فرصت مناسب را پیدا می‌کند، تطابق را می‌سنجد و بهترین نسخه تو را برای همان شغل آماده می‌کند." dark/><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{workflow.map(({icon:Icon,n,title,text})=><article key={n} className="group rounded-[28px] border border-white/10 bg-white/[.055] p-7 shadow-[0_18px_50px_rgba(2,18,13,.16)] backdrop-blur-sm transition hover:-translate-y-1 hover:border-[#9ef6cd]/35 hover:bg-white/[.075]"><div className="flex justify-between"><span className="grid size-14 place-items-center rounded-2xl bg-[#a9efc9] text-[#0c3b2c]"><Icon size={22}/></span><span className="text-3xl font-black text-white/15">{n}</span></div><h3 className="mt-9 text-base font-black">{title}</h3><p className="mt-3 text-[11px] leading-7 text-white/60">{text}</p></article>)}</div></div></section>}

const features=[{icon:BriefcaseBusiness,title:"پیداکردن هوشمند فرصت‌های مناسب",text:"فرصت‌هایی را ببین که واقعاً با تجربه، مهارت‌ها و ترجیحات شغلی تو هم‌خوان‌اند.",bg:"bg-[#e2f3e9]",span:"lg:col-span-7"},{icon:Target,title:"تطبیق دقیق قبل از اپلای",text:"امتیاز واقعی، مهارت‌های مشترک و شکاف‌های مهم هر آگهی را بشناس.",bg:"bg-[#edf6f1]",span:"lg:col-span-5"},{icon:WandSparkles,title:"رزومه خودکار برای همان موقعیت",text:"رادیکار بدون تغییر اطلاعات واقعی، مرتبط‌ترین نسخه رزومه را آماده می‌کند.",bg:"bg-[#dcefe4]",span:"lg:col-span-5"},{icon:Layers3,title:"مدیریت مسیر تا مصاحبه",text:"هر فرصت، نسخه رزومه و مرحله اپلای را منظم و یکپارچه دنبال کن.",bg:"bg-[#f1f6f3]",span:"lg:col-span-7"}];

function FeaturePreview({ index }: { index: number }) {
  const previewClassName = "absolute -bottom-6 left-7 right-7 h-[178px] rounded-t-[24px] border border-black/5 bg-white/90 p-4 shadow-[0_-16px_42px_rgba(28,91,65,.1)] transition duration-500 hover:-translate-y-3 sm:p-5";

  if (index === 0) {
    return (
      <div className={previewClassName}>
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <strong className="text-[9px]">فرصت‌های پیشنهادی</strong>
          <span className="rounded-full bg-[#176b4e] px-3 py-1 text-[8px] font-black text-white">۳ فرصت جدید</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <strong className="block truncate text-[11px] text-[#18382c]">طراح محصول ارشد</strong>
            <span className="mt-1 flex items-center gap-1 text-[8px] text-[#82908b]"><MapPin size={10} /> راهکارنو · تهران / دورکاری</span>
          </div>
          <div className="grid size-11 shrink-0 place-items-center rounded-full border-[5px] border-[#dff3e8] text-[10px] font-black text-[#087b5b]">۹۱٪</div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[7px] font-bold text-[#4d625b]">
          <span className="rounded-full bg-[#edf6f1] px-2 py-1">۱۲ مهارت مشترک</span>
          <span className="rounded-full bg-[#e1f5e9] px-2 py-1 text-[#087b5b]">رزومه اختصاصی آماده</span>
          <span className="rounded-full bg-[#f2f5f3] px-2 py-1">تمام‌وقت</span>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={previewClassName}>
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <strong className="text-[9px]">گزارش تطابق فرصت</strong>
          <span className="rounded-full bg-[#dff4e8] px-3 py-1 text-[8px] font-black text-[#087b5b]">مناسب برای اپلای</span>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border-[5px] border-[#ccebd9] text-[11px] font-black text-[#087b5b]">۸۶٪</div>
          <div className="min-w-0 flex-1 space-y-2.5">
            <div><div className="mb-1 flex justify-between text-[7px] font-bold text-[#61716c]"><span>مهارت‌های منطبق</span><span>۱۲ مورد</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#e8efeb]"><i className="block h-full w-[86%] rounded-full bg-[#29a674]" /></div></div>
            <div><div className="mb-1 flex justify-between text-[7px] font-bold text-[#61716c]"><span>شکاف‌های مهم</span><span>۳ مورد</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#e8efeb]"><i className="block h-full w-[28%] rounded-full bg-[#e1bd68]" /></div></div>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5 text-[7px] font-bold"><span className="rounded-full bg-[#e4f5eb] px-2 py-1 text-[#087b5b]">Figma</span><span className="rounded-full bg-[#e4f5eb] px-2 py-1 text-[#087b5b]">Product Strategy</span><span className="rounded-full bg-[#fff5dc] px-2 py-1 text-[#8b6b20]">SQL نیاز به تقویت</span></div>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={previewClassName}>
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <strong className="text-[9px]">نسخه اختصاصی رزومه</strong>
          <span className="rounded-full bg-[#176b4e] px-3 py-1 text-[8px] font-black text-white">آماده ساخت</span>
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-[#f4f8f5] p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#16805b] shadow-sm"><FileText size={15}/></span>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-[9px] text-[#18382c]">رزومهٔ طراح محصول ارشد</strong>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dde8e1]"><i className="block h-full w-[91%] rounded-full bg-[#2aaa76]" /></div>
            <span className="mt-1 block text-[7px] text-[#7e8d87]">۹۱٪ تطابق با شرح شغل</span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[7px] font-bold text-[#54655f]"><span className="rounded-lg border border-[#e4ebe7] px-1 py-1.5">خلاصه حرفه‌ای</span><span className="rounded-lg border border-[#e4ebe7] px-1 py-1.5">تجربه مرتبط</span><span className="rounded-lg border border-[#e4ebe7] px-1 py-1.5">مهارت‌ها</span></div>
      </div>
    );
  }

  return (
    <div className={previewClassName}>
      <div className="flex items-center justify-between border-b border-black/5 pb-3">
        <strong className="text-[9px]">وضعیت اپلای</strong>
        <span className="rounded-full bg-[#176b4e] px-3 py-1 text-[8px] font-black text-white">۴ فرصت فعال</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-1" dir="rtl">
        {["ذخیره‌شده", "رزومه آماده", "ارسال‌شده", "مصاحبه"].map((step, stepIndex) => <div key={step} className="flex min-w-0 flex-1 items-center last:flex-none"><div className="text-center"><span className={`mx-auto grid size-5 place-items-center rounded-full text-[8px] ${stepIndex < 3 ? "bg-[#18835d] text-white" : "border border-[#b9cbc2] bg-white text-[#71817b]"}`}>{stepIndex < 3 ? <Check size={10}/> : "۴"}</span><span className="mt-1 block whitespace-nowrap text-[6px] font-bold text-[#677771]">{step}</span></div>{stepIndex < 3 && <i className={`mx-1 mb-3 h-px flex-1 ${stepIndex < 2 ? "bg-[#4eb78a]" : "bg-[#d8e3dd]"}`} />}</div>)}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f2f7f4] px-3 py-2"><div><strong className="block text-[8px] text-[#18382c]">طراح محصول ارشد</strong><span className="mt-0.5 block text-[7px] text-[#83918c]">راهکارنو</span></div><span className="rounded-full bg-[#fff1cf] px-2 py-1 text-[7px] font-black text-[#8a6718]">مصاحبه فردا · ۱۰:۳۰</span></div>
    </div>
  );
}

export function FeaturesSection(){return <section id="features" className="bg-[#fbfcf8] py-24 sm:py-32"><div className={shell}><SectionIntro eyebrow="یک موتور هوشمند کاریابی" title="فرصت بهتر را پیدا کن و برای همان فرصت آماده شو" text="کشف شغل، تحلیل تطابق، ساخت رزومه اختصاصی و پیگیری اپلای در یک جریان منسجم و شخصی‌سازی‌شده."/><div className="mt-14 grid gap-4 lg:grid-cols-12">{features.map(({icon:Icon,title,text,bg,span},i)=><article key={title} className={`relative min-h-[320px] overflow-hidden rounded-[30px] border border-[#d7e6dc] p-7 ${bg} ${span}`}><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/75 text-[#176b4e]"><Icon size={18}/></span><h3 className="m-0 max-w-md text-xl font-black sm:text-2xl">{title}</h3></div><p className="mt-3 max-w-md text-[11px] leading-7 text-[#5f6d68]">{text}</p><FeaturePreview index={i}/></article>)}</div></div></section>}

export function DemoSection(){return <section id="demo" className="bg-white py-24 sm:py-32"><div className={`${shell} grid items-center gap-12 lg:grid-cols-2`}><div><SectionIntro eyebrow="تطبیق هوشمند، نه حدس و گمان" title="قبل از اپلای بدان چقدر برای این شغل آماده‌ای" text="رادیکار پروفایل تو را با نیازهای واقعی آگهی مقایسه می‌کند، دلیل امتیاز را توضیح می‌دهد و همان‌جا رزومه مناسب آن موقعیت را می‌سازد."/><Link href="/login" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#176b4e] px-6 text-xs font-black text-white">تطبیق با یک فرصت <ArrowLeft size={15}/></Link></div><div className="relative rounded-[30px] border border-[#d8e6dd] bg-[#f3f8f5] p-6 shadow-[0_24px_70px_rgba(20,80,55,.1)]"><BorderBeam/><div className="flex items-center justify-between"><strong className="text-xs">گزارش تطابق فرصت</strong><span className="rounded-full bg-[#dff4e8] px-3 py-1.5 text-[8px] font-black text-[#176b4e]">مناسب برای اپلای</span></div><div className="mt-6 grid grid-cols-2 gap-3">{[["امتیاز تطابق","۸۶٪"],["مهارت‌های منطبق","۱۲ مورد"],["شکاف‌های مهم","۳ مورد"],["رزومه اختصاصی","آماده ساخت"]].map(([a,b])=><div key={a} className="rounded-2xl bg-white p-4"><span className="text-[8px] text-[#7a8783]">{a}</span><strong className="mt-2 block text-base text-[#18382c]">{b}</strong><div className="mt-3 h-1.5 rounded-full bg-[#24a773]"/></div>)}</div></div></div></section>}

export function TemplatesSection(){const jobs=[["طراح محصول ارشد","فین‌تک · تهران","۹۱٪"],["مدیر محصول","SaaS · دورکاری","۸۷٪"],["طراح تجربه کاربری","تجارت الکترونیک · تهران","۸۴٪"],["Product Designer","Remote · Europe","۸۱٪"]];return <section className="relative overflow-hidden bg-[radial-gradient(circle_at_8%_0%,#216c53_0%,#0f4032_36%,#08281f_72%,#061b16_100%)] py-24 text-white"><DotPattern className="invert opacity-[.07] [mask-image:none]"/><div aria-hidden="true" className="absolute -right-24 bottom-0 size-72 rounded-full bg-[#65d69c]/10 blur-3xl"/><div className={`${shell} relative`}><SectionIntro eyebrow="فرصت‌هایی متناسب با تو" title="به‌جای جست‌وجوی بیشتر، انتخاب دقیق‌تری داشته باش" text="رادیکار آگهی‌ها را با پروفایل حرفه‌ای و ترجیحات تو مقایسه می‌کند تا فرصت‌های ارزشمند زودتر دیده شوند." dark/></div><div className="relative mt-14 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"><Marquee reverse>{jobs.map(([title,meta,score])=><Link href="/login" key={title} className="w-[300px] shrink-0 rounded-[24px] border border-white/12 bg-white/[.065] p-5 shadow-[0_18px_50px_rgba(2,18,13,.18)] backdrop-blur-sm transition hover:border-[#a9efc9]/45 hover:bg-white/[.095]"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#a9efc9] text-[#0c3b2c]"><BriefcaseBusiness size={17}/></span><strong className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] text-[#baf4d4]">{score} تطابق</strong></div><h3 className="mt-6 text-sm font-black">{title}</h3><span className="mt-2 flex items-center gap-1.5 text-[9px] text-white/55"><MapPin size={12}/>{meta}</span><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[9px]"><span className="text-white/55">رزومه اختصاصی آماده می‌شود</span><ArrowLeft size={14} className="text-[#a9efc9]"/></div></Link>)}</Marquee></div></section>}

const plans: Array<{
  name: string;
  description: string;
  price: string;
  featured?: boolean;
  items: Array<[string, boolean]>;
}> = [
  {
    name: "پایه",
    description: "مناسب شروع مسیر",
    price: "رایگان",
    items: [
      ["ساخت ۱ رزومه", true],
      ["تحلیل پایه پروفایل", true],
      ["تطبیق شغلی محدود", true],
      ["مصاحبهٔ آزمایشی AI", false],
      ["تحلیل‌های پیشرفتهٔ مسیر شغلی", false],
    ],
  },
  {
    name: "حرفه‌ای",
    description: "مناسب جست‌وجوی جدی کار",
    price: "۴۹۹٬۰۰۰",
    featured: true,
    items: [
      ["رزومه نامحدود", true],
      ["تطبیق پیشرفته با هوش مصنوعی", true],
      ["شبیه‌سازی مصاحبه", true],
      ["تحلیل‌های مسیر شغلی", true],
      ["مدیریت کامل فرصت‌ها", true],
    ],
  },
  {
    name: "ممتاز",
    description: "مناسب مدیران و متخصصان ارشد",
    price: "۷۹۹٬۰۰۰",
    items: [
      ["همه امکانات پلن حرفه‌ای", true],
      ["دستیار پیشرفتهٔ مسیر شغلی", true],
      ["دسترسی زودهنگام به قابلیت‌های AI", true],
      ["اولویت در پردازش درخواست‌ها", true],
      ["پشتیبانی اختصاصی", true],
    ],
  },
];
export function PricingSection() {
  return (
    <section id="pricing" className="bg-[#fbfcf8] py-24">
      <div className={shell}>
        <SectionIntro
          eyebrow="شفاف و ساده"
          title="برای قدم بعدی‌ات، یک پلن انتخاب کن"
          text="رایگان شروع کن و فقط وقتی به امکانات بیشتری نیاز داشتی ارتقا بده."
        />
        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex min-h-[520px] flex-col rounded-[30px] border p-7 transition duration-300 hover:-translate-y-1 sm:p-8 ${
                plan.featured
                  ? "z-10 overflow-visible border-[#3e9d78] bg-[radial-gradient(circle_at_15%_0%,#2d8967_0%,#176047_42%,#0c3d2f_100%)] text-white shadow-[0_26px_70px_rgba(13,74,53,.25)] lg:-my-5 lg:min-h-[560px]"
                  : "overflow-hidden border-black/7 bg-white text-[#173c30] hover:border-[#8fc9ad] hover:shadow-[0_20px_55px_rgba(26,87,64,.08)]"
              }`}
            >
              {plan.featured && (
                <>
                  <DotPattern className="invert opacity-[.07] [mask-image:none]" />
                  <BorderBeam className="opacity-80" />
                  <span className="absolute left-7 top-0 z-20 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#4cae83] bg-[#55c891] px-5 py-3 text-[11px] font-black text-[#FFF] shadow-[0_10px_24px_rgba(16,91,61,.2)]">
                    پیشنهاد رادیکار
                  </span>
                  <div
                    aria-hidden="true"
                    className="absolute -left-16 -top-20 size-52 rounded-full bg-[#7fe2ad]/15 blur-3xl"
                  />
                </>
              )}
              <div className="relative z-10">
                <div className="text-right">
                  <h3 className="text-2xl font-black">{plan.name}</h3>
                  <p className={`mt-2 text-xs ${plan.featured ? "text-white/55" : "text-[#9aa8a3]"}`}>{plan.description}</p>
                </div>
                <div className="mt-9 flex items-end gap-2 border-b border-black/8 pb-8">
                  <strong className={`text-5xl font-black tracking-[-2px] ${plan.featured ? "text-white" : "text-[#087b5b]"}`}>{plan.price}</strong>
                  {plan.price !== "رایگان" && (
                    <small className={`mb-1 text-[11px] ${plan.featured ? "text-white/55" : "text-[#9aa8a3]"}`}>
                      هزار تومان<br />ماهانه
                    </small>
                  )}
                </div>
                <ul className={`mt-8 flex-1 space-y-5 p-0 text-[12px] ${plan.featured ? "text-white/80" : "text-[#53635e]"}`}>
                  {plan.items.map(([item, included]) => (
                    <li key={item} className={`flex items-center gap-3 ${included ? "" : plan.featured ? "text-white/30" : "text-[#b8c2be]"}`}>
                      {included ? <Check size={16} className={plan.featured ? "text-[#63dda1]" : "text-[#21825f]"} /> : <span className="w-4 text-center text-lg leading-none">×</span>}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 flex min-h-14 items-center justify-center rounded-full border text-sm font-black ${
                    plan.featured
                      ? "border-white/80 bg-white text-[#087b5b] shadow-[0_12px_30px_rgba(2,29,20,.18)] hover:bg-[#dff8ea]"
                      : "border-[#d9e2dd] bg-white text-[#087b5b] hover:border-[#8fc9ad] hover:bg-[#f4faf6]"
                  }`}
                >
                  انتخاب پلن {plan.name}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs=[["آیا واقعاً می‌توانم رایگان شروع کنم؟","بله، اولین رزومه و قابلیت‌های اصلی را با پلن رایگان تجربه می‌کنی."],["رزومه فارسی و انگلیسی پشتیبانی می‌شود؟","بله، هر دو زبان با چیدمان و خروجی مناسب پشتیبانی می‌شوند."],["اطلاعات من از کجا می‌آید؟","خودت آن‌ها را وارد می‌کنی یا از رزومه فعلی استخراج می‌شوند."],["برای هر شغل رزومه جدا می‌سازد؟","بله، برای هر شرح شغل یک نسخه هدفمند و مستقل می‌سازی."]];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return <div className="rounded-2xl border border-black/7 bg-[#fbfcf8] px-5 py-4">
    <button type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)} className="flex w-full cursor-pointer items-center justify-between text-right text-xs font-black">
      {question}<ChevronDown size={16} className={`shrink-0 transition duration-300 ease-out ${isOpen ? "rotate-180" : "rotate-0"}`} />
    </button>
    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="overflow-hidden"><p className="mt-3 border-t border-black/5 pt-3 text-[10px] leading-7 text-[#75827e]">{answer}</p></div>
    </div>
  </div>;
}

export function FaqSection(){return <section id="faq" className="bg-white py-24"><div className={`${shell} grid gap-12 lg:grid-cols-[.8fr_1.2fr]`}><SectionIntro eyebrow="سؤال‌های پرتکرار" title="احتمالاً جواب اینجاست" text="اگر هنوز چیزی ذهنت را درگیر کرده، پشتیبانی کنارت است."/><div className="space-y-3">{faqs.map(([q,a])=><FaqItem key={q} question={q} answer={a}/>)}</div></div></section>}
export function FinalCta(){return <section className="bg-white px-5 pb-24"><div className="relative mx-auto max-w-[1120px] overflow-hidden rounded-[34px] bg-[#0b3025] px-6 py-16 text-center shadow-[0_30px_80px_rgba(7,45,33,.2)]"><Image src="/images/team-collaboration-green.png" alt="همکاران در حال همکاری در یک شرکت" fill sizes="(max-width: 1120px) 100vw, 1120px" className="object-cover object-center"/><div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,25,19,.72),rgba(7,46,34,.84)_35%,rgba(8,52,38,.84)_65%,rgba(4,25,19,.7))]"/><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(31,122,88,.18),transparent_56%)]"/><DotPattern className="invert opacity-[.07] [mask-image:none]"/><div className="relative text-white"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black backdrop-blur-md"><Sparkles size={13}/> فرصت بعدی می‌تواند مال تو باشد</span><h2 className="mx-auto mt-6 max-w-3xl text-3xl font-black leading-[1.55] text-white drop-shadow-sm sm:text-5xl">فرصت مناسب را پیدا کن؛ رادیکار تو را برای رسیدن به آن آماده می‌کند</h2><p className="mt-4 text-xs text-white/70">با ساخت پروفایل حرفه‌ای، پیشنهاد شغل و اولین تحلیل تطابق را شروع کن.</p><Link href="/login" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border border-[#9ce8c2]/40 bg-[#b9f2d3] px-7 text-xs font-black text-[#0b3c2d] shadow-[0_14px_34px_rgba(2,24,17,.28)]">پیداکردن فرصت‌های من <ArrowLeft size={15}/></Link></div></div></section>}
export function MarketingFooter() {
  const footerLinks = [
    { title: "محصول", links: [["امکانات", "#features"], ["نحوه کار", "#how-it-works"], ["تعرفه‌ها", "#pricing"]] },
    { title: "رادیکار", links: [["سؤال‌های پرتکرار", "#faq"], ["ورود به حساب", "/login"], ["شروع رایگان", "/login"]] },
  ];

  return (
    <footer className="relative overflow-hidden bg-[radial-gradient(circle_at_80%_0%,#164f3d_0%,#092d23_38%,#051d17_72%,#041511_100%)] text-white">
      <DotPattern className="invert opacity-[.055] [mask-image:none]" />
      <div aria-hidden="true" className="absolute -right-24 top-12 size-72 rounded-full bg-[#4bd294]/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-36 left-1/4 size-80 rounded-full bg-[#1c8b61]/10 blur-3xl" />
      <div className={`${shell} relative py-14 sm:py-16`}>
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.35fr_.65fr_.65fr]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="رادیکار">
              <span className="grid size-11 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_12px_35px_rgba(0,0,0,.2)] backdrop-blur-sm">
                <Image src="/radikar-logo.png" alt="" width={34} height={34} />
              </span>
              <span>
                <strong className="block text-xl font-black">رادیکار</strong>
                <small className="mt-0.5 block text-[10px] font-bold text-[#9dddbf]">دستیار هوشمند مسیر شغلی</small>
              </span>
            </Link>
            <p className="mt-6 text-[13px] leading-7 text-white/55">فرصت‌های شغلی متناسب را پیدا کن، میزان تطابقت را بسنج و برای هر موقعیت یک رزومه هدفمند و آماده ارسال داشته باش.</p>
            <Link href="/login" className="relative mt-6 inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-full border border-[#96e6bc]/25 bg-white/10 px-5 text-[12px] font-black text-white backdrop-blur-sm">
              ساخت مسیر شغلی من
              <ArrowLeft size={14} />
            </Link>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-[13px] font-black text-[#b8f2d2]">{group.title}</h3>
              <ul className="mt-5 space-y-4 p-0 text-[12px] text-white/50">
                {group.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="transition hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-5 pt-7 text-[11px] text-white/35 sm:flex-row">
          <p>© ۱۴۰۵ رادیکار؛ برای ساختن مسیر حرفه‌ای بهتر.</p>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="transition hover:text-white/70">حریم خصوصی</Link>
            <Link href="/terms" className="transition hover:text-white/70">شرایط استفاده</Link>
            <span className="inline-flex items-center gap-1.5 text-[#83cdaa]"><span className="size-1.5 rounded-full bg-[#54d493] shadow-[0_0_10px_#54d493]" /> سرویس فعال است</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
function SectionIntro({eyebrow,title,text,dark=false}:{eyebrow:string;title:string;text:string;dark?:boolean}){return <div className="max-w-2xl"><span className={`text-[9px] font-black ${dark?"text-[#a9efc9]":"text-[#11865b]"}`}>● {eyebrow}</span><h2 className={`mt-4 text-3xl font-black leading-[1.5] sm:text-4xl ${dark?"text-white":"text-[#17201e]"}`}>{title}</h2><p className={`mt-4 max-w-xl text-xs leading-8 ${dark?"text-white/60":"text-[#6e7b77]"}`}>{text}</p></div>}
