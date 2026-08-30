"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { normalizeDigits } from "@radicar/validators";
import { z } from "zod";
import { useAuth } from "@/app/_components/auth";
import { useToast } from "../../_components/panel-shell";
import { apiRequest } from "@/lib/api-client";
import { usePlans, type Membership, type Plan } from "@/lib/billing";
import {
  AdminFilterSelect,
  AdminTableEmptyState,
  AdminTablePagination,
  AdminTableToolbar,
} from "../_components/admin-table-controls";

type MembershipUser = {
  user: { id: string; phone: string; fullName: string | null; status: "active" | "suspended" };
  membership: Omit<Membership, "plan"> | null;
  plan: Plan | null;
};
type Response = { items: MembershipUser[]; total: number; page: number; pageSize: number };
const grantSchema = z.object({ planId: z.string().min(1) });
function localizedNumber<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => typeof value === "string" ? normalizeDigits(value) : value,
    schema,
  );
}
const extendSchema = z.object({
  days: localizedNumber(z.coerce.number().int().min(1).max(3650)),
});
const creditSchema = z.object({
  resource: z.enum(["resume", "pdf", "ai", "match", "interview"]),
  units: localizedNumber(
    z.coerce.number().int().min(-100000).max(100000).refine((value) => value !== 0),
  ),
  reason: z.string().trim().max(500).optional(),
});
const cancelSchema = z.object({ reason: z.string().trim().max(500).optional() });

