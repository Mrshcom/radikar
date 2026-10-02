import { cn } from "@/lib/cn";

const repeatGrid = "grid grid-cols-1 gap-3 min-[561px]:grid-cols-2 min-[1121px]:grid-cols-3 min-[1800px]:grid-cols-4";

export function KnowledgeCardsSkeleton() {
  return (
    <div className="grid gap-4" aria-label="در حال استخراج اطلاعات رزومه" aria-busy="true">
      {[7, 4, 1, 1, 5].map((fieldCount, cardIndex) => (
        <section
          className="rounded-[18px] border border-[#e7ebe6] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.045)]"
          key={cardIndex}
        >
          <header className="mb-5 flex items-center gap-3">
            <i className="size-10 animate-pulse rounded-xl bg-[#e8eeea]" />
            <div className="grid flex-1 gap-2">
              <i className="h-3 w-32 animate-pulse rounded bg-[#e8eeea]" />
              <i className="h-2 w-56 max-w-full animate-pulse rounded bg-[#eef2ef]" />
            </div>
            {(cardIndex === 2 || cardIndex === 3) && <i className="h-8 w-24 animate-pulse rounded-lg bg-[#e8eeea]" />}
          </header>
          <div className={repeatGrid}>
            {Array.from({ length: fieldCount }, (_, fieldIndex) => {
              const multiline =
                (cardIndex === 0 && fieldIndex === fieldCount - 1) || (cardIndex === 4 && fieldIndex >= 3);
              const fullWidth = multiline || cardIndex === 2 || cardIndex === 3;
              return (
                <div className={cn("grid gap-1.5", fullWidth && "col-span-full")} key={fieldIndex}>
                  <i className="h-2 w-16 animate-pulse rounded bg-[#e8eeea]" />
                  <i className={cn("h-[42px] animate-pulse rounded-[10px] bg-[#eef2ef]", multiline && "h-24")} />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function KnowledgeSectionSkeleton() {
  return (
    <section className="grid gap-4 rounded-[18px] border border-[#e7ebe6] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.045)]">
      <header className="flex items-center gap-3 border-b border-[#edf0ec] pb-4">
        <i className="size-10 animate-pulse rounded-xl bg-[#e3f2ec]" />
        <div className="min-w-0 flex-1">
          <i className="block h-3 w-36 animate-pulse rounded bg-[#e5eae6]" />
          <i className="mt-2 block h-2 w-2/3 animate-pulse rounded bg-[#eef2ef]" />
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 min-[700px]:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div className={cn("grid gap-1.5", index === 5 && "min-[700px]:col-span-2")} key={index}>
            <i className="h-2 w-20 animate-pulse rounded bg-[#e8eeea]" />
            <i className={cn("h-[42px] animate-pulse rounded-[10px] bg-[#eef2ef]", index === 5 && "h-24")} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function KnowledgePageSkeleton() {
  return (
    <div role="status" aria-label="در حال خواندن پایگاه دانش">
      <div className="mb-8 flex items-start justify-between gap-5 max-[560px]:block">
        <div className="min-w-0 flex-1">
          <i className="mb-3 block h-2.5 w-40 animate-pulse rounded bg-[#e8eeea]" />
          <i className="block h-8 w-56 animate-pulse rounded-lg bg-[#e5eae6]" />
          <i className="mt-3 block h-3 w-[min(620px,95%)] animate-pulse rounded bg-[#eef2ef]" />
        </div>
      </div>
      <div className="mb-4 flex min-h-[84px] flex-col items-start gap-4 rounded-[18px] border border-[#dcebe5] bg-[#f2f8f5] p-5 min-[700px]:flex-row min-[700px]:items-center min-[700px]:justify-between">
        <i className="size-11 animate-pulse rounded-xl bg-white" />
        <div className="min-w-0 flex-1">
          <i className="block h-3 w-32 animate-pulse rounded bg-[#dfe9e4]" />
          <i className="mt-2 block h-2 w-56 max-w-full animate-pulse rounded bg-[#e5ede9]" />
        </div>
        <i className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-white max-[699px]:w-full" />
      </div>
      <div className="mb-4 flex min-h-[86px] flex-col items-start gap-3 rounded-[17px] border border-[#dce7e1] bg-white p-4 shadow-[0_12px_36px_rgba(27,55,50,.055)] min-[700px]:flex-row min-[700px]:items-center">
        <i className="size-11 animate-pulse rounded-xl bg-[#e3f2ec]" />
        <div className="min-w-0 flex-1">
          <i className="block h-3 w-40 animate-pulse rounded bg-[#e5eae6]" />
          <i className="mt-2 block h-2 w-3/4 animate-pulse rounded bg-[#eef2ef]" />
        </div>
        <i className="h-10 w-32 max-w-full animate-pulse rounded-[10px] bg-[#e8eeea] max-[699px]:w-full" />
      </div>
      <div className="grid items-start gap-4 min-[1100px]:grid-cols-[250px_minmax(0,1fr)]">
        <div className="rounded-[18px] border border-[#dce7e1] bg-white p-2 shadow-[0_12px_36px_rgba(27,55,50,.055)]">
          <div className="hidden px-3 pb-3 pt-2 min-[1100px]:block">
            <i className="block h-3 w-32 animate-pulse rounded bg-[#e5eae6]" />
            <i className="mt-2 block h-2 w-full animate-pulse rounded bg-[#eef2ef]" />
          </div>
          <div className="flex gap-2 overflow-hidden px-[12%] max-[1099px]:[mask-image:linear-gradient(to_right,transparent_0%,black_13%,black_87%,transparent_100%)] min-[1100px]:grid min-[1100px]:overflow-visible min-[1100px]:px-0">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                className={cn(
                  "flex min-h-[58px] min-w-[76%] items-center gap-3 rounded-[14px] p-3 min-[1100px]:min-w-0",
                  index === 0 ? "bg-[#e9f6f0]" : "bg-[#fbfcfa]",
                )}
                key={index}
              >
                <i className="size-9 shrink-0 animate-pulse rounded-xl bg-[#e3eee8]" />
                <span className="min-w-0 flex-1">
                  <i className="block h-2.5 w-3/4 animate-pulse rounded bg-[#e5eae6]" />
                  <i className="mt-2 block h-2 w-full animate-pulse rounded bg-[#eef2ef]" />
                </span>
                <i className="size-6 shrink-0 animate-pulse rounded-full bg-[#edf2ef]" />
              </div>
            ))}
          </div>
        </div>
        <KnowledgeSectionSkeleton />
      </div>
      <div className="mt-4 flex min-h-[68px] items-center justify-between rounded-[15px] border border-[#d8e6df] bg-white p-3.5 shadow-[0_14px_40px_rgba(25,49,47,.12)]">
        <i className="h-2.5 w-64 max-w-[50%] animate-pulse rounded bg-[#e8eeea]" />
        <i className="h-10 w-36 max-w-[42%] animate-pulse rounded-[10px] bg-[#dfe9e4]" />
      </div>
    </div>
  );
}
