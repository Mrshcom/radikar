import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({ className, ...props }: TextFieldProps) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 min-w-0 w-full rounded-[10px] border border-[#dfe6e0] bg-white px-3 py-2 text-[11px] font-normal text-[#405753] outline-none transition placeholder:font-normal placeholder:text-[#9aa7a3] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10 aria-[invalid=true]:border-[#c44d4d] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#c44d4d]/10 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    />
  );
}
