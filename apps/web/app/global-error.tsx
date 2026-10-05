"use client";

import { StatusState } from "./_components/status-state";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans text-[#19312f]">
        <StatusState
          variant="error"
          title="خطای پیش‌بینی‌نشده‌ای رخ داد"
          description="اطلاعات شما حذف نشده است. لطفاً دوباره تلاش کنید."
          actionLabel="تلاش مجدد"
          onAction={reset}
        />
      </body>
    </html>
  );
}
