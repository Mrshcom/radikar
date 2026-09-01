import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f2] px-4">
      <section className="w-full max-w-md rounded-3xl border border-[#dcebe5] bg-white p-7 text-center">
        <span className="text-4xl font-black text-[#0f7b62]">۴۰۴</span>
        <h1 className="mt-3 text-lg font-extrabold text-[#19312f]">
          صفحه موردنظر پیدا نشد
        </h1>
        <p className="mt-2 text-xs leading-6 text-[#657572]">
          ممکن است آدرس تغییر کرده باشد یا این بخش دیگر در دسترس نباشد.
        </p>
        <Link
          className="mt-6 inline-flex min-h-10 items-center rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white"
          href="/dashboard"
        >
          بازگشت به داشبورد
        </Link>
      </section>
    </main>
  );
}
