"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { useAuth, type UserRole } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import {
  AdminFilterSelect,
  AdminTableEmptyState,
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
const roleLabels: Record<UserRole, string> = { user: "کاربر", admin: "ادمین", superadmin: "سوپرادمین" };

export default function AdminUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const users = useQuery({
    queryKey: ["admin", "users", search, role, status, page, pageSize],
    queryFn: () =>
      apiRequest<UsersResponse>(
        `/api/admin/users?search=${encodeURIComponent(search)}&role=${role}&status=${status}&page=${page}&pageSize=${pageSize}`,
      ),
    enabled: user?.role === "superadmin",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  const updateUser = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<AdminUser, "role" | "status">> }) =>
      apiRequest(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]);
    },
  });

  if (user?.role !== "superadmin") return null;
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
        {!users.isLoading && (users.data?.items.length ?? 0) === 0 ? <AdminTableEmptyState filtered={Boolean(search || role || status)} /> : <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-right text-[10px]">
            <thead className="bg-[#f7f9f6] text-[#71817e]"><tr>{["کاربر", "نقش", "وضعیت", "رکوردها", "تاریخ عضویت", "آخرین ورود", "مدیریت"].map((title) => <th className="px-4 py-3" key={title}>{title}</th>)}</tr></thead>
            <tbody>{(users.data?.items ?? []).map((item) => (
              <tr className="border-t border-[#edf0ec]" key={item.id}>
                <td className="px-4 py-3"><strong className="block text-[11px]">{item.fullName || "بدون نام"}</strong><span className="mt-1 block w-fit text-[#899592]" dir="ltr">{item.phone}</span></td>
                <td className="px-4 py-3"><select className="rounded-[8px] border border-[#dfe5df] bg-white px-2 py-1.5" value={item.role} disabled={item.id === user.id || updateUser.isPending} onChange={(event) => updateUser.mutate({ id: item.id, input: { role: event.target.value as UserRole } })}>{Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
                <td className="px-4 py-3"><span className={item.status === "active" ? "text-[#14705a]" : "text-[#b14848]"}>{item.status === "active" ? "فعال" : "تعلیق‌شده"}</span></td>
                <td className="px-4 py-3">{Number(item.recordsCount).toLocaleString("fa-IR")}</td>
                <td className="px-4 py-3">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</td>
                <td className="px-4 py-3">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleDateString("fa-IR") : "—"}</td>
                <td className="px-4 py-3"><button className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 font-bold disabled:opacity-40" type="button" disabled={item.id === user.id || updateUser.isPending} onClick={() => updateUser.mutate({ id: item.id, input: { status: item.status === "active" ? "suspended" : "active" } })}>{item.status === "active" ? "تعلیق" : "فعال‌سازی"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
        <AdminTablePagination page={page} pageSize={pageSize} total={users.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
      </section>
    </div>
  );
}
