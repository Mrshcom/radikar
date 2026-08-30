"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { formatTomans, type Order } from "@/lib/billing";
import { AdminFilterSelect, AdminTableEmptyState, AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

type Payment = { id: string; authority: string; amountRials: number; status: string; providerCode: number | null; refId: string | null; cardPan: string | null; createdAt: string; verifiedAt: string | null };
type Response = { items: Array<{ payment: Payment; order: Order; user: { phone: string; fullName: string | null } }>; total: number };
const statusOptions = [{ value: "", label: "همه وضعیت‌ها" }, { value: "initiated", label: "ایجادشده" }, { value: "verified", label: "تأییدشده" }, { value: "failed", label: "ناموفق" }, { value: "canceled", label: "لغوشده" }, { value: "refunded", label: "بازگشت وجه" }];

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["admin", "payments", page, pageSize, search, status],
    queryFn: () => { const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search }); if (status) params.set("status", status); return apiRequest<Response>(`/api/admin/payments?${params}`); },
    enabled: user?.role !== "user", staleTime: 15_000, placeholderData: keepPreviousData,
  });
  if (user?.role === "user") return null;
  const filtered = Boolean(search || status);
  return <div className="grid gap-6"><header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><CreditCard size={18} /> امور مالی</span><h1 className="mb-0 mt-3 text-[25px] font-black">واریزی‌ها و تراکنش‌های درگاه</h1></header><section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
    <AdminTableToolbar search={search} searchPlaceholder="نام، شماره، Authority یا کد مرجع" activeFilterCount={status ? 1 : 0} onSearch={(value) => { setSearch(value); setPage(1); }} onResetFilters={() => { setStatus(""); setPage(1); }}><AdminFilterSelect label="وضعیت تراکنش" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} /></AdminTableToolbar>
    {(query.data?.items.length ?? 0) === 0 && !query.isLoading ? <AdminTableEmptyState filtered={filtered} /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-right text-[10px]"><thead className="bg-[#f7f9f6]"><tr>{["کاربر", "مبلغ", "وضعیت", "Authority", "کد مرجع", "کارت", "تاریخ"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead><tbody>{(query.data?.items ?? []).map(({ payment, user: owner }) => <tr className="border-t border-[#edf0ec]" key={payment.id}><td className="px-4 py-4">{owner.fullName || owner.phone}</td><td className="px-4 py-4">{formatTomans(payment.amountRials)} تومان</td><td className="px-4 py-4">{statusOptions.find((item) => item.value === payment.status)?.label ?? payment.status}</td><td className="max-w-[190px] truncate px-4 py-4" dir="ltr">{payment.authority}</td><td className="px-4 py-4" dir="ltr">{payment.refId || "—"}</td><td className="px-4 py-4" dir="ltr">{payment.cardPan || "—"}</td><td className="px-4 py-4">{new Date(payment.createdAt).toLocaleDateString("fa-IR")}</td></tr>)}</tbody></table></div>}
    <AdminTablePagination page={page} pageSize={pageSize} total={query.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
  </section></div>;
}
