import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "../../_components/json-ld";
import { absoluteUrl, createPageMetadata, siteConfig } from "@/lib/site";

const title = "راهنمای رزومه، اپلای و مسیر شغلی";
const description = "راهنماهای کاربردی رادیکار برای ساخت رزومه، تطبیق با آگهی، تمرین مصاحبه و مدیریت هدفمند درخواست‌های شغلی.";
export const metadata = createPageMetadata({ title, description, path: "/guides" });
const guides = [
  ["ساخت رزومه حرفه‌ای", "از اطلاعات پایه تا نسخه‌ای منظم و قابل ویرایش.", "/resume-builder"],
  ["رزومه‌ساز هوشمند", "استفاده مسئولانه از هوش مصنوعی برای رزومه هدفمند.", "/ai-resume-builder"],
  ["تطبیق رزومه و شغل", "درک امتیاز تطابق و شکاف‌های قابل بهبود.", "/resume-job-match"],
  ["تمرین مصاحبه", "آمادگی براساس رزومه و شرح موقعیت.", "/interview-practice"],
  ["مدیریت اپلای", "پیگیری منظم فرصت‌ها و مراحل استخدام.", "/application-tracker"],
] as const;

export default function GuidesPage() {
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: absoluteUrl("/guides"), inLanguage: siteConfig.language, hasPart: guides.map(([name, , path]) => ({ "@type": "WebPage", name, url: absoluteUrl(path) })) };
  return <><JsonLd data={schema} /><div className="mx-auto max-w-[1040px] px-5 pb-24 pt-32 sm:px-8 sm:pt-40"><header className="max-w-3xl"><p className="text-xs font-black text-[#0b704c]">مرکز راهنمای رادیکار</p><h1 className="mt-4 text-4xl font-black leading-[1.5] sm:text-5xl">راهنماهای رزومه و کاریابی هدفمند</h1><p className="mt-6 text-sm leading-8 text-[#52645e]">{description}</p></header><section className="mt-12 grid gap-4 sm:grid-cols-2"><h2 className="sr-only">موضوع‌های راهنما</h2>{guides.map(([name, summary, href]) => <Link key={href} href={href} className="group rounded-[26px] border border-[#d8e8df] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><h3 className="text-xl font-black">{name}</h3><p className="mt-3 text-sm leading-7 text-[#52645e]">{summary}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#0b704c]">مطالعه راهنما <ArrowLeft size={15} /></span></Link>)}</section></div></>;
}
