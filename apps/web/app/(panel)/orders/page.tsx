"use client";

import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { useState } from "react";
import { formatTomans, useOrders } from "@/lib/billing";

const statusLabel = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", failed: "ناموفق", canceled: "لغوشده", refunded: "بازگشت وجه" } as const;

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const orders = useOrders(page);
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><ReceiptText size={18} /> سفارش‌ها</span>
          <h1 className="mb-0 mt-3 text-[26px] font-black">سفارش‌ها و پرداخت‌های من</h1>
        </div>
        <Link className="rounded-[11px] bg-[#0f7b62] px-4 py-3 text-[10px] font-bold text-white no-underline" href="/upgrade">خرید یا ارتقای بسته</Link>
      </header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-right text-[10px]">
            <thead className="bg-[#f7f9f6] text-[#71817e]"><tr>{["شماره سفارش", "پلن", "مبلغ", "وضعیت", "تاریخ", "کد پیگیری"].map((title) => <th className="px-4 py-3" key={title}>{title}</th>)}</tr></thead>
            <tbody>
              {(orders.data?.items ?? []).map(({ order, plan }) => (
                <tr className="border-t border-[#edf0ec]" key={order.id}>
                  <td className="px-4 py-4 font-bold" dir="ltr">{order.orderNumber}</td>
                  <td className="px-4 py-4">{plan.name}</td>
                  <td className="px-4 py-4">{formatTomans(order.amountRials)} تومان</td>
                  <td className="px-4 py-4">{statusLabel[order.status]}</td>
                  <td className="px-4 py-4 text-[#71817e]">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</td>
                  <td className="px-4 py-4" dir="ltr">{order.refId || "—"}</td>
                </tr>
              ))}
              {!orders.isLoading && !orders.data?.items.length && <tr><td className="px-4 py-12 text-center text-[#84918e]" colSpan={6}>هنوز سفارشی ثبت نشده است.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#edf0ec] p-4 text-[9px]">
          <button className="rounded-lg border border-[#dfe5df] bg-white px-3 py-2 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>صفحه قبل</button>
          صفحه {page.toLocaleString("fa-IR")}
          <button className="rounded-lg border border-[#dfe5df] bg-white px-3 py-2 disabled:opacity-40" disabled={(orders.data?.items.length ?? 0) < 20} onClick={() => setPage((value) => value + 1)}>صفحه بعد</button>
        </div>
      </section>
    </div>
  );
}
