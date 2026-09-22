"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn, type SortState } from "../../_components/data-table";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { formatTomans, type Order } from "@/lib/billing";
import { PersianDateTime } from "@/lib/date-time-display";
import { useUrlTablePagination } from "@/lib/table-page-size";
import {
  createTableFilterParser,
  tableQueryStateOptions,
  tableSearchParser,
  tableSortByParser,
  tableSortDirectionParser,
} from "@/lib/table-search-params";
import { AdminFilterSelect, AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

type Payment = { id: string; authority: string; amountRials: number; status: string; providerCode: number | null; refId: string | null; cardPan: string | null; createdAt: string; verifiedAt: string | null };
type Response = { items: Array<{ payment: Payment; order: Order; user: { phone: string; fullName: string | null } }>; total: number };
const statusOptions = [{ value: "", label: "همه وضعیت‌ها" }, { value: "initiated", label: "ایجادشده" }, { value: "verified", label: "تأییدشده" }, { value: "failed", label: "ناموفق" }, { value: "canceled", label: "لغوشده" }, { value: "refunded", label: "بازگشت وجه" }];
const paymentFilterParsers = {
  search: tableSearchParser,
  status: createTableFilterParser(statusOptions.slice(1).map((item) => item.value)),
  sortBy: tableSortByParser,
  sortDirection: tableSortDirectionParser,
};

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [{ search, status, sortBy, sortDirection }, setFilters] = useQueryStates(paymentFilterParsers, {
    ...tableQueryStateOptions,
    urlKeys: { search: "q" },
  });
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } =
    useUrlTablePagination();
  const sort: SortState = sortBy && (sortDirection === "asc" || sortDirection === "desc") ? { key: sortBy, direction: sortDirection } : null;
  const query = useQuery({
    queryKey: ["admin", "payments", page, pageSize, search, status, sortBy, sortDirection],
    queryFn: () => apiRequest<Response>(`/api/admin/payments?${buildQueryString({ page, pageSize, search, status, sortBy, sortDirection })}`),
    enabled: user?.role !== "user", staleTime: 15_000, placeholderData: keepPreviousData,
  });
  if (user?.role === "user") return null;
  const filtered = Boolean(search || status);
  const columns: DataTableColumn<Response["items"][number]>[] = [
    { key: "user", title: "کاربر", render: ({ user: owner }) => owner.fullName || owner.phone },
    { key: "amount", title: "مبلغ", render: ({ payment }) => `${formatTomans(payment.amountRials)} تومان` },
    { key: "status", title: "وضعیت", render: ({ payment }) => statusOptions.find((item) => item.value === payment.status)?.label ?? payment.status },
    { key: "authority", title: "Authority", className: "max-w-[190px] truncate", render: ({ payment }) => <span dir="ltr">{payment.authority}</span> },
    { key: "reference", title: "کد مرجع", render: ({ payment }) => <span dir="ltr">{payment.refId || "—"}</span> },
    { key: "card", title: "کارت", render: ({ payment }) => <span dir="ltr">{payment.cardPan || "—"}</span> },
    { key: "date", title: "تاریخ و ساعت", className: "whitespace-nowrap", render: ({ payment }) => <PersianDateTime value={payment.createdAt} /> },
  ];
  return <div className="grid gap-6"><header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><CreditCard size={18} /> امور مالی</span><h1 className="mb-0 mt-3 text-[25px] font-black">واریزی‌ها و تراکنش‌های درگاه</h1></header><section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
    <AdminTableToolbar search={search} searchPlaceholder="نام، شماره، Authority یا کد مرجع" activeFilterCount={status ? 1 : 0} onSearch={(value) => { void setFilters({ search: value }); setPage(1); }} onResetFilters={() => { void setFilters({ status: "" }); setPage(1); }}><AdminFilterSelect label="وضعیت تراکنش" value={status} options={statusOptions} onChange={(value) => { void setFilters({ status: value }); setPage(1); }} /></AdminTableToolbar>
    <DataTable columns={columns} rows={query.data?.items ?? []} getRowKey={({ payment }) => payment.id} loading={query.isLoading} error={query.error} retrying={query.isFetching} onRetry={() => void query.refetch()} filtered={filtered} sort={sort} onSortChange={(next) => { void setFilters({ sortBy: next?.key ?? "", sortDirection: next?.direction ?? "" }); setPage(1); }} minWidthClassName="min-w-[900px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={query.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={setPageSize} />} />
  </section></div>;
}
