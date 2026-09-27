"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

export type SearchableSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  options: readonly SearchableSelectOption[];
  value: string | readonly string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  allowCustom?: boolean;
  maxSelected?: number;
  searchable?: boolean;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  multiple = false,
  placeholder = "انتخاب کن",
  searchPlaceholder = "جست‌وجو...",
  emptyLabel = "موردی پیدا نشد",
  disabled = false,
  className,
  ariaLabel,
  allowCustom = false,
  maxSelected,
  searchable = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
    openAbove: boolean;
  } | null>(null);
  const listboxId = useId();
  const selectedValues = useMemo(
    () => new Set(Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );
  const selectedOptions = [...selectedValues].map((selectedValue) =>
    options.find((option) => option.value === selectedValue) ?? { value: selectedValue, label: selectedValue },
  );
  const filteredOptions = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const gap = 8;
      const viewportPadding = 8;
      // Keep the menu aligned with its trigger. Only enforce the requested
      // minimum so short labels do not make the dropdown unnecessarily wide.
      const width = Math.max(rect.width, 100);
      const left = Math.min(Math.max(viewportPadding, rect.right - width), window.innerWidth - width - viewportPadding);
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding - gap;
      const spaceAbove = rect.top - viewportPadding - gap;
      const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
      const availableSpace = openAbove ? spaceAbove : spaceBelow;
      const maxHeight = Math.max(120, Math.min(320, availableSpace));
      setMenuPosition({
        left,
        width,
        maxHeight,
        openAbove,
        ...(openAbove
          ? { bottom: Math.max(viewportPadding, window.innerHeight - rect.top + gap) }
          : { top: Math.min(window.innerHeight - viewportPadding, rect.bottom + gap) }),
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

  const selectOption = (option: SearchableSelectOption) => {
    if (option.disabled) return;
    if (multiple) {
      const next = new Set(selectedValues);
      if (next.has(option.value)) next.delete(option.value);
      else if (maxSelected == null || next.size < maxSelected) next.add(option.value);
      onChange(options.filter((item) => next.has(item.value)).map((item) => item.value));
      return;
    }
    onChange(option.value);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !open) {
      event.preventDefault();
      setOpen(true);
      if (searchable || allowCustom) queueMicrotask(() => inputRef.current?.focus());
    }
  };

  return (
    <div className={cn("relative min-w-0", className)} ref={rootRef} dir="rtl">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="flex min-h-10 w-full items-center gap-2 rounded-[10px] border border-[#dfe6e0] bg-white px-3 py-2 text-right text-[11px] !font-normal text-[#405753] outline-none transition hover:border-[#a8cdbd] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        ref={triggerRef}
        onClick={() => { setOpen((current) => !current); setQuery(""); }}
        onKeyDown={onKeyDown}
        type="button"
      >
        <span className={cn("min-w-0 flex-1", multiple && "flex max-h-7 flex-wrap items-center gap-1 overflow-hidden")}>
          {selectedOptions.length ? (
            multiple ? selectedOptions.map((option) => <span className="max-w-full truncate rounded-md bg-[#eaf5f0] px-2 py-0.5 text-[11px] !font-normal text-[#0f705a]" key={option.value}>{option.label}</span>) : <span className="truncate !font-normal">{selectedOptions[0].label}</span>
          ) : <span className="!font-normal text-[#91a09b]">{placeholder}</span>}
        </span>
        <ChevronDown className={cn("shrink-0 text-[#6f817b] transition-transform", open && "rotate-180")} size={15} />
      </button>
      {open && menuPosition && createPortal(
        <div
          className="fixed z-[100] min-w-[100px] overflow-hidden rounded-xl border border-[#dce6e1] bg-white p-1.5 shadow-[0_16px_40px_rgba(25,49,47,.16)]"
          ref={menuRef}
          style={{
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
            ...(menuPosition.openAbove ? { bottom: menuPosition.bottom } : { top: menuPosition.top }),
          }}
        >
          {(searchable || allowCustom) && <div className="flex items-center gap-2 rounded-lg border border-[#edf1ee] bg-[#fbfcfa] px-2.5">
            <Search className="shrink-0 text-[#8a9994]" size={14} />
            <input
              aria-controls={listboxId}
              aria-label={searchPlaceholder}
              className="h-9 min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#9aa7a3]"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
              placeholder={searchPlaceholder}
              ref={inputRef}
              value={query}
            />
            {query && <button aria-label="پاک کردن جست‌وجو" className="text-[#879791]" onClick={() => setQuery("")} type="button"><X size={13} /></button>}
          </div>}
          <div className={cn("mt-1 space-y-px overflow-y-auto", !searchable && !allowCustom && "mt-0")} id={listboxId} role="listbox" aria-multiselectable={multiple || undefined} style={{ maxHeight: menuPosition.maxHeight }}>
            {filteredOptions.length || (allowCustom && query.trim()) ? <>{filteredOptions.map((option) => {
              const selected = selectedValues.has(option.value);
              return (
                <button
                  aria-selected={selected}
                  className={cn("flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-right text-[11px] transition hover:bg-[#edf7f2]", selected && "bg-[#edf7f2] text-[#0f7b62]", option.disabled && "cursor-not-allowed opacity-40")}
                  disabled={option.disabled}
                  key={option.value}
                  onClick={() => selectOption(option)}
                  role="option"
                  type="button"
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected && <Check className="shrink-0" size={14} />}
                </button>
              );
            })}{allowCustom && query.trim() && !options.some((option) => option.value.toLocaleLowerCase() === query.trim().toLocaleLowerCase()) && <button className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2.5 text-right text-[10px] font-bold text-[#0f7b62] hover:bg-[#edf7f2]" onClick={() => { selectOption({ value: query.trim(), label: query.trim() }); setQuery(""); }} role="option" type="button">افزودن «{query.trim()}»</button>}</> : <p className="m-0 px-2.5 py-3 text-center text-[10px] text-[#8b9995]">{emptyLabel}</p>}
          </div>
          {multiple && selectedOptions.length > 0 && (
            <button className="mt-1 w-full rounded-lg border-t border-[#edf1ee] px-2.5 py-2 text-center text-[9px] font-bold text-[#a34e45] hover:bg-[#fff7f5]" onClick={() => onChange([])} type="button">پاک کردن انتخاب‌ها</button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
