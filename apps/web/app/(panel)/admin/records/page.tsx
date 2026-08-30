"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { AdminFilterSelect, AdminTableEmptyState, AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

type RecordsResponse = { items: { id: string; collection: string; profileId: string | null; ownerUserId: string | null; ownerPhone: string | null; updatedAt: string }[]; total: number };
const collectionOptions = [
  { value: "", label: "همه انواع اطلاعات" },
  { value: "profiles", label: "فضاهای کاری" }, { value: "knowledge", label: "پایگاه دانش" },
  { value: "resumes", label: "رزومه‌ها" }, { value: "jobs", label: "فرصت‌های شغلی" },
  { value: "applications", label: "اپلای‌ها" }, { value: "interviews", label: "مصاحبه‌ها" },
  { value: "dashboard", label: "داده‌های داشبورد" },
];

export default function AdminRecordsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("");
  const records = useQuery({
    queryKey: ["admin", "records", page, pageSize, search, collection],
    queryFn: () => { const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search }); if (collection) params.set("collection", collection); return apiRequest<RecordsResponse>(`/api/admin/records?${params}`); },
    enabled: user?.role === "superadmin", staleTime: 15_000, placeholderData: keepPreviousData,
  });
  if (user?.role !== "superadmin") return null;
  const filtered = Boolean(search || collection);
  return <div className="grid gap-6"><header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><Database size={18} /> پایش داده‌ها</span><h1 className="mb-0 mt-3 text-[25px] font-black">همه اطلاعات ثبت‌شده در سامانه</h1></header><section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
    <AdminTableToolbar search={search} searchPlaceholder="شناسه، شماره مالک یا فضای کاری" activeFilterCount={collection ? 1 : 0} onSearch={(value) => { setSearch(value); setPage(1); }} onResetFilters={() => { setCollection(""); setPage(1); }}><AdminFilterSelect label="نوع اطلاعات" value={collection} options={collectionOptions} onChange={(value) => { setCollection(value); setPage(1); }} /></AdminTableToolbar>
    {(records.data?.items.length ?? 0) === 0 && !records.isLoading ? <AdminTableEmptyState filtered={filtered} /> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-right text-[10px]"><thead className="bg-[#f7f9f6] text-[#71817e]"><tr>{["نوع اطلاعات", "شناسه", "مالک", "فضای کاری", "آخرین تغییر"].map((title) => <th className="px-4 py-3" key={title}>{title}</th>)}</tr></thead><tbody>{(records.data?.items ?? []).map((item) => <tr className="border-t border-[#edf0ec]" key={`${item.collection}:${item.id}`}><td className="px-4 py-3 font-bold text-[#285f52]">{collectionOptions.find((option) => option.value === item.collection)?.label ?? item.collection}</td><td className="max-w-[230px] truncate px-4 py-3 text-[#71817e]" dir="ltr">{item.id}</td><td className="px-4 py-3" dir="ltr">{item.ownerPhone || "داده قدیمی"}</td><td className="px-4 py-3 text-[#71817e]">{item.profileId || "—"}</td><td className="px-4 py-3 text-[#71817e]">{new Date(item.updatedAt).toLocaleDateString("fa-IR")}</td></tr>)}</tbody></table></div>}
    <AdminTablePagination page={page} pageSize={pageSize} total={records.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
  </section></div>;
}
