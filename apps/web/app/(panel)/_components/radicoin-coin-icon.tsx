import Image from "next/image";
import { cn } from "@/lib/cn";

type RadicoinCoinIconProps = {
  className?: string;
  size?: number;
};

export function RadicoinCoinIcon({ className, size = 32 }: RadicoinCoinIconProps) {
  return (
    <Image
      alt="رادیکوین"
      className={cn("shrink-0 object-contain", className)}
      height={size}
      src="/illustrations/radicoin-coin-m-v3.png"
      width={size}
    />
  );
}
