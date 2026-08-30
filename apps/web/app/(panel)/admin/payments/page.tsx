"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { formatTomans, type Order } from "@/lib/billing";
import { useTablePageSize } from "@/lib/table-page-size";
import { AdminFilterSelect, AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

type Payment = { id: string; authority: string; amountRials: number; status: string; providerCode: number | null; refId: string | null; cardPan: string | null; createdAt: string; verifiedAt: string | null };
type Response = { items: Array<{ payment: Payment; order: Order; user: { phone: string; fullName: string | null } }>; total: number };
const statusOptions = [{ value: "", label: "همه وضعیت‌ها" }, { value: "initiated", label: "ایجادشده" }, { value: "verified", label: "تأییدشده" }, { value: "failed", label: "ناموفق" }, { value: "canceled", label: "لغوشده" }, { value: "refunded", label: "بازگشت وجه" }];

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, isSaving: pageSizeSaving } = useTablePageSize();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["admin", "payments", page, pageSize, search, status],
    queryFn: () => apiRequest<Response>(`/api/admin/payments?${buildQueryString({ page, pageSize, search, status })}`),
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
    { key: "date", title: "تاریخ", render: ({ payment }) => new Date(payment.createdAt).toLocaleDateString("fa-IR") },
  ];
  return <div className="grid gap-6"><header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><CreditCard size={18} /> امور مالی</span><h1 className="mb-0 mt-3 text-[25px] font-black">واریزی‌ها و تراکنش‌های درگاه</h1></header><section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
    <AdminTableToolbar search={search} searchPlaceholder="نام، شماره، Authority یا کد مرجع" activeFilterCount={status ? 1 : 0} onSearch={(value) => { setSearch(value); setPage(1); }} onResetFilters={() => { setStatus(""); setPage(1); }}><AdminFilterSelect label="وضعیت تراکنش" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} /></AdminTableToolbar>
    <DataTable columns={columns} rows={query.data?.items ?? []} getRowKey={({ payment }) => payment.id} loading={query.isLoading} error={query.error} retrying={query.isFetching} onRetry={() => void query.refetch()} filtered={filtered} minWidthClassName="min-w-[900px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={query.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />} />
  </section></div>;
}
