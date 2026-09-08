"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { useUrlTablePagination } from "@/lib/table-page-size";
import {
  createTableFilterParser,
  tableQueryStateOptions,
  tableSearchParser,
} from "@/lib/table-search-params";
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
const recordFilterParsers = {
  search: tableSearchParser,
  collection: createTableFilterParser(
    collectionOptions.slice(1).map((item) => item.value),
  ),
};

export default function AdminRecordsPage() {
  const { user } = useAuth();
  const [{ search, collection }, setFilters] = useQueryStates(
    recordFilterParsers,
    { ...tableQueryStateOptions, urlKeys: { search: "q" } },
  );
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } =
    useUrlTablePagination();
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
    <AdminTableToolbar search={search} searchPlaceholder="شناسه، شماره مالک یا فضای کاری" activeFilterCount={collection ? 1 : 0} onSearch={(value) => { void setFilters({ search: value }); setPage(1); }} onResetFilters={() => { void setFilters({ collection: "" }); setPage(1); }}><AdminFilterSelect label="نوع اطلاعات" value={collection} options={collectionOptions} onChange={(value) => { void setFilters({ collection: value }); setPage(1); }} /></AdminTableToolbar>
    <DataTable columns={columns} rows={records.data?.items ?? []} getRowKey={(item) => `${item.collection}:${item.id}`} loading={records.isLoading} error={records.error} retrying={records.isFetching} onRetry={() => void records.refetch()} filtered={filtered} minWidthClassName="min-w-[680px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={records.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={setPageSize} />} />
  </section></div>;
}
