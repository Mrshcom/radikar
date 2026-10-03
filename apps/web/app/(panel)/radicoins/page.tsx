"use client";

import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Gift,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePlans } from "@/lib/billing";
import { PersianDateTime } from "@/lib/date-time-display";
import { useRadicoinWallet } from "@/lib/radicoins";
import { RadicoinIcon } from "../_components/radicoin-icon";

const sourceLabels: Record<string, string> = {
  daily_login: "ورود روزانه",
  activity: "فعالیت در رادیکار",
  referral_signup: "ثبت‌نام دعوتی",
  referral_activation: "فعالیت دعوت‌شونده",
  referral_upgrade: "ارتقای دعوت‌شونده",
  purchase: "هدیه خرید",
  campaign: "هدیه جشنواره",
  birthday: "هدیه تولد",
  admin_adjustment: "اصلاح مدیریت",
  redemption: "خرج در فروشگاه",
  reversal: "برگشت",
};
const formatCoinAmount = (value: number) => (value === 0 ? "صفر" : value.toLocaleString("fa-IR"));

export default function RadicoinsPage() {
  const wallet = useRadicoinWallet();
  const plans = usePlans();
  const balance = wallet.data?.wallet?.availableCoins ?? 0;
  const rewards = (plans.data ?? []).filter((plan) => plan.radicoinCost && plan.isPurchasable);
  const nextReward = rewards
    .filter((plan) => (plan.radicoinCost ?? 0) > balance)
    .sort((a, b) => (a.radicoinCost ?? 0) - (b.radicoinCost ?? 0))[0];
  const progress = nextReward ? Math.min(100, Math.round((balance / (nextReward.radicoinCost ?? 1)) * 100)) : 100;
  const transactions = wallet.data?.transactions ?? [];

  return (
    <div className="grid gap-6 overflow-x-clip">
      <section className="relative isolate">
        <div className="relative grid items-center gap-4 lg:min-h-[430px] lg:grid-cols-[.9fr_1.1fr] lg:gap-8">
          <div className="relative z-20 flex flex-col justify-center px-2 pb-2 pt-7 md:px-5 lg:px-7 lg:py-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-[#0f7b62] shadow-[0_6px_20px_rgba(15,123,98,.08)]">
              <Sparkles size={14} /> کیف پول وفاداری رادیکار
            </span>
            <h1 className="mb-0 mt-5 max-w-lg text-[28px] font-black leading-[1.55] text-[#19312f] md:text-[34px]">
              رادیکوین‌های تو، <span className="text-[#0f7b62]">سوخت مسیر حرفه‌ای تو</span>
            </h1>
            <p className="mb-0 mt-3 max-w-xl text-[12px] leading-7 text-[#61746f]">
              با حضور و فعالیت واقعی در رادیکار سکه جمع کن و آن‌ها را برای ارتقای پلن خرج کن. رادیکوین‌های عادی منقضی
              نمی‌شوند.
            </p>
            <div className="mt-6 flex w-fit min-w-56 items-center gap-4 rounded-[18px] bg-white/95 px-5 py-4 shadow-[0_16px_45px_rgba(31,76,64,.12)] backdrop-blur-md">
              <RadicoinIcon className="size-14 drop-shadow-[0_8px_18px_rgba(199,145,20,.22)]" size={56} />
              <div>
                <span className="block text-[9px] text-[#7b8c87]">موجودی قابل‌استفاده</span>
                <strong className="mt-1 block text-[27px] font-black leading-none text-[#19312f]">
                  {balance.toLocaleString("fa-IR")}{" "}
                  <small className="text-[9px] font-medium text-[#7b8c87]">رادیکوین</small>
                </strong>
              </div>
            </div>
          </div>
          <div className="relative min-h-[370px] lg:min-h-full">
            <div className="pointer-events-none absolute bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-[#174b3e]/12 blur-2xl" />
            <Image
              alt="ماسکات رادیکار در حال پس‌انداز رادیکوین در کیف پول"
              className="scale-110 object-contain object-center [mask-image:radial-gradient(ellipse_at_center,black_54%,transparent_80%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_54%,transparent_80%)] lg:scale-[1.18]"
              fill
              priority
              sizes="(min-width: 1024px) 52vw, 100vw"
              src="/illustrations/radikar-mascot-wallet-hero-v2.png"
            />
          </div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "کل دریافتی",
            value: wallet.data?.wallet?.lifetimeEarnedCoins ?? 0,
            icon: Trophy,
            card: "from-[#f1faf6] to-white",
            iconStyle: "bg-[#dff4ea] text-[#0f7b62]",
          },
          {
            label: "کل مصرف‌شده",
            value: wallet.data?.wallet?.lifetimeSpentCoins ?? 0,
            icon: ArrowUpRight,
            card: "from-[#fff7ed] to-white",
            iconStyle: "bg-[#ffecd5] text-[#b96b2d]",
          },
          {
            label: "در انتظار",
            value: wallet.data?.wallet?.pendingCoins ?? 0,
            icon: LockKeyhole,
            card: "from-[#fffbed] to-white",
            iconStyle: "bg-[#fff1bd] text-[#9a7010]",
          },
        ].map(({ label, value, icon: Icon, card, iconStyle }) => (
          <article
            className={`flex items-center gap-4 rounded-[18px] bg-gradient-to-l ${card} px-4 py-4 shadow-[0_10px_30px_rgba(27,63,54,.055)]`}
            key={label}
          >
            <span className={`grid size-13 shrink-0 place-items-center rounded-[16px] ${iconStyle}`}>
              <Icon size={23} />
            </span>
            <div>
              <span className="block text-[14px] font-bold text-[#526762]">{label}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <strong className="text-[25px] font-black leading-none text-[#19312f]">
                  {formatCoinAmount(value)}
                </strong>
                <span className="text-[12px] font-semibold text-[#82908d]">رادیکوین</span>
              </div>
            </div>
          </article>
        ))}
      </section>
      <section className="rounded-[18px] border border-[#e4dcc0] bg-[#fffaf0] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#fff0bd] text-[#b18216]">
              <Gift size={21} />
            </span>
            <div>
              <strong className="text-[12px] text-[#5f5128]">
                {nextReward ? `تا پلن ${nextReward.name}` : "رادیکوین‌هایت آماده استفاده‌اند"}
              </strong>
              <p className="mb-0 mt-1 text-[9px] leading-6 text-[#89794b]">
                {nextReward
                  ? `${((nextReward.radicoinCost ?? 0) - balance).toLocaleString("fa-IR")} رادیکوین دیگر لازم داری`
                  : "هنگام خرید یا ارتقا، روش پرداخت رادیکوین را انتخاب کن."}
              </p>
            </div>
          </div>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-[11px] bg-[#0f7b62] px-4 text-[10px] font-bold text-white no-underline"
            href="/upgrade"
          >
            مشاهده پلن‌ها و ارتقا <ArrowLeft size={15} />
          </Link>
        </div>
        {nextReward && (
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eee5c9]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#d6a82f,#f3c95b)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </section>
      <section className="overflow-hidden rounded-[20px] border border-[#e1e8e2] bg-white">
        <h2 className="m-0 border-b border-[#edf1ee] px-5 py-4 text-[13px] font-black text-[#19312f]">گردش رادیکوین</h2>
        {wallet.isLoading ? (
          <div className="grid min-h-40 place-items-center">
            <LoaderCircle className="animate-spin text-[#0f7b62]" />
          </div>
        ) : (
          <div className="divide-y divide-[#edf1ee]">
            {transactions.map((entry) => {
              const reversedDebit = entry.status === "reversed" && entry.amount < 0;
              const hasRecordedReturn =
                reversedDebit &&
                Boolean(
                  entry.orderId &&
                  transactions.some((item) => item.source === "reversal" && item.orderId === entry.orderId),
                );
              const legacyReturn = reversedDebit && !hasRecordedReturn;
              const displayAmount = legacyReturn ? Math.abs(entry.amount) : entry.amount;
              const isCredit = entry.amount >= 0 || legacyReturn;
              const title = legacyReturn
                ? "تراکنش لغو شد؛ رادیکوین برگشت"
                : reversedDebit
                  ? "تراکنش لغو شد"
                  : entry.description;
              const source = legacyReturn
                ? "برگشت تراکنش"
                : reversedDebit
                  ? "تراکنش لغوشده"
                  : (sourceLabels[entry.source] ?? entry.source);
              return (
                <div className="flex items-center justify-between gap-4 px-5 py-4" key={entry.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-[11px] ${isCredit ? "bg-[#eaf5f0] text-[#0f7b62]" : "bg-[#fff2e8] text-[#b96b2d]"}`}
                    >
                      {reversedDebit ? (
                        <RotateCcw size={17} />
                      ) : isCredit ? (
                        <ArrowDownLeft size={17} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-[10px] text-[#405753]">{title}</strong>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#8a9793]">
                        {reversedDebit && (
                          <span className="rounded-full bg-[#eaf5f0] px-1.5 py-0.5 font-bold text-[#0f7b62]">
                            برگشت‌خورده
                          </span>
                        )}
                        {source} · <PersianDateTime value={entry.createdAt} />
                      </span>
                    </div>
                  </div>
                  <strong
                    className={
                      isCredit
                        ? "inline-flex items-baseline text-[11px] text-[#0f7b62]"
                        : "inline-flex items-baseline text-[11px] text-[#b96b2d]"
                    }
                    dir="ltr"
                  >{`${isCredit ? "+" : "−"}${Math.abs(displayAmount).toLocaleString("fa-IR")}`}</strong>
                </div>
              );
            })}
            {!transactions.length && (
              <p className="m-0 p-10 text-center text-[10px] text-[#87938f]">هنوز تراکنشی ثبت نشده است.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
