"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Check, ChevronLeft, Circle, Gift, LoaderCircle, Sparkles, X } from "lucide-react";
import { useOnboarding } from "./onboarding-provider";
import type { OnboardingStepId } from "@/app/_components/auth";
import { useClaimOnboardingReward, useOnboardingReward } from "@/lib/radicoins";
import { useToast } from "@/app/_components/toast";
import { Skeleton } from "../skeletons/primitives";

const items: Array<{ id: OnboardingStepId; title: string; description: string; href: string; action: string }> = [
  {
    id: "profile",
    title: "پروفایل مسیر شغلی",
    description: "توانمندی‌ها و هدف‌های حرفه‌ای‌ات را ثبت کن.",
    href: "/knowledge-base",
    action: "تکمیل پروفایل",
  },
  {
    id: "match",
    title: "اولین تحلیل تطابق",
    description: "رزومه‌ات را با یک آگهی واقعی مقایسه کن.",
    href: "/match",
    action: "شروع تحلیل",
  },
  {
    id: "resume",
    title: "رزومه هدفمند",
    description: "یک رزومه قابل ارسال برای فرصت موردنظرت بساز.",
    href: "/resumes",
    action: "ساخت رزومه",
  },
  {
    id: "application",
    title: "پیگیری اپلای",
    description: "اولین اقدام شغلی‌ات را در مسیر پیگیری ثبت کن.",
    href: "/applications",
    action: "ثبت اپلای",
  },
  {
    id: "referral",
    title: "دعوت از دوستان",
    description: "لینک دعوتت را بفرست تا ثبت‌نام یک دوست تأیید شود.",
    href: "/referrals",
    action: "دعوت از دوست",
  },
  {
    id: "interview",
    title: "تست آمادگی مصاحبه",
    description: "مصاحبه را کامل کن و گزارش شخصی‌سازی‌شده بگیر.",
    href: "/interview",
    action: "شروع تست",
  },
];

