"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  CreditCard,
  Gift,
  History,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { RadicoinIcon } from "@/app/(panel)/_components/radicoin-icon";
import { useAuth } from "@/app/_components/auth";
import { useMembership } from "@/lib/billing";
import { useRadicoinWallet } from "@/lib/radicoins";
import { userDisplayName, userIdentifier } from "@/lib/user-identity";

type AccountLink = { href: string; label: string; icon: LucideIcon | typeof RadicoinIcon };
type AccountGroup = {
  title: string;
  icon: LucideIcon;
  links: AccountLink[];
  wide?: boolean;
  tone: "green" | "amber" | "blue";
};

const accountGroups: AccountGroup[] = [
  {
    title: "حساب و امنیت",
    icon: ShieldCheck,
    tone: "green",
    links: [
      { href: "/account", label: "اطلاعات حساب و مصرف", icon: UserRound },
      { href: "/settings", label: "تنظیمات، نشست‌ها و ورودها", icon: History },
    ],
  },
  {
    title: "خرید و اعتبار",
    icon: CreditCard,
    tone: "amber",
    links: [
      { href: "/orders", label: "سفارش‌ها و پرداخت‌ها", icon: ReceiptText },
      { href: "/upgrade", label: "مشاهده و ارتقای پلن", icon: Sparkles },
    ],
  },
  {
    title: "دعوت و پاداش",
    icon: Gift,
    wide: true,
    tone: "blue",
    links: [
      { href: "/referrals", label: "دعوت از دوستان", icon: UsersRound },
      { href: "/radicoins", label: "تاریخچهٔ پاداش‌های رادیکوین", icon: RadicoinIcon },
    ],
  },
];

