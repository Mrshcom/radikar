"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="grid min-h-screen place-items-center bg-[#f6f7f2] px-4 font-sans text-[#19312f]">
        <main className="w-full max-w-md rounded-3xl border border-[#efc9c5] bg-white p-7 text-center">
          <h1 className="text-lg font-extrabold">خطای پیش‌بینی‌نشده‌ای رخ داد</h1>
          <p className="mt-3 text-xs leading-6 text-[#657572]">
            اطلاعات شما حذف نشده است. لطفاً دوباره تلاش کنید.
          </p>
          <button
            className="mt-6 min-h-10 rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white"
            type="button"
            onClick={reset}
          >
            تلاش مجدد
          </button>
        </main>
      </body>
    </html>
  );
}
