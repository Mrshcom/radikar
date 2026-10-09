"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock3, ReceiptText, ShieldCheck, TriangleAlert } from "lucide-react";

const results = {
  success: {
    eyebrow: "پرداخت موفق؛ همه‌چیز آماده است",
    title: "پرداخت با موفقیت تأیید شد",
    description: "خبر خوب! سفارش شما ثبت شد و پلن و اعتبارهای جدید روی حسابتان فعال شدند.",
    note: "جزئیات خرید و اعتبارهای فعال‌شده را در سفارش‌ها ببینید.",
    image: "/illustrations/radikar-payment-success-v1.png",
    imageAlt: "رادیکار با رسید پرداخت موفق",
    primaryHref: "/orders",
    primaryLabel: "مشاهده سفارش‌ها",
    accentClass: "bg-[#dcf4e8] text-[#08795d]",
    glowClass: "bg-[#d9efe2]",
  },
  failed: {
    eyebrow: "پرداخت تأیید نشد",
    title: "پرداخت تکمیل نشد",
    description:
      "درگاه، تأیید نهایی این پرداخت را برنگرداند. وضعیت سفارش را بررسی کنید و در صورت نیاز دوباره تلاش کنید.",
    note: "اگر مبلغی از حسابتان کسر شده، نتیجه را از بخش سفارش‌ها پیگیری کنید.",
    image: "/illustrations/radikar-payment-failed-v1.png",
    imageAlt: "رادیکار با رسید پرداخت ناموفق",
    primaryHref: "/upgrade",
    primaryLabel: "تلاش مجدد",
    accentClass: "bg-[#ffebd5] text-[#ad6126]",
    glowClass: "bg-[#fbe7d5]",
  },
  pending: {
    eyebrow: "در انتظار پاسخ درگاه",
    title: "تأیید پرداخت در حال بررسی است",
    description: "هنوز پاسخ قطعی درگاه دریافت نشده است. پس از تأیید، سفارش به‌صورت خودکار تکمیل می‌شود.",
    note: "لطفاً قبل از تلاش دوباره، وضعیت سفارش را در بخش سفارش‌ها بررسی کنید.",
    image: null,
    imageAlt: "",
    primaryHref: "/orders",
    primaryLabel: "بررسی وضعیت سفارش",
    accentClass: "bg-[#fff2d7] text-[#93651c]",
    glowClass: "bg-[#f7ecd2]",
  },
} as const;

export default function BillingResultPage() {
  const params = useSearchParams();
  const status =
    params.get("status") === "success" ? "success" : params.get("status") === "pending" ? "pending" : "failed";
  const result = results[status];
  const StatusIcon = status === "success" ? BadgeCheck : status === "pending" ? Clock3 : TriangleAlert;

  return (
    <section
      aria-labelledby="billing-result-title"
      className="relative isolate mx-auto w-full max-w-[1280px] px-4 pt-0 pb-6 sm:px-8 lg:pb-8"
    >
      <div className="relative flex flex-col lg:min-h-[600px] lg:flex-row">
        <div className="relative z-10 order-2 flex flex-1 flex-col justify-center pb-10 text-right sm:px-4 lg:order-1 lg:py-14 lg:pr-8 lg:pl-4">
          <div
            className={`mb-7 flex items-center gap-3 font-extrabold ${status === "failed" ? "text-base text-[#a35c27] sm:text-lg" : status === "success" ? "text-base text-[#08795d] sm:text-lg" : "text-sm text-[#477066] sm:text-base"}`}
          >
            <span
              className={`grid shrink-0 place-items-center rounded-full ${status === "failed" ? "size-12 shadow-[0_0_0_8px_rgba(255,233,206,0.42)]" : status === "success" ? "size-12 shadow-[0_0_0_8px_rgba(218,244,230,0.55)]" : "size-10"} ${result.accentClass}`}
            >
              <StatusIcon aria-hidden="true" className={status === "pending" ? "size-5" : "size-6"} strokeWidth={2.3} />
            </span>
            <span>{result.eyebrow}</span>
          </div>

          <h1
            id="billing-result-title"
            className="m-0 max-w-[690px] text-[clamp(2.175rem,3.8vw,4.125rem)] leading-[1.35] font-black tracking-tight text-[#163b33]"
          >
            {result.title}
          </h1>
          <p className="mb-0 mt-6 max-w-[620px] text-base leading-[2.1] text-[#647973] sm:text-xl">
            {result.description}
          </p>

          <div className="mt-7 flex max-w-[570px] items-start gap-3 text-sm leading-8 text-[#587069] sm:text-base">
            <ReceiptText aria-hidden="true" className="mt-1 size-5 shrink-0 text-[#14846a]" />
            <span>{result.note}</span>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href={result.primaryHref}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-[#0f7b62] px-7 text-base font-bold text-white no-underline shadow-[0_12px_28px_rgba(15,123,98,0.18)] transition-[background-color,box-shadow] duration-200 hover:bg-[#0b6c55] hover:shadow-[0_15px_30px_rgba(15,123,98,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
            >
              {result.primaryLabel}
              <ArrowLeft aria-hidden="true" className="size-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex min-h-14 items-center justify-center text-base font-bold text-[#38564e] underline-offset-8 transition-colors duration-200 hover:text-[#0f7b62] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
            >
              بازگشت به پنل
            </Link>
          </div>
          <p className="mb-0 mt-10 flex items-center gap-2 text-xs leading-6 text-[#83948d]">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
            وضعیت نهایی سفارش همیشه در بخش سفارش‌ها قابل مشاهده است.
          </p>
        </div>

        <div className="relative order-1 h-[330px] shrink-0 sm:h-[440px] lg:order-2 lg:h-auto lg:w-[44%]">
          <div
            aria-hidden="true"
            className={`absolute top-[18%] left-[8%] size-[72%] rounded-full blur-[80px] ${result.glowClass}`}
          />
          <div
            aria-hidden="true"
            className="absolute top-[12%] left-[12%] size-3 rounded-full bg-[#e7bc70]/65 sm:size-4"
          />
          <div
            aria-hidden="true"
            className="absolute right-[10%] bottom-[20%] size-2 rounded-full bg-[#89c9ad]/70 sm:size-3"
          />
          {result.image ? (
            <Image
              src={result.image}
              alt={result.imageAlt}
              width={1024}
              height={1536}
              priority
              sizes="(min-width: 1024px) 43vw, 100vw"
              className="relative mx-auto h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_30px_35px_rgba(36,75,62,0.14)] lg:h-[105%]"
            />
          ) : (
            <div aria-hidden="true" className="relative mx-auto flex h-full items-center justify-center">
              <Clock3
                className="size-32 text-[#b08535] drop-shadow-[0_18px_20px_rgba(111,91,40,0.14)] sm:size-44"
                strokeWidth={1.4}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
