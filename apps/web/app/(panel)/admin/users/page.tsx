"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { useAuth, type UserRole } from "@/app/_components/auth";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { ConfirmActionModal } from "../../_components/ui";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import { useTablePageSize } from "@/lib/table-page-size";
import {
  AdminFilterSelect,
  AdminTablePagination,
  AdminTableToolbar,
} from "../_components/admin-table-controls";

type AdminUser = {
  id: string;
  phone: string;
  fullName: string | null;
  role: UserRole;
  status: "active" | "suspended";
  createdAt: string;
  lastLoginAt: string | null;
  recordsCount: number;
};
type UsersResponse = { items: AdminUser[]; total: number; page: number; pageSize: number };
type PendingUserAction = {
  user: AdminUser;
  input: Partial<Pick<AdminUser, "role" | "status">>;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
};
const roleLabels: Record<UserRole, string> = { user: "کاربر", admin: "ادمین", superadmin: "سوپرادمین" };

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, isSaving: pageSizeSaving } = useTablePageSize();
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingUserAction | null>(null);
  const users = useQuery({
    queryKey: ["admin", "users", search, role, status, page, pageSize],
    queryFn: () => apiRequest<UsersResponse>(
      `/api/admin/users?${buildQueryString({ search, role, status, page, pageSize })}`,
    ),
    enabled: user?.role === "superadmin",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  const updateUser = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<AdminUser, "role" | "status">> }) =>
      apiRequest(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: async () => {
      setPendingAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]);
    },
  });

  if (user?.role !== "superadmin") return null;
  const columns: DataTableColumn<AdminUser>[] = [
    { key: "user", title: "کاربر", skeletonClassName: "w-32", render: (item) => <><strong className="block text-[11px]">{item.fullName || "بدون نام"}</strong><span className="mt-1 block w-fit text-[#899592]" dir="ltr">{item.phone}</span></> },
    { key: "role", title: "نقش", render: (item) => <select className="rounded-[8px] border border-[#dfe5df] bg-white px-2 py-1.5" value={item.role} disabled={item.id === user.id || updateUser.isPending} onChange={(event) => { const nextRole = event.target.value as UserRole; setPendingAction({ user: item, input: { role: nextRole }, title: "تأیید تغییر سطح دسترسی", description: `نقش ${item.fullName || item.phone} از «${roleLabels[item.role]}» به «${roleLabels[nextRole]}» تغییر کند؟`, confirmLabel: "تغییر نقش" }); }}>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select> },
    { key: "status", title: "وضعیت", render: (item) => <span className={item.status === "active" ? "text-[#14705a]" : "text-[#b14848]"}>{item.status === "active" ? "فعال" : "تعلیق‌شده"}</span> },
    { key: "records", title: "رکوردها", render: (item) => Number(item.recordsCount).toLocaleString("fa-IR") },
    { key: "created", title: "تاریخ عضویت", render: (item) => new Date(item.createdAt).toLocaleDateString("fa-IR") },
    { key: "login", title: "آخرین ورود", render: (item) => item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleDateString("fa-IR") : "—" },
    { key: "manage", title: "مدیریت", render: (item) => { const suspending = item.status === "active"; return <button className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 font-bold disabled:opacity-40" type="button" disabled={item.id === user.id || updateUser.isPending} onClick={() => setPendingAction({ user: item, input: { status: suspending ? "suspended" : "active" }, title: suspending ? "تأیید تعلیق کاربر" : "تأیید فعال‌سازی کاربر", description: `${item.fullName || item.phone} ${suspending ? "تعلیق" : "دوباره فعال"} شود؟`, confirmLabel: suspending ? "تعلیق کاربر" : "فعال‌سازی کاربر", tone: suspending ? "danger" : "primary" })}>{suspending ? "تعلیق" : "فعال‌سازی"}</button>; } },
  ];
  return (
    <div className="grid gap-6">
      <header>
        <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><Users size={18} /> مدیریت کاربران</span>
        <h1 className="mb-0 mt-3 text-[25px] font-black">کاربران و سطح دسترسی</h1>
      </header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <div className="border-b border-[#edf0ec] p-5">
          <div>
            <h2 className="m-0 text-[14px] font-extrabold">فهرست همه کاربران</h2>
            <small className="mt-1 block text-[9px] text-[#8a9794]">{Number(users.data?.total ?? 0).toLocaleString("fa-IR")} حساب</small>
          </div>
          <AdminTableToolbar
            search={search}
            searchPlaceholder="نام یا شماره همراه"
            activeFilterCount={Number(Boolean(role)) + Number(Boolean(status))}
            onSearch={(value) => { setSearch(value); setPage(1); }}
            onResetFilters={() => { setRole(""); setStatus(""); setPage(1); }}
          >
            <AdminFilterSelect label="نقش" value={role} onChange={(value) => { setRole(value); setPage(1); }} options={[{ value: "", label: "همه نقش‌ها" }, { value: "user", label: "کاربر" }, { value: "admin", label: "ادمین" }, { value: "superadmin", label: "سوپرادمین" }]} />
            <AdminFilterSelect label="وضعیت حساب" value={status} onChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: "", label: "همه وضعیت‌ها" }, { value: "active", label: "فعال" }, { value: "suspended", label: "تعلیق‌شده" }]} />
          </AdminTableToolbar>
        </div>
        <DataTable columns={columns} rows={users.data?.items ?? []} getRowKey={(item) => item.id} loading={users.isLoading} error={users.error} retrying={users.isFetching} onRetry={() => void users.refetch()} filtered={Boolean(search || role || status)} minWidthClassName="min-w-[800px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={users.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />} />
      </section>
      {pendingAction && (
        <ConfirmActionModal
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          tone={pendingAction.tone}
          pending={updateUser.isPending}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => updateUser.mutate({ id: pendingAction.user.id, input: pendingAction.input })}
        />
      )}
    </div>
  );
}
