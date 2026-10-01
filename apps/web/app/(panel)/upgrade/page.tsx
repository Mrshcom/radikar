"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { BadgeCheck, CalendarDays, Check, CreditCard, Crown, LoaderCircle, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/app/_components/toast";
import { ApiError } from "@/lib/api-client";
import { PersianDateTime } from "@/lib/date-time-display";
import {
  formatLimit,
  formatTomans,
  type Plan,
  useCreateOrder,
  useMembership,
  usePlans,
} from "@/lib/billing";
import { useRadicoinWallet } from "@/lib/radicoins";
import { RadicoinCoinIcon } from "../_components/radicoin-coin-icon";
import { Modal } from "../_components/ui";

const checkoutSchema = z.object({
  paymentMethod: z.enum(["gateway", "radicoin"]),
});
type CheckoutForm = z.infer<typeof checkoutSchema>;

const planMascots: Record<string, { src: string; alt: string }> = {
  free: {
    src: "/illustrations/radikar-plan-free-v1.png",
    alt: "ماسکات رادیکار با رزومه برای پلن رایگان",
  },
  "job-search": {
    src: "/illustrations/radikar-plan-job-search-v1.png",
    alt: "ماسکات رادیکار در حال جست‌وجوی فرصت شغلی",
  },
  professional: {
    src: "/illustrations/radikar-plan-professional-v1.png",
    alt: "ماسکات حرفه‌ای رادیکار با نشان موفقیت",
  },
};

