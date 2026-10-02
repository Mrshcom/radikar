export function SettingsSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6" aria-busy="true" aria-label="در حال دریافت تنظیمات">
      <header className="grid gap-3">
        <span className="h-5 w-36 animate-pulse rounded-md bg-[#e4ece8]" />
        <span className="h-8 w-32 animate-pulse rounded-md bg-[#e4ece8]" />
        <span className="h-4 w-3/4 animate-pulse rounded-md bg-[#edf2ef]" />
      </header>
      <div className="flex gap-2 border-b border-[#e3e9e3]">
        <span className="h-11 w-32 animate-pulse rounded-t-md bg-[#e8efeb]" />
        <span className="h-11 w-24 animate-pulse rounded-t-md bg-[#f0f4f1]" />
      </div>
      <section className="grid gap-5 rounded-[20px] border border-[#e3e9e3] bg-white p-5 sm:p-6">
        <span className="h-5 w-32 animate-pulse rounded-md bg-[#e4ece8]" />
        <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
          {[1, 2].map((item) => (
            <span className="h-[70px] animate-pulse rounded-xl border border-[#edf1ee] bg-[#f1f5f2]" key={item} />
          ))}
        </div>
        <span className="h-11 w-full animate-pulse rounded-[10px] bg-[#f1f5f2]" />
        <span className="h-11 w-full animate-pulse rounded-[10px] bg-[#f1f5f2]" />
        <div className="flex flex-col gap-3 border-t border-[#edf0ec] pt-4 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-between">
          <span className="h-4 w-44 animate-pulse rounded-md bg-[#edf2ef]" />
          <span className="h-10 w-32 animate-pulse rounded-[10px] bg-[#dce9e2] max-[560px]:w-full" />
        </div>
      </section>
    </div>
  );
}
