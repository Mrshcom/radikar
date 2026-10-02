"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Home, RefreshCw } from "lucide-react";

type StatusStateProps = {
  variant: "error" | "notFound";
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  onAction?: () => void;
};

export function StatusState({ variant, title, description, actionLabel, href, onAction }: StatusStateProps) {
  const isError = variant === "error";
  const illustrationSrc = isError ? "/illustrations/status-error-v3.png" : "/illustrations/status-not-found-v3.png";

  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#f6f7f2] px-4 py-12" dir="rtl">
      <section
        className={`relative w-full max-w-2xl overflow-hidden rounded-[28px] border bg-white px-6 py-12 text-center shadow-[0_24px_70px_rgba(22,63,55,.1)] sm:px-12 ${isError ? "border-[#efc9c5]" : "border-[#dcebe5]"}`}
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -left-16 -top-20 size-48 rounded-full blur-3xl ${isError ? "bg-[#ffe2dd]" : "bg-[#d9f2e7]"}`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -bottom-24 -right-16 size-52 rounded-full blur-3xl ${isError ? "bg-[#fff0df]" : "bg-[#e5f4ef]"}`}
        />
        <div className="relative mx-auto mb-2 flex h-64 w-full max-w-sm items-center justify-center sm:h-72 sm:max-w-[420px]">
          <Image
            src={illustrationSrc}
            alt=""
            width={716}
            height={716}
            priority
            className="relative z-10 size-full object-contain"
          />
        </div>
        <div className="relative">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold ${isError ? "bg-[#fff0ed] text-[#a64b42]" : "bg-[#eaf7f1] text-[#0f705a]"}`}
          >
            {isError ? "خطای موقت" : "مسیر پیدا نشد"}
          </span>
          <h1 className="mt-4 text-[22px] font-black leading-[1.7] text-[#19312f] sm:text-[26px]">{title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-[11px] leading-8 text-[#657572] sm:text-[12px]">{description}</p>
          {href ? (
            <Link
              className="mx-auto mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f7b62] px-6 text-[11px] font-bold text-white no-underline shadow-[0_8px_18px_rgba(15,123,98,.18)] transition hover:bg-[#0c6b55]"
              href={href}
            >
              <Home size={16} /> {actionLabel}
            </Link>
          ) : (
            <button
              className="mx-auto mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f7b62] px-6 text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(15,123,98,.18)] transition hover:bg-[#0c6b55]"
              type="button"
              onClick={onAction}
            >
              <RefreshCw size={16} /> {actionLabel}
            </button>
          )}
          <span aria-hidden="true" className="mx-auto mt-7 flex w-fit items-center gap-1 text-[9px] text-[#a1afaa]">
            {isError ? "اگر مشکل ادامه داشت، صفحه را تازه‌سازی کن" : "از منوی پنل مسیر دیگری را انتخاب کن"}{" "}
            <ArrowRight size={12} className="rotate-180" />
          </span>
        </div>
      </section>
    </main>
  );
}
