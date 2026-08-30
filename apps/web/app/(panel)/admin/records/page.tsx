"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { useTablePageSize } from "@/lib/table-page-size";
import { AdminFilterSelect, AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

type RecordsResponse = { items: { id: string; collection: string; profileId: string | null; ownerUserId: string | null; ownerPhone: string | null; updatedAt: string }[]; total: number };
type RecordRow = RecordsResponse["items"][number];
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
  const { pageSize, setPageSize, isSaving: pageSizeSaving } = useTablePageSize();
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("");
  const records = useQuery({
    queryKey: ["admin", "records", page, pageSize, search, collection],
    queryFn: () => apiRequest<RecordsResponse>(`/api/admin/records?${buildQueryString({ page, pageSize, search, collection })}`),
    enabled: user?.role === "superadmin", staleTime: 15_000, placeholderData: keepPreviousData,
  });
  if (user?.role !== "superadmin") return null;
  const filtered = Boolean(search || collection);
  const columns: DataTableColumn<RecordRow>[] = [
    { key: "collection", title: "نوع اطلاعات", className: "font-bold text-[#285f52]", render: (item) => collectionOptions.find((option) => option.value === item.collection)?.label ?? item.collection },
    { key: "id", title: "شناسه", className: "max-w-[230px] truncate text-[#71817e]", render: (item) => <span dir="ltr">{item.id}</span> },
    { key: "owner", title: "مالک", render: (item) => <span dir="ltr">{item.ownerPhone || "داده قدیمی"}</span> },
    { key: "workspace", title: "فضای کاری", className: "text-[#71817e]", render: (item) => item.profileId || "—" },
    { key: "updated", title: "آخرین تغییر", className: "text-[#71817e]", render: (item) => new Date(item.updatedAt).toLocaleDateString("fa-IR") },
  ];
  return <div className="grid gap-6"><header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><Database size={18} /> پایش داده‌ها</span><h1 className="mb-0 mt-3 text-[25px] font-black">همه اطلاعات ثبت‌شده در سامانه</h1></header><section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
    <AdminTableToolbar search={search} searchPlaceholder="شناسه، شماره مالک یا فضای کاری" activeFilterCount={collection ? 1 : 0} onSearch={(value) => { setSearch(value); setPage(1); }} onResetFilters={() => { setCollection(""); setPage(1); }}><AdminFilterSelect label="نوع اطلاعات" value={collection} options={collectionOptions} onChange={(value) => { setCollection(value); setPage(1); }} /></AdminTableToolbar>
    <DataTable columns={columns} rows={records.data?.items ?? []} getRowKey={(item) => `${item.collection}:${item.id}`} loading={records.isLoading} error={records.error} retrying={records.isFetching} onRetry={() => void records.refetch()} filtered={filtered} minWidthClassName="min-w-[680px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={records.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />} />
  </section></div>;
}
