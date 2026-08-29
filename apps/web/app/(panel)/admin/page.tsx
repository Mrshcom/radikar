"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Database, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth, type UserRole } from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { AdminNav } from "./_components/admin-nav";

const searchSchema = z.object({ search: z.string().trim().max(100) });
type SearchValues = z.infer<typeof searchSchema>;

type Stats = {
  users: { total: number; active: number };
  records: { total: number; byCollection: { collection: string; total: number }[] };
  usersByRole: { role: UserRole; total: number }[];
};
type BillingStats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  revenueRials: number;
};

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
type RecordsResponse = {
  items: {
    id: string;
    collection: string;
    profileId: string | null;
    ownerUserId: string | null;
    ownerPhone: string | null;
    updatedAt: string;
  }[];
  total: number;
  page: number;
  pageSize: number;
};

const roleLabels: Record<UserRole, string> = {
  user: "کاربر",
  admin: "ادمین",
  superadmin: "سوپرادمین",
};

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [recordsPage, setRecordsPage] = useState(1);
  const { register, handleSubmit } = useForm<SearchValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { search: "" },
  });
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiRequest<Stats>("/api/admin/stats"),
    enabled: user?.role === "superadmin",
    staleTime: 30_000,
  });
  const billingStats = useQuery({
    queryKey: ["admin", "billing-stats"],
    queryFn: () => apiRequest<BillingStats>("/api/admin/billing-stats"),
    enabled: user?.role === "superadmin",
    staleTime: 30_000,
  });
  const users = useQuery({
    queryKey: ["admin", "users", search, page],
    queryFn: () =>
      apiRequest<UsersResponse>(
        `/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&pageSize=20`,
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
  const records = useQuery({
    queryKey: ["admin", "records", recordsPage],
    queryFn: () => apiRequest<RecordsResponse>(`/api/admin/records?page=${recordsPage}&pageSize=20`),
    enabled: user?.role === "superadmin",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  if (!user) return null;

  if (user.role === "user") {
    return (
      <section className="rounded-[18px] border border-[#ead8c0] bg-[#fffaf0] p-6 text-[13px] text-[#815e2e]">
        اجازه دسترسی به بخش مدیریت را نداری.
      </section>
    );
  }

  if (user.role === "admin") {
    return (
      <div className="grid gap-6">
        <AdminNav />
        <section className="rounded-[18px] border border-[#d8e7df] bg-white p-7">
          <h1 className="m-0 text-[23px] font-black text-[#19312f]">مدیریت عملیات کاربران</h1>
          <p className="mb-0 mt-3 text-[11px] leading-8 text-[#748582]">
            از منوی بالا عضویت و اعتبار کاربران، سفارش‌ها و واریزی‌ها را مدیریت کن. گزارش کل سامانه و مدیریت نقش‌ها فقط برای سوپرادمین در دسترس است.
          </p>
        </section>
      </div>
    );
  }

  const cards = [
    { label: "کل کاربران", value: stats.data?.users.total ?? 0, icon: Users },
    { label: "کاربران فعال", value: stats.data?.users.active ?? 0, icon: UserCheck },
    { label: "کل رکوردها", value: stats.data?.records.total ?? 0, icon: Database },
    {
      label: "ادمین‌ها",
      value:
        stats.data?.usersByRole
          .filter((item) => item.role !== "user")
          .reduce((total, item) => total + Number(item.total), 0) ?? 0,
      icon: ShieldCheck,
    },
    {
      label: "سفارش‌های موفق",
      value: billingStats.data?.paidOrders ?? 0,
      icon: BarChart3,
    },
    {
      label: "فروش تأییدشده (تومان)",
      value: Math.round((billingStats.data?.revenueRials ?? 0) / 10),
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid gap-6">
      <AdminNav />
      <header>
        <p className="m-0 text-[11px] font-bold text-[#0f7b62]">گزارش مدیریتی</p>
        <h1 className="mb-0 mt-2 text-[25px] font-black text-[#19312f]">مدیریت سامانه</h1>
        <p className="mb-0 mt-2 text-[11px] leading-7 text-[#7c8b88]">
          آمار کل سامانه، فهرست کاربران و سطح دسترسی آن‌ها را از اینجا مدیریت کن.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-4 max-[1050px]:grid-cols-2 max-[560px]:grid-cols-1">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="rounded-[17px] border border-[#e3e9e3] bg-white p-5 shadow-[0_10px_30px_rgba(30,61,53,.05)]" key={label}>
            <span className="mb-4 grid size-10 place-items-center rounded-[12px] bg-[#eaf5f0] text-[#0f7b62]">
              <Icon size={20} />
            </span>
            <strong className="block text-[24px] font-black">{Number(value).toLocaleString("fa-IR")}</strong>
            <small className="mt-1 block text-[10px] text-[#81908d]">{label}</small>
          </article>
        ))}
      </section>

      <section className="rounded-[18px] border border-[#e3e9e3] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-[#0f7b62]" />
          <h2 className="m-0 text-[14px] font-extrabold">تفکیک اطلاعات ثبت‌شده</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(stats.data?.records.byCollection ?? []).map((item) => (
            <span className="rounded-[9px] bg-[#f2f6f3] px-3 py-2 text-[10px] text-[#526762]" key={item.collection}>
              {item.collection}: <strong>{Number(item.total).toLocaleString("fa-IR")}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-[#edf0ec] p-5 max-[620px]:items-stretch max-[620px]:flex-col">
          <div>
            <h2 className="m-0 text-[14px] font-extrabold">فهرست همه کاربران</h2>
            <small className="mt-1 block text-[9px] text-[#8a9794]">
              {Number(users.data?.total ?? 0).toLocaleString("fa-IR")} حساب
            </small>
          </div>
          <form
            className="flex h-10 min-w-[280px] items-center gap-2 rounded-[11px] border border-[#dfe6e0] px-3 max-[620px]:min-w-0"
            onSubmit={handleSubmit(({ search: value }) => {
              setSearch(value);
              setPage(1);
            })}
          >
            <Search size={16} className="text-[#84918e]" />
            <input {...register("search")} className="min-w-0 flex-1 border-0 bg-transparent text-[10px] outline-none" placeholder="نام یا شماره همراه" />
            <button className="border-0 bg-transparent text-[10px] font-bold text-[#0f7b62]" type="submit">جست‌وجو</button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-right text-[10px]">
            <thead className="bg-[#f7f9f6] text-[#71817e]">
              <tr>
                {['کاربر', 'نقش', 'وضعیت', 'رکوردها', 'آخرین ورود', 'مدیریت'].map((title) => (
                  <th className="px-4 py-3 font-bold" key={title}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(users.data?.items ?? []).map((item) => (
                <tr className="border-t border-[#edf0ec]" key={item.id}>
                  <td className="px-4 py-3">
                    <strong className="block text-[11px]">{item.fullName || "بدون نام"}</strong>
                    <span dir="ltr" className="mt-1 block w-fit text-[#899592]">{item.phone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-[8px] border border-[#dfe5df] bg-white px-2 py-1.5 text-[10px]"
                      value={item.role}
                      disabled={item.id === user.id || updateUser.isPending}
                      onChange={(event) =>
                        updateUser.mutate({ id: item.id, input: { role: event.target.value as UserRole } })
                      }
                    >
                      {Object.entries(roleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={item.status === "active" ? "text-[#14705a]" : "text-[#b14848]"}>
                      {item.status === "active" ? "فعال" : "تعلیق‌شده"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{Number(item.recordsCount).toLocaleString("fa-IR")}</td>
                  <td className="px-4 py-3 text-[#71817e]">
                    {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleDateString("fa-IR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 text-[9px] font-bold text-[#566966] disabled:opacity-40"
                      type="button"
                      disabled={item.id === user.id || updateUser.isPending}
                      onClick={() =>
                        updateUser.mutate({
                          id: item.id,
                          input: { status: item.status === "active" ? "suspended" : "active" },
                        })
                      }
                    >
                      {item.status === "active" ? "تعلیق" : "فعال‌سازی"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#edf0ec] px-5 py-4 text-[9px] text-[#73827f]">
          <button className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>صفحه قبل</button>
          صفحه {page.toLocaleString("fa-IR")}
          <button className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 disabled:opacity-40" disabled={(users.data?.items.length ?? 0) < 20} onClick={() => setPage((value) => value + 1)}>صفحه بعد</button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <div className="border-b border-[#edf0ec] p-5">
          <h2 className="m-0 text-[14px] font-extrabold">فهرست همه اطلاعات سامانه</h2>
          <small className="mt-1 block text-[9px] text-[#8a9794]">
            {Number(records.data?.total ?? 0).toLocaleString("fa-IR")} رکورد متعلق به کاربران
          </small>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-right text-[10px]">
            <thead className="bg-[#f7f9f6] text-[#71817e]">
              <tr>
                {['نوع اطلاعات', 'شناسه', 'مالک', 'فضای کاری', 'آخرین تغییر'].map((title) => (
                  <th className="px-4 py-3 font-bold" key={title}>{title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(records.data?.items ?? []).map((item) => (
                <tr className="border-t border-[#edf0ec]" key={`${item.collection}:${item.id}`}>
                  <td className="px-4 py-3 font-bold text-[#285f52]">{item.collection}</td>
                  <td className="max-w-[230px] truncate px-4 py-3 text-[#71817e]" dir="ltr">{item.id}</td>
                  <td className="px-4 py-3" dir="ltr">{item.ownerPhone || "داده قدیمی"}</td>
                  <td className="px-4 py-3 text-[#71817e]">{item.profileId || "—"}</td>
                  <td className="px-4 py-3 text-[#71817e]">{new Date(item.updatedAt).toLocaleDateString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#edf0ec] px-5 py-4 text-[9px] text-[#73827f]">
          <button className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 disabled:opacity-40" disabled={recordsPage === 1} onClick={() => setRecordsPage((value) => value - 1)}>صفحه قبل</button>
          صفحه {recordsPage.toLocaleString("fa-IR")}
          <button className="rounded-[8px] border border-[#dfe5df] bg-white px-3 py-1.5 disabled:opacity-40" disabled={(records.data?.items.length ?? 0) < 20} onClick={() => setRecordsPage((value) => value + 1)}>صفحه بعد</button>
        </div>
      </section>
    </div>
  );
}
