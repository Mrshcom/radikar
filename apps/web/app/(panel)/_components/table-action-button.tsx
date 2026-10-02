"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type TableActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  children: ReactNode;
};

/** Shared icon-only action control for every DataTable action column. */
export function TableActionButton({
  label,
  children,
  className,
  type = "button",
  ...props
}: TableActionButtonProps) {
  return (
    <button
      {...props}
      aria-label={label}
      className={cn(
        "inline-grid size-8 place-items-center rounded-[8px] border border-[#dfe5df] bg-white text-[#526461] transition hover:border-[#a8cdbd] hover:text-[#0f7b62] disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      title={label}
      type={type}
    >
      {children}
    </button>
  );
}