function AccountGroupCard({ group }: { group: AccountGroup }) {
  const Icon = group.icon;
  const iconTone = {
    green: "bg-[#e5f4eb] text-[#0f7b62] ring-1 ring-[#d2e9da]",
    amber: "bg-[#fff1d9] text-[#a87926] ring-1 ring-[#f5e1bb]",
    blue: "bg-[#eaf0fb] text-[#617dc2] ring-1 ring-[#dce6f7]",
  }[group.tone];
  const cardTone = {
    green: "border-[#dbeae1]",
    amber: "border-[#efe4d2]",
    blue: "border-[#e0e8f4]",
  }[group.tone];
  const headerTone = {
    green: "bg-gradient-to-l from-[#f3faf6] to-white",
    amber: "bg-gradient-to-l from-[#fffbf3] to-white",
    blue: "bg-gradient-to-l from-[#f6f8ff] to-white",
  }[group.tone];

  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[18px] border bg-white transition-colors duration-200 hover:border-[#c8dfd1] focus-within:border-[#b8daca] ${cardTone} ${group.wide ? "md:col-span-2 md:flex md:min-h-[96px] md:items-center md:bg-gradient-to-l md:from-[#f6f8ff] md:to-white md:px-4" : ""}`}
    >
      <div
        className={`flex min-h-[68px] items-center gap-2.5 px-5 py-3 ${headerTone} ${group.wide ? "md:shrink-0 md:bg-none md:px-1" : "border-b border-[#edf0ec]"}`}
      >
        <span className={`grid size-[34px] shrink-0 place-items-center rounded-[10px] ${iconTone}`}>
          <Icon aria-hidden="true" size={18} />
        </span>
        <h2 className="m-0 min-w-0 text-[14px] font-black text-[#19312f]">{group.title}</h2>
        {!group.wide && (
          <small className="mr-auto shrink-0 rounded-full border border-[#e6eee8] bg-white/75 px-2 py-0.5 text-[12px] font-semibold text-[#74847f]">
            {group.links.length.toLocaleString("fa-IR")} بخش
          </small>
        )}
      </div>
      <div
        className={`grid p-2 ${group.wide ? "sm:grid-cols-2 md:mr-auto md:w-full md:max-w-[480px] md:gap-2 md:p-0" : ""}`}
      >
        {group.links.map(({ href, label, icon: LinkIcon }) => (
          <Link
            className="group flex min-h-[56px] min-w-0 items-center gap-2.5 rounded-[10px] border border-transparent px-3 text-[13px] font-bold text-[#294a40] no-underline transition-[background-color,border-color,color] hover:border-[#dceee3] hover:bg-[#f1f8f3] hover:text-[#0f7b62] focus-visible:outline-2 focus-visible:outline-[#0f7b62]"
            href={href}
            key={`${href}-${label}`}
          >
            <span aria-hidden="true" className="shrink-0 text-[#81948a] group-hover:text-[#0f7b62]">
              <LinkIcon size={18} />
            </span>
            <span className="min-w-0 flex-1">{label}</span>
            <span className="grid size-6 shrink-0 place-items-center rounded-full text-[#a3b2ab] transition-colors group-hover:bg-white group-hover:text-[#0f7b62]">
              <ChevronLeft aria-hidden="true" size={16} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function AccountCenterPage() {
  const { user } = useAuth();
  const membership = useMembership();
  const wallet = useRadicoinWallet();
  const walletBalance = wallet.data?.wallet?.availableCoins;
  const planName = membership.data?.plan.name;

  return (
    <div className="mx-auto w-full max-w-6xl pb-6">
      <header>
        <h1 className="m-0 text-[26px] font-black tracking-[-.5px] text-[#19312f] sm:text-[28px]">مرکز حساب</h1>
        <p className="m-0 mt-0.5 text-[11px] leading-6 text-[#71817d]">
          اطلاعات، خریدها و پاداش‌هایت یک‌جا و همیشه در دسترس‌اند.
        </p>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-[1.46fr_1fr_1fr]">
        <section className="relative col-span-2 flex min-h-[148px] flex-col justify-between overflow-hidden rounded-[19px] border border-[#247965] bg-gradient-to-l from-[#0b4f43] via-[#126d58] to-[#0b866b] p-4 text-white sm:p-5 lg:col-span-1 lg:min-h-[156px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[109px] -left-11 size-[148px] rounded-full border border-white/20"
          />
          <Image
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[148px] w-auto object-contain object-bottom sm:h-[156px]"
            height={640}
            sizes="104px"
            src="/illustrations/radikar-mascot-account-center-v1.png"
            width={426}
          />
          <div className="relative flex w-[calc(100%-104px)] min-w-0 items-center gap-2.5">
            <span className="grid size-[39px] shrink-0 place-items-center rounded-[12px] border border-white/20 bg-white/15">
              <UserRound aria-hidden="true" size={22} />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-[16px]">{user ? userDisplayName(user) : "حساب کاربری"}</strong>
              <small className="mt-0.5 block truncate text-[12px] text-[#d7e9df]" dir="auto">
                {user ? userIdentifier(user) : "اطلاعات در حال بارگذاری"}
              </small>
            </span>
          </div>
          <Link
            className="relative mt-3 inline-flex w-fit max-w-[calc(100%-104px)] items-center gap-1.5 text-[12px] font-bold text-[#e0f5e9] no-underline hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            href="/account"
          >
            اطلاعات و امنیت حساب <ArrowLeft aria-hidden="true" size={15} />
          </Link>
        </section>

        <section className="relative flex min-h-[148px] min-w-0 flex-col overflow-hidden rounded-[19px] border border-[#cfe6d8] bg-gradient-to-bl from-[#f7fcf8] via-[#eef8f1] to-[#e4f4e9] p-4 sm:p-5 lg:min-h-[156px]">
          <BadgeCheck
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-4 -left-3 text-[#0f7b62]/[.07]"
            size={84}
          />
          <span className="relative flex items-center justify-between gap-2 text-[12px] font-bold text-[#627a6f]">
            پلن فعلی{" "}
            <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-white bg-white/85 text-[#0c8a68]">
              <BadgeCheck aria-hidden="true" size={18} />
            </span>
          </span>
          <strong className="relative mt-1.5 truncate text-[18px] font-black text-[#19312f] sm:text-[20px]">
            {planName ?? (membership.isPending ? "در حال بارگذاری…" : "نامشخص")}
          </strong>
          <Link
            className="group relative mt-auto inline-flex w-fit items-center gap-1 pt-1 text-[12px] font-bold text-[#0f7b62] no-underline hover:text-[#075b49] focus-visible:outline-2 focus-visible:outline-[#0f7b62]"
            href="/upgrade"
          >
            جزئیات و ارتقای پلن <ArrowLeft aria-hidden="true" size={15} />
          </Link>
        </section>

        <section className="relative flex min-h-[148px] min-w-0 flex-col overflow-hidden rounded-[19px] border border-[#efdfb9] bg-gradient-to-bl from-[#fffcf5] via-[#fff8e9] to-[#f8edd2] p-4 sm:p-5 lg:min-h-[156px]">
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-4 -left-3 text-[#a47827]/[.08]">
            <RadicoinIcon size={86} />
          </span>
          <span className="relative flex items-center justify-between gap-2 text-[12px] font-bold text-[#806f51]">
            موجودی رادیکوین{" "}
            <span
              aria-hidden="true"
              className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-white bg-white/85 text-[#a47827]"
            >
              <RadicoinIcon size={18} />
            </span>
          </span>
          <strong className="relative mt-1.5 truncate text-[18px] font-black text-[#19312f] sm:text-[20px]">
            {walletBalance === undefined
              ? wallet.isPending
                ? "در حال بارگذاری…"
                : "نامشخص"
              : walletBalance.toLocaleString("fa-IR")}
            {walletBalance !== undefined && <span className="mr-1 text-[12px] font-semibold">سکه</span>}
          </strong>
          <Link
            className="group relative mt-auto inline-flex w-fit items-center gap-1 pt-1 text-[12px] font-bold text-[#886626] no-underline hover:text-[#634813] focus-visible:outline-2 focus-visible:outline-[#886626]"
            href="/radicoins"
          >
            مشاهدهٔ کیف پول <ArrowLeft aria-hidden="true" size={15} />
          </Link>
        </section>
      </div>

      <h2 className="mx-0 mb-2.5 mt-5 text-[15px] font-black text-[#19312f]">دسترسی‌های حساب</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {accountGroups.map((group) => (
          <AccountGroupCard group={group} key={group.title} />
        ))}
      </div>
    </div>
  );
}
