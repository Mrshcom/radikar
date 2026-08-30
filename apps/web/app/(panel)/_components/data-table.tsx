"use client";

import { AlertCircle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataTableColumn<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  skeletonClassName?: string;
};

export function DataTableSkeleton<T>({
  columns,
  rows = 5,
}: {
  columns: DataTableColumn<T>[];
  rows?: number;
}) {
  return (
    <tbody aria-label="در حال بارگذاری جدول">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr className="border-t border-[#edf0ec]" key={rowIndex}>
          {columns.map((column, columnIndex) => (
            <td className={cn("px-4 py-4", column.className)} key={column.key}>
              <span
                className={cn(
                  "block h-3 animate-pulse rounded-full bg-[#e7eeea]",
                  column.skeletonClassName ?? (columnIndex === 0 ? "w-28" : "w-16"),
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function DataTableEmptyState({ filtered = false }: { filtered?: boolean }) {
  return (
    <div className="grid min-h-[260px] place-items-center px-6 py-10 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-[15px] bg-[#edf5f1] text-[#43806f]">
          <Inbox size={23} />
        </span>
        <strong className="mt-3 block text-[12px] text-[#29443f]">
          {filtered ? "نتیجه‌ای با این فیلترها پیدا نشد" : "هنوز اطلاعاتی ثبت نشده است"}
        </strong>
        <p className="mb-0 mt-1 text-[9px] text-[#8a9895]">
          {filtered ? "عبارت جست‌وجو یا فیلترها را تغییر بده." : "پس از ثبت اولین مورد، اطلاعات اینجا نمایش داده می‌شوند."}
        </p>
      </div>
    </div>
  );
}

export function DataTableErrorState({
  error,
  retrying = false,
  onRetry,
}: {
  error: unknown;
  retrying?: boolean;
  onRetry?: () => void;
}) {
  const message = error instanceof Error ? error.message : "دریافت اطلاعات جدول ناموفق بود.";
  return (
    <div className="grid min-h-[260px] place-items-center px-6 py-10 text-center" role="alert">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-[15px] bg-[#fff1ef] text-[#b14848]">
          <AlertCircle size={23} />
        </span>
        <strong className="mt-3 block text-[12px] text-[#7f352f]">خطا در دریافت اطلاعات</strong>
        <p className="mb-0 mt-1 max-w-md text-[9px] leading-6 text-[#8a6662]">{message}</p>
        {onRetry && (
          <button
            className="mx-auto mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-[10px] border border-[#e4cbc7] bg-white px-4 text-[9px] font-bold text-[#9b4840] disabled:opacity-50"
            disabled={retrying}
            onClick={onRetry}
            type="button"
          >
            {retrying ? <LoaderCircle className="animate-spin" size={14} /> : <RotateCcw size={14} />}
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  filtered = false,
  minWidthClassName = "min-w-[760px]",
  skeletonRows = 5,
  error,
  retrying = false,
  onRetry,
  footer,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  filtered?: boolean;
  minWidthClassName?: string;
  skeletonRows?: number;
  error?: unknown;
  retrying?: boolean;
  onRetry?: () => void;
  footer?: ReactNode;
}) {
  const empty = !loading && rows.length === 0;
  const failed = !loading && Boolean(error);
  return (
    <>
      {failed ? (
        <DataTableErrorState error={error} retrying={retrying} onRetry={onRetry} />
      ) : empty ? (
        <DataTableEmptyState filtered={filtered} />
      ) : (
        <div className="overflow-x-auto">
          <table className={cn("w-full border-collapse text-right text-[10px]", minWidthClassName)}>
            <thead className="bg-[#f7f9f6] text-[#71817e]">
              <tr>
                {columns.map((column) => (
                  <th className={cn("px-4 py-3 font-extrabold", column.headerClassName)} key={column.key}>
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            {loading ? (
              <DataTableSkeleton columns={columns} rows={skeletonRows} />
            ) : (
              <tbody>
                {rows.map((row) => (
                  <tr className="border-t border-[#edf0ec] transition-colors hover:bg-[#fbfcfa]" key={getRowKey(row)}>
                    {columns.map((column) => (
                      <td className={cn("px-4 py-4", column.className)} key={column.key}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}
      {footer}
    </>
  );
}
