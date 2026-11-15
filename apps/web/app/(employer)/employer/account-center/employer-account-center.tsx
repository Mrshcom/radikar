"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ChevronLeft,
  CreditCard,
  Gift,
  History,
  MessageSquareText,
  ReceiptText,
  Settings,
  ShoppingBag,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { RadicoinIcon } from "@/app/(panel)/_components/radicoin-icon";
import { useAuth } from "@/app/_components/auth";
import { useMembership } from "@/lib/billing";
import { useEmployerProfile } from "@/lib/employer";
import { useRadicoinWallet } from "@/lib/radicoins";
import { userDisplayName, userIdentifier } from "@/lib/user-identity";

type CenterLink = { href: string; label: string; description: string; icon: LucideIcon | typeof RadicoinIcon };

const groups: Array<{ title: string; icon: LucideIcon; links: CenterLink[] }> = [
  {
    title: "حساب و کسب‌وکار",
    icon: Building2,
    links: [
      { href: "/employer/profile", label: "پروفایل شرکت", description: "نام و اطلاعات مجموعه", icon: Building2 },
      { href: "/account", label: "اطلاعات حساب", description: "نام و اطلاعات شخصی", icon: UserRound },
      { href: "/settings", label: "امنیت و نشست‌ها", description: "ورودها و تنظیمات امنیتی", icon: Settings },
      { href: "/employer/support", label: "پشتیبانی و تیکت‌ها", description: "ثبت درخواست و مشاهده پاسخ‌ها", icon: MessageSquareText },
    ],
  },
  {
    title: "خرید و اعتبار",
    icon: CreditCard,
    links: [
      {
        href: "/radicoins/buy",
        label: "خرید رادیکوین",
        description: "شارژ کیف پول با پرداخت آنلاین",
        icon: ShoppingBag,
      },
      { href: "/upgrade", label: "پلن‌های کارفرما", description: "امکانات و ارتقای استخدام", icon: BadgeCheck },
      { href: "/orders", label: "سفارش‌ها و پرداخت‌ها", description: "سوابق پرداخت و وضعیت سفارش", icon: ReceiptText },
    ],
  },
  {
    title: "دعوت و کیف پول",
    icon: Gift,
    links: [
      { href: "/referrals", label: "دعوت از دوستان", description: "لینک دعوت و دریافت پاداش", icon: UsersRound },
      { href: "/radicoins", label: "گردش رادیکوین", description: "موجودی و تاریخچه تراکنش‌ها", icon: History },
    ],
  },
];

