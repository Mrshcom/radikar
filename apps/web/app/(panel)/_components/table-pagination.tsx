"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { tablePageSizes, type TablePageSize } from "@/lib/table-page-size";
import { cn } from "@/lib/cn";

type PaginationItem = number | `ellipsis-${"start" | "end"}`;

function paginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 8) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, "ellipsis-end", totalPages - 2, totalPages - 1, totalPages];
  if (page >= totalPages - 3) return [1, 2, 3, "ellipsis-start", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis-start", page - 1, page, page + 1, "ellipsis-end", totalPages];
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeSaving = false,
}: {
  page: number;
  pageSize: TablePageSize;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: TablePageSize) => void;
  pageSizeSaving?: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const items = paginationItems(safePage, totalPages);

  return (
    <div className="flex min-h-[68px] items-center justify-between gap-5 border-t border-[#edf0ec] px-5 py-3 max-[700px]:flex-col max-[700px]:items-stretch">
      <label className="flex items-center gap-2 whitespace-nowrap text-[9px] font-bold text-[#60736f]">
        تعداد ردیف
        <select
          aria-label="تعداد ردیف در هر صفحه"
          className="h-9 min-w-[72px] rounded-[10px] border border-[#cfdcd6] bg-white px-3 text-[10px] font-extrabold text-[#245348] outline-none transition focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10 disabled:opacity-60"
          disabled={pageSizeSaving}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as TablePageSize)}
          value={pageSize}
        >
          {tablePageSizes.map((size) => (
            <option key={size} value={size}>{size.toLocaleString("fa-IR")}</option>
          ))}
        </select>
        {pageSizeSaving && <span className="text-[8px] font-medium text-[#84918e]">در حال ذخیره…</span>}
      </label>

      <nav aria-label="صفحه‌بندی جدول" className="flex items-center justify-end gap-2.5" dir="ltr">
        <button
          aria-label="صفحه قبل"
          className="grid size-10 shrink-0 place-items-center rounded-full border-0 bg-[#edf0ee] p-0 text-[#65736f] transition-colors hover:bg-[#dfe7e2] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          type="button"
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div className="flex h-10 items-center overflow-hidden rounded-full bg-[#edf0ee] px-1">
          {items.map((item) =>
            typeof item === "number" ? (
              <button
                aria-current={item === safePage ? "page" : undefined}
                className={cn(
                  "grid size-10 shrink-0 place-items-center border-0 p-0 text-[11px] font-bold transition-colors",
                  item === safePage
                    ? "rounded-full bg-[#0f7b62] text-white"
                    : "rounded-full bg-transparent text-[#687872] hover:bg-[#e1e7e3]",
                )}
                key={item}
                onClick={() => onPageChange(item)}
                type="button"
              >
                {item.toLocaleString("fa-IR")}
              </button>
            ) : (
              <span className="grid size-10 shrink-0 place-items-center text-[12px] font-bold text-[#6f7d79]" key={item}>…</span>
            ),
          )}
        </div>
        <button
          aria-label="صفحه بعد"
          className="grid size-10 shrink-0 place-items-center rounded-full border-0 bg-[#edf0ee] p-0 text-[#65736f] transition-colors hover:bg-[#dfe7e2] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          type="button"
        >
          <ChevronRight size={18} strokeWidth={2.2} />
        </button>
      </nav>
    </div>
  );
}