export function OnboardingChecklistModal({ onClose }: { onClose: () => void }) {
  const { markCompleted, startTour } = useOnboarding();
  const signals = useOnboardingReward();
  const claim = useClaimOnboardingReward();
  const notify = useToast();
  const completed = useMemo(() => signals.data?.completedSteps ?? [], [signals.data?.completedSteps]);
  const allStepsCompleted = completed.length === items.length;
  const claimed = Boolean(signals.data?.claimed);
  const claimReward = async () => {
    try {
      const result = await claim.mutateAsync();
      notify(result.credited ? "۱۰۰ رادیکوین به کیف پولت اضافه شد." : "این پاداش را قبلاً دریافت کرده‌ای.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "دریافت پاداش انجام نشد؛ دوباره تلاش کن.", "error");
    }
  };
  useEffect(() => {
    if (signals.data?.completedSteps) markCompleted(completed);
  }, [completed, markCompleted, signals.data]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[#082e26]/60 p-4 backdrop-blur-[7px] sm:p-7"
      dir="rtl"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        aria-labelledby="onboarding-title"
        aria-modal="true"
        className="relative max-h-[calc(100dvh-32px)] w-[min(1120px,100%)] overflow-y-auto rounded-[28px] border border-white/70 bg-[#f7fbf8] shadow-[0_32px_100px_rgba(5,37,30,.4)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="بستن راهنما"
          className="absolute left-5 top-5 z-10 grid size-9 place-items-center rounded-full border border-[#d8e7df] bg-white/80 text-[#647873] shadow-sm hover:bg-white"
          onClick={onClose}
          type="button"
        >
          <X size={18} />
        </button>
        <div className="relative min-h-[610px] p-7 max-[780px]:min-h-0 max-[780px]:p-5">
          <aside
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 top-0 hidden w-[36%] overflow-hidden min-[781px]:block"
          >
            <span className="absolute left-1/2 top-[13%] size-[310px] -translate-x-1/2 rounded-full bg-[#d8f0e6]" />
            <span className="absolute left-[15%] top-[12%] flex items-center gap-1.5 rounded-full bg-[#e5f5ed] px-3 py-1.5 text-[9px] font-bold text-[#0f7b62]">
              <Sparkles size={14} /> همراه مسیر شغلی
            </span>
            <Image
              alt=""
              className="absolute bottom-[-22px] left-1/2 h-[515px] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-[0_22px_22px_rgba(19,72,59,.18)]"
              height={515}
              priority
              src="/illustrations/radikar-mascot-guide-v1.png"
              width={515}
            />
          </aside>
          <div className="relative z-[1] ml-[36%] flex min-h-[554px] min-w-0 flex-col py-2 pl-2 max-[780px]:ml-0 max-[780px]:min-h-0 max-[780px]:p-0">
            <header className="flex items-start gap-3 border-b border-[#dfeae4] pb-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#dff3e9] text-[#0f7b62]">
                <Sparkles size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[10px] font-bold text-[#0f7b62]">شروع سریع رادیکار</p>
                <h1 className="m-0 mt-1 text-[22px] leading-[1.6] text-[#19312f]" id="onboarding-title">
                  مسیر حرفه‌ای‌ات را قدم‌به‌قدم بساز
                </h1>
                {signals.data ? (
                  <p className="mb-0 mt-1 text-[10px] leading-6 text-[#71837e]">{`${completed.length.toLocaleString("fa-IR")} از ${items.length.toLocaleString("fa-IR")} قدم تکمیل شده است.`}</p>
                ) : (
                  <Skeleton className="mt-2 h-3 w-40" />
                )}
              </div>
            </header>
            {signals.isPending && !signals.data && (
              <div role="status" aria-label="در حال دریافت اطلاعات راهنما" aria-busy="true">
                <span className="sr-only">در حال بررسی مرحله‌ها و وضعیت پاداش…</span>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {items.map((item) => (
                    <div key={item.id} className="min-h-[100px] rounded-[17px] border border-[#dce8e1] bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="size-7 rounded-full" />
                      </div>
                      <Skeleton className="mt-3 h-3 w-full" />
                      <Skeleton className="mt-3 h-3 w-20" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-[15px] border border-[#dce8e1] px-4 py-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-9 w-32 rounded-full" />
                </div>
                <div className="mt-6 flex gap-3 border-t border-[#dfeae4] pt-5">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-16" />
                </div>
              </div>
            )}
            {signals.isError && (
              <div
                role="alert"
                className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#fff5ed] p-3 text-[10px] text-[#9a572d]"
              >
                <span>بررسی مرحله‌ها انجام نشد.</span>
                <button
                  type="button"
                  className="border-0 bg-transparent font-bold"
                  onClick={() => void signals.refetch()}
                >
                  تلاش دوباره
                </button>
              </div>
            )}
            {signals.data && (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {items.map((item) => {
                    const done = completed.includes(item.id);
                    return (
                      <article
                        className={`relative flex min-h-[100px] flex-col rounded-[17px] border p-4 ${done ? "border-[#bee3d2] bg-[#f1faf5]" : "border-[#dce8e1] bg-white hover:border-[#aad7c4] hover:shadow-[0_12px_24px_rgba(22,75,60,.07)]"}`}
                        key={item.id}
                      >
                        <span
                          className={
                            done
                              ? "absolute left-4 top-4 grid size-7 place-items-center rounded-full bg-[#0f7b62] text-white"
                              : "absolute left-4 top-4 grid size-7 place-items-center rounded-full border border-[#c8dcd2] text-[#9badA5]"
                          }
                        >
                          {done ? <Check size={15} /> : <Circle size={13} />}
                        </span>
                        <h3 className="m-0 pl-8 text-[12px] text-[#29433d]">{item.title}</h3>
                        <p className="mb-0 mt-2 text-[9px] leading-5 text-[#758681]">{item.description}</p>
                        {done ? (
                          <span className="mt-auto pt-2 text-[9px] font-bold text-[#168065]">تکمیل شده</span>
                        ) : (
                          <Link
                            className="mt-auto inline-flex w-fit items-center gap-1 pt-2 text-[9px] font-bold text-[#0f7b62] no-underline hover:text-[#084f3d]"
                            href={item.href}
                            onClick={onClose}
                          >
                            {item.action} <ChevronLeft size={14} />
                          </Link>
                        )}
                      </article>
                    );
                  })}
                </div>
                <div
                  className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[15px] border px-4 py-3 ${allStepsCompleted ? "border-[#c8e6d7] bg-[#eaf8f1]" : "border-[#f0dfad] bg-[#fff9ea]"}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-[11px] ${allStepsCompleted ? "bg-[#0f7b62] text-white" : "bg-[#ffebad] text-[#a46f10]"}`}
                    >
                      {allStepsCompleted ? <Check size={18} /> : <Gift size={18} />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                      <strong className="shrink-0 whitespace-nowrap text-[12px] text-[#29433d]">
                        پاداش تکمیل مسیر
                      </strong>
                      <span className="text-[10px] leading-5 text-[#74857f]">
                        {claimed
                          ? "۱۰۰ رادیکوین به کیف پولت اضافه شده است."
                          : allStepsCompleted
                            ? "همهٔ مرحله‌ها کامل شده‌اند؛ پاداشت آماده است."
                            : "با تکمیل همهٔ مرحله‌ها، پاداش آمادهٔ دریافت می‌شود."}
                      </span>
                    </div>
                  </div>
                  {claimed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dff3e9] px-3 py-2 text-[11px] font-bold text-[#0f7b62]">
                      <Check size={16} />
                      پاداش دریافت شد
                    </span>
                  ) : allStepsCompleted ? (
                    <button
                      type="button"
                      disabled={claim.isPending || !signals.data?.eligible}
                      onClick={() => void claimReward()}
                      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border-0 bg-[#ffedb5] px-4 py-2 text-[12px] font-extrabold text-[#8d6814] transition-colors hover:bg-[#ffe49a] disabled:cursor-wait disabled:opacity-60"
                    >
                      {claim.isPending ? (
                        <>
                          <LoaderCircle size={17} className="animate-spin" />
                          در حال دریافت…
                        </>
                      ) : (
                        <>
                          دریافت ۱۰۰ رادیکوین
                          <Image
                            alt=""
                            aria-hidden="true"
                            className="size-6 object-contain"
                            height={24}
                            src="/illustrations/radicoin-coin-m-v3.png"
                            width={24}
                          />
                        </>
                      )}
                    </button>
                  ) : (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ffedb5] px-3 py-1.5 text-[12px] font-extrabold text-[#8d6814]"
                      dir="ltr"
                    >
                      +۱۰۰
                      <Image
                        alt=""
                        aria-hidden="true"
                        className="size-6 shrink-0 object-contain"
                        height={24}
                        src="/illustrations/radicoin-coin-m-v3.png"
                        width={24}
                      />
                    </span>
                  )}
                </div>
                <footer className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#dfeae4] pt-5 max-[780px]:mt-5">
                  <button
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] bg-[#0f7b62] px-4 text-[12px] font-bold text-white shadow-[0_8px_18px_rgba(15,123,98,.2)] hover:bg-[#0b684f]"
                    onClick={startTour}
                    type="button"
                  >
                    تور کوتاه پنل <ChevronLeft size={15} />
                  </button>
                  <button
                    className="min-h-10 border-0 bg-transparent px-2 text-[12px] text-[#72827e] hover:text-[#19312f]"
                    onClick={onClose}
                    type="button"
                  >
                    {allStepsCompleted || claimed ? "بستن" : "هنوز زوده!"}
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
