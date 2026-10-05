"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  invalid?: boolean;
};

const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const calendarWidth = 270;
const calendarGap = 6;
const viewportPadding = 8;

type CalendarPosition = {
  left: number;
  top: number;
};

export function JalaliDatePicker({ value, onChange, ariaLabel, min, max, invalid = false }: JalaliDatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const selectedDate = parseLocalIsoDate(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate ?? new Date());
  const [calendarPosition, setCalendarPosition] = useState<CalendarPosition | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !calendarRef.current?.contains(target)) setOpen(false);
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

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = rootRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const calendarHeight = calendarRef.current?.offsetHeight ?? 0;
      const availableBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
      const openAbove = calendarHeight > 0 && availableBelow < calendarHeight + calendarGap;
      const desiredTop = openAbove
        ? triggerRect.top - calendarHeight - calendarGap
        : triggerRect.bottom + calendarGap;
      const maxLeft = Math.max(viewportPadding, window.innerWidth - calendarWidth - viewportPadding);

      setCalendarPosition({
        left: Math.min(Math.max(triggerRect.right - calendarWidth, viewportPadding), maxLeft),
        top: Math.max(viewportPadding, desiredTop),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, viewDate]);

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
        aria-haspopup="dialog"
        data-invalid={invalid}
        onClick={() => {
          if (!open && selectedDate) setViewDate(selectedDate);
          setOpen((current) => !current);
        }}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-[10px] border border-[#dfe6e0] bg-white px-3 py-2 text-right text-[11px] !font-normal text-[#405753] outline-none transition hover:border-[#a8cdbd] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10",
          open && !invalid && "border-[#0f7b62] ring-4 ring-[#0f7b62]/10",
          invalid && "border-[#c44d4d] ring-4 ring-[#c44d4d]/10",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate !font-normal", !selectedDate && "text-[#91a09b]")}>
          {selectedDate ? formatPersianCalendarDate(selectedDate) : "انتخاب تاریخ"}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-[#6f817b]">
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

      {open &&
        createPortal(
          <div
            ref={calendarRef}
            role="dialog"
            aria-label={`تقویم ${ariaLabel}`}
            className="fixed z-100 w-[270px] rounded-xl border border-[#dce6e1] bg-white p-3 shadow-[0_14px_35px_rgba(31,64,55,0.12)]"
            style={{
              left: calendarPosition?.left ?? viewportPadding,
              top: calendarPosition?.top ?? viewportPadding,
              visibility: calendarPosition ? "visible" : "hidden",
            }}
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
              <strong className="text-[12px] text-[#29433d]">{formatPersianCalendarMonth(viewDate)}</strong>
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
                <span key={day} className="py-1 text-[10px] font-bold text-[#91a09c]">
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
                  (minDate !== undefined && time < minDate) || (maxDate !== undefined && time > maxDate);
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
                      "grid aspect-square place-items-center rounded-lg text-[11px] transition-colors",
                      selected
                        ? "bg-[#0f7b62] font-bold text-white"
                        : "text-[#415650] hover:bg-[#edf6f2] hover:text-[#0f7b62]",
                      disabled && "cursor-not-allowed opacity-25 hover:bg-transparent",
                    )}
                  >
                    {new Intl.NumberFormat("fa-IR").format(getPersianDateParts(date).day)}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
