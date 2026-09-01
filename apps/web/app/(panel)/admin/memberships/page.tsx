"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Info, ShieldCheck, UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { normalizeDigits } from "@radicar/validators";
import { z } from "zod";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { useToast } from "@/app/_components/toast";
import { MembershipSummary, MembershipSummarySkeleton } from "../../_components/membership-summary";
import { ConfirmActionModal, Modal } from "../../_components/ui";
import { apiRequest } from "@/lib/api-client";
import { buildQueryString } from "@/lib/build-query-string";
import {
  billingKeys,
  useAdminMembership,
  usePlans,
  type AdminMembershipEvent,
  type Membership,
  type Plan,
} from "@/lib/billing";
import { useTablePageSize } from "@/lib/table-page-size";
import {
  AdminFilterSelect,
  AdminTablePagination,
  AdminTableToolbar,
} from "../_components/admin-table-controls";

type MembershipUser = {
  user: { id: string; phone: string; fullName: string | null; status: "active" | "suspended" };
  membership: Omit<Membership, "plan"> | null;
  plan: Plan | null;
};
type Response = { items: MembershipUser[]; total: number; page: number; pageSize: number };
type PendingMembershipAction = {
  kind: "membership" | "status";
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  tone?: "primary" | "danger";
  path?: string;
  body?: unknown;
  user?: MembershipUser;
};
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

const resourceLabels: Record<string, string> = {
  resume: "ساخت رزومه",
  pdf: "دانلود PDF",
  ai: "هوش مصنوعی",
  match: "تطبیق شغلی",
  interview: "مصاحبه آزمایشی",
};

function detailString(event: AdminMembershipEvent, key: string) {
  const value = event.details?.[key];
  return typeof value === "string" ? value : "";
}

