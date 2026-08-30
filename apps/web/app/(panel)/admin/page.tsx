"use client";

import {
  Activity,
  BadgeDollarSign,
  CircleDollarSign,
  FileText,
  ReceiptText,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/app/_components/auth";
import { useAdminBillingStats, useAdminStats } from "@/lib/admin-stats";

const collectionLabels: Record<string, string> = {
  profiles: "فضاهای کاری",
  knowledge: "پایگاه‌های دانش",
  resumes: "رزومه‌ها",
  jobs: "فرصت‌های شغلی",
  applications: "اپلای‌ها",
  interviews: "مصاحبه‌ها",
  dashboard: "خلاصه‌های داشبورد",
};

function formatNumber(value: number) {
  return Number(value).toLocaleString("fa-IR");
}

export default function AdminPage() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === "superadmin";
  const stats = useAdminStats(isSuperadmin);
  const billingStats = useAdminBillingStats(isSuperadmin);

  if (!user || user.role === "user") return null;
  if (user.role === "admin") {
    return (
      <section className="rounded-[18px] border border-[#d8e7df] bg-white p-7">
        <h1 className="m-0 text-[23px] font-black text-[#19312f]">مدیریت عملیات سامانه</h1>
        <p className="mb-0 mt-3 text-[11px] leading-8 text-[#748582]">
          مدیریت عضویت و اعتبار کاربران، سفارش‌ها و تراکنش‌ها از منوی کناری در دسترس است.
          گزارش‌های کلان سامانه و مدیریت نقش‌ها فقط برای سوپرادمین نمایش داده می‌شود.
        </p>
      </section>
    );
  }

  const cards = [
    { label: "کل کاربران ثبت‌نام‌شده", value: stats.data?.users.total ?? 0, icon: Users },
    { label: "حساب‌های فعال", value: stats.data?.users.active ?? 0, icon: UserCheck },
    { label: "ثبت‌نام امروز", value: stats.data?.users.registeredToday ?? 0, icon: UserPlus },
    { label: "کاربران واردشده امروز", value: stats.data?.users.activeToday ?? 0, icon: Activity },
    { label: "کل رزومه‌های ساخته‌شده", value: stats.data?.records.resumes ?? 0, icon: FileText },
    { label: "رزومه‌های ساخته‌شده امروز", value: stats.data?.records.resumesToday ?? 0, icon: FileText },
    { label: "خریدهای موفق امروز", value: billingStats.data?.paidOrdersToday ?? 0, icon: ReceiptText },
    { label: "سفارش‌های ایجادشده امروز", value: billingStats.data?.ordersToday ?? 0, icon: ReceiptText },
    {
      label: "فروش امروز (تومان)",
      value: Math.round((billingStats.data?.revenueTodayRials ?? 0) / 10),
      icon: BadgeDollarSign,
    },
    { label: "کل خریدهای موفق", value: billingStats.data?.paidOrders ?? 0, icon: CircleDollarSign },
    {
      label: "کل فروش تأییدشده (تومان)",
      value: Math.round((billingStats.data?.revenueRials ?? 0) / 10),
      icon: BadgeDollarSign,
    },
    { label: "سفارش‌های در انتظار", value: billingStats.data?.pendingOrders ?? 0, icon: ReceiptText },
  ];

  return (
    <div className="grid gap-6">
      <header>
        <p className="m-0 text-[11px] font-bold text-[#0f7b62]">نمای لحظه‌ای کسب‌وکار</p>
        <h1 className="mb-0 mt-2 text-[25px] font-black text-[#19312f]">داشبورد مدیریتی سامانه</h1>
        <p className="mb-0 mt-2 text-[11px] leading-7 text-[#7c8b88]">
          وضعیت کاربران، تولید رزومه و فروش سامانه بر اساس روز جاری به وقت تهران نمایش داده می‌شود.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 max-[1180px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            className="flex min-w-0 items-center gap-3 rounded-[15px] border border-[#e3e9e3] bg-white p-3.5 shadow-[0_8px_24px_rgba(30,61,53,.05)]"
            key={label}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#eaf5f0] text-[#0f7b62]">
              <Icon size={18} />
            </span>
            <small className="min-w-0 flex-1 truncate whitespace-nowrap text-[9px] font-semibold text-[#81908d]" title={label}>{label}</small>
            <strong className="shrink-0 text-[18px] font-black text-[#19312f]">{formatNumber(value)}</strong>
          </article>
        ))}
      </section>

      <section className="rounded-[18px] border border-[#e3e9e3] bg-white p-5">
        <h2 className="m-0 text-[14px] font-extrabold">ترکیب داده‌های ثبت‌شده در سامانه</h2>
        <p className="mb-4 mt-1 text-[9px] text-[#8a9794]">
          مجموع {formatNumber(stats.data?.records.total ?? 0)} رکورد متعلق به کاربران
        </p>
        <div className="grid grid-cols-4 gap-2 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
          {(stats.data?.records.byCollection ?? []).map((item) => (
            <div className="rounded-[11px] bg-[#f2f6f3] px-4 py-3 text-[10px] text-[#526762]" key={item.collection}>
              <span>{collectionLabels[item.collection] ?? item.collection}</span>
              <strong className="mt-1 block text-[16px] text-[#19312f]">{formatNumber(item.total)}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
