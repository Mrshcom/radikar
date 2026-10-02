"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Filter, RotateCcw, Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { SearchableSelect } from "@/app/_components/searchable-select";

const searchSchema = z.object({ search: z.string().trim().max(100) });
type SearchValues = z.infer<typeof searchSchema>;

type ToolbarProps = {
  search: string;
  searchPlaceholder?: string;
  activeFilterCount?: number;
  showFilters?: boolean;
  onSearch: (value: string) => void;
  onResetFilters: () => void;
  children?: ReactNode;
};

export function TableToolbar({
  search,
  searchPlaceholder = "جست‌وجو...",
  activeFilterCount = 0,
  children,
  showFilters = Boolean(children),
  onSearch,
  onResetFilters,
}: ToolbarProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { register, control, reset } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search },
    values: { search },
  });
  const searchValue = useWatch({ control, name: "search" }) ?? "";
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    if (searchValue.trim() === search.trim()) return;
    const timer = window.setTimeout(() => {
      const parsed = searchSchema.safeParse({ search: searchValue });
      if (parsed.success) onSearchRef.current(parsed.data.search);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [search, searchValue]);

  const clearAll = () => {
    reset({ search: "" });
    onSearch("");
    onResetFilters();
  };

  return (
    <div className="border-b border-[#edf0ec] bg-[#fbfcfa]">
      <div className="flex items-center gap-2 p-4 max-[680px]:flex-col max-[680px]:items-stretch">
        <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[11px] border border-[#dfe6e0] bg-white px-4 max-[680px]:w-full max-[680px]:flex-none min-[1024px]:h-10 min-[1024px]:min-w-[280px] min-[1024px]:px-3">
          <Search size={18} className="shrink-0 text-[#84918e] min-[1024px]:size-4" />
          <input
            {...register("search")}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-[11px] outline-none"
            maxLength={100}
            placeholder={searchPlaceholder}
          />
        </div>
        {showFilters && (
          <button
            aria-expanded={advancedOpen}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-[11px] border px-3 text-[9px] font-bold min-[1024px]:h-10",
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
        )}
        {(search || activeFilterCount > 0) && (
          <button
            className="flex h-12 items-center justify-center gap-1.5 rounded-[11px] border border-[#ead8d5] bg-white px-3 text-[9px] font-bold text-[#a34e45] min-[1024px]:h-10"
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
    <label className="grid gap-1.5 text-[9px] font-bold text-[#74837f]">
      {label}
      <SearchableSelect options={options} value={value} onChange={(next) => onChange(String(next))} placeholder="همه" />
    </label>
  );
}
