"use client";

import { useEffect } from "react";
import { StatusState } from "./_components/status-state";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusState
      variant="error"
      title="مشکلی در نمایش این بخش پیش آمد"
      description="اطلاعات شما حذف نشده است. دوباره تلاش کنید و اگر مشکل ادامه داشت، صفحه را تازه‌سازی کنید."
      actionLabel="تلاش مجدد"
      onAction={reset}
    />
  );
}