function detailNumber(event: AdminMembershipEvent, key: string) {
  const value = event.details?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function eventContent(event: AdminMembershipEvent) {
  if (event.type === "admin_grant") {
    return { title: "اعطای پلن", description: `پلن ${event.plan?.name || event.planId || "انتخاب‌شده"} برای کاربر فعال شد.` };
  }
  if (event.type === "admin_extend") {
    return { title: "تمدید عضویت", description: `${(event.durationDays ?? 0).toLocaleString("fa-IR")} روز به مدت عضویت افزوده شد.` };
  }
  if (event.type === "admin_adjust") {
    const resource = detailString(event, "resource");
    const units = detailNumber(event, "units") ?? 0;
    const reason = detailString(event, "reason");
    return {
      title: units < 0 ? "کاهش اعتبار" : "افزایش اعتبار",
      description: `${Math.abs(units).toLocaleString("fa-IR")} واحد ${resourceLabels[resource] || resource || "اعتبار"}${reason ? ` — دلیل: ${reason}` : ""}`,
    };
  }
  if (event.type === "account_suspended") {
    return { title: "تعلیق حساب", description: "دسترسی کاربر تعلیق و نشست‌های فعال او لغو شد." };
  }
  if (event.type === "account_activated") {
    return { title: "فعال‌سازی حساب", description: "دسترسی حساب کاربر دوباره فعال شد." };
  }
  if (event.type === "cancel") {
    const reason = detailString(event, "reason");
    return { title: "لغو عضویت", description: reason ? `دلیل: ${reason}` : "عضویت و اعتبار باقی‌مانده کاربر لغو شد." };
  }
  return { title: "تغییر مدیریتی", description: "یک تغییر توسط مدیر روی حساب کاربر ثبت شد." };
}

export default function MembershipsAdminPage() {
  const { user } = useAuth();
  const notify = useToast();
  const queryClient = useQueryClient();
  const plans = usePlans();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, isSaving: pageSizeSaving } = useTablePageSize();
  const [planId, setPlanId] = useState("");
  const [membershipStatus, setMembershipStatus] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [selected, setSelected] = useState<MembershipUser | null>(null);
  const [detailsUser, setDetailsUser] = useState<MembershipUser | null>(null);
  const [detailsTab, setDetailsTab] = useState<"usage" | "logs">("usage");
  const [pendingAction, setPendingAction] = useState<PendingMembershipAction | null>(null);
  const grantForm = useForm({ resolver: zodResolver(grantSchema), defaultValues: { planId: "job-search" } });
  const extendForm = useForm({ resolver: zodResolver(extendSchema), defaultValues: { days: 30 } });
  const creditForm = useForm({ resolver: zodResolver(creditSchema), defaultValues: { resource: "ai" as const, units: 10, reason: "" } });
  const cancelForm = useForm({ resolver: zodResolver(cancelSchema), defaultValues: { reason: "" } });
  const memberDetails = useAdminMembership(detailsUser?.user.id);
  const users = useQuery({
    queryKey: ["admin", "memberships", search, planId, membershipStatus, userStatus, page, pageSize],
    queryFn: () => apiRequest<Response>(`/api/admin/memberships?${buildQueryString({ search, planId, membershipStatus, userStatus, page, pageSize })}`),
    enabled: user?.role !== "user",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  const action = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown; successMessage: string }) => apiRequest(path, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: async (_, variables) => {
      notify(variables.successMessage);
      setPendingAction(null);
      setSelected(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "membership-details"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "membership"] }),
      ]);
    },
    onError: (error) => notify(error instanceof Error ? error.message : "ثبت تغییر ناموفق بود.", "error"),
  });
  const changeStatus = useMutation({
    mutationFn: ({ item }: { item: MembershipUser; successMessage: string }) =>
      apiRequest(`/api/admin/users/${item.user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: item.user.status === "active" ? "suspended" : "active",
        }),
      }),
    onSuccess: async (_, variables) => {
      notify(variables.successMessage);
      setPendingAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] }),
        queryClient.invalidateQueries({ queryKey: billingKeys.adminMembership(variables.item.user.id) }),
      ]);
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تغییر وضعیت ناموفق بود.", "error"),
  });
  if (user?.role === "user") return <p className="rounded-xl bg-[#fff1ef] p-5 text-[11px] text-[#a13f37]">اجازه دسترسی به این بخش را نداری.</p>;
  const endpoint = (actionName: string) => `/api/admin/users/${selected!.user.id}/membership/${actionName}`;
  const columns: DataTableColumn<MembershipUser>[] = [
    { key: "user", title: "کاربر", skeletonClassName: "w-32", render: (item) => <><strong className="block text-[11px]">{item.user.fullName || "بدون نام"}</strong><span dir="ltr" className="mt-1 block w-fit text-[#899592]">{item.user.phone}</span></> },
    { key: "plan", title: "پلن", render: (item) => item.plan?.name || "ثبت‌نشده" },
    { key: "account", title: "وضعیت حساب", render: (item) => item.user.status === "active" ? "فعال" : "تعلیق‌شده" },
    { key: "membership", title: "وضعیت عضویت", render: (item) => item.membership?.status === "active" ? "فعال" : item.membership?.status === "canceled" ? "لغوشده" : "منقضی" },
    { key: "expiry", title: "انقضا", render: (item) => item.membership?.expiresAt ? new Date(item.membership.expiresAt).toLocaleDateString("fa-IR") : "—" },
    { key: "ai", title: "اعتبار AI", render: (item) => item.membership?.aiCreditsRemaining?.toLocaleString("fa-IR") ?? "—" },
    { key: "manage", title: "مدیریت", render: (item) => { const suspending = item.user.status === "active"; return <div className="flex flex-wrap gap-2"><button className="inline-flex items-center gap-1.5 rounded-lg border border-[#b9d9cc] bg-[#f4faf7] px-3 py-2 text-[9px] font-bold text-[#0f705a]" type="button" onClick={() => { setDetailsUser(item); setDetailsTab("usage"); }}><Info size={14} /> اطلاعات تکمیلی</button><button className="rounded-lg border border-[#dfe5df] bg-white px-3 py-2 text-[9px] font-bold" type="button" onClick={() => setSelected(item)}>ویرایش</button><button className="rounded-lg border border-[#e6d5d1] bg-white px-3 py-2 text-[9px] font-bold text-[#9b4a42]" type="button" disabled={changeStatus.isPending || item.user.id === user?.id} onClick={() => setPendingAction({ kind: "status", user: item, title: suspending ? "تأیید تعلیق کاربر" : "تأیید فعال‌سازی کاربر", description: `${item.user.fullName || item.user.phone} ${suspending ? "تعلیق" : "دوباره فعال"} شود؟`, confirmLabel: suspending ? "تعلیق کاربر" : "فعال‌سازی کاربر", successMessage: suspending ? "حساب کاربر با موفقیت تعلیق شد." : "حساب کاربر با موفقیت فعال شد.", tone: suspending ? "danger" : "primary" })}>{suspending ? "تعلیق" : "فعال‌سازی"}</button></div>; } },
  ];
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
        <DataTable columns={columns} rows={users.data?.items ?? []} getRowKey={(item) => item.user.id} loading={users.isLoading} error={users.error} retrying={users.isFetching} onRetry={() => void users.refetch()} filtered={Boolean(search || planId || membershipStatus || userStatus)} minWidthClassName="min-w-[850px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={users.data?.total ?? 0} pageSizeSaving={pageSizeSaving} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />} />
      </section>
      {selected && (
        <Modal
          title={`ویرایش عضویت ${selected.user.fullName || "کاربر"}`}
          description={`${selected.user.phone} — پلن فعلی: ${selected.plan?.name || "بدون عضویت"}`}
          document
          showCloseButton
          onClose={() => setSelected(null)}
        >
          <div className="mt-5 grid grid-cols-2 gap-4 max-[800px]:grid-cols-1">
            <form className="grid gap-3 rounded-xl bg-white p-4" onSubmit={grantForm.handleSubmit((body) => setPendingAction({ kind: "membership", path: endpoint("grant"), body, title: "تأیید اعطای پلن", description: `پلن انتخاب‌شده برای ${selected.user.fullName || selected.user.phone} فعال شود؟`, confirmLabel: "اعطا و فعال‌سازی", successMessage: "پلن کاربر با موفقیت فعال شد." }))}><strong className="text-[11px]">اعطای پلن</strong><select className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" {...grantForm.register("planId")}>{(plans.data ?? []).map((plan) => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select><button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">اعطا و فعال‌سازی</button></form>
            <form className="grid gap-3 rounded-xl bg-white p-4" onSubmit={extendForm.handleSubmit((body) => setPendingAction({ kind: "membership", path: endpoint("extend"), body, title: "تأیید تمدید عضویت", description: `${body.days.toLocaleString("fa-IR")} روز به عضویت ${selected.user.fullName || selected.user.phone} افزوده شود؟`, confirmLabel: "تأیید تمدید", successMessage: "مدت عضویت کاربر با موفقیت تمدید شد." }))}><strong className="text-[11px]">تمدید زمان عضویت</strong><input className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" type="number" {...extendForm.register("days")} /><button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">افزودن روز</button></form>
            <form className="grid gap-3 rounded-xl bg-white p-4" onSubmit={creditForm.handleSubmit((body) => setPendingAction({ kind: "membership", path: endpoint("credits"), body, title: "تأیید تغییر اعتبار", description: `اعتبار ${selected.user.fullName || selected.user.phone} به میزان ${body.units.toLocaleString("fa-IR")} واحد تغییر کند؟`, confirmLabel: "ثبت تغییر اعتبار", successMessage: "اعتبار کاربر با موفقیت به‌روزرسانی شد.", tone: body.units < 0 ? "danger" : "primary" }))}><strong className="text-[11px]">افزایش یا کاهش اعتبار</strong><div className="grid grid-cols-2 gap-2"><select className="h-10 rounded-lg border border-[#dfe5df] px-2 text-[10px]" {...creditForm.register("resource")}><option value="ai">هوش مصنوعی</option><option value="match">تطبیق</option><option value="interview">مصاحبه</option><option value="resume">رزومه</option><option value="pdf">PDF</option></select><input className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" type="number" {...creditForm.register("units")} /></div><input className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]" placeholder="دلیل تغییر (اختیاری)" {...creditForm.register("reason")} /><button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">ثبت اعتبار</button></form>
            <form className="grid gap-3 rounded-xl border border-[#efd8d4] bg-white p-4" onSubmit={cancelForm.handleSubmit((body) => setPendingAction({ kind: "membership", path: endpoint("cancel"), body, title: "تأیید لغو عضویت", description: `عضویت ${selected.user.fullName || selected.user.phone} لغو و تمام اعتبار باقی‌مانده حذف شود؟`, confirmLabel: "لغو فوری عضویت", successMessage: "عضویت کاربر با موفقیت لغو شد.", tone: "danger" }))}><strong className="text-[11px] text-[#a13f37]">لغو عضویت</strong><input className="h-10 rounded-lg border border-[#e8d5d1] px-3 text-[10px]" placeholder="دلیل لغو (اختیاری)" {...cancelForm.register("reason")} /><button className="rounded-lg bg-[#b14848] px-3 py-2 text-[10px] font-bold text-white">لغو فوری و حذف اعتبار باقی‌مانده</button></form>
          </div>
        </Modal>
      )}
      {detailsUser && (
        <Modal
          title={detailsUser.user.fullName || "کاربر بدون نام"}
          description={detailsUser.user.phone}
          document
          showCloseButton
          onClose={() => setDetailsUser(null)}
          headerActions={(
            <span className={detailsUser.user.status === "active" ? "rounded-full bg-[#edf7f2] px-3 py-1.5 text-[9px] font-bold text-[#14705a]" : "rounded-full bg-[#fff0ed] px-3 py-1.5 text-[9px] font-bold text-[#b65343]"}>
              حساب {detailsUser.user.status === "active" ? "فعال" : "تعلیق‌شده"}
            </span>
          )}
        >
          <div className="mt-5 flex gap-2 border-b border-[#e8ede9]" role="tablist" aria-label="اطلاعات تکمیلی کاربر">
            <button className={`inline-flex min-h-11 items-center gap-2 border-x-0 border-t-0 bg-transparent px-4 text-[10px] font-bold ${detailsTab === "usage" ? "border-b-2 border-[#0f7b62] text-[#0f7b62]" : "border-b-2 border-transparent text-[#71807c]"}`} type="button" role="tab" aria-selected={detailsTab === "usage"} onClick={() => setDetailsTab("usage")}><ShieldCheck size={16} /> پلن و میزان مصرف</button>
            <button className={`inline-flex min-h-11 items-center gap-2 border-x-0 border-t-0 bg-transparent px-4 text-[10px] font-bold ${detailsTab === "logs" ? "border-b-2 border-[#0f7b62] text-[#0f7b62]" : "border-b-2 border-transparent text-[#71807c]"}`} type="button" role="tab" aria-selected={detailsTab === "logs"} onClick={() => setDetailsTab("logs")}><ClipboardList size={16} /> لاگ مدیریتی ({memberDetails.data?.history.length.toLocaleString("fa-IR") ?? "—"})</button>
          </div>
          <div className="my-5">
            {memberDetails.isPending && <MembershipSummarySkeleton />}
            {memberDetails.isError && (
              <div className="grid justify-items-start gap-3 rounded-[16px] border border-[#f0d7d0] bg-[#fff7f4] p-5 text-[10px] text-[#a44d3e]">
                دریافت اطلاعات کاربر ممکن نشد.
                <button className="rounded-lg border border-[#e2c4bd] bg-white px-3 py-2 font-bold" type="button" onClick={() => void memberDetails.refetch()}>تلاش مجدد</button>
              </div>
            )}
            {memberDetails.data && detailsTab === "usage" && (
              <MembershipSummary membership={memberDetails.data.membership} />
            )}
            {memberDetails.data && detailsTab === "logs" && (
              <div className="grid max-h-[55vh] gap-3 overflow-y-auto pl-1">
                {memberDetails.data.history.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-[#dce5df] bg-[#f8faf8] p-8 text-center text-[10px] text-[#768682]">هنوز هیچ اقدام مدیریتی برای این کاربر ثبت نشده است.</div>
                ) : memberDetails.data.history.map((event) => {
                  const content = eventContent(event);
                  return (
                    <article className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[15px] border border-[#e1e8e3] bg-[#fbfcfb] px-4 py-3" key={event.id}>
                      <strong className="shrink-0 whitespace-nowrap text-[11px] text-[#244039]">{content.title}</strong>
                      <p className="m-0 line-clamp-2 min-w-[14rem] flex-1 text-[10px] leading-5 text-[#61726e]" title={content.description}>{content.description}</p>
                      <small className="shrink-0 whitespace-nowrap text-[9px] text-[#87938f]">انجام‌دهنده: {event.actor?.fullName || event.actor?.phone || "مدیر حذف‌شده"}{event.actor?.role === "superadmin" ? " (سوپرادمین)" : event.actor?.role === "admin" ? " (ادمین)" : ""}</small>
                      <time className="shrink-0 whitespace-nowrap text-[9px] text-[#82908d]" dateTime={event.createdAt}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}</time>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}
      {pendingAction && (
        <ConfirmActionModal
          title={pendingAction.title}
          description={pendingAction.description}
          confirmLabel={pendingAction.confirmLabel}
          tone={pendingAction.tone}
          pending={action.isPending || changeStatus.isPending}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            if (pendingAction.kind === "status" && pendingAction.user) {
              changeStatus.mutate({
                item: pendingAction.user,
                successMessage: pendingAction.successMessage,
              });
              return;
            }
            if (pendingAction.path) {
              action.mutate({ path: pendingAction.path, body: pendingAction.body, successMessage: pendingAction.successMessage });
            }
          }}
        />
      )}
    </div>
  );
}
