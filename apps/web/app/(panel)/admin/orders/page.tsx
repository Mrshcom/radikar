"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { formatTomans, usePlans, type Order, type Plan } from "@/lib/billing";
import { useUrlTablePagination } from "@/lib/table-page-size";
import {
  createTableFilterParser,
  tableOptionalFilterParser,
  tableQueryStateOptions,
  tableSearchParser,
} from "@/lib/table-search-params";
import {
  AdminFilterSelect,
  AdminTablePagination,
  AdminTableToolbar,
} from "../_components/admin-table-controls";

type Response = {
  items: Array<{ order: Order; plan: Plan; user: { phone: string; fullName: string | null } }>;
  total: number;
};

const statusOptions = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "pending", label: "در انتظار" },
  { value: "paid", label: "پرداخت‌شده" },
  { value: "failed", label: "ناموفق" },
  { value: "canceled", label: "لغوشده" },
  { value: "refunded", label: "بازگشت وجه" },
];
const orderFilterParsers = {
  search: tableSearchParser,
  status: createTableFilterParser(statusOptions.slice(1).map((item) => item.value)),
  planId: tableOptionalFilterParser,
};

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const plans = usePlans();
  const [{ search, status, planId }, setFilters] = useQueryStates(
    orderFilterParsers,
    { ...tableQueryStateOptions, urlKeys: { search: "q", planId: "plan" } },
  );
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } =
    useUrlTablePagination();
  const query = useQuery({
    queryKey: ["admin", "orders", page, pageSize, search, status, planId],
    queryFn: () => apiRequest<Response>(
      `/api/admin/orders?${buildQueryString({ page, pageSize, search, status, planId })}`,
    ),
    enabled: user?.role !== "user",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  if (user?.role === "user") return null;
  const filtered = Boolean(search || status || planId);
  const columns: DataTableColumn<Response["items"][number]>[] = [
    { key: "order", title: "سفارش", className: "font-bold", render: ({ order }) => <span dir="ltr">{order.orderNumber}</span> },
    { key: "user", title: "کاربر", render: ({ user: owner }) => owner.fullName || owner.phone },
    { key: "plan", title: "پلن", render: ({ plan }) => plan.name },
    { key: "amount", title: "مبلغ", render: ({ order }) => `${formatTomans(order.amountRials)} تومان` },
    { key: "status", title: "وضعیت", render: ({ order }) => statusOptions.find((item) => item.value === order.status)?.label ?? order.status },
    { key: "date", title: "تاریخ", render: ({ order }) => new Date(order.createdAt).toLocaleDateString("fa-IR") },
    { key: "tracking", title: "پیگیری", render: ({ order }) => <span dir="ltr">{order.refId || "—"}</span> },
  ];
  return (
    <div className="grid gap-6">
      <header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><ReceiptText size={18} /> مدیریت فروش</span><h1 className="mb-0 mt-3 text-[25px] font-black">سفارش‌ها و پیگیری وضعیت</h1></header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <AdminTableToolbar search={search} searchPlaceholder="شماره سفارش، نام یا شماره کاربر" activeFilterCount={[status, planId].filter(Boolean).length} onSearch={(value) => { void setFilters({ search: value }); setPage(1); }} onResetFilters={() => { void setFilters({ status: "", planId: "" }); setPage(1); }}>
          <AdminFilterSelect label="وضعیت سفارش" value={status} options={statusOptions} onChange={(value) => { void setFilters({ status: value }); setPage(1); }} />
          <AdminFilterSelect label="پلن" value={planId} options={[{ value: "", label: "همه پلن‌ها" }, ...(plans.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))]} onChange={(value) => { void setFilters({ planId: value }); setPage(1); }} />
        </AdminTableToolbar>
        <DataTable columns={columns} rows={query.data?.items ?? []} getRowKey={({ order }) => order.id} loading={query.isLoading} error={query.error} retrying={query.isFetching} onRetry={() => void query.refetch()} filtered={filtered} minWidthClassName="min-w-[850px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={query.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={setPageSize} />} />
      </section>
    </div>
  );
}
