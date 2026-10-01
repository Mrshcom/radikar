"use client";

import Link from "next/link";
import Image from "next/image";
import { Gift, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { recordReferralVisit } from "@/lib/referrals";

export default function JoinPage() {
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase() || "";
    setReferralCode(code);
  }, []);

  useEffect(() => {
    if (!/^R[A-Z0-9]{8}$/.test(referralCode)) return;
    window.localStorage.setItem("radikar_referral_code", referralCode);
    void recordReferralVisit(referralCode).catch(() => undefined);
  }, [referralCode]);

  const loginHref = referralCode ? `/login?ref=${encodeURIComponent(referralCode)}` : "/login";
  return (
    <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[#f2f6f3] px-4 py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_16%,rgba(137,211,182,.28)_0%,transparent_27%),radial-gradient(circle_at_14%_82%,rgba(246,210,106,.16)_0%,transparent_23%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-55 [background-image:radial-gradient(rgba(15,123,98,.18)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_5%,transparent_72%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <Image
          alt=""
          className="absolute -left-5 top-[14%] size-20 object-contain opacity-35 drop-shadow-[0_12px_20px_rgba(183,136,20,.16)] [--tilt:-12deg] motion-safe:animate-[float_9s_ease-in-out_infinite] motion-safe:[animation-delay:-2s] motion-reduce:animate-none sm:left-[4%] sm:size-28"
          height={1254}
          src="/illustrations/radicoin-coin-m-v3.png"
          width={1254}
        />
        <Image
          alt=""
          className="absolute right-[5%] top-[9%] hidden size-16 object-contain opacity-25 drop-shadow-[0_10px_18px_rgba(183,136,20,.14)] [--tilt:18deg] motion-safe:animate-[float_11s_ease-in-out_infinite] motion-safe:[animation-delay:-6s] motion-reduce:animate-none sm:block"
          height={1254}
          src="/illustrations/radicoin-coin-m-v3.png"
          width={1254}
        />
        <Image
          alt=""
          className="absolute -right-7 bottom-[11%] size-24 object-contain opacity-30 drop-shadow-[0_14px_24px_rgba(183,136,20,.16)] [--tilt:12deg] motion-safe:animate-[float_10s_ease-in-out_infinite] motion-safe:[animation-delay:-4s] motion-reduce:animate-none sm:right-[3%] sm:size-32"
          height={1254}
          src="/illustrations/radicoin-coin-m-v3.png"
          width={1254}
        />
        <Image
          alt=""
          className="absolute bottom-[7%] left-[13%] hidden size-14 object-contain opacity-25 drop-shadow-[0_10px_18px_rgba(183,136,20,.14)] [--tilt:-20deg] motion-safe:animate-[float_8s_ease-in-out_infinite] motion-safe:[animation-delay:-5s] motion-reduce:animate-none md:block"
          height={1254}
          src="/illustrations/radicoin-coin-m-v3.png"
          width={1254}
        />
      </div>

      <section className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[30px] border border-[#dfe8e2] bg-white text-right shadow-[0_24px_70px_rgba(20,61,50,.12)] lg:grid-cols-[1.1fr_.9fr]">
        <div className="p-7 sm:p-10">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[#eaf5f0] text-[#0f7b62]">
              <Gift size={24} />
            </span>
            <h1 className="m-0 text-[27px] font-black text-[#19312f]">به رادیکار دعوت شدی</h1>
          </div>
          <p className="mb-0 mt-5 text-[12px] leading-8 text-[#71817e]">
            مسیر شغلی‌ات را هدفمند بساز؛ رزومه، فرصت‌های شغلی و تحلیل‌های هوشمند را یک‌جا داشته
            باش.
          </p>
          <div className="mt-6 grid gap-3 rounded-[16px] bg-[#f7faf8] p-4 text-[12px] text-[#526561]">
            <span className="flex items-center gap-2">
              <Sparkles className="text-[#0f7b62]" size={16} /> عضویت زودهنگام و مزایای ویژه‌ی
              زمان لانچ
            </span>
            <span className="flex items-center gap-2">
              <UsersRound className="text-[#0f7b62]" size={16} /> امتیاز دعوت پس از احراز هویت
              ثبت می‌شود
            </span>
          </div>
          <Link
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#0f7b62] px-5 text-[11px] font-bold text-white no-underline shadow-[0_10px_20px_rgba(15,123,98,.2)]"
            href={loginHref}
          >
            شروع عضویت
          </Link>
        </div>
        <div className="relative grid min-h-[280px] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#e1f5eb_0%,#f7fbf8_62%,#ecf5f0_100%)] p-5">
          <span className="absolute left-8 top-9 size-20 rounded-full bg-[#c8eddd]/60 blur-2xl" />
          <span className="absolute bottom-6 right-6 size-24 rounded-full bg-[#f7e4a0]/40 blur-3xl" />
          <Image
            alt="تصویرسازی دعوت دوستان و دریافت امتیاز"
            className="relative h-auto w-full max-w-[390px] object-contain drop-shadow-[0_18px_20px_rgba(15,84,64,.16)]"
            height={1295}
            priority
            src="/illustrations/referral-invite-v1.png"
            width={1214}
          />
        </div>
      </section>
    </main>
  );
}
