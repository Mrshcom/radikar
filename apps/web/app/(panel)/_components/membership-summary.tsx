"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Coins,
  Download,
  FileSearch,
  FileText,
  MessagesSquare,
  Sparkles,
  Target,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Membership } from "@/lib/billing";
import { PersianDateTime } from "@/lib/date-time-display";
import { InterviewPackAction } from "./interview-pack-action";

type UsageKey = keyof Membership["usage"];

export type EmployerMembershipStats = {
  positions: number;
  candidates: number;
  screenedCandidates: number;
  interviewInvitations: number;
  radicoinBalance: number;
};

const usageItems: Array<{
  key: UsageKey;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { key: "resume", label: "ساخت رزومه", description: "تعداد رزومه‌های قابل ساخت", icon: FileText },
  { key: "pdf", label: "دانلود PDF", description: "خروجی‌های قابل دریافت", icon: Download },
  { key: "ai", label: "اعتبار هوش مصنوعی", description: "عملیات تولید و بهبود محتوا", icon: Sparkles },
  { key: "match", label: "تطبیق شغلی", description: "تحلیل رزومه با فرصت شغلی", icon: Target },
  { key: "interview", label: "مصاحبه آزمایشی", description: "جلسه‌های تمرین مصاحبه", icon: MessagesSquare },
];

function remainingDays(expiresAt: string) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

