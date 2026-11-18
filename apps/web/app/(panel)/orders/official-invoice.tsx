"use client";

import Image from "next/image";
import { Download } from "lucide-react";
import type { ReactNode } from "react";
import { Modal } from "../_components/ui";
import { formatPersianDateTime } from "@/lib/date-time";
import { type Order, type Plan } from "@/lib/billing";

type InvoiceBuyer = { name: string; phone: string | null };
type Invoice = { order: Order; plan: Plan; buyer: InvoiceBuyer };

function LabelValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <p className="m-0 text-[10px] leading-7 text-[#344740]">
      <span className="font-black text-[#1e322c]">{label}: </span>
      {children}
    </p>
  );
}

function InvoiceDocument({ order, plan, buyer }: Invoice) {
  const issuedAt = order.paidAt ?? order.createdAt;
  const amountRials = order.amountRials.toLocaleString("fa-IR");

  return (
    <article className="overflow-hidden rounded-[3px] border border-[#e5e8e6] bg-white px-7 py-8 text-[#263832] shadow-[0_14px_42px_rgba(20,54,46,.08)] sm:px-10 sm:py-9">
      <header className="flex items-start justify-between gap-5 border-b-2 border-[#e7eae8] pb-5">
        <div className="flex items-center gap-3.5">
          <Image alt="لوگوی رادیکار" height={45} priority src="/radikar-logo-v20261117.png" width={45} />
          <div>
            <h3 className="m-0 text-[23px] font-black tracking-[-.5px] text-[#19312f]">فاکتور فروش خدمات</h3>
            <span className="mt-1 block text-[9px] font-bold text-[#73837e]">رادیکار · خدمات حرفه‌ای مسیر شغلی</span>
          </div>
        </div>
        <div className="text-left text-[10px] leading-7 text-[#475c54]">
          <p className="m-0"><span className="font-black">شماره فاکتور: </span><bdi dir="ltr">{order.orderNumber}</bdi></p>
          <p className="m-0"><span className="font-black">تاریخ صدور: </span><bdi dir="ltr">{formatPersianDateTime(issuedAt)}</bdi></p>
        </div>
      </header>

      <section className="border-b border-[#e7eae8] py-5">
        <h4 className="m-0 text-[14px] font-black text-[#1d312b]">اطلاعات فروشنده</h4>
        <div className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <LabelValue label="نام">رادیکار</LabelValue>
          <LabelValue label="نوع خدمات">سامانهٔ خدمات حرفه‌ای و استخدام</LabelValue>
        </div>
      </section>

      <section className="border-b border-[#e7eae8] py-5">
        <h4 className="m-0 text-[14px] font-black text-[#1d312b]">اطلاعات خریدار</h4>
        <div className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <LabelValue label="نام/شرکت">{buyer.name}</LabelValue>
          <LabelValue label="شماره تماس"><bdi dir="ltr">{buyer.phone ?? "—"}</bdi></LabelValue>
        </div>
      </section>

      <section className="py-5">
        <h4 className="m-0 text-[14px] font-black text-[#1d312b]">جزئیات فاکتور</h4>
        <div className="mt-3 overflow-hidden border border-[#dfe5e2]">
          <div className="grid grid-cols-[minmax(0,2.1fr)_0.55fr_1fr_0.85fr] border-b border-[#dfe5e2] bg-[#f5f7f6] text-center text-[9px] font-black text-[#2e413a]">
            <span className="border-e border-[#dfe5e2] px-2 py-3 text-right">شرح</span>
            <span className="border-e border-[#dfe5e2] px-2 py-3">تعداد</span>
            <span className="border-e border-[#dfe5e2] px-2 py-3">مبلغ واحد (ریال)</span>
            <span className="px-2 py-3">مبلغ کل (ریال)</span>
          </div>
          <div className="grid min-h-17 grid-cols-[minmax(0,2.1fr)_0.55fr_1fr_0.85fr] text-center text-[10px] text-[#344740]">
            <span className="flex items-center border-e border-[#dfe5e2] px-3 py-4 text-right font-bold">اشتراک پلن {plan.name} · {plan.durationDays.toLocaleString("fa-IR")} روز</span>
            <span className="flex items-center justify-center border-e border-[#dfe5e2] px-2 py-4">۱</span>
            <span className="flex items-center justify-center border-e border-[#dfe5e2] px-2 py-4">{amountRials}</span>
            <span className="flex items-center justify-center px-2 py-4 font-black">{amountRials}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#dfe5e2] bg-[#fafbfa] px-4 py-3 text-[11px]">
            <strong>جمع کل (ریال)</strong>
            <strong>{amountRials}</strong>
          </div>
        </div>
        <div className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <LabelValue label="روش پرداخت">{order.gateway === "radicoin" ? "رادیکوین" : "درگاه بانکی"}</LabelValue>
          <LabelValue label="کد پیگیری"><bdi dir="ltr">{order.refId ?? "—"}</bdi></LabelValue>
        </div>
      </section>

      <footer className="flex items-end justify-between gap-5 border-t-2 border-[#e7eae8] pt-5">
        <p className="m-0 text-[9px] leading-6 text-[#74837f]">این فاکتور به‌صورت الکترونیکی توسط رادیکار صادر شده و اعتبار آن از طریق شماره فاکتور قابل پیگیری است.</p>
        <div className="shrink-0 text-left">
          <strong className="block text-[11px] text-[#385148]">با سپاس از خرید شما</strong>
          <span className="mt-1 block text-[9px] text-[#81908b]">رادیکار</span>
        </div>
      </footer>
    </article>
  );
}

export function OfficialInvoiceModal({ order, plan, buyer, onClose }: Invoice & { onClose: () => void }) {
  return (
    <>
      <Modal
        title="فاکتور رسمی رادیکار"
        description="نسخهٔ PDF رسمی، بدون اطلاعات مرورگر، با دکمهٔ پایین مستقیم دانلود می‌شود."
        onClose={onClose}
        showCloseButton
        modalClassName="!w-[min(780px,calc(100vw-32px))] !max-w-[780px]"
      >
        <div className="mt-5">
          <InvoiceDocument order={order} plan={plan} buyer={buyer} />
          <div className="mt-5 flex justify-end">
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[11px] bg-[#0f7b62] px-5 text-[12px] font-bold text-white"
              href={`/api/billing/orders/${order.id}/invoice`}
            >
              <Download size={17} /> دریافت PDF فاکتور
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
