"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ReceiptText } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { formatTomans, usePlans, type Order, type Plan } from "@/lib/billing";
import {
  AdminFilterSelect,
  AdminTableEmptyState,
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

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const plans = usePlans();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [planId, setPlanId] = useState("");
  const query = useQuery({
    queryKey: ["admin", "orders", page, pageSize, search, status, planId],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search });
      if (status) params.set("status", status);
      if (planId) params.set("planId", planId);
      return apiRequest<Response>(`/api/admin/orders?${params}`);
    },
    enabled: user?.role !== "user",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  if (user?.role === "user") return null;
  const filtered = Boolean(search || status || planId);
  return (
    <div className="grid gap-6">
      <header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><ReceiptText size={18} /> مدیریت فروش</span><h1 className="mb-0 mt-3 text-[25px] font-black">سفارش‌ها و پیگیری وضعیت</h1></header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <AdminTableToolbar search={search} searchPlaceholder="شماره سفارش، نام یا شماره کاربر" activeFilterCount={[status, planId].filter(Boolean).length} onSearch={(value) => { setSearch(value); setPage(1); }} onResetFilters={() => { setStatus(""); setPlanId(""); setPage(1); }}>
          <AdminFilterSelect label="وضعیت سفارش" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} />
          <AdminFilterSelect label="پلن" value={planId} options={[{ value: "", label: "همه پلن‌ها" }, ...(plans.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))]} onChange={(value) => { setPlanId(value); setPage(1); }} />
        </AdminTableToolbar>
        {(query.data?.items.length ?? 0) === 0 && !query.isLoading ? <AdminTableEmptyState filtered={filtered} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-right text-[10px]"><thead className="bg-[#f7f9f6]"><tr>{["سفارش", "کاربر", "پلن", "مبلغ", "وضعیت", "تاریخ", "پیگیری"].map((item) => <th className="px-4 py-3" key={item}>{item}</th>)}</tr></thead><tbody>{(query.data?.items ?? []).map(({ order, plan, user: owner }) => <tr className="border-t border-[#edf0ec]" key={order.id}><td className="px-4 py-4" dir="ltr">{order.orderNumber}</td><td className="px-4 py-4">{owner.fullName || owner.phone}</td><td className="px-4 py-4">{plan.name}</td><td className="px-4 py-4">{formatTomans(order.amountRials)} تومان</td><td className="px-4 py-4">{statusOptions.find((item) => item.value === order.status)?.label ?? order.status}</td><td className="px-4 py-4">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</td><td className="px-4 py-4" dir="ltr">{order.refId || "—"}</td></tr>)}</tbody></table></div>
        )}
        <AdminTablePagination page={page} pageSize={pageSize} total={query.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
      </section>
    </div>
  );
}