function CenterGroup({ title, icon: GroupIcon, links }: (typeof groups)[number]) {
  return (
    <section className="overflow-hidden rounded-[20px] border border-[#dfe9e3] bg-white">
      <div className="flex min-h-[66px] items-center gap-3 border-b border-[#edf2ee] bg-gradient-to-l from-[#f4faf6] to-white px-5">
        <span className="grid size-9 place-items-center rounded-[11px] bg-[#e4f3ea] text-[#0f7b62]">
          <GroupIcon aria-hidden="true" size={19} />
        </span>
        <h2 className="m-0 text-sm font-black text-[#19312f]">{title}</h2>
      </div>
      <div className="grid p-2">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link
            className="group flex min-h-[70px] items-center gap-3 rounded-[13px] px-3 no-underline transition hover:bg-[#f1f8f4] focus-visible:outline-2 focus-visible:outline-[#0f7b62]"
            href={href}
            key={href}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2f6f4] text-[#667c74] transition group-hover:bg-white group-hover:text-[#0f7b62]">
              <Icon aria-hidden="true" size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-[13px] text-[#294a40]">{label}</strong>
              <small className="mt-1 block truncate text-[11px] text-[#82908c]">{description}</small>
            </span>
            <ChevronLeft aria-hidden="true" className="text-[#a1aea9] group-hover:text-[#0f7b62]" size={17} />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function EmployerAccountCenterPage() {
  const { user } = useAuth();
  const profile = useEmployerProfile();
  const membership = useMembership();
  const wallet = useRadicoinWallet();
  const companyName = profile.data?.profile?.companyName;
  const walletBalance = wallet.data?.wallet?.availableCoins;

  return (
    <div className="mx-auto w-full max-w-6xl pb-8">
      <header>
        <h1 className="m-0 text-[26px] font-black tracking-[-.5px] text-[#19312f] sm:text-[30px]">مرکز کارفرما</h1>
        <p className="mb-0 mt-1 text-xs leading-6 text-[#71817d]">
          حساب، شرکت، خریدها و اعتبارهای شما در یک فضای مستقل از داشبورد استخدام.
        </p>
      </header>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.35fr_.9fr_.9fr]">
        <section className="relative flex min-h-[170px] overflow-hidden rounded-[22px] border border-[#226f5d] bg-gradient-to-l from-[#0a4b40] via-[#126a57] to-[#0b8168] p-5 text-white">
          <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between pl-24 sm:pl-36">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-[13px] border border-white/20 bg-white/15">
                <Building2 aria-hidden="true" size={23} />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-lg">
                  {companyName ?? (profile.isPending ? "در حال بارگذاری…" : "پروفایل شرکت")}
                </strong>
                <small className="mt-1 block truncate text-xs text-[#d4e8df]">
                  {user ? `${userDisplayName(user)} · ${userIdentifier(user)}` : "حساب کارفرما"}
                </small>
              </span>
            </div>
            <Link
              className="inline-flex w-fit items-center gap-2 text-xs font-bold text-[#e2f4ec] no-underline hover:text-white"
              href="/employer/profile"
            >
              ویرایش پروفایل شرکت <ArrowLeft aria-hidden="true" size={15} />
            </Link>
          </div>
          <Image
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[160px] w-auto object-contain object-bottom opacity-95"
            height={640}
            src="/illustrations/radikar-mascot-account-center-v1.png"
            width={426}
          />
        </section>

        <section className="flex min-h-[170px] flex-col rounded-[22px] border border-[#d2e7da] bg-gradient-to-bl from-[#f8fcf9] to-[#e7f5ec] p-5">
          <span className="flex items-center justify-between text-xs font-bold text-[#647b71]">
            پلن فعال{" "}
            <span className="grid size-9 place-items-center rounded-xl bg-white text-[#0f7b62]">
              <BadgeCheck aria-hidden="true" size={19} />
            </span>
          </span>
          <strong className="mt-3 truncate text-xl font-black text-[#19312f]">
            {membership.data?.plan.name ?? (membership.isPending ? "در حال بارگذاری…" : "نامشخص")}
          </strong>
          <Link
            className="mt-auto inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#0f7b62] no-underline"
            href="/upgrade"
          >
            مشاهده پلن‌ها <ArrowLeft aria-hidden="true" size={14} />
          </Link>
        </section>

        <section className="flex min-h-[170px] flex-col rounded-[22px] border border-[#eedfb9] bg-gradient-to-bl from-[#fffdf7] to-[#f8edd0] p-5">
          <span className="flex items-center justify-between text-xs font-bold text-[#7e704f]">
            کیف پول رادیکوین{" "}
            <span className="grid size-9 place-items-center rounded-xl bg-white text-[#a57925]">
              <RadicoinIcon size={19} />
            </span>
          </span>
          <strong className="mt-3 text-xl font-black text-[#19312f]">
            {walletBalance === undefined
              ? wallet.isPending
                ? "در حال بارگذاری…"
                : "نامشخص"
              : walletBalance.toLocaleString("fa-IR")}{" "}
            {walletBalance !== undefined && <small className="text-xs font-semibold">سکه</small>}
          </strong>
          <Link
            className="mt-auto inline-flex w-fit items-center gap-1.5 text-xs font-bold text-[#876523] no-underline"
            href="/radicoins/buy"
          >
            خرید رادیکوین <ArrowLeft aria-hidden="true" size={14} />
          </Link>
        </section>
      </div>

      <h2 className="mb-3 mt-6 text-base font-black text-[#19312f]">دسترسی‌های مرکز کارفرما</h2>
      <div className="grid gap-3 lg:grid-cols-3">
        {groups.map((group) => (
          <CenterGroup {...group} key={group.title} />
        ))}
      </div>
    </div>
  );
}
