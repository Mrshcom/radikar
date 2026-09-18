import type { ReactNode } from "react";

import { cn } from "../../../lib/cn";

export function DotPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(21,28,27,.14)_1px,transparent_1.2px)] bg-[size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]",
        className,
      )}
    />
  );
}

export function BorderBeam({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute inset-0 overflow-hidden rounded-[inherit] p-px [mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] [mask-composite:exclude]",
        "before:absolute before:aspect-square before:w-28 before:animate-[spin_5s_linear_infinite] before:bg-[conic-gradient(from_0deg,transparent_0_72%,#9ef6cd_88%,#1a9b68_96%,transparent)] before:[inset:-50%]",
        className,
      )}
    />
  );
}

export function Meteors({ count = 7 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <i
          key={index}
          className={cn(
            "absolute -top-12 h-px w-24 rotate-[-35deg] animate-[meteor_8s_linear_infinite] bg-gradient-to-l from-[#16865b]/35 to-transparent opacity-0",
            [
              "left-[8%] [animation-delay:0s]",
              "left-[23%] [animation-delay:2.8s]",
              "left-[38%] [animation-delay:5.2s]",
              "left-[54%] [animation-delay:1.4s]",
              "left-[68%] [animation-delay:4.1s]",
              "left-[82%] [animation-delay:6.5s]",
              "left-[94%] [animation-delay:3.4s]",
            ][index % 7],
          )}
        />
      ))}
    </div>
  );
}

export function Marquee({
  children,
  reverse = false,
  className,
}: {
  children: ReactNode;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex overflow-hidden [--duration:32s]", className)}>
      <div
        className={cn(
          "flex min-w-full shrink-0 animate-[marquee_var(--duration)_linear_infinite] items-center justify-around gap-4 pl-4",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          "flex min-w-full shrink-0 animate-[marquee_var(--duration)_linear_infinite] items-center justify-around gap-4 pl-4",
          reverse && "[animation-direction:reverse]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AnimatedNumber({ children }: { children: ReactNode }) {
  return (
    <span className="bg-[linear-gradient(90deg,#0d7550,#23b77b,#0d7550)] bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_5s_linear_infinite]">
      {children}
    </span>
  );
}
