"use client";

import {
  BadgeCheck,
  Coins,
  Copy,
  Gift,
  Link2,
  Medal,
  MousePointerClick,
  Send,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useToast } from "@/app/_components/toast";
import { PersianDateTime } from "@/lib/date-time-display";
import { useReferralDashboard, useReferralLeaderboard } from "@/lib/referrals";

const inviteSteps = [
  { title: "لینکت را بفرست", description: "لینک اختصاصی را برای دوستانت بفرست.", icon: Send },
  { title: "ثبت‌نام تأیید شود", description: "بعد از تأیید حساب، هدیه اولیه ثبت می‌شود.", icon: BadgeCheck },
  { title: "باهم رادیکوین بگیرید", description: "فعالیت واقعی دوستت، پاداش بیشتری آزاد می‌کند.", icon: Coins },
];

export default function ReferralsPage() {
  const notify = useToast();
  const dashboard = useReferralDashboard();
  const leaderboard = useReferralLeaderboard();
  const inviteLink = useMemo(
    () =>
      dashboard.data && typeof window !== "undefined"
        ? `${window.location.origin}/join?ref=${dashboard.data.referral.code}`
        : "",
    [dashboard.data],
  );
  const inviteMessage = useMemo(
    () =>
      inviteLink
        ? `من از رادیکار برای ساختن یک مسیر شغلی حرفه‌ای‌تر استفاده می‌کنم؛ از پیدا کردن فرصت‌های مناسب و ساخت رزومه هدفمند تا پیگیری اپلای و آمادگی مصاحبه.\n\nتو هم با لینک دعوت من عضو شو و رادیکوین هدیه بگیر:\n${inviteLink}`
        : "",
    [inviteLink],
  );

  const copyInviteMessage = async () => {
    if (!inviteMessage) return;
    try {
      await navigator.clipboard.writeText(inviteMessage);
      notify("متن دعوت و لینک اختصاصی کپی شد.");
    } catch {
      notify("کپی متن دعوت ناموفق بود. دوباره تلاش کن.", "error");
    }
  };

  if (dashboard.isLoading)
    return (
      <div className="grid min-h-64 place-items-center text-[11px] text-[#7c8b88]">در حال آماده‌سازی لینک دعوت...</div>
    );
  if (dashboard.isError || !dashboard.data)
    return (
      <div className="grid min-h-64 place-items-center text-[11px] text-[#a34e45]">دریافت اطلاعات دعوت ناموفق بود.</div>
    );
  const referral = dashboard.data.referral;
  const stats = [
    { label: "رادیکوین دعوت", value: referral.confirmedPoints, icon: Medal, color: "bg-[#fff5d9] text-[#b58112]" },
    { label: "بازدید لینک", value: referral.visits, icon: MousePointerClick, color: "bg-[#eaf5f0] text-[#0f7b62]" },
    { label: "دعوت موفق", value: referral.confirmedReferrals, icon: UsersRound, color: "bg-[#eef3ff] text-[#4f6fa8]" },
    { label: "در انتظار", value: referral.pendingReferrals, icon: Gift, color: "bg-[#fff0ec] text-[#b96d57]" },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-7 overflow-x-clip pb-8">
      <section className="relative isolate px-2 pb-7 pt-8 md:px-5 lg:mb-6 lg:min-h-[535px] lg:px-7 lg:py-10">
        <div className="relative grid items-center gap-5 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
          <div className="relative z-20 max-w-xl lg:py-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-bold text-[#0f7b62] shadow-[0_6px_20px_rgba(15,123,98,.08)]">
              <Sparkles size={14} /> دعوت کن، باهم رشد کنید
            </span>
            <h1 className="mb-0 mt-5 text-[29px] font-black leading-[1.55] text-[#19312f] md:text-[36px]">
              دوستت را به رادیکار دعوت کن، <span className="text-[#0f7b62]">هر دو رادیکوین بگیرید</span>
            </h1>
            <p className="mb-0 mt-3 max-w-lg text-[11px] leading-8 text-[#61746f]">
              از ثبت‌نام تأییدشده تا اولین فعالیت واقعی و ارتقای حساب، هر قدم دوستت می‌تواند برای هر دوی شما پاداش
              تازه‌ای بسازد.
            </p>
            <div
              className="mt-6 w-full max-w-lg rounded-[18px] bg-white/95 p-3 shadow-[0_16px_45px_rgba(31,76,64,.13)] backdrop-blur"
              dir="ltr"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#eaf5f0] text-[#0f7b62]">
                  <Link2 size={18} />
                </span>
                <code className="min-w-0 flex-1 truncate text-left text-[10px] text-[#405753]" title={inviteLink}>
                  {inviteLink}
                </code>
                <button
                  aria-label="کپی متن دعوت"
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-[11px] bg-[#0f7b62] text-white transition hover:bg-[#0b6953]"
                  onClick={() => void copyInviteMessage()}
                  type="button"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex min-h-[270px] items-end justify-center lg:min-h-[390px]">
            <div className="pointer-events-none absolute bottom-7 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-[#174b3e]/15 blur-2xl" />
            <Image
              alt="ماسکات رادیکار همراه با رادیکوین‌های دعوت"
              className="relative z-10 -mb-10 w-[310px] max-w-none drop-shadow-[0_25px_28px_rgba(20,65,54,.15)] sm:w-[370px] lg:-mb-16 lg:w-[490px]"
              height={1254}
              priority
              src="/illustrations/radikar-mascot-radicoin-v2.png"
              width={1254}
            />
          </div>
        </div>

        <div className="relative z-30 mt-4 grid gap-3 sm:grid-cols-3 lg:absolute lg:-bottom-6 lg:left-7 lg:right-7 lg:mt-0">
          {inviteSteps.map(({ title, description, icon: Icon }, index) => (
            <article
              className="rounded-[18px] border border-white/75 bg-white/82 p-4 shadow-[0_12px_30px_rgba(31,76,64,.09)] backdrop-blur-md"
              key={title}
            >
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#f5fbf8] text-[#0f7b62]">
                  <Icon size={18} />
                </span>
                <strong className="text-[12px] text-[#314b46]">
                  {index + 1}. {title}
                </strong>
              </div>
              <p className="mb-0 mt-3 text-[10px] leading-6 text-[#71847f]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <article
            className="group flex items-center gap-4 rounded-[18px] bg-white p-4 shadow-[0_10px_32px_rgba(31,76,64,.055)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_36px_rgba(31,76,64,.09)]"
            key={label}
          >
            <span className={`grid size-11 shrink-0 place-items-center rounded-[14px] ${color}`}>
              <Icon size={19} />
            </span>
            <div>
              <strong className="block text-[20px] font-black text-[#19312f]">{value.toLocaleString("fa-IR")}</strong>
              <span className="mt-1 block text-[9px] text-[#7c8b88]">{label}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <article className="overflow-hidden rounded-[20px] bg-white shadow-[0_12px_38px_rgba(31,76,64,.055)]">
          <h2 className="m-0 flex items-center gap-2 border-b border-[#edf0ec] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">
            <Coins className="text-[#d49d20]" size={18} /> گردش رادیکوین دعوت
          </h2>
          <div className="divide-y divide-[#edf0ec]">
            {referral.events.length ? (
              referral.events.map((event) => (
                <div className="flex items-center justify-between gap-3 px-5 py-4" key={event.id}>
                  <div>
                    <strong className="block text-[10px] text-[#405753]">{event.description}</strong>
                    <span className="mt-1 block text-[9px] text-[#82908d]">
                      <PersianDateTime value={event.createdAt} />
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-[9px] font-bold ${event.points >= 0 ? "bg-[#eaf5f0] text-[#0f705a]" : "bg-[#fff1ef] text-[#b14848]"}`}
                  >
                    {event.points > 0 ? "+" : ""}
                    {event.points.toLocaleString("fa-IR")} رادیکوین
                  </span>
                </div>
              ))
            ) : (
              <div className="grid min-h-40 place-items-center px-6 text-center">
                <div>
                  <Coins className="mx-auto text-[#d8dfdc]" size={28} />
                  <p className="mb-0 mt-3 text-[10px] text-[#82908d]">
                    اولین دعوتت را بفرست؛ رادیکوین‌های این بخش خیلی زود جان می‌گیرند.
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
        <article className="overflow-hidden rounded-[20px] bg-[linear-gradient(155deg,#153f36,#0f705a)] text-white shadow-[0_16px_42px_rgba(15,112,90,.14)]">
          <h2 className="m-0 flex items-center gap-2 border-b border-white/10 px-5 py-4 text-[13px] font-extrabold">
            <Trophy className="text-[#ffd66b]" size={18} /> برترین دعوت‌کنندگان
          </h2>
          <div className="divide-y divide-white/10">
            {(leaderboard.data?.items ?? []).map((item, index) => (
              <div className="flex items-center justify-between gap-3 px-5 py-3.5" key={item.userId}>
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-7 place-items-center rounded-full text-[9px] font-black ${index < 3 ? "bg-[#ffd66b] text-[#634b0c]" : "bg-white/10 text-white/80"}`}
                  >
                    {(index + 1).toLocaleString("fa-IR")}
                  </span>
                  <span className="text-[10px] text-white/85">{item.displayName}</span>
                </div>
                <span className="text-[9px] text-[#9ee0c7]">{item.referrals.toLocaleString("fa-IR")} دعوت</span>
              </div>
            ))}
            {!leaderboard.data?.items.length ? (
              <div className="grid min-h-40 place-items-center px-6 text-center">
                <p className="m-0 text-[10px] leading-6 text-white/60">رتبه‌بندی پس از اولین دعوت موفق شکل می‌گیرد.</p>
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}
