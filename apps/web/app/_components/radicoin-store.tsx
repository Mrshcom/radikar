"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, CreditCard, LoaderCircle, ReceiptText, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { RadicoinIcon } from "@/app/(panel)/_components/radicoin-icon";
import { Modal, SectionBackLink, SectionTitle } from "@/app/(panel)/_components/ui";
import { formatTomans } from "@/lib/billing";
import { PersianDateTime } from "@/lib/date-time-display";
import { useRadicoinWallet } from "@/lib/radicoins";
import { type RadicoinPack, useCreateRadicoinPackOrder, useRadicoinPackOrders, useRadicoinPacks } from "@/lib/radicoin-packs";

const schema = z.object({ packId: z.string().min(1, "یک بسته انتخاب کن.") });
type FormValues = z.infer<typeof schema>;
const statusLabels = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", failed: "ناموفق", canceled: "لغوشده" };
const packIllustrations: Record<string, { src: string; alt: string }> = {
  "radicoin-25": { src: "/illustrations/radicoin-pouch-pack-v2.png", alt: "کیسهٔ رادیکوین" },
  "radicoin-150": { src: "/illustrations/radicoin-chest-pack-v2.png", alt: "صندوق رادیکوین" },
  "radicoin-500": { src: "/illustrations/radicoin-vault-pack-v2.png", alt: "خزانهٔ رادیکوین" },
};

type RadicoinStoreProps = { backHref: string; backLabel: string; description: string };

