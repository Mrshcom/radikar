"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Clock3, X } from "lucide-react";
import { cn } from "@/lib/cn";

type TimePickerProps = { value: string; onChange: (value: string) => void; ariaLabel: string; invalid?: boolean };

const persianTime = new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2, useGrouping: false });
const hours = Array.from({ length: 24 }, (_, value) => String(value).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, value) => String(value).padStart(2, "0"));
const pickerWidth = 292;
const pickerGap = 6;
const viewportPadding = 8;

function displayTime(value: string) {
  const [hour = "00", minute = "00"] = value.split(":");
  return `${persianTime.format(Number(hour))}:${persianTime.format(Number(minute))}`;
}

function safeTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : "09:00";
}

export function TimePicker({ value, onChange, ariaLabel, invalid = false }: TimePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => safeTime(value));
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [selectedHour, selectedMinute] = safeTime(draft).split(":");

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !pickerRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
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
      const rect = trigger.getBoundingClientRect();
      const height = pickerRef.current?.offsetHeight ?? 0;
      const top =
        window.innerHeight - rect.bottom - viewportPadding < height + pickerGap
          ? rect.top - height - pickerGap
          : rect.bottom + pickerGap;
      setPosition({
        left: Math.min(
          Math.max(rect.right - pickerWidth, viewportPadding),
          Math.max(viewportPadding, window.innerWidth - pickerWidth - viewportPadding),
        ),
        top: Math.max(viewportPadding, top),
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-invalid={invalid}
        onClick={() => {
          if (!open) setDraft(safeTime(value));
          setOpen((current) => !current);
        }}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-[10px] border border-[#dfe6e0] bg-white px-3 py-2 text-right text-[11px] !font-normal text-[#405753] outline-none transition hover:border-[#a8cdbd] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10",
          open && !invalid && "border-[#0f7b62] ring-4 ring-[#0f7b62]/10",
          invalid && "border-[#c44d4d] ring-4 ring-[#c44d4d]/10",
        )}
      >
        {value && (
          <X
            size={13}
            aria-label="پاک‌کردن ساعت"
            className="shrink-0 text-[#6f817b]"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
            }}
          />
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left [direction:ltr] !font-normal",
            !value && "text-[#91a09b]",
          )}
        >
          {value ? displayTime(value) : "انتخاب ساعت"}
        </span>
        <Clock3 className="shrink-0 text-[#6f817b]" size={15} />
      </button>

      {open &&
        createPortal(
          <div
            ref={pickerRef}
            role="dialog"
            aria-label={`انتخاب ساعت ${ariaLabel}`}
            className="fixed z-100 w-[292px] rounded-xl border border-[#dce6e1] bg-white p-3 shadow-[0_14px_35px_rgba(31,64,55,0.12)]"
            style={{
              left: position?.left ?? viewportPadding,
              top: position?.top ?? viewportPadding,
              visibility: position ? "visible" : "hidden",
            }}
          >
            <div className="flex items-center justify-between rounded-xl bg-[#eff8f3] px-3 py-2">
              <span className="text-[11px] font-bold text-[#527065]">زمان انتخابی</span>
              <strong className="text-sm font-black text-[#0f7b62]">{displayTime(draft)}</strong>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <TimeColumn
                label="دقیقه"
                values={minutes}
                selected={selectedMinute}
                onSelect={(minute) => setDraft(`${selectedHour}:${minute}`)}
              />
              <TimeColumn
                label="ساعت"
                values={hours}
                selected={selectedHour}
                onSelect={(hour) => setDraft(`${hour}:${selectedMinute}`)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
              className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#0f7b62] px-3 text-xs font-bold text-white transition hover:bg-[#0b6c56]"
            >
              <Check size={14} /> تأیید ساعت
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

function TimeColumn({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string;
  values: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <section aria-label={label}>
      <p className="mb-1.5 text-center text-[10px] font-bold text-[#71887a]">{label}</p>
      <div
        className="grid max-h-40 grid-cols-3 gap-1 overflow-y-auto rounded-lg border border-[#e4ece7] bg-[#fbfdfb] p-1.5"
        dir="ltr"
      >
        {values.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={selected === item}
            onClick={() => onSelect(item)}
            className={cn(
              "grid h-7 place-items-center rounded-md text-[11px] transition-colors",
              selected === item
                ? "bg-[#0f7b62] font-bold text-white"
                : "text-[#456055] hover:bg-[#eaf5ef] hover:text-[#0f7b62]",
            )}
          >
            {persianTime.format(Number(item))}
          </button>
        ))}
      </div>
    </section>
  );
}
