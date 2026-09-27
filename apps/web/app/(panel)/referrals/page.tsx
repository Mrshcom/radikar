"use client";

import { Copy, Gift, Link2, Medal, UsersRound } from "lucide-react";
import { useMemo } from "react";
import { useToast } from "@/app/_components/toast";
import { PersianDateTime } from "@/lib/date-time-display";
import { useReferralDashboard, useReferralLeaderboard } from "@/lib/referrals";

export default function ReferralsPage() {
  const notify = useToast();
  const dashboard = useReferralDashboard();
  const leaderboard = useReferralLeaderboard();
  const inviteLink = useMemo(() => dashboard.data && typeof window !== "undefined" ? `${window.location.origin}/join?ref=${dashboard.data.referral.code}` : "", [dashboard.data]);
  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    notify("لینک دعوت کپی شد.");
  };

  if (dashboard.isLoading) return <div className="grid min-h-64 place-items-center text-[11px] text-[#7c8b88]">در حال آماده‌سازی لینک دعوت...</div>;
  if (dashboard.isError || !dashboard.data) return <div className="grid min-h-64 place-items-center text-[11px] text-[#a34e45]">دریافت اطلاعات دعوت ناموفق بود.</div>;
  const referral = dashboard.data.referral;

  return <div className="mx-auto grid max-w-5xl gap-6">
    <header>
      <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><Gift size={18} /> دعوت دوستان</span>
      <h1 className="mb-0 mt-3 text-[26px] font-black text-[#19312f]">با دعوت دوستان، امتیاز بگیر</h1>
      <p className="mb-0 mt-2 text-[11px] leading-7 text-[#71817e]">هر ثبت‌نام تأییدشده از لینک تو، امتیاز پیش‌لانچ به حساب هر دو نفر اضافه می‌کند.</p>
    </header>

    <section className="grid gap-4 rounded-[20px] bg-[#0f7b62] p-6 text-white shadow-[0_16px_38px_rgba(15,123,98,.16)]">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><strong className="text-[16px]">لینک اختصاصی دعوت تو</strong><p className="mb-0 mt-2 text-[10px] text-white/75">دوستانت با این لینک عضو شوند تا امتیازشان پس از احراز هویت ثبت شود.</p></div><span className="grid size-11 place-items-center rounded-[14px] bg-white/15"><Link2 size={21} /></span></div>
      <div className="flex flex-wrap gap-2 rounded-[13px] bg-white p-2 text-[#29443f]" dir="ltr"><code className="min-w-0 flex-1 truncate px-3 py-2 text-left text-[11px]" title={inviteLink}>{inviteLink}</code><button className="inline-flex min-h-9 items-center gap-2 rounded-[9px] bg-[#0f7b62] px-4 text-[10px] font-bold text-white" onClick={() => void copyLink()} type="button"><Copy size={15} /> کپی لینک</button></div>
    </section>

    <section className="grid gap-3 sm:grid-cols-4">
      {[{ label: "امتیاز من", value: referral.confirmedPoints, icon: Medal }, { label: "بازدید لینک", value: referral.visits, icon: Link2 }, { label: "دعوت موفق", value: referral.confirmedReferrals, icon: UsersRound }, { label: "در انتظار", value: referral.pendingReferrals, icon: Gift }].map(({ label, value, icon: Icon }) => <article className="rounded-[16px] border border-[#e3e9e3] bg-white p-4" key={label}><Icon className="text-[#0f7b62]" size={18} /><strong className="mt-4 block text-[20px] text-[#19312f]">{value.toLocaleString("fa-IR")}</strong><span className="mt-1 block text-[9px] text-[#7c8b88]">{label}</span></article>)}
    </section>

    <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <article className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white"><h2 className="m-0 border-b border-[#edf0ec] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">تاریخچه امتیازها</h2><div className="divide-y divide-[#edf0ec]">{referral.events.length ? referral.events.map((event) => <div className="flex items-center justify-between gap-3 px-5 py-4" key={event.id}><div><strong className="block text-[10px] text-[#405753]">{event.description}</strong><span className="mt-1 block text-[9px] text-[#82908d]"><PersianDateTime value={event.createdAt} /></span></div><span className={`rounded-md px-2 py-1 text-[10px] ${event.points >= 0 ? "bg-[#eaf5f0] text-[#0f705a]" : "bg-[#fff1ef] text-[#b14848]"}`}>{event.points > 0 ? "+" : ""}{event.points.toLocaleString("fa-IR")} امتیاز</span></div>) : <p className="m-0 p-8 text-center text-[10px] text-[#82908d]">هنوز امتیازی ثبت نشده است.</p>}</div></article>
      <article className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white"><h2 className="m-0 border-b border-[#edf0ec] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">برترین دعوت‌کنندگان</h2><div className="divide-y divide-[#edf0ec]">{(leaderboard.data?.items ?? []).map((item, index) => <div className="flex items-center justify-between px-5 py-3" key={item.userId}><span className="text-[10px] text-[#405753]">{index + 1}. {item.displayName}</span><span className="text-[9px] text-[#0f7b62]">{item.referrals.toLocaleString("fa-IR")} دعوت</span></div>)}{!leaderboard.data?.items.length ? <p className="m-0 p-8 text-center text-[10px] text-[#82908d]">رتبه‌بندی پس از اولین دعوت موفق شکل می‌گیرد.</p> : null}</div></article>
    </section>
  </div>;
}
