"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, Circle, Sparkles, X } from "lucide-react";
import { applicationStore, knowledgeProfileStore, matchAnalysisStore, resumeStore } from "@/lib/data/stores";
import { hasResumeContent } from "../../resumes/resume-data";
import { useOnboarding } from "./onboarding-provider";
import type { OnboardingStepId } from "@/app/_components/auth";

const items: Array<{ id: OnboardingStepId; title: string; description: string; href: string; action: string }> = [
  { id: "profile", title: "پروفایل مسیر شغلی", description: "توانمندی‌ها و هدف‌های حرفه‌ای‌ات را ثبت کن.", href: "/knowledge-base", action: "تکمیل پروفایل" },
  { id: "match", title: "اولین تحلیل تطابق", description: "رزومه‌ات را با یک آگهی واقعی مقایسه کن.", href: "/match", action: "شروع تحلیل" },
  { id: "resume", title: "رزومه هدفمند", description: "یک رزومه قابل ارسال برای فرصت موردنظرت بساز.", href: "/resumes", action: "ساخت رزومه" },
  { id: "application", title: "پیگیری اپلای", description: "اولین اقدام شغلی‌ات را در مسیر پیگیری ثبت کن.", href: "/applications", action: "ثبت اپلای" },
];

async function loadSignals() {
  const [profiles, resumes, analyses, applications] = await Promise.all([knowledgeProfileStore.list(), resumeStore.list(), matchAnalysisStore.list(), applicationStore.list()]);
  return {
    profile: profiles.some((profile) => hasResumeContent(profile.resumeData) || Boolean(profile.careerGoals.trim() || profile.skills.trim())),
    match: analyses.length > 0,
    resume: resumes.some((resume) => hasResumeContent(resume.data)),
    application: applications.length > 0,
  } satisfies Record<OnboardingStepId, boolean>;
}

export function OnboardingChecklistModal({ onClose }: { onClose: () => void }) {
  const { markCompleted, startTour } = useOnboarding();
  const signals = useQuery({ queryKey: ["onboarding", "signals"], queryFn: loadSignals, staleTime: 15_000 });
  const completed = items.filter((item) => signals.data?.[item.id]).map((item) => item.id);
  useEffect(() => { if (signals.data) markCompleted(completed); }, [completed, markCompleted, signals.data]);

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#082e26]/60 p-4 backdrop-blur-[7px] sm:p-7" dir="rtl" onMouseDown={onClose} role="presentation">
    <section aria-labelledby="onboarding-title" aria-modal="true" className="relative max-h-[calc(100dvh-32px)] w-[min(1120px,100%)] overflow-y-auto rounded-[28px] border border-white/70 bg-[#f7fbf8] shadow-[0_32px_100px_rgba(5,37,30,.4)]" onMouseDown={(event) => event.stopPropagation()} role="dialog">
      <button aria-label="بستن راهنما" className="absolute left-5 top-5 z-10 grid size-9 place-items-center rounded-full border border-[#d8e7df] bg-white/80 text-[#647873] shadow-sm hover:bg-white" onClick={onClose} type="button"><X size={18} /></button>
      <div className="relative min-h-[610px] p-7 max-[780px]:min-h-0 max-[780px]:p-5">
        <aside aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 top-0 hidden w-[36%] overflow-hidden min-[781px]:block">
          <span className="absolute left-1/2 top-[16%] size-[280px] -translate-x-1/2 rounded-full bg-[#d8f0e6]" />
          <span className="absolute left-[15%] top-[12%] flex items-center gap-1.5 rounded-full bg-[#e5f5ed] px-3 py-1.5 text-[9px] font-bold text-[#0f7b62]"><Sparkles size={14} /> همراه مسیر شغلی</span>
          <Image alt="" className="absolute bottom-[-18px] left-1/2 h-[460px] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-[0_22px_22px_rgba(19,72,59,.18)]" height={460} priority src="/illustrations/radikar-mascot-guide-v1.png" width={460} />
        </aside>
        <div className="relative z-[1] ml-[36%] flex min-w-0 flex-col py-2 pl-2 max-[780px]:ml-0 max-[780px]:p-0">
          <header className="flex items-start gap-3 border-b border-[#dfeae4] pb-5"><span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#dff3e9] text-[#0f7b62]"><Sparkles size={22} /></span><div className="min-w-0 flex-1"><p className="m-0 text-[10px] font-bold text-[#0f7b62]">شروع سریع رادیکار</p><h1 className="m-0 mt-1 text-[22px] leading-[1.6] text-[#19312f]" id="onboarding-title">مسیر حرفه‌ای‌ات را قدم‌به‌قدم بساز</h1><p className="mb-0 mt-1 text-[10px] leading-6 text-[#71837e]">{`${completed.length.toLocaleString("fa-IR")} از ${items.length.toLocaleString("fa-IR")} قدم تکمیل شده است.`}</p></div></header>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => { const done = Boolean(signals.data?.[item.id]); return <article className={`relative flex min-h-[124px] flex-col rounded-[17px] border p-4 ${done ? "border-[#bee3d2] bg-[#f1faf5]" : "border-[#dce8e1] bg-white hover:border-[#aad7c4] hover:shadow-[0_12px_24px_rgba(22,75,60,.07)]"}`} key={item.id}><span className={done ? "absolute left-4 top-4 grid size-7 place-items-center rounded-full bg-[#0f7b62] text-white" : "absolute left-4 top-4 grid size-7 place-items-center rounded-full border border-[#c8dcd2] text-[#9badA5]"}>{done ? <Check size={15} /> : <Circle size={13} />}</span><h3 className="m-0 pl-8 text-[12px] text-[#29433d]">{item.title}</h3><p className="mb-0 mt-2 text-[9px] leading-5 text-[#758681]">{item.description}</p>{done ? <span className="mt-auto pt-2 text-[9px] font-bold text-[#168065]">تکمیل شده</span> : <Link className="mt-auto inline-flex w-fit items-center gap-1 pt-2 text-[9px] font-bold text-[#0f7b62] no-underline hover:text-[#084f3d]" href={item.href} onClick={onClose}>{item.action} <ChevronLeft size={14} /></Link>}</article>; })}</div>
          <footer className="mt-auto flex flex-wrap items-center gap-3 border-t border-[#dfeae4] pt-5 max-[780px]:mt-5"><button className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] bg-[#0f7b62] px-4 text-[10px] font-bold text-white shadow-[0_8px_18px_rgba(15,123,98,.2)] hover:bg-[#0b684f]" onClick={startTour} type="button">تور کوتاه پنل <ChevronLeft size={15} /></button><button className="min-h-10 border-0 bg-transparent px-2 text-[10px] text-[#72827e] hover:text-[#19312f]" onClick={onClose} type="button">فعلاً بعداً</button></footer>
        </div>
      </div>
    </section>
  </div>;
}
