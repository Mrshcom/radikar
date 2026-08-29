import { cn } from "@/lib/cn";

type SkeletonProps = { label?: string };

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn("block animate-pulse rounded-lg bg-[#e5eae6]", className)}
      aria-hidden="true"
    />
  );
}

function LoadingContext({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center gap-2 text-[9px] text-[#71817e]",
        className,
      )}
    >
      <i className="size-2 animate-pulse rounded-full bg-[#0f7b62]" />
      {children}
    </div>
  );
}

const panel =
  "rounded-[17px] border border-[#e7ebe6] bg-white shadow-[0_12px_36px_rgba(27,55,50,.055)]";

function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-2.5">
      {Array.from({ length: count }, (_, index) => (
        <Shimmer
          className={cn("h-2.5", index === count - 1 ? "w-2/3" : "w-full")}
          key={index}
        />
      ))}
    </div>
  );
}

function SkeletonJobCard() {
  return (
    <article
      className="flex min-h-[255px] min-w-0 flex-col rounded-[20px] border border-[#e1e8e2] bg-white p-5"
      aria-hidden="true"
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-3">
          <Shimmer className="size-12 rounded-[15px]" />
          <div>
            <Shimmer className="h-2.5 w-20" />
            <Shimmer className="mt-2 h-2 w-14" />
          </div>
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-7 w-20 rounded-full" />
          <Shimmer className="size-9 rounded-xl" />
        </div>
      </div>
      <Shimmer className="mt-5 h-4 w-3/4" />
      <div className="mt-3 rounded-xl border border-[#e8eee9] bg-[#f7faf7] p-3">
        <Shimmer className="h-2.5 w-full" />
        <Shimmer className="mt-2 h-2.5 w-2/3" />
      </div>
      <div className="mt-auto flex justify-between border-t border-[#e9eeea] pt-4">
        <Shimmer className="h-2.5 w-16" />
        <Shimmer className="h-8 w-24" />
      </div>
    </article>
  );
}

export function JobCardsSkeleton({
  count = 8,
  dashboard = false,
}: {
  count?: number;
  dashboard?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-3",
        dashboard
          ? "grid-cols-1 min-[700px]:grid-cols-2 min-[1121px]:grid-cols-3"
          : "grid-cols-1 min-[561px]:grid-cols-2 min-[1121px]:grid-cols-3",
      )}
      role="status"
      aria-label="در حال دریافت فرصت‌های شغلی"
    >
      {Array.from({ length: count }, (_, index) => (
        <SkeletonJobCard key={index} />
      ))}
    </div>
  );
}

function SkeletonTitle({ action = true }: { action?: boolean }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-5">
      <div className="min-w-0 flex-1">
        <Shimmer className="mb-3 h-2.5 w-28" />
        <Shimmer className="h-8 w-[min(360px,80%)]" />
        <Shimmer className="mt-3 h-3 w-[min(620px,95%)]" />
      </div>
      {action && <Shimmer className="h-10 w-32 shrink-0" />}
    </div>
  );
}

