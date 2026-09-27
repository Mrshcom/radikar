"use client";

import { AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import { isValidElement, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { DataTableCardSkeleton, DataTableSkeleton } from "./skeletons/table-skeletons";
import { SearchableSelect } from "@/app/_components/searchable-select";

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
  sortable?: boolean;
};

export type SortDirection = "asc" | "desc";
export type SortState = { key: string; direction: SortDirection } | null;

function textFromNode(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join(" ");
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; value?: string | number };
    return props.children != null ? textFromNode(props.children) : props.value == null ? "" : String(props.value);
  }
  return "";
}

function normalizeSortText(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .trim();
}

function compareSortValues(left: string, right: string) {
  const normalizedLeft = normalizeSortText(left);
  const normalizedRight = normalizeSortText(right);
  if (!normalizedLeft && !normalizedRight) return 0;
  if (!normalizedLeft) return 1;
  if (!normalizedRight) return -1;
  const leftNumber = Number(normalizedLeft.replace(/[^\d.-]/g, ""));
  const rightNumber = Number(normalizedRight.replace(/[^\d.-]/g, ""));
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && /\d/.test(normalizedLeft) && /\d/.test(normalizedRight)) {
    return leftNumber - rightNumber;
  }
  return normalizedLeft.localeCompare(normalizedRight, "fa", { numeric: true, sensitivity: "base" });
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
  sort: controlledSort,
  onSortChange,
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
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
}) {
  const mobile = useSyncExternalStore(
    subscribeToMobileTableViewport,
    getMobileTableViewportSnapshot,
    getMobileTableViewportServerSnapshot,
  );
  const [localSort, setLocalSort] = useState<SortState>(null);
  const isControlled = onSortChange !== undefined;
  const sort = isControlled ? controlledSort ?? null : localSort;
  const sortedRows = useMemo(() => {
    if (isControlled || !sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column || column.sortable === false) return rows;
    return rows
      .map((row, index) => ({ row, index, value: textFromNode(column.render(row)) }))
      .sort((left, right) => {
        const comparison = compareSortValues(left.value, right.value);
        return comparison === 0 ? left.index - right.index : sort.direction === "asc" ? comparison : -comparison;
      })
      .map(({ row }) => row);
  }, [columns, isControlled, rows, sort]);
  const cycleSort = (key: string) => {
    const nextSort = (current: SortState): SortState => {
      if (!current || current.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    };
    if (isControlled) onSortChange?.(nextSort(sort));
    else setLocalSort(nextSort);
  };
  const sortableColumns = columns.filter((column) => column.sortable !== false);
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
          <div>
            {sortableColumns.length > 0 && <div className="flex items-center gap-2 border-b border-[#edf1ee] bg-[#f7f9f6] p-3 text-[10px]">
              <label className="flex flex-1 items-center gap-2 font-bold text-[#71817e]">مرتب‌سازی
                <SearchableSelect className="flex-1" options={[{ value: "", label: "بدون مرتب‌سازی" }, ...sortableColumns.map((column) => ({ value: column.key, label: column.title }))]} value={sort?.key ?? ""} onChange={(value) => {
                  const nextSort = String(value) ? { key: String(value), direction: "asc" as const } : null;
                  if (isControlled) onSortChange?.(nextSort); else setLocalSort(nextSort);
                }} />
              </label>
              {sort && <button className="grid size-8 place-items-center rounded-[8px] border border-[#dfe5df] bg-white text-[#526461]" type="button" onClick={() => cycleSort(sort.key)} aria-label={sort.direction === "asc" ? "مرتب‌سازی نزولی" : "غیرفعال کردن مرتب‌سازی"}>
                {sort.direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
              </button>}
            </div>}
            <div className="grid gap-3 p-3" role="list">
              {sortedRows.map((row) => (
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
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className={cn("w-full border-collapse text-right text-[10px]", minWidthClassName)}>
            <thead className="bg-[#f7f9f6] text-[#71817e]">
              <tr>
                {columns.map((column) => {
                  const isSorted = sort?.key === column.key;
                  return <th aria-sort={isSorted ? (sort.direction === "asc" ? "ascending" : "descending") : "none"} className={cn("px-4 py-3 font-extrabold", column.headerClassName)} key={column.key}>
                    {column.sortable === false ? column.title : <button className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 font-inherit text-inherit" type="button" onClick={() => cycleSort(column.key)} title={`مرتب‌سازی ${column.title}`}>
                      {column.title}
                      {isSorted ? (sort.direction === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown className="opacity-45" size={13} />}
                    </button>}
                  </th>
                })}
              </tr>
            </thead>
            {loading ? (
              <DataTableSkeleton columns={columns} rows={skeletonRows} />
            ) : (
              <tbody>
                {sortedRows.map((row) => (
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