export default function MembershipsAdminPage() {
  const { user } = useAuth();
  const notify = useToast();
  const queryClient = useQueryClient();
  const plans = usePlans();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [planId, setPlanId] = useState("");
  const [membershipStatus, setMembershipStatus] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [selected, setSelected] = useState<MembershipUser | null>(null);
  const grantForm = useForm({ resolver: zodResolver(grantSchema), defaultValues: { planId: "job-search" } });
  const extendForm = useForm({ resolver: zodResolver(extendSchema), defaultValues: { days: 30 } });
  const creditForm = useForm({ resolver: zodResolver(creditSchema), defaultValues: { resource: "ai" as const, units: 10, reason: "" } });
  const cancelForm = useForm({ resolver: zodResolver(cancelSchema), defaultValues: { reason: "" } });
  const users = useQuery({
    queryKey: ["admin", "memberships", search, planId, membershipStatus, userStatus, page, pageSize],
    queryFn: () => apiRequest<Response>(`/api/admin/memberships?search=${encodeURIComponent(search)}&planId=${planId}&membershipStatus=${membershipStatus}&userStatus=${userStatus}&page=${page}&pageSize=${pageSize}`),
    enabled: user?.role !== "user",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  const action = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) => apiRequest(path, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: async () => {
      notify("تغییر عضویت با موفقیت ثبت شد.");
      setSelected(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "membership"] }),
      ]);
    },
    onError: (error) => notify(error instanceof Error ? error.message : "ثبت تغییر ناموفق بود.", "error"),
  });
  const changeStatus = useMutation({
    mutationFn: (item: MembershipUser) =>
      apiRequest(`/api/admin/users/${item.user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: item.user.status === "active" ? "suspended" : "active",
        }),
      }),
    onSuccess: async () => {
      notify("وضعیت حساب کاربر تغییر کرد.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تغییر وضعیت ناموفق بود.", "error"),
  });
  if (user?.role === "user") return <p className="rounded-xl bg-[#fff1ef] p-5 text-[11px] text-[#a13f37]">اجازه دسترسی به این بخش را نداری.</p>;
  const endpoint = (actionName: string) => `/api/admin/users/${selected!.user.id}/membership/${actionName}`;
  return (
    <div className="grid gap-6">
      <header><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><UserCog size={18} /> مدیریت کاربران و عضویت</span><h1 className="mb-0 mt-3 text-[25px] font-black">عضویت و اعتبار کاربران</h1></header>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <div className="border-b border-[#edf0ec] p-5">
          <span className="text-[10px] text-[#71817e]">{Number(users.data?.total ?? 0).toLocaleString("fa-IR")} کاربر</span>
          <AdminTableToolbar
            search={search}
            searchPlaceholder="نام یا شماره همراه"
            activeFilterCount={Number(Boolean(planId)) + Number(Boolean(membershipStatus)) + Number(Boolean(userStatus))}
            onSearch={(value) => { setSearch(value); setPage(1); }}
            onResetFilters={() => { setPlanId(""); setMembershipStatus(""); setUserStatus(""); setPage(1); }}
          >
            <AdminFilterSelect label="پلن" value={planId} onChange={(value) => { setPlanId(value); setPage(1); }} options={[{ value: "", label: "همه پلن‌ها" }, ...(plans.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))]} />
            <AdminFilterSelect label="وضعیت عضویت" value={membershipStatus} onChange={(value) => { setMembershipStatus(value); setPage(1); }} options={[{ value: "", label: "همه وضعیت‌ها" }, { value: "active", label: "فعال" }, { value: "expired", label: "منقضی" }, { value: "canceled", label: "لغوشده" }]} />
            <AdminFilterSelect label="وضعیت حساب" value={userStatus} onChange={(value) => { setUserStatus(value); setPage(1); }} options={[{ value: "", label: "همه وضعیت‌ها" }, { value: "active", label: "فعال" }, { value: "suspended", label: "تعلیق‌شده" }]} />
          </AdminTableToolbar>
        </div>
        {!users.isLoading && (users.data?.items.length ?? 0) === 0 ? <AdminTableEmptyState filtered={Boolean(search || planId || membershipStatus || userStatus)} /> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-right text-[10px]"><thead className="bg-[#f7f9f6] text-[#71817e]"><tr>{["کاربر", "پلن", "وضعیت حساب", "وضعیت عضویت", "انقضا", "اعتبار AI", "مدیریت"].map((title) => <th className="px-4 py-3" key={title}>{title}</th>)}</tr></thead><tbody>{(users.data?.items ?? []).map((item) => <tr className="border-t border-[#edf0ec]" key={item.user.id}><td className="px-4 py-3"><strong className="block text-[11px]">{item.user.fullName || "بدون نام"}</strong><span dir="ltr" className="mt-1 block w-fit text-[#899592]">{item.user.phone}</span></td><td className="px-4 py-3">{item.plan?.name || "ثبت‌نشده"}</td><td className="px-4 py-3">{item.user.status === "active" ? "فعال" : "تعلیق‌شده"}</td><td className="px-4 py-3">{item.membership?.status === "active" ? "فعال" : item.membership?.status === "canceled" ? "لغوشده" : "منقضی"}</td><td className="px-4 py-3">{item.membership?.expiresAt ? new Date(item.membership.expiresAt).toLocaleDateString("fa-IR") : "—"}</td><td className="px-4 py-3">{item.membership?.aiCreditsRemaining?.toLocaleString("fa-IR") ?? "—"}</td><td className="px-4 py-3"><div className="flex gap-2"><button className="rounded-lg border border-[#dfe5df] bg-white px-3 py-2 text-[9px] font-bold" onClick={() => setSelected(item)}>عضویت</button><button className="rounded-lg border border-[#e6d5d1] bg-white px-3 py-2 text-[9px] font-bold text-[#9b4a42]" disabled={changeStatus.isPending || item.user.id === user?.id} onClick={() => changeStatus.mutate(item)}>{item.user.status === "active" ? "تعلیق" : "فعال‌سازی"}</button></div></td></tr>)}</tbody></table></div>}
        <AdminTablePagination page={page} pageSize={pageSize} total={users.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
      </section>
      {selected && (
        <section className="grid gap-5 rounded-[20px] border border-[#b9d9cc] bg-[#f7fbf8] p-6">
          <div className="flex items-center justify-between"><div><strong>{selected.user.fullName || selected.user.phone}</strong><small className="mr-2 text-[#748582]">{selected.plan?.name || "بدون عضویت"}</small></div><button className="border-0 bg-transparent text-[10px]" onClick={() => setSelected(null)}>بستن</button></div>
          <div className="grid grid-cols-2 gap-4 max-[800px]:grid-cols-1">
            <form className="grid gap-3 rounded-xl bg-white p-4" onSubmit={grantForm.handleSubmit((body) => action.mutate({ path: endpoint("grant"), body }))}><strong className="text-[11px]">اعطای پلن</strong><select className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" {...grantForm.register("planId")}>{(plans.data ?? []).map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select><button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">اعطا و فعال‌سازی</button></form>
            <form className="grid gap-3 rounded-xl bg-white p-4" onSubmit={extendForm.handleSubmit((body) => action.mutate({ path: endpoint("extend"), body }))}><strong className="text-[11px]">تمدید زمان عضویت</strong><input className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" type="number" {...extendForm.register("days")} /><button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">افزودن روز</button></form>
            <form className="grid gap-3 rounded-xl bg-white p-4" onSubmit={creditForm.handleSubmit((body) => action.mutate({ path: endpoint("credits"), body }))}><strong className="text-[11px]">افزایش یا کاهش اعتبار</strong><div className="grid grid-cols-2 gap-2"><select className="h-10 rounded-lg border border-[#dfe5df] px-2 text-[10px]" {...creditForm.register("resource")}><option value="ai">هوش مصنوعی</option><option value="match">تطبیق</option><option value="interview">مصاحبه</option><option value="resume">رزومه</option><option value="pdf">PDF</option></select><input className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" type="number" {...creditForm.register("units")} /></div><input className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" placeholder="دلیل تغییر (اختیاری)" {...creditForm.register("reason")} /><button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">ثبت اعتبار</button></form>
            <form className="grid gap-3 rounded-xl border border-[#efd8d4] bg-white p-4" onSubmit={cancelForm.handleSubmit((body) => action.mutate({ path: endpoint("cancel"), body }))}><strong className="text-[11px] text-[#a13f37]">لغو عضویت</strong><input className="h-10 rounded-lg border border-[#e8d5d1] px-3 text-[10px]" placeholder="دلیل لغو (اختیاری)" {...cancelForm.register("reason")} /><button className="rounded-lg bg-[#b14848] px-3 py-2 text-[10px] font-bold text-white">لغو فوری و حذف اعتبار باقی‌مانده</button></form>
          </div>
        </section>
      )}
    </div>
  );
}
