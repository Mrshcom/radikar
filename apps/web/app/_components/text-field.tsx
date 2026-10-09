import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;
const invalidControlClass =
  "aria-[invalid=true]:border-[#c44d4d] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#c44d4d]/10";

export function TextAreaField({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[125px] w-full resize-y rounded-[11px] border border-[#dfe5df] bg-[#fbfcfa] p-[13px] text-[12px] font-normal leading-8 outline-0 focus:border-[#72b7a2] focus:ring-4 focus:ring-[#0f7b62]/10 disabled:cursor-not-allowed disabled:opacity-60",
        invalidControlClass,
        className,
      )}
    />
  );
}

export function TextField({ className, ...props }: TextFieldProps) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 min-w-0 w-full rounded-[10px] border border-[#dfe6e0] bg-white px-3 py-2 text-[11px] font-normal text-[#405753] outline-none transition placeholder:font-normal placeholder:text-[#9aa7a3] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10 disabled:cursor-not-allowed disabled:opacity-60",
        invalidControlClass,
        className,
      )}
    />
  );
}
