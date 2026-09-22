"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { adminUserEditSchema, type AdminUserEditInput } from "@radikar/validators";
import { useAuth, type UserRole } from "@/app/_components/auth";
import { DataTable, type DataTableColumn, type SortState } from "../../_components/data-table";
import { Modal } from "../../_components/ui";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { PersianDateTime } from "@/lib/date-time-display";
import { useUrlTablePagination } from "@/lib/table-page-size";
import {
  createTableFilterParser,
  tableQueryStateOptions,
  tableSearchParser,
  tableSortByParser,
  tableSortDirectionParser,
} from "@/lib/table-search-params";
import {
  AdminFilterSelect,
  AdminTablePagination,
  AdminTableToolbar,
} from "../_components/admin-table-controls";

type AdminUser = {
  id: string;
  phone: string;
  fullName: string | null;
  adminAlias: string | null;
  role: UserRole;
  status: "active" | "suspended";
  createdAt: string;
  lastLoginAt: string | null;
  recordsCount: number;
};
type UsersResponse = { items: AdminUser[]; total: number; page: number; pageSize: number };
function UserEditModal({
  user,
  pending,
  error,
  onClose,
  onSave,
}: {
  user: AdminUser;
  pending: boolean;
  error: Error | null;
  onClose: () => void;
  onSave: (input: AdminUserEditInput) => void;
}) {
  const form = useForm<AdminUserEditInput>({
    resolver: zodResolver(adminUserEditSchema),
    defaultValues: { adminAlias: user.adminAlias ?? "", role: user.role, status: user.status },
  });
  return (
    <Modal
      title="ویرایش کاربر"
      description="نام مستعار، نقش و وضعیت حساب این کاربر را مدیریت کنید. نام مستعار فقط برای سوپرادمین قابل مشاهده است."
      onClose={() => !pending && onClose()}
      showCloseButton
    >
      <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit((values) => onSave({ ...values, adminAlias: values.adminAlias?.trim() || null }))}>
        <div className="rounded-[11px] bg-[#f3f7f4] p-3 text-[11px]">
          <strong className="block">{user.fullName || "بدون نام"}</strong>
          <span className="mt-1 block text-[#71817e]" dir="ltr">{user.phone}</span>
        </div>
        <label className="grid gap-2 text-[11px] font-bold text-[#536562]">
          نام مستعار
          <input
            {...form.register("adminAlias")}
            autoFocus
            className="h-11 rounded-[10px] border border-[#dfe5df] bg-white px-3 text-[11px] font-normal outline-none focus:border-[#0f7b62]"
            placeholder="مثلاً علی رضایی — مشتری قدیمی"
          />
          {form.formState.errors.adminAlias && <span className="text-[10px] text-[#b14848]">{form.formState.errors.adminAlias.message}</span>}
        </label>
        <div className="grid gap-2 text-[11px] font-bold text-[#536562]">
          نقش
          <select {...form.register("role")} className="h-11 rounded-[10px] border border-[#dfe5df] bg-white px-3 text-[11px] font-normal outline-none focus:border-[#0f7b62]">
            <option value="user">کاربر</option>
            <option value="admin">ادمین</option>
            <option value="superadmin">سوپرادمین</option>
          </select>
        </div>
        <div className="grid gap-2 text-[11px] font-bold text-[#536562]">
          وضعیت حساب
          <select {...form.register("status")} className="h-11 rounded-[10px] border border-[#dfe5df] bg-white px-3 text-[11px] font-normal outline-none focus:border-[#0f7b62]">
            <option value="active">فعال</option>
            <option value="suspended">تعلیق‌شده</option>
          </select>
        </div>
        <p className="m-0 text-[10px] leading-6 text-[#71817e]">خالی گذاشتن نام مستعار، آن را حذف می‌کند و نام ثبت‌شده‌ی خود کاربر تغییر نمی‌کند.</p>
        {error && <p className="m-0 rounded-[10px] bg-[#fff0ed] p-3 text-[10px] font-bold text-[#b14848]">{error.message}</p>}
        <div className="flex justify-end gap-2">
          <button className="min-h-10 rounded-[10px] border border-[#dfe5df] bg-white px-4 text-[11px] font-bold text-[#526461]" disabled={pending} type="button" onClick={onClose}>انصراف</button>
          <button className="min-h-10 rounded-[10px] bg-[#0f7b62] px-4 text-[11px] font-bold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "در حال ذخیره..." : "ذخیره تغییرات"}</button>
        </div>
      </form>
    </Modal>
  );
}
const roleLabels: Record<UserRole, string> = { user: "کاربر", admin: "ادمین", superadmin: "سوپرادمین" };
const userFilterParsers = {
  search: tableSearchParser,
  role: createTableFilterParser(["user", "admin", "superadmin"]),
  status: createTableFilterParser(["active", "suspended"]),
  sortBy: tableSortByParser,
  sortDirection: tableSortDirectionParser,
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [{ search, role, status, sortBy, sortDirection }, setFilters] = useQueryStates(
    userFilterParsers,
    { ...tableQueryStateOptions, urlKeys: { search: "q" } },
  );
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } =
    useUrlTablePagination();
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const sort: SortState = sortBy && (sortDirection === "asc" || sortDirection === "desc") ? { key: sortBy, direction: sortDirection } : null;
  const users = useQuery({
    queryKey: ["admin", "users", search, role, status, page, pageSize, sortBy, sortDirection],
    queryFn: () => apiRequest<UsersResponse>(
      `/api/admin/users?${buildQueryString({ search, role, status, page, pageSize, sortBy, sortDirection })}`,
    ),
    enabled: user?.role === "superadmin",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  const updateUser = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AdminUserEditInput }) => {
      await apiRequest(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role: input.role, status: input.status }) });
      return apiRequest<{ id: string; adminAlias: string | null }>(`/api/admin/users/${id}/alias`, { method: "PATCH", body: JSON.stringify({ adminAlias: input.adminAlias?.trim() || null }) });
    },
    onSuccess: async () => {
      setEditUser(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]);
    },
  });

  if (user?.role !== "superadmin") return null;
  const columns: DataTableColumn<AdminUser>[] = [
    { key: "user", title: "کاربر", skeletonClassName: "w-32", render: (item) => <><strong className="block text-[11px]">{item.fullName || "بدون نام"}</strong><span className="mt-1 block text-[#899592]" dir="ltr">{item.phone}</span></> },
    { key: "alias", title: "نام مستعار داخلی", render: (item) => item.adminAlias ? <span className="font-bold text-[#8a6822]">{item.adminAlias}</span> : <span className="text-[#899592]">ثبت نشده</span> },
    { key: "role", title: "نقش", render: (item) => <span className="font-bold text-[#526461]">{roleLabels[item.role]}</span> },
    { key: "status", title: "وضعیت", render: (item) => <span className={item.status === "active" ? "text-[#14705a]" : "text-[#b14848]"}>{item.status === "active" ? "فعال" : "تعلیق‌شده"}</span> },
    { key: "records", title: "رکوردها", render: (item) => Number(item.recordsCount).toLocaleString("fa-IR") },
    { key: "created", title: "تاریخ عضویت", render: (item) => <PersianDateTime value={item.createdAt} /> },
    { key: "login", title: "آخرین ورود", render: (item) => item.lastLoginAt ? <PersianDateTime value={item.lastLoginAt} /> : "—" },
    { key: "manage", title: "مدیریت", sortable: false, render: (item) => <button className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 font-bold text-[#526461] disabled:opacity-40" type="button" disabled={updateUser.isPending} onClick={() => { updateUser.reset(); setEditUser(item); }}>ویرایش</button> },
  ];
  return (
    <div className="grid gap-6">
      <header>
        <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><Users size={18} /> مدیریت کاربران</span>
        <h1 className="mb-0 mt-3 text-[25px] font-black">کاربران و سطح دسترسی</h1>
      </header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <AdminTableToolbar
          search={search}
          searchPlaceholder="نام یا شماره همراه"
          activeFilterCount={Number(Boolean(role)) + Number(Boolean(status))}
          onSearch={(value) => { void setFilters({ search: value }); setPage(1); }}
          onResetFilters={() => { void setFilters({ role: "", status: "" }); setPage(1); }}
        >
          <AdminFilterSelect label="نقش" value={role} onChange={(value) => { void setFilters({ role: value as typeof role }); setPage(1); }} options={[{ value: "", label: "همه نقش‌ها" }, { value: "user", label: "کاربر" }, { value: "admin", label: "ادمین" }, { value: "superadmin", label: "سوپرادمین" }]} />
          <AdminFilterSelect label="وضعیت حساب" value={status} onChange={(value) => { void setFilters({ status: value as typeof status }); setPage(1); }} options={[{ value: "", label: "همه وضعیت‌ها" }, { value: "active", label: "فعال" }, { value: "suspended", label: "تعلیق‌شده" }]} />
        </AdminTableToolbar>
        <DataTable columns={columns} rows={users.data?.items ?? []} getRowKey={(item) => item.id} loading={users.isLoading} error={users.error} retrying={users.isFetching} onRetry={() => void users.refetch()} filtered={Boolean(search || role || status)} sort={sort} onSortChange={(next) => { void setFilters({ sortBy: next?.key ?? "", sortDirection: next?.direction ?? "" }); setPage(1); }} minWidthClassName="min-w-[800px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={users.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={setPageSize} />} />
      </section>
      {editUser && <UserEditModal user={editUser} pending={updateUser.isPending} error={updateUser.error} onClose={() => { updateUser.reset(); setEditUser(null); }} onSave={(input) => updateUser.mutate({ id: editUser.id, input })} />}
    </div>
  );
}
