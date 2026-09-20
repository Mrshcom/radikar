export function MembershipSummarySkeleton() {
  return (
    <section
      className="grid gap-5 rounded-[20px] border border-[#dfe8e2] bg-[#f8fbf9] p-5 sm:p-6"
      aria-busy="true"
      aria-label="در حال دریافت وضعیت پلن"
    >
      <div className="flex flex-col gap-4 min-[620px]:flex-row min-[620px]:items-center min-[620px]:justify-between">
        <div className="grid gap-2">
          <span className="h-2.5 w-16 animate-pulse rounded bg-[#e1eae4]" />
          <span className="h-6 w-28 animate-pulse rounded-md bg-[#dce8e1]" />
          <span className="h-2 w-24 animate-pulse rounded bg-[#e9efeb]" />
        </div>
        <div className="flex items-center gap-3 rounded-[14px] border border-[#d8e6de] bg-white px-4 py-3">
          <span className="size-5 animate-pulse rounded bg-[#dceee5]" />
          <span className="grid gap-2">
            <span className="h-2.5 w-28 animate-pulse rounded bg-[#e1eae4]" />
            <span className="h-2 w-24 animate-pulse rounded bg-[#edf2ef]" />
          </span>
        </div>
        <span className="h-11 w-32 animate-pulse rounded-[11px] bg-[#dce9e2] max-[619px]:w-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <article className="grid gap-4 rounded-[17px] border border-[#e2e9e4] bg-white p-4" key={index}>
            <div className="flex items-start gap-3">
              <span className="size-10 shrink-0 animate-pulse rounded-[12px] bg-[#e6f2ec]" />
              <span className="grid min-w-0 flex-1 gap-2">
                <span className="h-3 w-24 animate-pulse rounded bg-[#e2eae5]" />
                <span className="h-2 w-3/4 animate-pulse rounded bg-[#edf2ef]" />
              </span>
              <span className="h-5 w-20 animate-pulse rounded-full bg-[#edf5f1]" />
            </div>
            <span className="h-2 animate-pulse rounded-full bg-[#edf1ed]" />
            <div className="flex justify-between">
              <span className="h-2 w-20 animate-pulse rounded bg-[#edf2ef]" />
              <span className="h-2 w-16 animate-pulse rounded bg-[#edf2ef]" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