export default function UpgradePage() {
  const plans = usePlans();
  const membership = useMembership();
  const wallet = useRadicoinWallet();
  const createOrder = useCreateOrder();
  const notify = useToast();
  const [invoicePlan, setInvoicePlan] = useState<Plan | null>(null);
  const checkout = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "gateway" },
  });
  const paymentMethod = useWatch({ control: checkout.control, name: "paymentMethod" });
  const error = createOrder.error instanceof ApiError ? createOrder.error.message : null;
  const availableCoins = wallet.data?.wallet?.availableCoins ?? 0;
  const radicoinCost = invoicePlan?.radicoinCost ?? 0;
  const appliedCoins = paymentMethod === "radicoin"
    ? Math.min(availableCoins, radicoinCost)
    : 0;
  const remainingRials = invoicePlan && radicoinCost > 0
    ? Math.max(
        0,
        Math.ceil(
          invoicePlan.priceRials * (radicoinCost - appliedCoins) / radicoinCost,
        ),
      )
    : invoicePlan?.priceRials ?? 0;

  const closeInvoice = () => {
    if (createOrder.isPending) return;
    createOrder.reset();
    setInvoicePlan(null);
  };

  const openInvoice = (plan: Plan) => {
    createOrder.reset();
    checkout.reset({ paymentMethod: "gateway" });
    setInvoicePlan(plan);
  };

  const confirmPurchase = (values: CheckoutForm) => {
    if (!invoicePlan) return;
    createOrder.mutate(
      {
        planId: invoicePlan.id,
        paymentMethod: values.paymentMethod,
        idempotencyKey: crypto.randomUUID(),
      },
      {
        onSuccess: (result) => {
          if (result.checkout !== "activated") return;
          setInvoicePlan(null);
          notify(`پلن ${result.planName} با رادیکوین فعال شد.`);
        },
      },
    );
  };

  return (
    <div className="grid gap-7">
      <header className="max-w-2xl">
        <span className="inline-flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]">
          <Crown size={18} /> خرید و ارتقا بسته
        </span>
        <h1 className="mb-0 mt-3 text-[28px] font-black text-[#19312f]">پلن مناسب مسیر شغلی‌ات را انتخاب کن</h1>
        <p className="mb-0 mt-3 text-[12px] leading-8 text-[#748582]">
          همه پلن‌ها ۳۰ روزه‌اند. تمدید همان پلن به زمان و اعتبار فعلی اضافه می‌شود و ارتقا بلافاصله فعال خواهد شد.
        </p>
      </header>

      {membership.data && (
        <section className="relative isolate overflow-hidden rounded-[22px] border border-[#c9e3d7] bg-[linear-gradient(110deg,#f7fcf9_0%,#e9f6f0_58%,#f8fbf7_100%)] px-5 py-5 shadow-[0_14px_36px_rgba(24,91,72,.07)] md:px-6">
          <span className="pointer-events-none absolute -right-12 -top-20 -z-10 size-52 rounded-full bg-[#bfe6d5]/35 blur-2xl" />
          <span className="pointer-events-none absolute -bottom-20 left-[24%] -z-10 size-44 rounded-full bg-[#f9e5a8]/25 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-[#0f7b62] text-white shadow-[0_10px_25px_rgba(15,123,98,.22)]">
                <Crown size={25} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6b827b]"><Sparkles size={13} className="text-[#b7891e]" /> اشتراک فعلی شما</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  <strong className="text-[20px] font-black text-[#19312f]">پلن {membership.data.plan.name}</strong>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold text-[#0f7b62] shadow-sm"><BadgeCheck size={13} /> فعال</span>
                </div>
                <p className="mb-0 mt-1 text-[9px] text-[#71847e]">همه امکانات این پلن آماده استفاده است.</p>
              </div>
            </div>
            <div className="flex min-w-[230px] items-center gap-3 rounded-[16px] border border-white/90 bg-white/75 px-4 py-3 shadow-[0_8px_24px_rgba(34,84,70,.08)] backdrop-blur-sm">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#fff5d8] text-[#a9780f]"><CalendarDays size={20} /></span>
              <div>
                <span className="block text-[9px] font-bold text-[#7a8b87]">اعتبار اشتراک تا</span>
                <strong className="mt-1 block text-[12px] text-[#294b44]"><PersianDateTime value={membership.data.expiresAt} /></strong>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid grid-cols-3 gap-5 max-[1050px]:grid-cols-1">
        {(plans.data ?? []).map((plan) => {
          const mascot = planMascots[plan.id];
          const current = membership.data?.planId === plan.id && membership.data.status === "active";
          const upgrading = Boolean(
            membership.data?.status === "active" &&
              membership.data.plan.sortOrder < plan.sortOrder,
          );
          const downgradeBlocked = Boolean(
            membership.data?.status === "active" &&
              membership.data.plan.sortOrder > plan.sortOrder,
          );
          const features = [
            `${formatLimit(plan.resumeLimit)} رزومه`,
            `${formatLimit(plan.pdfDownloadLimit)} خروجی PDF`,
            `${plan.aiCredits.toLocaleString("fa-IR")} اعتبار هوش مصنوعی`,
            `${plan.matchCredits.toLocaleString("fa-IR")} تحلیل تطبیق شغلی`,
            `${plan.interviewCredits.toLocaleString("fa-IR")} جلسه آمادگی مصاحبه`,
          ];
          return (
            <article
              className={`relative flex min-h-[430px] flex-col rounded-[22px] border bg-white p-6 shadow-[0_14px_40px_rgba(27,63,54,.06)] max-md:min-h-[380px] max-md:p-4 ${plan.id === "job-search" ? "border-[#69b39c] ring-4 ring-[#e9f5f0]" : "border-[#e1e8e2]"}`}
              key={plan.id}
            >
              {plan.id === "job-search" && <span className="absolute -top-3 left-6 rounded-full bg-[#0f7b62] px-3 py-1 text-[11px] text-white">پیشنهاد رادیکار</span>}
              <div className="flex min-h-[150px] items-center justify-between gap-3 max-md:min-h-[132px]">
                <div className="min-w-0 flex-1">
                  <h2 className="mb-0 text-[18px] font-black text-[#19312f]">{plan.name}</h2>
                  <p className="mb-0 mt-1 text-[10px] leading-6 text-[#7c8b88]">{plan.description}</p>
                </div>
                {mascot && (
                  <div className="relative -mb-5 -ml-3 -mt-4 h-[170px] w-[124px] shrink-0 self-start max-md:h-[150px] max-md:w-[110px]">
                    <Image
                      alt={mascot.alt}
                      className="object-contain object-bottom drop-shadow-[0_12px_18px_rgba(15,123,98,.14)]"
                      fill
                      sizes="(max-width: 1050px) 110px, 124px"
                      src={mascot.src}
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 border-y border-[#edf0ec] py-4 max-md:mt-3 max-md:py-3">
                <strong className="text-[25px] font-black">{plan.priceRials ? formatTomans(plan.priceRials) : "رایگان"}</strong>
                {plan.priceRials > 0 && <span className="mr-1 text-[10px] text-[#7d8c89]">تومان / ۳۰ روز</span>}
                {plan.radicoinCost && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#8c6812]">
                    <RadicoinCoinIcon size={22} />
                    یا {plan.radicoinCost.toLocaleString("fa-IR")} رادیکوین
                  </div>
                )}
              </div>
              <ul className="my-5 grid gap-3 p-0 text-[12px] text-[#536762] max-md:my-4 max-md:gap-2">
                {features.map((feature) => <li className="flex items-center gap-2" key={feature}><Check size={15} className="text-[#0f7b62]" />{feature}</li>)}
              </ul>
              <button
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border-0 bg-[#0f7b62] px-4 text-[11px] font-bold text-white disabled:bg-[#e7ece8] disabled:text-[#84918e]"
                disabled={!plan.isPurchasable || current || downgradeBlocked || createOrder.isPending}
                onClick={() => openInvoice(plan)}
                type="button"
              >
                {createOrder.isPending && createOrder.variables?.planId === plan.id && <LoaderCircle className="animate-spin" size={16} />}
                {current
                  ? "پلن فعلی"
                  : downgradeBlocked
                    ? "پس از پایان پلن فعلی"
                    : plan.isPurchasable
                      ? upgrading ? "ارتقا و فعال‌سازی" : "خرید و فعال‌سازی"
                      : "ویژه ثبت‌نام اول"}
              </button>
            </article>
          );
        })}
      </section>

      {invoicePlan && (
        <Modal
          title="پیش‌فاکتور خرید بسته"
          description="جزئیات سفارش و روش پرداخت را انتخاب کن؛ اگر رادیکوین کافی نباشد، فقط باقی‌مانده از درگاه پرداخت می‌شود."
          onClose={closeInvoice}
          showCloseButton
        >
          {error && (
            <div className="mt-5 rounded-[12px] border border-[#efc9c5] bg-[#fff1ef] px-4 py-3 text-[11px] leading-6 text-[#a13f37]" role="alert">
              {error}
            </div>
          )}

          <form className="mt-5" onSubmit={checkout.handleSubmit(confirmPurchase)}>
          <div className="overflow-hidden rounded-[14px] border border-[#dfe8e2] bg-[#fbfdfb]">
            <div className="flex items-center gap-3 border-b border-[#e5ece7] bg-[#edf7f2] px-4 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-white text-[#0f7b62] shadow-sm">
                <ReceiptText size={20} />
              </span>
              <div>
                <p className="m-0 text-[11px] text-[#71827e]">بسته انتخابی</p>
                <strong className="mt-1 block text-[15px] text-[#19312f]">{invoicePlan.name}</strong>
              </div>
            </div>
            <dl className="m-0 grid gap-0 px-4 text-[11px]">
              <div className="flex items-center justify-between gap-4 border-b border-[#edf1ee] py-3">
                <dt className="text-[#71827e]">مدت اعتبار</dt>
                <dd className="m-0 font-bold text-[#19312f]">{invoicePlan.durationDays.toLocaleString("fa-IR")} روز</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="font-bold text-[#19312f]">قیمت بسته</dt>
                <dd className="m-0 text-[18px] font-black text-[#0f7b62]">
                  {formatTomans(invoicePlan.priceRials)} <span className="text-[10px] font-bold">تومان</span>
                </dd>
              </div>
            </dl>
          </div>

          <fieldset className="mt-4 grid gap-3 border-0 p-0">
            <legend className="mb-2 text-[12px] font-black text-[#19312f]">روش پرداخت</legend>
            <label className={`flex cursor-pointer items-center gap-3 rounded-[14px] border p-4 transition ${paymentMethod === "gateway" ? "border-[#0f7b62] bg-[#edf7f2] ring-2 ring-[#d9eee5]" : "border-[#dfe8e2] bg-white"}`}>
              <input className="accent-[#0f7b62]" type="radio" value="gateway" {...checkout.register("paymentMethod")} />
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-white text-[#0f7b62] shadow-sm"><CreditCard size={20} /></span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[12px] text-[#19312f]">درگاه بانکی</strong>
                <span className="mt-1 block text-[10px] leading-6 text-[#71827e]">پرداخت کامل {formatTomans(invoicePlan.priceRials)} تومان از زرین‌پال</span>
              </span>
            </label>

            <label className={`flex items-center gap-3 rounded-[14px] border p-4 transition ${availableCoins <= 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${paymentMethod === "radicoin" ? "border-[#d19a1c] bg-[#fff9e8] ring-2 ring-[#f4e5b9]" : "border-[#dfe8e2] bg-white"}`}>
              <input className="accent-[#b47b05]" disabled={!invoicePlan.radicoinCost || wallet.isLoading || availableCoins <= 0} type="radio" value="radicoin" {...checkout.register("paymentMethod")} />
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#fff5cf]"><RadicoinCoinIcon size={34} /></span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[12px] text-[#19312f]">رادیکوین {availableCoins < radicoinCost && availableCoins > 0 ? "+ درگاه بانکی" : ""}</strong>
                <span className="mt-1 block text-[10px] leading-6 text-[#71827e]">
                  {wallet.isLoading
                    ? "در حال دریافت موجودی…"
                    : availableCoins > 0
                      ? `موجودی شما: ${availableCoins.toLocaleString("fa-IR")} رادیکوین`
                      : "برای این روش موجودی رادیکوین نداری"}
                </span>
              </span>
              {invoicePlan.radicoinCost && <span className="shrink-0 text-[11px] font-black text-[#9a6d0b]">{invoicePlan.radicoinCost.toLocaleString("fa-IR")}</span>}
            </label>
          </fieldset>

          {paymentMethod === "radicoin" && invoicePlan.radicoinCost && (
            <dl className="mt-4 grid gap-2 rounded-[14px] bg-[#f7f5ed] p-4 text-[11px]">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#71827e]">رادیکوین مصرفی</dt>
                <dd className="m-0 flex items-center gap-1.5 font-black text-[#8c6812]"><RadicoinCoinIcon size={20} />{appliedCoins.toLocaleString("fa-IR")}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[#e8e1ca] pt-2">
                <dt className="font-bold text-[#19312f]">باقی‌مانده پرداخت بانکی</dt>
                <dd className="m-0 text-[16px] font-black text-[#0f7b62]">{formatTomans(remainingRials)} <span className="text-[9px]">تومان</span></dd>
              </div>
            </dl>
          )}

          <p className="mt-4 flex items-center gap-2 rounded-[11px] bg-[#f4f7f5] px-4 py-3 text-[10px] leading-6 text-[#60716d]">
            <ShieldCheck className="shrink-0 text-[#0f7b62]" size={18} />
            رادیکوین تا پایان پرداخت رزرو می‌شود؛ در صورت انصراف یا ناموفق بودن درگاه، کامل به موجودی برمی‌گردد.
          </p>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              className="min-h-11 rounded-[11px] border border-[#dbe4de] bg-white px-5 text-[11px] font-bold text-[#536762] disabled:opacity-60"
              disabled={createOrder.isPending}
              onClick={closeInvoice}
              type="button"
            >
              انصراف
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border-0 bg-[#0f7b62] px-5 text-[11px] font-bold text-white disabled:opacity-60"
              disabled={createOrder.isPending}
              type="submit"
            >
              {createOrder.isPending && <LoaderCircle className="animate-spin" size={16} />}
              {paymentMethod === "radicoin" && remainingRials === 0
                ? "تأیید و فعال‌سازی با رادیکوین"
                : paymentMethod === "radicoin" && appliedCoins > 0
                  ? "تأیید و پرداخت باقی‌مانده"
                  : "تأیید و انتقال به درگاه"}
            </button>
          </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
