"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[70vh] place-items-center px-4 py-12" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-[#efc9c5] bg-white p-7 text-center shadow-[0_18px_55px_rgba(22,63,55,.09)]">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fff1ef] text-[#a13f37]">
          <CircleAlert size={27} />
        </span>
        <h1 className="mt-5 text-lg font-extrabold text-[#19312f]">
          مشکلی در نمایش این بخش پیش آمد
        </h1>
        <p className="mt-2 text-xs leading-6 text-[#657572]">
          اطلاعات شما حذف نشده است. دوباره تلاش کنید و اگر مشکل ادامه داشت، صفحه
          را تازه‌سازی کنید.
        </p>
        <button
          className="mx-auto mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white"
          type="button"
          onClick={reset}
        >
          <RefreshCw size={16} />
          تلاش مجدد
        </button>
      </section>
    </main>
  );
}
