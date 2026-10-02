import type { HTMLAttributes } from "react";
import { formatPersianDateTime } from "./date-time";

export function PersianDateTime({
  value,
  fallback = "—",
  ...props
}: { value: string | Date; fallback?: string } & Omit<HTMLAttributes<HTMLElement>, "dir">) {
  return (
    <bdi dir="ltr" {...props}>
      {formatPersianDateTime(value, fallback)}
    </bdi>
  );
}
