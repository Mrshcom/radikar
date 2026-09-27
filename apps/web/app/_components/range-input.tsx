"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { formatGroupedNumber, normalizeNumericInput } from "@/lib/fa-number";

type RangeInputProps = {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
};

export function RangeInput({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = "حداقل",
  maxPlaceholder = "حداکثر",
  inputMode = "text",
  className,
}: RangeInputProps) {
  const inputClass = "h-10 min-w-0 w-full rounded-[10px] border border-[#dfe6e0] bg-white px-2 text-center text-[9px] text-[#405753] outline-none transition placeholder:text-[#9aa7a3] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10";
  return (
    <label className={cn("grid min-w-0 gap-1.5 text-[8px] font-bold text-[#74837f]", className)}>
      {label}
      <div className="flex min-w-0 items-center gap-1.5" dir="rtl">
        <input aria-label={`${label} حداقل`} className={inputClass} inputMode={inputMode} onChange={(event) => onMinChange(normalizeNumericInput(event.target.value))} placeholder={minPlaceholder} value={formatGroupedNumber(minValue)} />
        <span aria-hidden="true" className="shrink-0 text-[9px] font-bold text-[#91a09b]">تا</span>
        <input aria-label={`${label} حداکثر`} className={inputClass} inputMode={inputMode} onChange={(event) => onMaxChange(normalizeNumericInput(event.target.value))} placeholder={maxPlaceholder} value={formatGroupedNumber(maxValue)} />
      </div>
    </label>
  );
}