export function RadicoinStore({ backHref, backLabel, description }: RadicoinStoreProps) {
  const packs = useRadicoinPacks();
  const orders = useRadicoinPackOrders();
  const wallet = useRadicoinWallet();
  const createOrder = useCreateRadicoinPackOrder();
  const [invoicePack, setInvoicePack] = useState<RadicoinPack | null>(null);
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { packId: "" },
  });
  const selectedPackId = useWatch({ control, name: "packId" });

  useEffect(() => {
    if (!selectedPackId && packs.data?.[1]) setValue("packId", packs.data[1].id);
  }, [packs.data, selectedPackId, setValue]);

  const closeInvoice = () => {
    if (createOrder.isPending) return;
    createOrder.reset();
    setInvoicePack(null);
  };

  const submit = handleSubmit(({ packId }) => {
    const pack = packs.data?.find((item) => item.id === packId);
    if (!pack) return;
    createOrder.reset();
    setInvoicePack(pack);
  });

  const confirmPurchase = async () => {
    if (!invoicePack) return;
    const result = await createOrder.mutateAsync({ packId: invoicePack.id, idempotencyKey: crypto.randomUUID() });
    if (result.paymentUrl) window.location.assign(result.paymentUrl);
  };

  return (
    <div className="mx-auto w-full max-w-5xl pb-8">
      <SectionTitle
        title="خرید رادیکوین"
        description={description}
        leading={<SectionBackLink href={backHref} label={backLabel} />}
        action={
          <div className="flex items-center gap-3 rounded-2xl border border-[#eddfba] bg-[#fff9e9] px-4 py-3">
          <Image
            alt="رادیکوین"
            className="size-9 shrink-0 object-contain"
            height={36}
            src="/illustrations/radicoin-coin-m-v3.png"
            width={36}
          />
          <span><small className="block text-[10px] text-[#846f43]">موجودی فعلی</small><strong className="text-lg text-[#463b21]">{(wallet.data?.wallet?.availableCoins ?? 0).toLocaleString("fa-IR")} رادیکوین</strong></span>
          </div>
        }
      />
      <form className="mt-6" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-3">
          {(packs.data ?? []).map((pack, index) => {
            const selected = selectedPackId === pack.id;
            const illustration = packIllustrations[pack.id];
            return <label className={`relative cursor-pointer rounded-[20px] border bg-white p-5 transition ${selected ? "border-[#0f7b62] ring-3 ring-[#dcefe7]" : "border-[#dfe8e3] hover:border-[#a9cdbc]"}`} key={pack.id}>
              <input className="sr-only" type="radio" value={pack.id} {...register("packId")} />
              {index === 1 && <span className="absolute -top-3 right-5 rounded-full bg-[#0f7b62] px-3 py-1 text-[10px] font-bold text-white">پیشنهاد رادیکار</span>}
              <span className="flex items-start justify-between gap-3"><span className="flex min-w-0 items-center gap-4">{illustration ? <Image alt={illustration.alt} className="size-32 shrink-0 object-contain" height={128} src={illustration.src} width={128} /> : <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#fff4d6] text-[#a4771d]"><RadicoinIcon size={23} /></span>}<strong className="truncate text-base text-[#19312f]">{pack.name}</strong></span>{selected && <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-[#0f7b62] text-white"><Check size={16} /></span>}</span>
              <span className="mt-4 flex min-h-16 items-center justify-between gap-3 border-t border-[#edf1ee] pt-4">
                <span className="text-2xl font-black text-[#19312f]">{pack.coins.toLocaleString("fa-IR")} <small className="text-xs font-semibold text-[#778781]">رادیکوین</small></span>
                <span className="flex flex-col items-end gap-1 text-left">
                  {pack.originalAmountRials && pack.originalAmountRials > pack.amountRials && <small className="text-[11px] font-semibold text-[#596660] line-through decoration-[#151c19] decoration-1">{formatTomans(pack.originalAmountRials)} تومان</small>}
                  <strong className="text-sm font-bold text-[#0f7b62]">{formatTomans(pack.amountRials)} تومان</strong>
                </span>
              </span>
            </label>;
          })}
        </div>
        {errors.packId && <p className="mb-0 mt-3 text-xs font-semibold text-[#b84936]">{errors.packId.message}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-[#dfe8e3] bg-white p-4 sm:p-5">
          <span className="flex items-center gap-3 text-xs leading-6 text-[#64756f]"><ShieldCheck className="shrink-0 text-[#0f7b62]" size={21} /> پس از تأیید درگاه، رادیکوین‌ها به‌صورت خودکار به کیف پول اضافه می‌شوند.</span>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[13px] bg-[#0f7b62] px-6 text-sm font-bold text-white hover:bg-[#0b6954] disabled:cursor-not-allowed disabled:opacity-55" disabled={createOrder.isPending || packs.isPending} type="submit">{createOrder.isPending ? <LoaderCircle className="animate-spin" size={18} /> : <CreditCard size={18} />} ادامه و پرداخت آنلاین <ArrowLeft size={17} /></button>
        </div>
      </form>
      {invoicePack && (
        <Modal
          title="پیش‌فاکتور خرید رادیکوین"
          description="جزئیات سفارش را بررسی کن؛ پس از تأیید، برای پرداخت کامل به درگاه بانکی منتقل می‌شوی."
          onClose={closeInvoice}
          showCloseButton
        >
          {createOrder.error && (
            <div className="mt-5 rounded-[12px] border border-[#efc9c5] bg-[#fff1ef] px-4 py-3 text-[11px] leading-6 text-[#a13f37]" role="alert">
              {createOrder.error.message}
            </div>
          )}
          <div className="mt-5 overflow-hidden rounded-[14px] border border-[#dfe8e2] bg-[#fbfdfb]">
            <div className="flex items-center gap-3 border-b border-[#e5ece7] bg-[#edf7f2] px-4 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-white text-[#0f7b62] shadow-sm">
                <RadicoinIcon size={20} />
              </span>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                <p className="m-0 text-[11px] text-[#71827e]">بسته انتخابی</p>
                <strong className="text-[15px] text-[#19312f]">{invoicePack.name}</strong>
              </div>
            </div>
            <dl className="m-0 grid gap-0 px-4 text-[11px]">
              <div className="flex items-center justify-between gap-4 border-b border-[#edf1ee] py-3">
                <dt className="text-[#71827e]">رادیکوین دریافتی</dt>
                <dd className="m-0 flex items-center gap-1.5 font-black text-[#9a6d0b]">
                  <Image alt="" aria-hidden="true" className="size-5 object-contain" height={20} src="/illustrations/radicoin-coin-m-v3.png" width={20} />
                  {invoicePack.coins.toLocaleString("fa-IR")}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="font-bold text-[#19312f]">قیمت بسته</dt>
                <dd className="m-0 text-[18px] font-black text-[#0f7b62]">
                  {formatTomans(invoicePack.amountRials)} <span className="text-[10px] font-bold">تومان</span>
                </dd>
              </div>
            </dl>
          </div>

          <section className="mt-4" aria-labelledby="radicoin-payment-method">
            <h3 className="mb-2 text-[12px] font-black text-[#19312f]" id="radicoin-payment-method">روش پرداخت</h3>
            <div className="flex items-center gap-3 rounded-[14px] border border-[#0f7b62] bg-[#edf7f2] p-4 ring-2 ring-[#d9eee5]">
              <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-white text-[#0f7b62] shadow-sm"><CreditCard size={20} /></span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[12px] text-[#19312f]">درگاه بانکی</strong>
                <span className="mt-1 block text-[10px] leading-6 text-[#71827e]">پرداخت کامل {formatTomans(invoicePack.amountRials)} تومان از زرین‌پال</span>
              </span>
            </div>
          </section>

          <p className="mt-4 flex items-center gap-2 rounded-[11px] bg-[#f4f7f5] px-4 py-3 text-[10px] leading-6 text-[#60716d]">
            <ShieldCheck className="shrink-0 text-[#0f7b62]" size={18} />
            پس از تأیید موفق پرداخت، رادیکوین‌ها به‌صورت خودکار به کیف پول اضافه می‌شوند.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button className="min-h-11 rounded-[11px] border border-[#dbe4de] bg-white px-5 text-[11px] font-bold text-[#536762] disabled:opacity-60" disabled={createOrder.isPending} type="button" onClick={closeInvoice}>انصراف</button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] border-0 bg-[#0f7b62] px-5 text-[11px] font-bold text-white disabled:opacity-60" disabled={createOrder.isPending} type="button" onClick={confirmPurchase}>
              {createOrder.isPending && <LoaderCircle className="animate-spin" size={16} />}
              تأیید و انتقال به درگاه
            </button>
          </div>
        </Modal>
      )}
      <section className="mt-8">
        <div className="flex items-center gap-2"><ReceiptText className="text-[#0f7b62]" size={20} /><h2 className="m-0 text-base font-black text-[#19312f]">خریدهای اخیر رادیکوین</h2></div>
        <div className="mt-3 overflow-hidden rounded-[18px] border border-[#e1e9e4] bg-white">
          {orders.isPending ? <p className="m-0 p-5 text-sm text-[#71817d]">در حال دریافت سفارش‌ها…</p> : orders.data?.length ? orders.data.map((order) => <div className="flex flex-wrap items-center gap-3 border-b border-[#edf1ee] p-4 last:border-0" key={order.id}><span className="grid size-10 place-items-center rounded-xl bg-[#fff5dc] text-[#a57925]"><RadicoinIcon size={20} /></span><span className="min-w-36 flex-1"><strong className="block text-sm text-[#294a40]">{order.coins.toLocaleString("fa-IR")} رادیکوین</strong><small className="mt-1 block text-[10px] text-[#82908c]"><PersianDateTime value={order.createdAt} /></small></span><span className="text-xs font-bold text-[#516760]">{formatTomans(order.amountRials)} تومان</span><span className={`rounded-full px-3 py-1 text-[10px] font-bold ${order.status === "paid" ? "bg-[#e6f5ec] text-[#0b735b]" : order.status === "pending" ? "bg-[#fff4d7] text-[#8b681e]" : "bg-[#fff0ed] text-[#b34d3b]"}`}>{statusLabels[order.status]}</span></div>) : <p className="m-0 p-5 text-sm text-[#71817d]">هنوز خرید رادیکوینی ثبت نشده است.</p>}
        </div>
      </section>
    </div>
  );
}
