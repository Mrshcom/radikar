"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronLeft,
  CircleDot,
  FileSearch,
  FileText,
  LoaderCircle,
  Sparkles,
  UserRoundSearch,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { PersianDateTime } from "@/lib/date-time-display";
import { useEmployerPositions, useEmployerProfile, type EmployerPosition } from "@/lib/employer";

const statusMeta: Record<
  EmployerPosition["screeningStatus"],
  { label: string; className: string; dotClassName: string }
> = {
  not_started: {
    label: "آماده ورود رزومه",
    className: "bg-[#fff2dc] text-[#9a6b20]",
    dotClassName: "bg-[#d69a36]",
  },
  processing: {
    label: "در حال پایش",
    className: "bg-[#e8f0fb] text-[#5278a5]",
    dotClassName: "bg-[#6f96c2]",
  },
  completed: {
    label: "پایش تکمیل",
    className: "bg-[#e5f4ec] text-[#0f7b62]",
    dotClassName: "bg-[#20a27f]",
  },
  failed: {
    label: "نیازمند بررسی",
    className: "bg-[#fff0ed] text-[#b2513e]",
    dotClassName: "bg-[#d16b56]",
  },
};

const statTones = [
  { card: "border-[#eadfd8] from-[#fff9f5] to-white", icon: "bg-[#fae8dc] text-[#b96d4b]" },
  { card: "border-[#ddd8ea] from-[#faf8ff] to-white", icon: "bg-[#eee9f8] text-[#7660a8]" },
  { card: "border-[#d8e3ec] from-[#f7fbff] to-white", icon: "bg-[#e5eff7] text-[#547da5]" },
  { card: "border-[#ebe2c8] from-[#fffdf7] to-white", icon: "bg-[#f6edcf] text-[#98752c]" },
] as const;

