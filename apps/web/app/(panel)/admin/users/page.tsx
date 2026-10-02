"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Users } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { adminUserEditSchema, type AdminUserEditInput } from "@radikar/validators";
import { useAuth, type UserRole } from "@/app/_components/auth";
import { SearchableSelect } from "@/app/_components/searchable-select";
import { DataTable, type DataTableColumn, type SortState } from "../../_components/data-table";
import { TableActionButton } from "../../_components/table-action-button";
import { ConfirmActionModal, Modal } from "../../_components/ui";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { PersianDateTime } from "@/lib/date-time-display";
import { useUrlTablePagination } from "@/lib/table-page-size";
import { userDisplayName, userIdentifier } from "@/lib/user-identity";
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
  phone: string | null;
  email: string | null;
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
  const selectedRole = useWatch({ control: form.control, name: "role" });
  const selectedStatus = useWatch({ control: form.control, name: "status" });
  return (
    <Modal
      title="ویرایش کاربر"
      description="نام مستعار، نقش و وضعیت حساب این کاربر را مدیریت کنید. نام مستعار فقط برای سوپرادمین قابل مشاهده است."
      onClose={() => !pending && onClose()}
      showCloseButton
    >
      <form className="mt-5 grid gap-4" onSubmit={form.handleSubmit((values) => onSave({ ...values, adminAlias: values.adminAlias?.trim() || null }))}>
        <div className="rounded-[11px] bg-[#f3f7f4] p-3 text-[11px]">
          <strong className="block">{userDisplayName(user)}</strong>
          <span className="mt-1 block text-[#71817e]" dir="ltr">{userIdentifier(user)}</span>
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
          <SearchableSelect options={[{ value: "user", label: "کاربر" }, { value: "admin", label: "ادمین" }, { value: "superadmin", label: "سوپرادمین" }]} value={selectedRole} onChange={(value) => form.setValue("role", String(value) as UserRole, { shouldDirty: true, shouldValidate: true })} />
        </div>
        <div className="grid gap-2 text-[11px] font-bold text-[#536562]">
          وضعیت حساب
          <SearchableSelect options={[{ value: "active", label: "فعال" }, { value: "suspended", label: "تعلیق‌شده" }]} value={selectedStatus} onChange={(value) => form.setValue("status", String(value) as AdminUserEditInput["status"], { shouldDirty: true, shouldValidate: true })} />
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
  const [pendingUserUpdate, setPendingUserUpdate] = useState<{
    user: AdminUser;
    input: AdminUserEditInput;
  } | null>(null);
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
      setPendingUserUpdate(null);
      setEditUser(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]);
    },
  });

  if (user?.role !== "superadmin") return null;
  const columns: DataTableColumn<AdminUser>[] = [
    { key: "user", title: "کاربر", skeletonClassName: "w-32", render: (item) => <><strong className="block text-[12px]">{userDisplayName(item)}</strong><span className="mt-1 block text-[#899592]" dir="ltr">{userIdentifier(item)}</span></> },
    { key: "alias", title: "نام مستعار داخلی", render: (item) => item.adminAlias ? <span className="font-bold text-[#8a6822]">{item.adminAlias}</span> : <span className="text-[#899592]">ثبت نشده</span> },
    { key: "role", title: "نقش", render: (item) => <span className="font-bold text-[#526461]">{roleLabels[item.role]}</span> },
    { key: "status", title: "وضعیت", render: (item) => <span className={item.status === "active" ? "text-[#14705a]" : "text-[#b14848]"}>{item.status === "active" ? "فعال" : "تعلیق‌شده"}</span> },
    { key: "records", title: "رکوردها", render: (item) => Number(item.recordsCount).toLocaleString("fa-IR") },
    { key: "created", title: "تاریخ عضویت", className: "whitespace-nowrap", render: (item) => <PersianDateTime value={item.createdAt} /> },
    { key: "login", title: "آخرین ورود", className: "whitespace-nowrap", render: (item) => item.lastLoginAt ? <PersianDateTime value={item.lastLoginAt} /> : "—" },
    { key: "manage", title: "عملیات", sortable: false, render: (item) => <TableActionButton label={`ویرایش ${userDisplayName(item)}`} disabled={updateUser.isPending} onClick={() => { updateUser.reset(); setEditUser(item); }}><Pencil size={14} /></TableActionButton> },
  ];
  return (
    <div className="grid gap-6">
      <header>
        <h1 className="mb-0 flex items-center gap-2 text-[25px] font-black text-[#19312f]"><Users size={22} /> کاربران و دسترسی‌ها</h1>
      </header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <AdminTableToolbar
          search={search}
          searchPlaceholder="نام، شماره همراه یا ایمیل"
          activeFilterCount={Number(Boolean(role)) + Number(Boolean(status))}
          onSearch={(value) => { void setFilters({ search: value }); setPage(1); }}
          onResetFilters={() => { void setFilters({ role: "", status: "" }); setPage(1); }}
        >
          <AdminFilterSelect label="نقش" value={role} onChange={(value) => { void setFilters({ role: value as typeof role }); setPage(1); }} options={[{ value: "", label: "همه نقش‌ها" }, { value: "user", label: "کاربر" }, { value: "admin", label: "ادمین" }, { value: "superadmin", label: "سوپرادمین" }]} />
          <AdminFilterSelect label="وضعیت حساب" value={status} onChange={(value) => { void setFilters({ status: value as typeof status }); setPage(1); }} options={[{ value: "", label: "همه وضعیت‌ها" }, { value: "active", label: "فعال" }, { value: "suspended", label: "تعلیق‌شده" }]} />
        </AdminTableToolbar>
        <DataTable columns={columns} rows={users.data?.items ?? []} getRowKey={(item) => item.id} loading={users.isLoading} error={users.error} retrying={users.isFetching} onRetry={() => void users.refetch()} filtered={Boolean(search || role || status)} sort={sort} onSortChange={(next) => { void setFilters({ sortBy: next?.key ?? "", sortDirection: next?.direction ?? "" }); setPage(1); }} minWidthClassName="min-w-[800px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={users.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={setPageSize} />} />
      </section>
      {editUser && <UserEditModal user={editUser} pending={updateUser.isPending} error={updateUser.error} onClose={() => { updateUser.reset(); setEditUser(null); }} onSave={(input) => setPendingUserUpdate({ user: editUser, input })} />}
      {pendingUserUpdate && (
        <ConfirmActionModal
          title={pendingUserUpdate.input.status !== pendingUserUpdate.user.status ? "تأیید تعلیق کاربر" : "تأیید تغییر سطح دسترسی"}
          description={`تغییرات حساب ${userDisplayName(pendingUserUpdate.user)} ثبت شود؟`}
          confirmLabel="تأیید و ذخیره"
          pending={updateUser.isPending}
          tone={pendingUserUpdate.input.status === "suspended" ? "danger" : "primary"}
          onCancel={() => setPendingUserUpdate(null)}
          onConfirm={() => updateUser.mutate({ id: pendingUserUpdate.user.id, input: pendingUserUpdate.input })}
        />
      )}
    </div>
  );
}
