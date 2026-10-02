import { StatusState } from "./_components/status-state";

export default function NotFound() {
  return (
    <StatusState
      variant="notFound"
      title="صفحه موردنظر پیدا نشد"
      description="ممکن است آدرس تغییر کرده باشد یا این بخش دیگر در دسترس نباشد."
      actionLabel="بازگشت به داشبورد"
      href="/dashboard"
    />
  );
}
