"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatPersianCalendarDate,
  formatPersianCalendarMonth,
  getPersianDateParts,
  getPersianMonthDays,
  parseLocalIsoDate,
  shiftPersianMonth,
  toLocalIsoDate,
} from "@/lib/jalali-date";

type JalaliDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  min?: string;
  max?: string;
};

const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

export function JalaliDatePicker({
  value,
  onChange,
  ariaLabel,
  min,
  max,
}: JalaliDatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseLocalIsoDate(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const monthDays = useMemo(() => getPersianMonthDays(viewDate), [viewDate]);
  const leadingEmptyDays = (monthDays[0].getDay() + 1) % 7;
  const minDate = min ? parseLocalIsoDate(min)?.getTime() : undefined;
  const maxDate = max ? parseLocalIsoDate(max)?.getTime() : undefined;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => {
          if (!open && selectedDate) setViewDate(selectedDate);
          setOpen((current) => !current);
        }}
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#dfe6e1] bg-[#fafcfb] px-3 text-[10px] text-[#344b46] outline-none transition-colors hover:border-[#c8dcd3] focus:border-[#9bc8b8]"
      >
        <span className={cn(!selectedDate && "text-[#9aa7a3]")}>
          {selectedDate ? formatPersianCalendarDate(selectedDate) : "انتخاب تاریخ"}
        </span>
        <span className="flex items-center gap-1.5 text-[#77908a]">
          {selectedDate && (
            <X
              size={13}
              aria-label="پاک‌کردن تاریخ"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
            />
          )}
          <CalendarDays size={15} />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`تقویم ${ariaLabel}`}
          className="absolute top-[calc(100%+6px)] right-0 z-30 w-[270px] rounded-xl border border-[#dce6e1] bg-white p-3 shadow-[0_14px_35px_rgba(31,64,55,0.12)]"
        >
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              aria-label="ماه بعد"
              onClick={() => setViewDate((current) => shiftPersianMonth(current, 1))}
              className="grid size-8 place-items-center rounded-lg text-[#61736f] hover:bg-[#f0f6f3] hover:text-[#0f7b62]"
            >
              <ChevronRight size={16} />
            </button>
            <strong className="text-[10px] text-[#29433d]">
              {formatPersianCalendarMonth(viewDate)}
            </strong>
            <button
              type="button"
              aria-label="ماه قبل"
              onClick={() => setViewDate((current) => shiftPersianMonth(current, -1))}
              className="grid size-8 place-items-center rounded-lg text-[#61736f] hover:bg-[#f0f6f3] hover:text-[#0f7b62]"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day) => (
              <span key={day} className="py-1 text-[8px] font-bold text-[#91a09c]">
                {day}
              </span>
            ))}
            {Array.from({ length: leadingEmptyDays }, (_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {monthDays.map((date) => {
              const isoDate = toLocalIsoDate(date);
              const time = date.getTime();
              const disabled =
                (minDate !== undefined && time < minDate) ||
                (maxDate !== undefined && time > maxDate);
              const selected = isoDate === value;
              return (
                <button
                  key={isoDate}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => {
                    onChange(isoDate);
                    setOpen(false);
                  }}
                  className={cn(
                    "grid aspect-square place-items-center rounded-lg text-[9px] transition-colors",
                    selected
                      ? "bg-[#0f7b62] font-bold text-white"
                      : "text-[#415650] hover:bg-[#edf6f2] hover:text-[#0f7b62]",
                    disabled && "cursor-not-allowed opacity-25 hover:bg-transparent",
                  )}
                >
                  {new Intl.NumberFormat("fa-IR").format(
                    getPersianDateParts(date).day,
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
