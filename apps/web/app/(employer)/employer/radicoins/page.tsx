"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, CreditCard, LoaderCircle, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { RadicoinIcon } from "@/app/(panel)/_components/radicoin-icon";
import { formatTomans } from "@/lib/billing";
import { PersianDateTime } from "@/lib/date-time-display";
import { useRadicoinWallet } from "@/lib/radicoins";
import { useCreateRadicoinPackOrder, useRadicoinPackOrders, useRadicoinPacks } from "@/lib/radicoin-packs";

const schema = z.object({ packId: z.string().min(1, "یک بسته انتخاب کن.") });
type FormValues = z.infer<typeof schema>;
const statusLabels = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", failed: "ناموفق", canceled: "لغوشده" };

export default function EmployerRadicoinStorePage() {
  const packs = useRadicoinPacks();
  const orders = useRadicoinPackOrders();
  const wallet = useRadicoinWallet();
  const createOrder = useCreateRadicoinPackOrder();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { packId: "" },
  });
  const selectedPackId = useWatch({ control, name: "packId" });

  useEffect(() => {
    if (!selectedPackId && packs.data?.[1]) setValue("packId", packs.data[1].id);
  }, [packs.data, selectedPackId, setValue]);

  const submit = handleSubmit(async ({ packId }) => {
    const result = await createOrder.mutateAsync({ packId, idempotencyKey: crypto.randomUUID() });
    if (result.paymentUrl) window.location.assign(result.paymentUrl);
  });

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <Link
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#587069] no-underline hover:text-[#0f7b62]"
        href="/employer/account-center"
      >
        <ArrowRight aria-hidden="true" size={17} /> بازگشت به مرکز کارفرما
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[26px] font-black text-[#19312f] sm:text-[30px]">خرید رادیکوین</h1>
          <p className="mb-0 mt-2 text-sm leading-7 text-[#6c7f79]">
            کیف پولت را برای پایش رزومه و دعوت نامزدها به مصاحبه شارژ کن.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-[#eddfba] bg-[#fff9e9] px-4 py-3">
          <RadicoinIcon size={28} />
          <span>
            <small className="block text-[10px] text-[#846f43]">موجودی فعلی</small>
            <strong className="text-lg text-[#463b21]">
              {(wallet.data?.wallet?.availableCoins ?? 0).toLocaleString("fa-IR")} رادیکوین
            </strong>
          </span>
        </div>
      </header>

      <form className="mt-6" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-3">
          {(packs.data ?? []).map((pack, index) => {
            const selected = selectedPackId === pack.id;
            return (
              <label
                className={`relative cursor-pointer rounded-[20px] border bg-white p-5 transition ${selected ? "border-[#0f7b62] ring-3 ring-[#dcefe7]" : "border-[#dfe8e3] hover:border-[#a9cdbc]"}`}
                key={pack.id}
              >
                <input className="sr-only" type="radio" value={pack.id} {...register("packId")} />
                {index === 1 && (
                  <span className="absolute -top-3 right-5 rounded-full bg-[#0f7b62] px-3 py-1 text-[10px] font-bold text-white">
                    پیشنهاد رادیکار
                  </span>
                )}
                <span className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-[14px] bg-[#fff4d6] text-[#a4771d]">
                    <RadicoinIcon size={23} />
                  </span>
                  {selected && (
                    <span className="grid size-7 place-items-center rounded-full bg-[#0f7b62] text-white">
                      <Check size={16} />
                    </span>
                  )}
                </span>
                <strong className="mt-5 block text-base text-[#19312f]">{pack.name}</strong>
                <span className="mt-2 block text-2xl font-black text-[#19312f]">
                  {pack.coins.toLocaleString("fa-IR")}{" "}
                  <small className="text-xs font-semibold text-[#778781]">رادیکوین</small>
                </span>
                <span className="mt-5 block border-t border-[#edf1ee] pt-4 text-sm font-bold text-[#0f7b62]">
                  {formatTomans(pack.amountRials)} تومان
                </span>
              </label>
            );
          })}
        </div>
        {errors.packId && <p className="mb-0 mt-3 text-xs font-semibold text-[#b84936]">{errors.packId.message}</p>}
        {createOrder.error && (
          <p className="mb-0 mt-3 rounded-xl bg-[#fff0ed] p-3 text-xs font-semibold text-[#b84936]">
            {createOrder.error.message}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#dfe8e3] bg-white p-4 sm:p-5">
          <span className="flex items-center gap-3 text-xs leading-6 text-[#64756f]">
            <ShieldCheck className="shrink-0 text-[#0f7b62]" size={21} /> پس از تأیید درگاه، رادیکوین‌ها به‌صورت خودکار
            به کیف پول اضافه می‌شوند.
          </span>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[13px] bg-[#0f7b62] px-6 text-sm font-bold text-white hover:bg-[#0b6954] disabled:cursor-not-allowed disabled:opacity-55"
            disabled={createOrder.isPending || packs.isPending}
            type="submit"
          >
            {createOrder.isPending ? <LoaderCircle className="animate-spin" size={18} /> : <CreditCard size={18} />}{" "}
            ادامه و پرداخت آنلاین <ArrowLeft size={17} />
          </button>
        </div>
      </form>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <ReceiptText className="text-[#0f7b62]" size={20} />
          <h2 className="m-0 text-base font-black text-[#19312f]">خریدهای اخیر رادیکوین</h2>
        </div>
        <div className="mt-3 overflow-hidden rounded-[18px] border border-[#e1e9e4] bg-white">
          {orders.isPending ? (
            <p className="m-0 p-5 text-sm text-[#71817d]">در حال دریافت سفارش‌ها…</p>
          ) : orders.data?.length ? (
            orders.data.map((order) => (
              <div
                className="flex flex-wrap items-center gap-3 border-b border-[#edf1ee] p-4 last:border-0"
                key={order.id}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-[#fff5dc] text-[#a57925]">
                  <RadicoinIcon size={20} />
                </span>
                <span className="min-w-36 flex-1">
                  <strong className="block text-sm text-[#294a40]">
                    {order.coins.toLocaleString("fa-IR")} رادیکوین
                  </strong>
                  <small className="mt-1 block text-[10px] text-[#82908c]">
                    <PersianDateTime value={order.createdAt} />
                  </small>
                </span>
                <span className="text-xs font-bold text-[#516760]">{formatTomans(order.amountRials)} تومان</span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${order.status === "paid" ? "bg-[#e6f5ec] text-[#0b735b]" : order.status === "pending" ? "bg-[#fff4d7] text-[#8b681e]" : "bg-[#fff0ed] text-[#b34d3b]"}`}
                >
                  {statusLabels[order.status]}
                </span>
              </div>
            ))
          ) : (
            <p className="m-0 p-5 text-sm text-[#71817d]">هنوز خرید رادیکوینی ثبت نشده است.</p>
          )}
        </div>
      </section>
    </div>
  );
}
