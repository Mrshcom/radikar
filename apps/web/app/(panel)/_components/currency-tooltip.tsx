import type { ReactNode } from "react";
import { formatDollarMicrosToTomans, formatDollarTextToTomans } from "@/lib/fa-number";
import { HoverTooltip } from "./hover-tooltip";

type CurrencyTooltipProps = {
  children: ReactNode;
  amount: number | string;
  amountKind?: "micros" | "text";
  currency?: string | null;
  dollarRateRials?: number | null;
  className?: string;
  contentClassName?: string;
  as?: "article" | "div" | "span";
};

export function CurrencyTooltip({
  children,
  amount,
  amountKind = "micros",
  currency = "USD",
  dollarRateRials,
  className,
  contentClassName,
  as = "span",
}: CurrencyTooltipProps) {
  if (currency?.toUpperCase() !== "USD") {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const content = amountKind === "text"
    ? formatDollarTextToTomans(String(amount), dollarRateRials)
    : formatDollarMicrosToTomans(Number(amount), dollarRateRials);

  return (
    <HoverTooltip
      as={as}
      className={className}
      content={<><span className="font-bold text-[#b9ead6]">معادل تومان:</span>{" "}{content}</>}
      contentClassName={contentClassName}
    >
      {children}
    </HoverTooltip>
  );
}
