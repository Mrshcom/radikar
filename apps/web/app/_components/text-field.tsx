import { forwardRef, type ComponentPropsWithRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { normalizeDigits } from "@radikar/validators";
import { cn } from "@/lib/cn";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;
const invalidControlClass =
  "aria-[invalid=true]:border-[#c44d4d] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#c44d4d]/10";

export function LocalizedNumberInput({ onChange, type, inputMode, ...props }: ComponentPropsWithRef<"input">) {
  return (
    <input
      {...props}
      type={type === "number" ? "text" : type}
      inputMode={inputMode ?? "decimal"}
      onChange={(event) => {
        event.currentTarget.value = normalizeDigits(event.currentTarget.value);
        onChange?.(event);
      }}
    />
  );
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextAreaField({ className, ...props }, ref) {
    return (
    <textarea
      {...props}
      ref={ref}
      className={cn(
        "min-h-[125px] w-full resize-y rounded-[11px] border border-[#dfe5df] bg-[#fbfcfa] p-[13px] text-[12px] font-normal leading-8 outline-0 focus:border-[#72b7a2] focus:ring-4 focus:ring-[#0f7b62]/10 disabled:cursor-not-allowed disabled:opacity-60",
        invalidControlClass,
        className,
      )}
    />
    );
  },
);

export function TextField({ className, ...props }: TextFieldProps) {
  const Input = props.type === "number" || props.inputMode === "numeric" || props.inputMode === "decimal"
    ? LocalizedNumberInput
    : "input";
  return (
    <Input
      {...props}
      className={cn(
        "h-10 min-w-0 w-full rounded-[10px] border border-[#dfe6e0] bg-white px-3 py-2 text-[11px] font-normal text-[#405753] outline-none transition placeholder:font-normal placeholder:text-[#9aa7a3] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10 disabled:cursor-not-allowed disabled:opacity-60",
        invalidControlClass,
        className,
      )}
    />
  );
}
