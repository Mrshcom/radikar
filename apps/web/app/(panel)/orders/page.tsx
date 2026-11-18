"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";
import { Download } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn, type SortState } from "../_components/data-table";
import { TableActionButton } from "../_components/table-action-button";
import { TableFilterSelect, TableToolbar } from "../_components/table-controls";
import { TablePagination } from "../_components/table-pagination";
import { SectionTitle } from "../_components/ui";
import { formatTomans, useOrders, type Order, type Plan } from "@/lib/billing";
import { PersianDateTime } from "@/lib/date-time-display";
import { useUrlTablePagination } from "@/lib/table-page-size";
import {
  createTableFilterParser,
  tableQueryStateOptions,
  tableSearchParser,
  tableSortByParser,
  tableSortDirectionParser,
} from "@/lib/table-search-params";
import { OfficialInvoiceModal } from "./official-invoice";
import { useEmployerProfile } from "@/lib/employer";

const statusLabel = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  failed: "ناموفق",
  canceled: "لغوشده",
  refunded: "بازگشت وجه",
} as const;
const statusOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
];
const orderFilterParsers = {
  search: tableSearchParser,
  status: createTableFilterParser(Object.keys(statusLabel)),
  sortBy: tableSortByParser,
  sortDirection: tableSortDirectionParser,
};

export default function OrdersPage() {
  const { user } = useAuth();
  const employerProfile = useEmployerProfile(user?.accountType === "employer");
  const [invoice, setInvoice] = useState<{ order: Order; plan: Plan } | null>(null);
  const buyer = {
    name:
      user?.accountType === "employer"
        ? (employerProfile.data?.profile?.companyName ?? user.fullName ?? "کارفرمای رادیکار")
        : (user?.fullName ?? "کاربر رادیکار"),
    phone: user?.phone ?? null,
  };
  const [{ search, status, sortBy, sortDirection }, setFilters] = useQueryStates(orderFilterParsers, {
    ...tableQueryStateOptions,
    urlKeys: { search: "q" },
  });
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } = useUrlTablePagination();
  const sort: SortState =
    sortBy && (sortDirection === "asc" || sortDirection === "desc") ? { key: sortBy, direction: sortDirection } : null;
  const orders = useOrders(page, pageSize, search, status, sortBy, sortDirection);
  type OrderRow = { order: Order; plan: Plan };
  const columns: DataTableColumn<OrderRow>[] = [
    {
      key: "number",
      title: "شماره سفارش",
      className: "font-bold",
      render: ({ order }) => <span dir="ltr">{order.orderNumber}</span>,
    },
    { key: "plan", title: "پلن", render: ({ plan }) => plan.name },
    { key: "amount", title: "مبلغ", render: ({ order }) => `${formatTomans(order.amountRials)} تومان` },
    { key: "status", title: "وضعیت", render: ({ order }) => statusLabel[order.status] },
    {
      key: "date",
      title: "تاریخ و ساعت",
      className: "text-[#71817e] whitespace-nowrap",
      render: ({ order }) => <PersianDateTime value={order.createdAt} />,
    },
    { key: "tracking", title: "کد پیگیری", render: ({ order }) => <span dir="ltr">{order.refId || "—"}</span> },
    {
      key: "actions",
      title: "عملیات",
      sortable: false,
      render: ({ order, plan }) =>
        order.status === "paid" ? (
          <TableActionButton label="دریافت فاکتور رسمی" onClick={() => setInvoice({ order, plan })}>
            <Download size={16} />
          </TableActionButton>
        ) : (
          <span className="text-[10px] text-[#84938f]">پس از پرداخت</span>
        ),
    },
  ];
  return (
    <div className="grid gap-6">
      <SectionTitle
        description="سفارش‌ها، پرداخت‌ها و وضعیت بسته‌های فعال خودت را یکجا پیگیری کن."
        title="سفارش‌ها و پرداخت‌های من"
        action={
          <Link
            className="rounded-[11px] bg-[#0f7b62] px-4 py-3 text-[10px] font-bold text-white no-underline"
            href="/upgrade"
          >
            خرید یا ارتقای بسته
          </Link>
        }
      />
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <TableToolbar
          search={search}
          searchPlaceholder="شماره سفارش"
          activeFilterCount={status ? 1 : 0}
          onSearch={(value) => {
            void setFilters({ search: value });
            setPage(1);
          }}
          onResetFilters={() => {
            void setFilters({ status: "" });
            setPage(1);
          }}
        >
          <TableFilterSelect
            label="وضعیت سفارش"
            value={status}
            options={statusOptions}
            onChange={(value) => {
              void setFilters({ status: value as typeof status });
              setPage(1);
            }}
          />
        </TableToolbar>
        <DataTable
          columns={columns}
          rows={orders.data?.items ?? []}
          getRowKey={({ order }) => order.id}
          loading={orders.isLoading}
          error={orders.error}
          retrying={orders.isFetching}
          onRetry={() => void orders.refetch()}
          filtered={Boolean(search || status)}
          sort={sort}
          onSortChange={(next) => {
            void setFilters({ sortBy: next?.key ?? "", sortDirection: next?.direction ?? "" });
            setPage(1);
          }}
          minWidthClassName="min-w-[720px]"
          footer={
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={orders.data?.total ?? 0}
              pageSizeSaving={pageSizeSaving}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          }
        />
      </section>
      {invoice && <OfficialInvoiceModal buyer={buyer} order={invoice.order} plan={invoice.plan} onClose={() => setInvoice(null)} />}
    </div>
  );
}
