import { cn } from "@/lib/cn";
import type { DataTableColumn } from "../data-table";

export function DataTableSkeleton<T>({ columns, rows = 5 }: { columns: DataTableColumn<T>[]; rows?: number }) {
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

export function DataTableCardSkeleton<T>({ columns, rows = 5 }: { columns: DataTableColumn<T>[]; rows?: number }) {
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
