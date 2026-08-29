"use client";

import { Check, Crown, LoaderCircle, Sparkles } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import {
  formatLimit,
  formatTomans,
  useCreateOrder,
  useMembership,
  usePlans,
} from "@/lib/billing";

export default function UpgradePage() {
  const plans = usePlans();
  const membership = useMembership();
  const createOrder = useCreateOrder();
  const error = createOrder.error instanceof ApiError ? createOrder.error.message : null;

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
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#cfe5db] bg-[#edf7f2] px-5 py-4 text-[11px] text-[#315f54]">
          <span>پلن فعلی: <strong>{membership.data.plan.name}</strong></span>
          <span>اعتبار تا: <strong>{new Date(membership.data.expiresAt).toLocaleDateString("fa-IR")}</strong></span>
        </section>
      )}

      {error && <p className="m-0 rounded-xl border border-[#efc9c5] bg-[#fff1ef] p-4 text-[11px] text-[#a13f37]">{error}</p>}

      <section className="grid grid-cols-3 gap-5 max-[1050px]:grid-cols-1">
        {(plans.data ?? []).map((plan) => {
          const current = membership.data?.planId === plan.id && membership.data.status === "active";
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
              className={`relative flex min-h-[430px] flex-col rounded-[22px] border bg-white p-6 shadow-[0_14px_40px_rgba(27,63,54,.06)] ${plan.id === "job-search" ? "border-[#69b39c] ring-4 ring-[#e9f5f0]" : "border-[#e1e8e2]"}`}
              key={plan.id}
            >
              {plan.id === "job-search" && <span className="absolute -top-3 right-6 rounded-full bg-[#0f7b62] px-3 py-1 text-[9px] font-bold text-white">پیشنهاد رادیکار</span>}
              <span className="grid size-11 place-items-center rounded-[13px] bg-[#eaf5f0] text-[#0f7b62]"><Sparkles size={21} /></span>
              <h2 className="mb-0 mt-5 text-[18px] font-black text-[#19312f]">{plan.name}</h2>
              <p className="mb-0 mt-2 min-h-14 text-[10px] leading-7 text-[#7c8b88]">{plan.description}</p>
              <div className="mt-4 border-y border-[#edf0ec] py-4">
                <strong className="text-[25px] font-black">{plan.priceRials ? formatTomans(plan.priceRials) : "رایگان"}</strong>
                {plan.priceRials > 0 && <span className="mr-1 text-[10px] text-[#7d8c89]">تومان / ۳۰ روز</span>}
              </div>
              <ul className="my-5 grid gap-3 p-0 text-[10px] text-[#536762]">
                {features.map((feature) => <li className="flex items-center gap-2" key={feature}><Check size={15} className="text-[#0f7b62]" />{feature}</li>)}
              </ul>
              <button
                className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border-0 bg-[#0f7b62] px-4 text-[11px] font-bold text-white disabled:bg-[#e7ece8] disabled:text-[#84918e]"
                disabled={!plan.isPurchasable || current || downgradeBlocked || createOrder.isPending}
                onClick={() => createOrder.mutate(plan.id)}
                type="button"
              >
                {createOrder.isPending && createOrder.variables === plan.id && <LoaderCircle className="animate-spin" size={16} />}
                {current ? "پلن فعلی" : downgradeBlocked ? "پس از پایان پلن فعلی" : plan.isPurchasable ? "خرید و فعال‌سازی" : "ویژه ثبت‌نام اول"}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
