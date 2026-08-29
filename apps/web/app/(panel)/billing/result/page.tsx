"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert } from "lucide-react";

export default function BillingResultPage() {
  const params = useSearchParams();
  const success = params.get("status") === "success";
  return (
    <section className="mx-auto grid max-w-xl place-items-center gap-5 rounded-[22px] border border-[#e3e9e3] bg-white p-10 text-center shadow-[0_15px_45px_rgba(27,63,54,.07)]">
      <span className={`grid size-16 place-items-center rounded-full ${success ? "bg-[#e8f6ef] text-[#0f7b62]" : "bg-[#fff1ef] text-[#b14848]"}`}>
        {success ? <CheckCircle2 size={32} /> : <CircleAlert size={32} />}
      </span>
      <h1 className="m-0 text-[22px] font-black">
        {success ? "پرداخت با موفقیت تأیید شد" : "پرداخت تکمیل نشد"}
      </h1>
      <p className="m-0 text-[11px] leading-7 text-[#748582]">
        {success
          ? "پلن و اعتبارهای جدید روی حساب شما فعال شدند."
          : "وجهی تأیید نشده است. جزئیات سفارش را بررسی و در صورت نیاز دوباره تلاش کنید."}
      </p>
      <div className="flex gap-3">
        <Link className="rounded-[11px] bg-[#0f7b62] px-4 py-3 text-[10px] font-bold text-white no-underline" href="/orders">مشاهده سفارش‌ها</Link>
        <Link className="rounded-[11px] border border-[#dfe5df] px-4 py-3 text-[10px] font-bold text-[#526461] no-underline" href="/dashboard">بازگشت به پنل</Link>
      </div>
    </section>
  );
}
