"use client";

import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "../_components/data-table";
import { TableFilterSelect, TableToolbar } from "../_components/table-controls";
import { TablePagination } from "../_components/table-pagination";
import { formatTomans, useOrders, type Order, type Plan } from "@/lib/billing";
import { useTablePageSize } from "@/lib/table-page-size";

const statusLabel = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", failed: "ناموفق", canceled: "لغوشده", refunded: "بازگشت وجه" } as const;
const statusOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
];

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { pageSize, setPageSize, isSaving: pageSizeSaving } = useTablePageSize();
  const orders = useOrders(page, pageSize, search, status);
  type OrderRow = { order: Order; plan: Plan };
  const columns: DataTableColumn<OrderRow>[] = [
    { key: "number", title: "شماره سفارش", className: "font-bold", render: ({ order }) => <span dir="ltr">{order.orderNumber}</span> },
    { key: "plan", title: "پلن", render: ({ plan }) => plan.name },
    { key: "amount", title: "مبلغ", render: ({ order }) => `${formatTomans(order.amountRials)} تومان` },
    { key: "status", title: "وضعیت", render: ({ order }) => statusLabel[order.status] },
    { key: "date", title: "تاریخ", className: "text-[#71817e]", render: ({ order }) => new Date(order.createdAt).toLocaleDateString("fa-IR") },
    { key: "tracking", title: "کد پیگیری", render: ({ order }) => <span dir="ltr">{order.refId || "—"}</span> },
  ];
  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><ReceiptText size={18} /> سفارش‌ها</span>
          <h1 className="mb-0 mt-3 text-[26px] font-black">سفارش‌ها و پرداخت‌های من</h1>
        </div>
        <Link className="rounded-[11px] bg-[#0f7b62] px-4 py-3 text-[10px] font-bold text-white no-underline" href="/upgrade">خرید یا ارتقای بسته</Link>
      </header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <TableToolbar
          search={search}
          searchPlaceholder="شماره سفارش"
          activeFilterCount={status ? 1 : 0}
          onSearch={(value) => { setSearch(value); setPage(1); }}
          onResetFilters={() => { setStatus(""); setPage(1); }}
        >
          <TableFilterSelect
            label="وضعیت سفارش"
            value={status}
            options={statusOptions}
            onChange={(value) => { setStatus(value); setPage(1); }}
          />
        </TableToolbar>
        <DataTable columns={columns} rows={orders.data?.items ?? []} getRowKey={({ order }) => order.id} loading={orders.isLoading} error={orders.error} retrying={orders.isFetching} onRetry={() => void orders.refetch()} filtered={Boolean(search || status)} minWidthClassName="min-w-[720px]" footer={<TablePagination page={page} pageSize={pageSize} total={orders.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />} />
      </section>
    </div>
  );
}
