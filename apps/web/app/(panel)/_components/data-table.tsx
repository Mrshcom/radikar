"use client";

import { AlertCircle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const mobileTableMediaQuery = "(max-width: 680px)";

function subscribeToMobileTableViewport(onChange: () => void) {
  const mediaQuery = window.matchMedia(mobileTableMediaQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMobileTableViewportSnapshot(): boolean | null {
  return window.matchMedia(mobileTableMediaQuery).matches;
}

function getMobileTableViewportServerSnapshot(): boolean | null {
  return null;
}

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

function DataTableCardSkeleton<T>({
  columns,
  rows = 5,
}: {
  columns: DataTableColumn<T>[];
  rows?: number;
}) {
  return (
    <div aria-label="در حال بارگذاری فهرست" className="grid gap-3 p-3">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="overflow-hidden rounded-[14px] border border-[#e3e9e3] bg-white" key={rowIndex}>
          {columns.map((column, columnIndex) => (
            <div
              className={cn(
                "flex min-h-11 items-center justify-between gap-4 px-4 py-3",
                columnIndex > 0 && "border-t border-[#edf1ee]",
              )}
              key={column.key}
            >
              <span className="h-2.5 w-16 animate-pulse rounded-full bg-[#e1e9e5]" />
              <span
                className={cn(
                  "h-3 animate-pulse rounded-full bg-[#e7eeea]",
                  column.skeletonClassName ?? (columnIndex === 0 ? "w-28" : "w-20"),
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
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
  const mobile = useSyncExternalStore(
    subscribeToMobileTableViewport,
    getMobileTableViewportSnapshot,
    getMobileTableViewportServerSnapshot,
  );
  const empty = !loading && rows.length === 0;
  const failed = !loading && Boolean(error);
  return (
    <>
      {failed ? (
        <DataTableErrorState error={error} retrying={retrying} onRetry={onRetry} />
      ) : empty ? (
        <DataTableEmptyState filtered={filtered} />
      ) : mobile === null ? (
        <div aria-hidden="true" className="min-h-24" />
      ) : mobile ? (
        loading ? (
          <DataTableCardSkeleton columns={columns} rows={skeletonRows} />
        ) : (
          <div className="grid gap-3 p-3" role="list">
            {rows.map((row) => (
              <article
                className="overflow-hidden rounded-[14px] border border-[#e1e8e3] bg-white shadow-[0_7px_20px_rgba(27,63,54,.045)]"
                key={getRowKey(row)}
                role="listitem"
              >
                <dl className="m-0">
                  {columns.map((column) => (
                    <div
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-4 px-4 py-3",
                        column.key !== columns[0]?.key && "border-t border-[#edf1ee]",
                      )}
                      key={column.key}
                    >
                      <dt className="w-24 shrink-0 text-[9px] font-bold text-[#7a8985]">{column.title}</dt>
                      <dd className={cn("m-0 min-w-0 flex-1 text-left text-[10px] text-[#2b4540]", column.className)}>
                        {column.render(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )
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
