import { cn } from "@/lib/cn";

export function Skeleton({
  className = "",
  as: Element = "span",
}: {
  className?: string;
  as?: "span" | "div" | "i";
}) {
  return (
    <Element
      aria-hidden="true"
      className={cn("block animate-pulse rounded-lg bg-[#e5eae6]", className)}
    />
  );
}

export function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-2.5" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          className={cn("h-2.5", index === count - 1 ? "w-2/3" : "w-full")}
          key={index}
        />
      ))}
    </div>
  );
}

export function LoadingContext({
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
      <i className="size-2 animate-pulse rounded-full bg-[#0f7b62]" aria-hidden="true" />
      {children}
    </div>
  );
}

export function SkeletonTitle({ action = true }: { action?: boolean }) {
  return (
    <div className="mb-8 flex items-start justify-between gap-5 max-[560px]:block">
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-3 h-2.5 w-28" />
        <Skeleton className="h-8 w-[min(360px,80%)]" />
        <Skeleton className="mt-3 h-3 w-[min(620px,95%)]" />
      </div>
      {action && (
        <Skeleton className="h-10 w-32 shrink-0 max-[560px]:mt-4 max-[560px]:w-full" />
      )}
    </div>
  );
}