type SuggestedAction = {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

function suggestedAction(profileExists: boolean, positions: EmployerPosition[]): SuggestedAction {
  if (!profileExists)
    return {
      title: "فضای شرکتت را آماده کن",
      description: "از صفحهٔ پوزیشن‌ها می‌توانی اطلاعات شرکت و مسیر جذب را تکمیل کنی.",
      href: "/employer/positions",
      label: "مشاهده پوزیشن‌ها",
      icon: Sparkles,
    };
  if (!positions.length)
    return {
      title: "اولین پوزیشن را بساز",
      description: "شرح موقعیت را وارد کن؛ ادامهٔ مسیر ورود رزومه قدم‌به‌قدم نمایش داده می‌شود.",
      href: "/employer/positions",
      label: "مشاهده پوزیشن‌ها",
      icon: BriefcaseBusiness,
    };
  const unfinished = positions.find((position) => position.screeningStatus === "not_started");
  if (unfinished)
    return {
      title: `رزومه‌های «${unfinished.title}» را وارد کن`,
      description: "این پوزیشن آمادهٔ دریافت رزومه و شروع پایش هوشمند است.",
      href: `/employer/positions/${unfinished.id}`,
      label: "ادامه فرایند جذب",
      icon: FileSearch,
    };
  const processing = positions.find((position) => position.screeningStatus === "processing");
  if (processing)
    return {
      title: `پایش «${processing.title}» در جریان است`,
      description: "نتیجه‌ها پس از تکمیل پردازش در صفحهٔ پوزیشن آماده می‌شوند.",
      href: `/employer/positions/${processing.id}`,
      label: "مشاهده وضعیت",
      icon: LoaderCircle,
    };
  return {
    title: "برای جذب بعدی آماده‌ای؟",
    description: "نتایج پوزیشن‌های قبلی را مرور کن و مسیر جذب بعدی را از صفحهٔ پوزیشن‌ها شروع کن.",
    href: "/employer/positions",
    label: "مشاهده پوزیشن‌ها",
    icon: BriefcaseBusiness,
  };
}

export default function EmployerDashboardPage() {
  const profile = useEmployerProfile();
  const positions = useEmployerPositions();
  const items = positions.data ?? [];
  const companyName = profile.data?.profile?.companyName;
  const completed = items.filter((item) => item.screeningStatus === "completed").length;
  const processing = items.filter((item) => item.screeningStatus === "processing").length;
  const waiting = items.filter((item) => item.screeningStatus === "not_started").length;
  const action = suggestedAction(Boolean(profile.data?.profile), items);
  const ActionIcon = action.icon;
  const loading = profile.isLoading || positions.isLoading;
  const recentPositions = items.slice(0, 4);
  const stats = [
    { label: "کل پوزیشن‌ها", value: items.length, note: "ثبت‌شده در فضای شما", icon: BriefcaseBusiness },
    { label: "پایش تکمیل", value: completed, note: "آماده بررسی نامزدها", icon: BadgeCheck },
    { label: "در حال پایش", value: processing, note: "در حال تحلیل رزومه‌ها", icon: LoaderCircle },
    { label: "آماده شروع", value: waiting, note: "در انتظار ورود رزومه", icon: FileText },
  ];

  return (
    <div className="pb-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[25px] font-black tracking-[-.45px] text-[#19312f] sm:text-[28px]">
            {companyName ? `داشبورد ${companyName}` : "داشبورد کارفرما"}
          </h1>
          <p className="mb-0 mt-1 text-[11px] leading-6 text-[#71817d]">
            نمای سریع پوزیشن‌ها، پایش رزومه‌ها و قدم بعدی فرایند جذب.
          </p>
        </div>
      </header>

      <section className="mt-5 grid gap-4 min-[1050px]:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
        <div className="relative flex min-h-[270px] items-center overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_12%_15%,rgba(80,157,139,.34),transparent_31%),linear-gradient(128deg,#173f39,#0f2f2d)] px-[clamp(24px,3vw,38px)] py-8 text-white shadow-[0_18px_42px_rgba(20,57,51,.14)]">
          <div className="relative z-[2] max-w-[540px]">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-[9px] font-semibold text-[#cce7df]">
              <Sparkles aria-hidden="true" size={14} /> نمای کلی مسیر استخدام
            </span>
            <h2 className="mb-1.5 mt-3 text-[clamp(18px,2.3vw,25px)] leading-[1.65] tracking-[-.5px]">
              {items.length
                ? `${items.length.toLocaleString("fa-IR")} پوزیشن در مسیر جذب داری`
                : "اولین مسیر جذب حرفه‌ای را بساز"}
            </h2>
            <p className="m-0 max-w-[470px] text-[10px] leading-7 text-[#abc4be]">
              {completed
                ? `${completed.toLocaleString("fa-IR")} پایش کامل شده و می‌توانی نامزدهای مناسب را برای مصاحبه انتخاب کنی.`
                : "از تعریف پوزیشن تا پایش رزومه و دعوت به مصاحبه، همهٔ مراحل در یک جریان ساده کنار هم قرار دارند."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-white px-4 text-[11px] font-bold text-[#123c37] no-underline transition-colors hover:bg-[#eaf4ef]"
                href="/employer/positions"
              >
                مدیریت پوزیشن‌ها <ArrowLeft aria-hidden="true" size={16} />
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-white/15 bg-white/5 px-4 text-[10px] font-bold text-[#d8ebe5] no-underline transition hover:bg-white/10 hover:text-white"
                href="/employer/account-center"
              >
                مرکز کارفرما
              </Link>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-8 size-52 rounded-full border border-white/8 shadow-[0_0_0_34px_rgba(255,255,255,.025),0_0_0_72px_rgba(255,255,255,.018)]"
          />
          <BriefcaseBusiness
            aria-hidden="true"
            className="absolute bottom-8 left-10 hidden text-white/[.07] sm:block"
            size={132}
            strokeWidth={1.2}
          />
        </div>

        <aside className="flex min-h-[270px] flex-col items-start rounded-[22px] border border-[#e3e9e0] bg-[linear-gradient(150deg,#f0f5ed,#eef1e9)] p-6">
          <div className="flex w-full items-center justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#d8eee5] text-[#0c765d]">
              <ActionIcon aria-hidden="true" className={ActionIcon === LoaderCircle ? "animate-spin" : ""} size={21} />
            </span>
            <span className="rounded-md bg-[#f4dfb9] px-2 py-1 text-[8px] font-bold text-[#8a6327]">قدم پیشنهادی</span>
          </div>
          <h2 className="mb-1.5 mt-5 line-clamp-2 text-[16px] leading-7 text-[#19312f]">{action.title}</h2>
          <p className="m-0 line-clamp-3 text-[10px] leading-6 text-[#72827f]">{action.description}</p>
          <Link
            className="mt-auto inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#dbe4dc] bg-white/75 px-4 text-[10px] font-bold text-[#405a53] no-underline shadow-sm transition hover:border-[#bbd6c8] hover:bg-white hover:text-[#0f7b62]"
            href={action.href}
          >
            {action.label} <ChevronLeft aria-hidden="true" size={16} />
          </Link>
        </aside>
      </section>

      <section aria-label="آمار پوزیشن‌ها" className="my-4 grid grid-cols-2 gap-2.5 min-[1050px]:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon }, index) => (
          <article
            className={`flex min-h-[92px] items-center gap-3 rounded-[17px] border bg-gradient-to-l p-4 shadow-[0_12px_36px_rgba(27,55,50,.045)] ${statTones[index].card}`}
            key={label}
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl max-[520px]:size-8 ${statTones[index].icon}`}
            >
              <Icon aria-hidden="true" size={19} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[10px] text-[#788783]">{label}</span>
              <strong className="mt-1 block text-[21px] leading-none text-[#19312f]">
                {loading ? "…" : value.toLocaleString("fa-IR")}
              </strong>
              <small className="mt-1.5 hidden truncate text-[8px] text-[#95a09d] sm:block">{note}</small>
            </span>
          </article>
        ))}
      </section>

      {(profile.error || positions.error) && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-[#f1d3cc] bg-[#fff5f2] p-3 text-xs font-semibold text-[#b14f3c]"
        >
          دریافت بخشی از اطلاعات داشبورد ناموفق بود؛ صفحه را دوباره بارگذاری کن.
        </p>
      )}

      <section className="grid gap-4 min-[1050px]:grid-cols-[minmax(0,1.55fr)_minmax(290px,.7fr)]">
        <div className="rounded-[17px] border border-[#e7ebe6] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.055)]">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="m-0 text-[14px] text-[#19312f]">آخرین پوزیشن‌ها</h2>
              <p className="mb-0 mt-1 text-[9px] text-[#99a4a1]">آخرین مسیرهای جذبی که ساخته‌ای</p>
            </div>
            <Link
              className="flex items-center gap-1 p-1.5 text-[10px] font-bold text-[#0f7b62] no-underline"
              href="/employer/positions"
            >
              مشاهده همه <ChevronLeft aria-hidden="true" size={15} />
            </Link>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="grid gap-2">
                {[0, 1, 2].map((item) => (
                  <div aria-hidden="true" className="h-[66px] animate-pulse rounded-xl bg-[#f3f6f4]" key={item} />
                ))}
              </div>
            ) : recentPositions.length ? (
              recentPositions.map((position) => {
                const meta = statusMeta[position.screeningStatus];
                return (
                  <Link
                    className="group grid min-h-[67px] grid-cols-[38px_minmax(100px,1fr)_auto_20px] items-center gap-3 border-t border-[#eef1ed] text-[#19312f] no-underline first:border-t-0 hover:text-[#0f7b62]"
                    href={`/employer/positions/${position.id}`}
                    key={position.id}
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-[#edf5f1] text-[#0f7b62]">
                      <BriefcaseBusiness aria-hidden="true" size={17} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-[11px]">{position.title}</strong>
                      <small className="mt-1 flex items-center gap-1.5 truncate text-[9px] text-[#909c98]">
                        <PersianDateTime value={position.createdAt} />
                        <span aria-hidden="true">·</span>
                        {position.companyName}
                      </small>
                    </span>
                    <span
                      className={`flex items-center gap-1.5 rounded-[7px] px-2 py-1.5 text-[8px] font-bold ${meta.className}`}
                    >
                      <span aria-hidden="true" className={`size-1.5 rounded-full ${meta.dotClassName}`} />
                      {meta.label}
                    </span>
                    <ChevronLeft
                      aria-hidden="true"
                      className="text-[#a3afab] transition group-hover:-translate-x-0.5 group-hover:text-[#0f7b62]"
                      size={16}
                    />
                  </Link>
                );
              })
            ) : (
              <div className="grid min-h-[205px] place-items-center rounded-xl border border-dashed border-[#d9e2dd] bg-[#fbfcfa] p-6 text-center">
                <div>
                  <BriefcaseBusiness className="mx-auto text-[#8cb8a8]" size={28} />
                  <strong className="mt-3 block text-[12px] text-[#19312f]">هنوز پوزیشنی نساخته‌ای</strong>
                  <p className="mb-0 mt-1 text-[9px] leading-6 text-[#86938f]">
                    اولین موقعیت شغلی را بساز و رزومه‌ها را وارد کن.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <section className="rounded-[17px] border border-[#e7ebe6] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.055)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="m-0 text-[13px] text-[#19312f]">مسیر جذب در رادیکار</h2>
                <p className="mb-0 mt-1 text-[9px] text-[#99a4a1]">چهار قدم تا انتخاب نامزد</p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-[#e5eff7] text-[#547da5]">
                <CircleDot aria-hidden="true" size={18} />
              </span>
            </div>
            <ol className="relative mb-0 mt-4 grid gap-3 pr-0 before:absolute before:bottom-4 before:right-[15px] before:top-4 before:w-px before:bg-[#dfe8e3]">
              {[
                { label: "تعریف پوزیشن", icon: BriefcaseBusiness },
                { label: "ورود رزومه‌ها", icon: FileText },
                { label: "پایش و انتخاب", icon: UserRoundSearch },
                { label: "دعوت به مصاحبه", icon: UsersRound },
              ].map(({ label, icon: Icon }, index) => (
                <li className="relative flex list-none items-center gap-3" key={label}>
                  <span
                    className={`z-[1] grid size-8 place-items-center rounded-[10px] border ${index === 0 && !items.length ? "border-[#a9d0c0] bg-[#e4f3ea] text-[#0f7b62]" : "border-[#e2e9e5] bg-white text-[#7d8d88]"}`}
                  >
                    <Icon aria-hidden="true" size={15} />
                  </span>
                  <span className="text-[10px] font-bold text-[#536762]">{label}</span>
                  <small className="mr-auto text-[8px] text-[#9aa5a1]">قدم {(index + 1).toLocaleString("fa-IR")}</small>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid grid-cols-2 gap-2 rounded-[17px] border border-[#e7ebe6] bg-white p-3 shadow-[0_12px_36px_rgba(27,55,50,.055)]">
            <Link
              className="group flex min-h-[64px] items-center gap-2.5 rounded-xl bg-[#f2f8f4] px-3 text-[9px] font-bold text-[#416158] no-underline transition hover:bg-[#e9f4ee] hover:text-[#0f7b62]"
              href="/employer/account-center"
            >
              <span className="grid size-8 place-items-center rounded-[10px] bg-white text-[#0f7b62]">
                <UsersRound aria-hidden="true" size={16} />
              </span>
              مرکز کارفرما
            </Link>
            <Link
              className="group flex min-h-[64px] items-center gap-2.5 rounded-xl bg-[#fff8e8] px-3 text-[9px] font-bold text-[#765c25] no-underline transition hover:bg-[#fff3d6]"
              href="/employer/radicoins"
            >
              <span className="grid size-8 place-items-center rounded-[10px] bg-white text-[#a57925]">
                <WalletCards aria-hidden="true" size={16} />
              </span>
              خرید رادیکوین
            </Link>
          </section>
        </div>
      </section>
    </div>
  );
}
