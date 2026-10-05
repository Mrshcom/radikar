"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Info, MoreHorizontal, ShieldCheck } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { normalizeDigits } from "@radikar/validators";
import { z } from "zod";
import { useAuth } from "@/app/_components/auth";
import { SearchableSelect } from "@/app/_components/searchable-select";
import { DataTable, type DataTableColumn, type SortState } from "../../_components/data-table";
import { FormField } from "../../_components/form-field";
import { TableActionButton } from "../../_components/table-action-button";
import { useToast } from "@/app/_components/toast";
import { MembershipSummary } from "../../_components/membership-summary";
import { MembershipSummarySkeleton } from "../../_components/skeletons";
import { ConfirmActionModal, Modal, SectionTitle } from "../../_components/ui";
import { apiRequest } from "@/lib/api-client";
import { PersianDateTime } from "@/lib/date-time-display";
import { buildQueryString } from "@/lib/build-query-string";
import { useAdminMembership, usePlans, type AdminMembershipEvent, type Membership, type Plan } from "@/lib/billing";
import { useUrlTablePagination } from "@/lib/table-page-size";
import { userDisplayName, userIdentifier } from "@/lib/user-identity";
import {
  createTableFilterParser,
  tableOptionalFilterParser,
  tableQueryStateOptions,
  tableSearchParser,
  tableSortByParser,
  tableSortDirectionParser,
} from "@/lib/table-search-params";
import { AdminFilterSelect, AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

type MembershipUser = {
  user: {
    id: string;
    phone: string | null;
    email: string | null;
    fullName: string | null;
    status: "active" | "suspended";
  };
  membership: Omit<Membership, "plan"> | null;
  plan: Plan | null;
};
type Response = { items: MembershipUser[]; total: number; page: number; pageSize: number };
type PendingMembershipAction = {
  kind: "membership";
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  tone?: "primary" | "danger";
  path?: string;
  body?: unknown;
};
type MembershipAction = "grant" | "switch" | "extend" | "credit" | "cancel";
const grantSchema = z.object({ planId: z.string().min(1) });
function localizedNumber<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (typeof value === "string" ? normalizeDigits(value) : value), schema);
}
const extendSchema = z.object({
  days: localizedNumber(z.coerce.number().int().min(1).max(3650)),
});
const creditSchema = z.object({
  resource: z.enum(["resume", "pdf", "ai", "match", "interview"]),
  units: localizedNumber(
    z.coerce
      .number()
      .int()
      .min(-100000)
      .max(100000)
      .refine((value) => value !== 0),
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

const membershipFilterParsers = {
  search: tableSearchParser,
  planId: tableOptionalFilterParser,
  membershipStatus: createTableFilterParser(["active", "expired", "canceled"]),
  sortBy: tableSortByParser,
  sortDirection: tableSortDirectionParser,
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
    const replaced = detailString(event, "mode") === "replace";
    return {
      title: replaced ? "تعویض پلن" : "اعطای پلن",
      description: replaced
        ? `پلن کاربر بدون تمدید زمان به ${event.plan?.name || event.planId || "پلن انتخاب‌شده"} تغییر کرد.`
        : `پلن ${event.plan?.name || event.planId || "انتخاب‌شده"} برای کاربر فعال شد.`,
    };
  }
  if (event.type === "admin_extend") {
    return {
      title: "تمدید عضویت",
      description: `${(event.durationDays ?? 0).toLocaleString("fa-IR")} روز به مدت عضویت افزوده شد.`,
    };
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
  const [{ search, planId, membershipStatus, sortBy, sortDirection }, setFilters] = useQueryStates(
    membershipFilterParsers,
    {
      ...tableQueryStateOptions,
      urlKeys: {
        search: "q",
        planId: "plan",
        membershipStatus: "membership",
      },
    },
  );
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } = useUrlTablePagination();
  const [selected, setSelected] = useState<MembershipUser | null>(null);
  const [selectedAction, setSelectedAction] = useState<MembershipAction | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  useEffect(() => {
    if (!openActionMenu) return;

    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest("[data-membership-action-menu]")) {
        setOpenActionMenu(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenActionMenu(null);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openActionMenu]);
  const sort: SortState =
    sortBy && (sortDirection === "asc" || sortDirection === "desc") ? { key: sortBy, direction: sortDirection } : null;
  const [detailsUser, setDetailsUser] = useState<MembershipUser | null>(null);
  const [detailsTab, setDetailsTab] = useState<"usage" | "logs">("usage");
  const [pendingAction, setPendingAction] = useState<PendingMembershipAction | null>(null);
  const grantForm = useForm({ resolver: zodResolver(grantSchema), defaultValues: { planId: "job-search" } });
  const switchForm = useForm({ resolver: zodResolver(grantSchema), defaultValues: { planId: "job-search" } });
  const extendForm = useForm({ resolver: zodResolver(extendSchema), defaultValues: { days: 30 } });
  const creditForm = useForm({
    resolver: zodResolver(creditSchema),
    defaultValues: { resource: "ai" as const, units: 10, reason: "" },
  });
  const cancelForm = useForm({ resolver: zodResolver(cancelSchema), defaultValues: { reason: "" } });
  const memberDetails = useAdminMembership(detailsUser?.user.id);
  const users = useQuery({
    queryKey: ["admin", "memberships", search, planId, membershipStatus, page, pageSize, sortBy, sortDirection],
    queryFn: () =>
      apiRequest<Response>(
        `/api/admin/memberships?${buildQueryString({ search, planId, membershipStatus, page, pageSize, sortBy, sortDirection })}`,
      ),
    enabled: user?.role !== "user",
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
  const action = useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown; successMessage: string }) =>
      apiRequest(path, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: async (_, variables) => {
      notify(variables.successMessage);
      setPendingAction(null);
      setSelected(null);
      setSelectedAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "memberships"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "membership-details"] }),
        queryClient.invalidateQueries({ queryKey: ["billing", "membership"] }),
      ]);
    },
    onError: (error) => notify(error instanceof Error ? error.message : "ثبت تغییر ناموفق بود.", "error"),
  });
  if (user?.role === "user")
    return <p className="rounded-xl bg-[#fff1ef] p-5 text-[11px] text-[#a13f37]">اجازه دسترسی به این بخش را نداری.</p>;
  const endpoint = (actionName: string) => `/api/admin/users/${selected!.user.id}/membership/${actionName}`;
  const columns: DataTableColumn<MembershipUser>[] = [
    {
      key: "user",
      title: "کاربر",
      skeletonClassName: "w-32",
      render: (item) => (
        <>
          <strong className="block text-[12px]">{userDisplayName(item.user)}</strong>
          <span dir="ltr" className="mt-1 block text-[#899592]">
            {userIdentifier(item.user)}
          </span>
        </>
      ),
    },
    { key: "plan", title: "پلن", render: (item) => item.plan?.name || "ثبت‌نشده" },
    { key: "account", title: "وضعیت حساب", render: (item) => (item.user.status === "active" ? "فعال" : "تعلیق‌شده") },
    {
      key: "membership",
      title: "وضعیت عضویت",
      render: (item) =>
        item.membership?.status === "active" ? "فعال" : item.membership?.status === "canceled" ? "لغوشده" : "منقضی",
    },
    {
      key: "expiry",
      title: "انقضا",
      className: "whitespace-nowrap",
      render: (item) => (item.membership?.expiresAt ? <PersianDateTime value={item.membership.expiresAt} /> : "—"),
    },
    {
      key: "ai",
      title: "اعتبار AI",
      render: (item) => item.membership?.aiCreditsRemaining?.toLocaleString("fa-IR") ?? "—",
    },
    {
      key: "manage",
      title: "عملیات",
      sortable: false,
      render: (item) => (
        <div className="relative flex gap-2" data-membership-action-menu>
          <TableActionButton
            label={`اطلاعات تکمیلی ${userDisplayName(item.user)}`}
            onClick={() => {
              setDetailsUser(item);
              setDetailsTab("usage");
            }}
          >
            <Info size={14} />
          </TableActionButton>
          <TableActionButton
            label={`عملیات عضویت ${userDisplayName(item.user)}`}
            onClick={() => setOpenActionMenu((current) => (current === item.user.id ? null : item.user.id))}
          >
            <MoreHorizontal size={15} />
          </TableActionButton>
          {openActionMenu === item.user.id && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-44 rounded-[12px] border border-[#dfe8e2] bg-white p-1.5 shadow-[0_12px_30px_rgba(25,57,50,.14)]">
              {([
                ["grant", "اعطای پلن"],
                ["switch", "تعویض پلن"],
                ["extend", "تمدید عضویت"],
                ["credit", "تغییر اعتبار"],
                ["cancel", "لغو عضویت"],
              ] as const).map(([actionName, label]) => (
                <button
                  className={`flex min-h-9 w-full items-center rounded-lg px-2.5 text-right text-[12px] font-normal hover:bg-[#f1f6f3] ${actionName === "cancel" ? "text-[#b14848] hover:bg-[#fff0ed]" : "text-[#405753]"}`}
                  key={actionName}
                  onClick={() => {
                    setSelected(item);
                    setSelectedAction(actionName);
                    setOpenActionMenu(null);
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ];
  return (
    <div className="grid gap-6">
      <SectionTitle description="پلن فعال، اعتبارها و تاریخچه عضویت کاربران را مدیریت کن." title="عضویت و اعتبار" />
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <AdminTableToolbar
          search={search}
          searchPlaceholder="نام، شماره همراه یا ایمیل"
          activeFilterCount={Number(Boolean(planId)) + Number(Boolean(membershipStatus))}
          onSearch={(value) => {
            void setFilters({ search: value });
            setPage(1);
          }}
          onResetFilters={() => {
            void setFilters({ planId: "", membershipStatus: "" });
            setPage(1);
          }}
        >
          <AdminFilterSelect
            label="پلن"
            value={planId}
            onChange={(value) => {
              void setFilters({ planId: value });
              setPage(1);
            }}
            options={[
              { value: "", label: "همه پلن‌ها" },
              ...(plans.data ?? []).map((plan) => ({ value: plan.id, label: plan.name })),
            ]}
          />
          <AdminFilterSelect
            label="وضعیت عضویت"
            value={membershipStatus}
            onChange={(value) => {
              void setFilters({ membershipStatus: value as typeof membershipStatus });
              setPage(1);
            }}
            options={[
              { value: "", label: "همه وضعیت‌ها" },
              { value: "active", label: "فعال" },
              { value: "expired", label: "منقضی" },
              { value: "canceled", label: "لغوشده" },
            ]}
          />
        </AdminTableToolbar>
        <DataTable
          columns={columns}
          rows={users.data?.items ?? []}
          getRowKey={(item) => item.user.id}
          loading={users.isLoading}
          error={users.error}
          retrying={users.isFetching}
          onRetry={() => void users.refetch()}
          filtered={Boolean(search || planId || membershipStatus)}
          sort={sort}
          onSortChange={(next) => {
            void setFilters({ sortBy: next?.key ?? "", sortDirection: next?.direction ?? "" });
            setPage(1);
          }}
          minWidthClassName="min-w-[850px]"
          footer={
            <AdminTablePagination
              page={page}
              pageSize={pageSize}
              total={users.data?.total ?? 0}
              pageSizeSaving={pageSizeSaving}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          }
        />
      </section>
      {selected && selectedAction && (
        <Modal
          title={{ grant: "اعطای پلن", switch: "تعویض پلن", extend: "تمدید عضویت", credit: "تغییر اعتبار", cancel: "لغو عضویت" }[selectedAction]}
          description={userDisplayName(selected.user)}
          showCloseButton
          onClose={() => {
            setSelected(null);
            setSelectedAction(null);
          }}
        >
          <div className="mt-5 grid gap-3">
            {selectedAction === "grant" && (
            <form
              className="grid gap-4"
              onSubmit={grantForm.handleSubmit((body) =>
                setPendingAction({
                  kind: "membership",
                  path: endpoint("grant"),
                  body: { ...body, mode: "add" },
                  title: "تأیید اعطای پلن",
                  description: `پلن انتخاب‌شده برای ${userDisplayName(selected.user)} فعال شود و مدت و اعتبار آن به عضویت فعلی افزوده شود؟`,
                  confirmLabel: "اعطا و افزودن مدت",
                  successMessage: "پلن جدید با موفقیت به عضویت کاربر افزوده شد.",
                }),
              )}
            >
              <FormField label="پلن" required error={grantForm.formState.errors.planId?.message}>
                <Controller control={grantForm.control} name="planId" render={({ field }) => (
                  <SearchableSelect invalid={Boolean(grantForm.formState.errors.planId)} options={(plans.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))} value={field.value} onChange={(value) => field.onChange(String(value))} placeholder="انتخاب پلن" />
                )} />
              </FormField>
              <button className="min-h-10 rounded-[10px] bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">
                اعطا و افزودن مدت
              </button>
            </form>
            )}
            {selectedAction === "switch" && (
            <form
              className="grid gap-4"
              onSubmit={switchForm.handleSubmit((body) =>
                setPendingAction({
                  kind: "membership",
                  path: endpoint("grant"),
                  body: { ...body, mode: "replace" },
                  title: "تأیید تعویض پلن",
                  description: `پلن ${userDisplayName(selected.user)} به پلن انتخاب‌شده تغییر کند؟ تاریخ انقضا تمدید نمی‌شود و سهمیه‌ها مطابق پلن جدید تنظیم می‌شوند.`,
                  confirmLabel: "تعویض بدون تمدید",
                  successMessage: "پلن کاربر بدون تمدید زمان تعویض شد.",
                }),
              )}
            >
              <FormField label="پلن" required error={switchForm.formState.errors.planId?.message}>
                <Controller control={switchForm.control} name="planId" render={({ field }) => (
                  <SearchableSelect invalid={Boolean(switchForm.formState.errors.planId)} options={(plans.data ?? []).map((plan) => ({ value: plan.id, label: plan.name }))} value={field.value} onChange={(value) => field.onChange(String(value))} placeholder="انتخاب پلن" />
                )} />
              </FormField>
              <button className="rounded-lg border border-[#94c9b1] bg-white px-3 py-2 text-[10px] font-bold text-[#0f7b62]">
                اصلاح پلن
              </button>
            </form>
            )}
            {selectedAction === "extend" && (
            <form
              className="grid gap-4"
              onSubmit={extendForm.handleSubmit((body) =>
                setPendingAction({
                  kind: "membership",
                  path: endpoint("extend"),
                  body,
                  title: "تأیید تمدید عضویت",
                  description: `${body.days.toLocaleString("fa-IR")} روز به عضویت ${userDisplayName(selected.user)} افزوده شود؟`,
                  confirmLabel: "تأیید تمدید",
                  successMessage: "مدت عضویت کاربر با موفقیت تمدید شد.",
                }),
              )}
            >
              <FormField label="تعداد روز" required error={extendForm.formState.errors.days?.message}>
                <input aria-invalid={Boolean(extendForm.formState.errors.days)} className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px] aria-[invalid=true]:border-[#c44d4d] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#c44d4d]/10" type="number" {...extendForm.register("days")} />
              </FormField>
              <button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">افزودن روز</button>
            </form>
            )}
            {selectedAction === "credit" && (
            <form
              className="grid gap-4"
              onSubmit={creditForm.handleSubmit((body) =>
                setPendingAction({
                  kind: "membership",
                  path: endpoint("credits"),
                  body,
                  title: "تأیید تغییر اعتبار",
                  description: `اعتبار ${userDisplayName(selected.user)} به میزان ${body.units.toLocaleString("fa-IR")} واحد تغییر کند؟`,
                  confirmLabel: "ثبت تغییر اعتبار",
                  successMessage: "اعتبار کاربر با موفقیت به‌روزرسانی شد.",
                  tone: body.units < 0 ? "danger" : "primary",
                }),
              )}
            >
              <div className="grid grid-cols-2 gap-2">
                <Controller
                  control={creditForm.control}
                  name="resource"
                  render={({ field }) => (
                    <SearchableSelect
                      invalid={Boolean(creditForm.formState.errors.resource)}
                      options={[
                        { value: "ai", label: "هوش مصنوعی" },
                        { value: "match", label: "تطبیق" },
                        { value: "interview", label: "مصاحبه" },
                        { value: "resume", label: "رزومه" },
                        { value: "pdf", label: "PDF" },
                      ]}
                      value={field.value}
                      onChange={(value) => field.onChange(String(value))}
                    />
                  )}
                />
                <input
                  aria-invalid={Boolean(creditForm.formState.errors.units)}
                  className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px] aria-[invalid=true]:border-[#c44d4d] aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-[#c44d4d]/10"
                  type="number"
                  {...creditForm.register("units")}
                />
              </div>
              {creditForm.formState.errors.resource?.message && <small className="text-[#c44d4d]">{creditForm.formState.errors.resource.message}</small>}
              {creditForm.formState.errors.units?.message && <small className="text-[#c44d4d]">{creditForm.formState.errors.units.message}</small>}
              <input
                className="h-10 rounded-lg border border-[#dfe5df] px-3 text-[10px]"
                placeholder="دلیل تغییر (اختیاری)"
                {...creditForm.register("reason")}
              />
              <button className="rounded-lg bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white">ثبت اعتبار</button>
            </form>
            )}
            {selectedAction === "cancel" && (
            <form
              className="grid gap-4"
              onSubmit={cancelForm.handleSubmit((body) =>
                setPendingAction({
                  kind: "membership",
                  path: endpoint("cancel"),
                  body,
                  title: "تأیید لغو عضویت",
                  description: `عضویت ${userDisplayName(selected.user)} لغو و تمام اعتبار باقی‌مانده حذف شود؟`,
                  confirmLabel: "لغو فوری عضویت",
                  successMessage: "عضویت کاربر با موفقیت لغو شد.",
                  tone: "danger",
                }),
              )}
            >
              <input
                className="h-10 rounded-lg border border-[#e8d5d1] px-3 text-[10px]"
                placeholder="دلیل لغو (اختیاری)"
                {...cancelForm.register("reason")}
              />
              <button className="rounded-lg bg-[#b14848] px-3 py-2 text-[10px] font-bold text-white">
                لغو فوری و حذف اعتبار باقی‌مانده
              </button>
            </form>
            )}
          </div>
        </Modal>
      )}
      {detailsUser && (
        <Modal
          title={userDisplayName(detailsUser.user)}
          description={userIdentifier(detailsUser.user)}
          document
          showCloseButton
          onClose={() => setDetailsUser(null)}
          headerActions={
            <span
              className={
                detailsUser.user.status === "active"
                  ? "rounded-full bg-[#edf7f2] px-3 py-1.5 text-[9px] font-bold text-[#14705a]"
                  : "rounded-full bg-[#fff0ed] px-3 py-1.5 text-[9px] font-bold text-[#b65343]"
              }
            >
              حساب {detailsUser.user.status === "active" ? "فعال" : "تعلیق‌شده"}
            </span>
          }
        >
          <div className="mt-5 flex gap-2 border-b border-[#e8ede9]" role="tablist" aria-label="اطلاعات تکمیلی کاربر">
            <button
              className={`inline-flex min-h-11 items-center gap-2 border-x-0 border-t-0 bg-transparent px-4 text-[10px] font-bold ${detailsTab === "usage" ? "border-b-2 border-[#0f7b62] text-[#0f7b62]" : "border-b-2 border-transparent text-[#71807c]"}`}
              type="button"
              role="tab"
              aria-selected={detailsTab === "usage"}
              onClick={() => setDetailsTab("usage")}
            >
              <ShieldCheck size={16} /> پلن و میزان مصرف
            </button>
            <button
              className={`inline-flex min-h-11 items-center gap-2 border-x-0 border-t-0 bg-transparent px-4 text-[10px] font-bold ${detailsTab === "logs" ? "border-b-2 border-[#0f7b62] text-[#0f7b62]" : "border-b-2 border-transparent text-[#71807c]"}`}
              type="button"
              role="tab"
              aria-selected={detailsTab === "logs"}
              onClick={() => setDetailsTab("logs")}
            >
              <ClipboardList size={16} /> لاگ مدیریتی (
              {memberDetails.data?.history.length.toLocaleString("fa-IR") ?? "—"})
            </button>
          </div>
          <div className="my-5">
            {memberDetails.isPending && <MembershipSummarySkeleton />}
            {memberDetails.isError && (
              <div className="grid justify-items-start gap-3 rounded-[16px] border border-[#f0d7d0] bg-[#fff7f4] p-5 text-[10px] text-[#a44d3e]">
                دریافت اطلاعات کاربر ممکن نشد.
                <button
                  className="rounded-lg border border-[#e2c4bd] bg-white px-3 py-2 font-bold"
                  type="button"
                  onClick={() => void memberDetails.refetch()}
                >
                  تلاش مجدد
                </button>
              </div>
            )}
            {memberDetails.data && detailsTab === "usage" && (
              <MembershipSummary membership={memberDetails.data.membership} />
            )}
            {memberDetails.data && detailsTab === "logs" && (
              <div className="grid max-h-[55vh] gap-3 overflow-y-auto pl-1">
                {memberDetails.data.history.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-[#dce5df] bg-[#f8faf8] p-8 text-center text-[10px] text-[#768682]">
                    هنوز هیچ اقدام مدیریتی برای این کاربر ثبت نشده است.
                  </div>
                ) : (
                  memberDetails.data.history.map((event) => {
                    const content = eventContent(event);
                    return (
                      <article
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[15px] border border-[#e1e8e3] bg-[#fbfcfb] px-4 py-3"
                        key={event.id}
                      >
                        <strong className="shrink-0 whitespace-nowrap text-[11px] text-[#244039]">
                          {content.title}
                        </strong>
                        <p
                          className="m-0 line-clamp-2 min-w-[14rem] flex-1 text-[10px] leading-5 text-[#61726e]"
                          title={content.description}
                        >
                          {content.description}
                        </p>
                        <small className="shrink-0 whitespace-nowrap text-[9px] text-[#87938f]">
                          انجام‌دهنده: {event.actor ? userDisplayName(event.actor) : "مدیر حذف‌شده"}
                          {event.actor?.role === "superadmin"
                            ? " (سوپرادمین)"
                            : event.actor?.role === "admin"
                              ? " (ادمین)"
                              : ""}
                        </small>
                        <time
                          className="shrink-0 whitespace-nowrap text-[9px] text-[#82908d]"
                          dateTime={event.createdAt}
                        >
                          <PersianDateTime value={event.createdAt} />
                        </time>
                      </article>
                    );
                  })
                )}
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
          pending={action.isPending}
          onCancel={() => setPendingAction(null)}
          onConfirm={() => {
            if (pendingAction.path) {
              action.mutate({
                path: pendingAction.path,
                body: pendingAction.body,
                successMessage: pendingAction.successMessage,
              });
            }
          }}
        />
      )}
    </div>
  );
}
