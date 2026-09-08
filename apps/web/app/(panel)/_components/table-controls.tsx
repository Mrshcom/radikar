"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Filter, RotateCcw, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/cn";

const searchSchema = z.object({ search: z.string().trim().max(100) });
type SearchValues = z.infer<typeof searchSchema>;

type ToolbarProps = {
  search: string;
  searchPlaceholder?: string;
  activeFilterCount?: number;
  onSearch: (value: string) => void;
  onResetFilters: () => void;
  children?: ReactNode;
};

export function TableToolbar({
  search,
  searchPlaceholder = "جست‌وجو...",
  activeFilterCount = 0,
  onSearch,
  onResetFilters,
  children,
}: ToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search },
    values: { search },
  });

  const clearAll = () => {
    reset({ search: "" });
    onSearch("");
    onResetFilters();
  };

  return (
    <div className="border-b border-[#edf0ec] bg-[#fbfcfa]">
      <div className="flex items-center gap-2 p-4 max-[680px]:flex-col max-[680px]:items-stretch">
        <form
          className="flex h-10 min-w-[280px] flex-1 items-center gap-2 rounded-[11px] border border-[#dfe6e0] bg-white px-3 max-[680px]:min-w-0"
          onSubmit={handleSubmit(({ search: value }) => onSearch(value))}
        >
          <Search size={16} className="text-[#84918e]" />
          <input
            {...register("search")}
            className="min-w-0 flex-1 border-0 bg-transparent text-[10px] outline-none"
            placeholder={searchPlaceholder}
          />
          <button className="border-0 bg-transparent text-[9px] font-bold text-[#0f7b62]" type="submit">
            جست‌وجو
          </button>
        </form>
        <button
          aria-expanded={advancedOpen}
          className={cn(
            "flex h-10 items-center justify-center gap-2 rounded-[11px] border px-3 text-[9px] font-bold",
            advancedOpen || activeFilterCount > 0
              ? "border-[#9dcdbd] bg-[#eaf5f0] text-[#0f7b62]"
              : "border-[#dfe6e0] bg-white text-[#657672]",
          )}
          onClick={() => setAdvancedOpen((value) => !value)}
          type="button"
        >
          <Filter size={15} /> فیلتر پیشرفته
          {activeFilterCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-[#0f7b62] text-[8px] text-white">
              {activeFilterCount.toLocaleString("fa-IR")}
            </span>
          )}
          <ChevronDown className={cn("transition-transform", advancedOpen && "rotate-180")} size={14} />
        </button>
        {(search || activeFilterCount > 0) && (
          <button
            className="flex h-10 items-center justify-center gap-1.5 rounded-[11px] border border-[#ead8d5] bg-white px-3 text-[9px] font-bold text-[#a34e45]"
            onClick={clearAll}
            type="button"
          >
            <RotateCcw size={14} /> پاک‌کردن
          </button>
        )}
      </div>
      {advancedOpen && children && (
        <div className="grid grid-cols-3 gap-3 border-t border-[#edf0ec] px-4 py-3 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1">
          {children}
        </div>
      )}
    </div>
  );
}

export function TableFilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-[8px] font-bold text-[#74837f]">
      {label}
      <select
        className="h-10 rounded-[10px] border border-[#dfe6e0] bg-white px-3 text-[9px] text-[#405753] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