export function DashboardSkeleton() {
  const chartBars = [
    "h-[45%]",
    "h-[70%]",
    "h-[35%]",
    "h-[90%]",
    "h-[55%]",
    "h-[75%]",
    "h-[40%]",
  ];
  return (
    <div role="status" aria-live="polite">
      <LoadingContext>
        در حال تحلیل رزومه و ساخت نمای کلی داشبورد
      </LoadingContext>
      <SkeletonTitle />
      <section className="grid gap-4 min-[1121px]:grid-cols-[minmax(0,1.9fr)_minmax(270px,.8fr)]">
        <div className="flex min-h-[265px] items-center rounded-[22px] bg-[#173f39] px-[clamp(24px,3vw,38px)] py-[34px]">
          <div className="min-w-0 flex-1">
            <Shimmer className="h-7 w-32 bg-white/15" />
            <Shimmer className="mt-4 h-7 w-4/5 bg-white/15" />
            <Shimmer className="mt-3 h-3 w-2/3 bg-white/10" />
            <Shimmer className="mt-2 h-3 w-3/4 bg-white/10" />
            <Shimmer className="mt-6 h-10 w-28 bg-white/20" />
          </div>
          <Shimmer className="size-[132px] shrink-0 rounded-full bg-white/15 max-[560px]:size-24" />
        </div>
        <div className="flex min-h-[265px] flex-col rounded-[22px] border border-[#e3e9e0] bg-[#eef3eb] p-7">
          <div className="flex justify-between">
            <Shimmer className="size-10 rounded-xl" />
            <Shimmer className="h-6 w-20" />
          </div>
          <Shimmer className="mt-6 h-5 w-3/4" />
          <div className="mt-4">
            <SkeletonLines count={3} />
          </div>
          <Shimmer className="mt-auto h-10 w-full" />
        </div>
      </section>
      <section className="my-4 grid grid-cols-1 gap-3 min-[700px]:grid-cols-2 min-[1121px]:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            className={cn(panel, "flex items-center gap-[13px] p-[17px]")}
            key={index}
          >
            <Shimmer className="size-10 rounded-xl" />
            <div className="min-w-0 flex-1">
              <Shimmer className="h-2.5 w-24" />
              <div className="mt-2 flex items-end justify-between">
                <Shimmer className="h-7 w-12" />
                <Shimmer className="h-2.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="grid gap-4 min-[1121px]:grid-cols-[minmax(0,1.65fr)_minmax(280px,.7fr)]">
        <div className={cn(panel, "min-h-80 p-[21px]")}>
          <div className="flex justify-between">
            <div className="w-1/2">
              <Shimmer className="h-4 w-28" />
              <Shimmer className="mt-2 h-2.5 w-full" />
            </div>
            <Shimmer className="h-4 w-20" />
          </div>
          <div className="mt-5 grid gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                className="flex min-h-[50px] items-center gap-3 border-t border-[#eef1ed]"
                key={index}
              >
                <Shimmer className="size-9" />
                <div className="flex-1">
                  <Shimmer className="h-2.5 w-1/2" />
                  <Shimmer className="mt-2 h-2 w-1/3" />
                </div>
                <Shimmer className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className={cn(panel, "min-h-80 p-[21px]")}>
          <div className="flex justify-between">
            <div className="w-2/3">
              <Shimmer className="h-4 w-28" />
              <Shimmer className="mt-2 h-2.5 w-full" />
            </div>
            <Shimmer className="size-10" />
          </div>
          <div className="mt-8 flex h-[118px] items-end justify-between gap-2 border-b border-[#edf0ec]">
            {chartBars.map((height, index) => (
              <Shimmer
                className={cn("w-[9%] rounded-b-none", height)}
                key={index}
              />
            ))}
          </div>
        </div>
      </section>
      <div className={cn(panel, "mt-4 p-[21px]")}>
        <div className="flex justify-between">
          <div className="w-1/2">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="mt-2 h-2.5 w-full" />
          </div>
          <Shimmer className="h-4 w-20" />
        </div>
        <div className="mt-4">
          <JobCardsSkeleton count={3} dashboard />
        </div>
      </div>
    </div>
  );
}

export function ResumesSkeleton() {
  return (
    <div role="status" aria-label="در حال دریافت رزومه‌های ذخیره‌شده">
      <SkeletonTitle />
      <div className="mb-6 flex w-full gap-1 rounded-[14px] border border-[#dfe7e1] bg-[#f2f5f2] p-1.5">
        <Shimmer className="h-10 flex-1 rounded-[10px] bg-white" />
        <Shimmer className="h-10 flex-1 rounded-[10px]" />
      </div>
      <section className={cn(panel, "mb-6 min-w-0 overflow-hidden p-5")}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Shimmer className="h-4 w-28" />
            <Shimmer className="mt-2 h-2.5 w-[min(390px,85%)]" />
          </div>
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 min-[700px]:grid-cols-2 min-[1121px]:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <article
              className="min-w-0 overflow-hidden rounded-[16px] border border-[#e1e8e2] bg-[#fbfcfa]"
              aria-hidden="true"
              key={index}
            >
              <div className="grid h-[260px] place-items-center bg-[#e9eeea] p-3">
                <Shimmer className="aspect-[210/297] h-[220px] rounded-sm bg-white" />
              </div>
              <div className="grid gap-3 border-t border-[#e5ebe6] p-4">
                <div className="flex items-center justify-between gap-3">
                  <Shimmer className="h-5 w-20" />
                  <Shimmer className="h-2.5 w-16" />
                </div>
                <Shimmer className="h-3 w-2/3" />
                <div className="flex items-center justify-between border-t border-[#e8ede9] pt-3">
                  <Shimmer className="h-2.5 w-24" />
                  <div className="flex gap-1">
                    <Shimmer className="size-8" />
                    <Shimmer className="size-8" />
                    <Shimmer className="size-8" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ApplicationsSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <LoadingContext>در حال ساخت ستون‌ها و وضعیت اپلای‌ها</LoadingContext>
      <SkeletonTitle />
      <div className={cn(panel, "mb-4 flex h-12 items-center gap-7 px-4")}>
        <Shimmer className="h-2.5 w-28" />
        <Shimmer className="h-2.5 w-24" />
        <Shimmer className="h-2.5 w-28" />
      </div>
      <div className="grid grid-cols-4 gap-3 overflow-x-auto max-[1120px]:grid-cols-[repeat(4,250px)]">
        {Array.from({ length: 4 }, (_, column) => (
          <section
            className="min-h-[440px] rounded-[15px] bg-[#eef1ed] p-[10px]"
            key={column}
          >
            <div className="mb-[10px] flex items-center justify-between px-1 py-1">
              <Shimmer className="h-3 w-20" />
              <Shimmer className="size-6" />
            </div>
            {Array.from({ length: 2 }, (_, card) => (
              <div
                className="mb-2 rounded-xl border border-[#e2e7e2] bg-white p-3"
                key={card}
              >
                <div className="flex items-center gap-2">
                  <Shimmer className="size-7" />
                  <Shimmer className="h-2.5 flex-1" />
                  <Shimmer className="size-5" />
                </div>
                <Shimmer className="mb-2 mt-3 h-3 w-3/4" />
                <Shimmer className="h-6 w-20" />
                <Shimmer className="mt-3 h-2 w-1/2" />
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export function InterviewSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <LoadingContext>
        در حال تولید جلسه و سؤال‌های مصاحبه متناسب با رزومه
      </LoadingContext>
      <SkeletonTitle action={false} />
      <div className="flex min-h-[360px] items-center rounded-[22px] bg-[#173f39] px-[38px] py-[34px] max-[560px]:p-7">
        <div className="min-w-0 flex-1">
          <Shimmer className="h-7 w-32 bg-white/15" />
          <Shimmer className="mt-4 h-7 w-3/4 bg-white/15" />
          <Shimmer className="mt-3 h-3 w-2/3 bg-white/10" />
          <Shimmer className="mt-2 h-3 w-1/2 bg-white/10" />
          <div className="mt-5 flex gap-4">
            <Shimmer className="h-3 w-20 bg-white/10" />
            <Shimmer className="h-3 w-28 bg-white/10" />
          </div>
          <Shimmer className="mt-5 h-10 w-36 bg-white/20" />
        </div>
        <Shimmer className="size-[132px] shrink-0 rounded-full bg-white/15 max-[560px]:size-24" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 max-[820px]:grid-cols-1">
        {Array.from({ length: 3 }, (_, index) => (
          <div className={cn(panel, "p-5")} key={index}>
            <Shimmer className="size-10 rounded-xl" />
            <Shimmer className="mt-4 h-4 w-2/3" />
            <div className="mt-3">
              <SkeletonLines count={2} />
            </div>
            <Shimmer className="mt-4 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchAnalysisSkeleton({
  label = "در حال مقایسه رزومه با نیازمندی‌های آگهی",
}: SkeletonProps) {
  return (
    <div className="min-h-[420px] p-5" role="status" aria-live="polite">
      <LoadingContext>{label}</LoadingContext>
      <div className="flex items-center gap-4 border-b border-[#edf0ec] pb-5">
        <Shimmer className="size-[105px] shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Shimmer className="h-6 w-24" />
          <Shimmer className="mt-3 h-5 w-2/3" />
          <Shimmer className="mt-2 h-2.5 w-1/3" />
        </div>
      </div>
      <div className="my-5 grid gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <div className="flex justify-between">
              <Shimmer className="h-2.5 w-1/3" />
              <Shimmer className="h-2.5 w-10" />
            </div>
            <Shimmer className="mt-2 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="border-t border-[#edf0ec] pt-4">
        <Shimmer className="h-3 w-40" />
        <div className="mt-3 flex gap-2">
          <Shimmer className="h-7 w-24" />
          <Shimmer className="h-7 w-28" />
          <Shimmer className="h-7 w-20" />
        </div>
      </div>
    </div>
  );
}

export function GenerationShimmer({
  label = "در حال تولید محتوا با مدل",
}: SkeletonProps) {
  return (
    <div
      className="rounded-xl border border-[#d9e7df] bg-[#f2faf6] p-3"
      role="status"
      aria-live="polite"
    >
      <LoadingContext>{label}</LoadingContext>
      <SkeletonLines count={2} />
    </div>
  );
}

export function FeedbackSkeleton() {
  return (
    <div
      className="mt-3 flex items-start gap-3 rounded-[10px] bg-[#edf8f3] p-3"
      role="status"
      aria-label="در حال تولید بازخورد"
    >
      <Shimmer className="size-8" />
      <div className="flex-1">
        <Shimmer className="h-3 w-1/3" />
        <Shimmer className="mt-2 h-3 w-full" />
        <Shimmer className="mt-2 h-3 w-4/5" />
      </div>
    </div>
  );
}

export function ResumePreviewSkeleton() {
  return (
    <div
      className="relative mx-auto aspect-[210/297] w-full max-w-[720px] overflow-hidden bg-white shadow-xl"
      role="status"
      aria-label="در حال تکمیل اطلاعات رزومه"
    >
      <div className="absolute top-4 right-4 left-4 z-2 rounded-lg bg-white/90 p-2 backdrop-blur">
        <LoadingContext className="mb-0">
          در حال بازنویسی اطلاعات و ساخت پیش‌نمایش رزومه
        </LoadingContext>
      </div>
      <div className="flex h-[22%] items-center gap-4 bg-[#173f39] p-7">
        <Shimmer className="size-16 rounded-full bg-white/20" />
        <div className="flex-1">
          <Shimmer className="h-6 w-1/2 bg-white/20" />
          <Shimmer className="mt-3 h-3 w-1/3 bg-white/15" />
        </div>
      </div>
      <div className="grid h-[78%] grid-cols-[30%_1fr]">
        <div className="bg-[#e7f2ed] p-5">
          <SkeletonLines count={8} />
        </div>
        <div className="p-7">
          {Array.from({ length: 12 }, (_, index) => (
            <Shimmer
              className={cn(
                "mb-3",
                index % 4 === 0 ? "h-5 w-1/2" : "h-3 w-full",
              )}
              key={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