function UsageCard({
  item,
  membership,
  showPackAction,
}: {
  item: (typeof usageItems)[number];
  membership: Membership;
  showPackAction?: boolean;
}) {
  const value = membership.usage[item.key];
  const Icon = item.icon;
  const exhausted = value.remaining === 0;
  const percent =
    value.total === null ? 0 : value.total === 0 ? 100 : Math.min(100, Math.round((value.used / value.total) * 100));

  return (
    <article className="grid min-w-0 gap-4 rounded-[17px] border border-[#e2e9e4] bg-white p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#edf7f2] text-[#0f7b62]">
          <Icon size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-[12px] text-[#233d38]">{item.label}</strong>
          <small className="mt-1 block text-[9px] leading-5 text-[#899792]">{item.description}</small>
        </span>
        <span
          className={
            exhausted
              ? "rounded-full bg-[#fff0ed] px-2.5 py-1 text-[8px] font-bold text-[#b65343]"
              : "rounded-full bg-[#edf7f2] px-2.5 py-1 text-[8px] font-bold text-[#14705a]"
          }
        >
          {value.remaining === null
            ? "نامحدود"
            : exhausted
              ? "تمام شده"
              : `${value.remaining.toLocaleString("fa-IR")} باقی‌مانده`}
        </span>
      </div>
      {value.total !== null ? (
        <div className="grid gap-2">
          <div className="h-2 overflow-hidden rounded-full bg-[#edf1ed]">
            <div
              className={exhausted ? "h-full rounded-full bg-[#d66f5c]" : "h-full rounded-full bg-[#2e9b7d]"}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#73827e]">
            <span>{value.used.toLocaleString("fa-IR")} مصرف‌شده</span>
            <span>از {value.total.toLocaleString("fa-IR")}</span>
          </div>
        </div>
      ) : (
        <p className="m-0 text-[9px] text-[#73827e]">
          تا امروز {value.used.toLocaleString("fa-IR")} مورد استفاده شده و سقف مصرف نامحدود است.
        </p>
      )}
      {showPackAction &&
        item.key === "interview" &&
        membership.planId === "professional" &&
        membership.status === "active" &&
        exhausted && <InterviewPackAction expiresAt={membership.expiresAt} />}
    </article>
  );
}

const employerStatItems: Array<{
  key: keyof EmployerMembershipStats;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { key: "positions", label: "پوزیشن‌های استخدامی", description: "پوزیشن‌های ساخته‌شده", icon: BriefcaseBusiness },
  { key: "candidates", label: "رزومه‌های واردشده", description: "نامزدهای ثبت‌شده در پوزیشن‌ها", icon: Users },
  { key: "screenedCandidates", label: "نامزدهای پایش‌شده", description: "رزومه‌های آماده ارزیابی", icon: FileSearch },
  {
    key: "interviewInvitations",
    label: "دعوت به مصاحبه",
    description: "دعوت‌های صادرشده برای نامزدها",
    icon: UserCheck,
  },
  { key: "radicoinBalance", label: "موجودی رادیکوین", description: "اعتبار قابل مصرف کارفرما", icon: Coins },
];

const emptyEmployerStats: EmployerMembershipStats = {
  positions: 0,
  candidates: 0,
  screenedCandidates: 0,
  interviewInvitations: 0,
  radicoinBalance: 0,
};

function EmployerPlanSummary({ membership, stats }: { membership: Membership; stats: EmployerMembershipStats }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {employerStatItems.map((item) => {
          const Icon = item.icon;
          return (
            <article
              className="flex min-w-0 items-center gap-3 rounded-[17px] border border-[#e2e9e4] bg-white p-4"
              key={item.key}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#edf7f2] text-[#0f7b62]">
                <Icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[17px] font-black text-[#233d38]">
                  {stats[item.key].toLocaleString("fa-IR")}
                </strong>
                <span className="mt-0.5 block text-[11px] font-bold text-[#405b54]">{item.label}</span>
                <small className="mt-1 block text-[9px] leading-5 text-[#899792]">{item.description}</small>
              </span>
            </article>
          );
        })}
      </div>
      <div className="rounded-[17px] border border-[#e2e9e4] bg-white p-4">
        <strong className="text-[11px] text-[#233d38]">امکانات پلن کارفرما</strong>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {membership.plan.features.map((feature) => (
            <span className="flex items-start gap-2 text-[10px] leading-6 text-[#526b64]" key={feature}>
              <Check className="mt-1 shrink-0 text-[#0f7b62]" size={14} />
              {feature}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

export function MembershipSummary({
  membership,
  accountType = "candidate",
  employerStats,
  showUpgradeAction = false,
}: {
  membership: Membership;
  accountType?: "candidate" | "employer";
  employerStats?: EmployerMembershipStats | null;
  showUpgradeAction?: boolean;
}) {
  return (
    <section className="grid gap-5 rounded-[20px] border border-[#dfe8e2] bg-[#f8fbf9] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold text-[#768782]">پلن فعلی</span>
          <h2 className="mb-0 mt-1 text-[20px] font-black text-[#193a33]">{membership.plan.name}</h2>
          <small className="mt-1 block text-[9px] text-[#778783]">
            وضعیت: {membership.status === "active" ? "فعال" : membership.status === "canceled" ? "لغوشده" : "منقضی"}
          </small>
        </div>
        <div className="flex items-center gap-3 rounded-[14px] border border-[#d8e6de] bg-white px-4 py-3">
          <CalendarDays className="text-[#178066]" size={19} />
          <span>
            <strong className="block text-[12px] text-[#27453e]">
              {remainingDays(membership.expiresAt).toLocaleString("fa-IR")} روز باقی‌مانده
            </strong>
            <small className="mt-1 block text-[8px] text-[#82908c]">
              اعتبار تا <PersianDateTime value={membership.expiresAt} />
            </small>
          </span>
        </div>
        {showUpgradeAction && (
          <Link
            className="inline-flex min-h-11 items-center rounded-[11px] bg-[#0f7b62] px-4 text-[10px] font-bold text-white no-underline"
            href="/upgrade"
          >
            خرید یا ارتقای بسته
          </Link>
        )}
      </div>
      {accountType === "employer" ? (
        <EmployerPlanSummary membership={membership} stats={employerStats ?? emptyEmployerStats} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {usageItems.map((item) => (
            <UsageCard item={item} key={item.key} membership={membership} showPackAction={showUpgradeAction} />
          ))}
        </div>
      )}
    </section>
  );
}
