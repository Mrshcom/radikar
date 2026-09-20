"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type RangeSliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  valueFormatter?: (value: number) => string;
  className?: string;
  disabled?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function stepPrecision(step: number) {
  return step.toString().split(".")[1]?.length ?? 0;
}

export function RangeSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  valueFormatter = String,
  className,
  disabled = false,
}: RangeSliderProps) {
  const boundedValue = clamp(value, min, max);
  const progress = max === min ? 0 : ((boundedValue - min) / (max - min)) * 100;
  const formattedValue = valueFormatter(boundedValue);

  const updateValue = (nextValue: number) => {
    const normalizedValue = Number(
      clamp(nextValue, min, max).toFixed(stepPrecision(step)),
    );
    onChange(normalizedValue);
  };

  return (
    <div className={cn("flex w-full items-center gap-3", className)} dir="ltr">
      <button
        className="grid size-8 shrink-0 place-items-center rounded-full border border-[#dce9e3] bg-[#f4f9f6] text-[#667a74] transition-colors hover:border-[#b9d8ca] hover:text-[#0f7b62] disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        onClick={() => updateValue(boundedValue - step)}
        disabled={disabled || boundedValue <= min}
        aria-label={`کاهش ${label}`}
      >
        <Minus size={15} />
      </button>

      <div className="relative h-12 min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full border border-[#c9ddd4] bg-[#f3f8f5]">
          <span
            className="block h-full rounded-full bg-[#27a17f]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className="pointer-events-none absolute top-1/2 z-[1] size-5 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#0f7b62] shadow-[0_2px_8px_rgba(15,123,98,.28)]"
          style={{ left: `calc(${progress}% - 10px)` }}
        >
          <span className="absolute bottom-[calc(100%+8px)] left-1/2 min-w-11 -translate-x-1/2 whitespace-nowrap rounded-[7px] bg-[#19312f] px-2 py-1 text-center text-[9px] font-bold leading-4 text-white shadow-[0_5px_14px_rgba(25,49,47,.2)]">
            {formattedValue}
            <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#19312f]" />
          </span>
        </div>
        <input
          className="absolute inset-0 z-[2] size-full cursor-grab opacity-0 disabled:cursor-not-allowed active:cursor-grabbing"
          type="range"
          min={min}
          max={max}
          step={step}
          value={boundedValue}
          onChange={(event) => updateValue(Number(event.target.value))}
          disabled={disabled}
          aria-label={label}
          aria-valuetext={formattedValue}
        />
      </div>

      <button
        className="grid size-8 shrink-0 place-items-center rounded-full border border-[#b9d8ca] bg-[#eaf6f0] text-[#0f7b62] transition-colors hover:bg-[#dff1e8] disabled:cursor-not-allowed disabled:opacity-40"
        type="button"
        onClick={() => updateValue(boundedValue + step)}
        disabled={disabled || boundedValue >= max}
        aria-label={`افزایش ${label}`}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
