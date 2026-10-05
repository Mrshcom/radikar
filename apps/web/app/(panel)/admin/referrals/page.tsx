"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Pencil, Trophy } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/app/_components/text-field";
import { useToast } from "@/app/_components/toast";
import { PersianDateTime } from "@/lib/date-time-display";
import {
  type AdminReferral,
  useAdjustReferralPoints,
  useAdminReferrals,
  useReferralLeaderboard,
} from "@/lib/referrals";
import { useUrlTablePagination } from "@/lib/table-page-size";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { FormField } from "../../_components/form-field";
import { HoverTooltip } from "../../_components/hover-tooltip";
import { PanelPageTitle } from "../../_components/panel-page-title";
import { TablePagination } from "../../_components/table-pagination";
import { TableActionButton } from "../../_components/table-action-button";
import { ConfirmActionModal } from "../../_components/ui";

const adjustmentSchema = z.object({
  points: z
    .number({ error: "مقدار رادیکوین الزامی است." })
    .int()
    .min(-10_000, "مقدار کمتر از حد مجاز است.")
    .max(10_000, "مقدار بیشتر از حد مجاز است.")
    .refine((value) => value !== 0, "مقدار نمی‌تواند صفر باشد."),
  description: z.string().trim().min(3, "دلیل را بنویس.").max(200, "دلیل نباید بیش از ۲۰۰ نویسه باشد."),
});
type AdjustmentValues = z.infer<typeof adjustmentSchema>;

function userName(user: AdminReferral["referrer"]) {
  return user.fullName || user.phone || user.email || "کاربر";
}

export default function AdminReferralsPage() {
  const notify = useToast();
  const { page, pageSize, setPage, setPageSize, isSaving } = useUrlTablePagination();
  const leaderboard = useReferralLeaderboard();
  const report = useAdminReferrals(page, pageSize);
  const adjust = useAdjustReferralPoints();
  const [selectedUser, setSelectedUser] = useState<AdminReferral["referrer"] | null>(null);
  const adjustmentForm = useForm<AdjustmentValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { points: 0, description: "" },
  });
  const columns: DataTableColumn<AdminReferral>[] = [
    { key: "referrer", title: "دعوت‌کننده", render: (item) => <span>{userName(item.referrer)}</span> },
    { key: "referred", title: "کاربر دعوت‌شده", render: (item) => <span>{userName(item.referred)}</span> },
    {
      key: "status",
      title: "وضعیت",
      render: (item) => (
        <span
          className={`rounded-md px-2 py-1 text-[9px] ${item.status === "confirmed" ? "bg-[#eaf5f0] text-[#0f705a]" : "bg-[#f2f4f2] text-[#71817e]"}`}
        >
          {item.status === "confirmed" ? "تأییدشده" : item.status === "pending" ? "در انتظار" : "ردشده"}
        </span>
      ),
    },
    {
      key: "date",
      title: "تاریخ",
      render: (item) => <PersianDateTime value={item.createdAt} />,
      className: "whitespace-nowrap",
    },
    {
      key: "actions",
      title: "عملیات",
      sortable: false,
      render: (item) => (
        <HoverTooltip content="اصلاح رادیکوین">
          <TableActionButton
            label="اصلاح رادیکوین"
            onClick={() => {
              setSelectedUser(item.referrer);
              adjustmentForm.reset({ points: 0, description: "" });
            }}
          >
            <Pencil size={14} />
          </TableActionButton>
        </HoverTooltip>
      ),
    },
  ];

  const submitAdjustment = adjustmentForm.handleSubmit(async (values) => {
    if (!selectedUser) return;
    try {
      await adjust.mutateAsync({ userId: selectedUser.id, ...values });
      notify("موجودی رادیکوین اصلاح شد.");
      setSelectedUser(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : "اصلاح رادیکوین ناموفق بود.", "error");
    }
  });

  return (
    <div className="grid gap-6">
      <PanelPageTitle
        title="دعوت‌های رادیکار"
        description="دعوت‌های ثبت‌شده، وضعیت تأیید و عملکرد دعوت‌کنندگان را بررسی کن."
      />
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <h2 className="m-0 flex items-center gap-2 border-b border-[#edf0ec] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">
          <Gift className="text-[#0f7b62]" size={18} /> دعوت‌های ثبت‌شده
        </h2>
        <DataTable
          columns={columns}
          rows={report.data?.items ?? []}
          getRowKey={(item) => item.id}
          loading={report.isLoading}
          error={report.error}
          retrying={report.isFetching}
          onRetry={() => void report.refetch()}
          minWidthClassName="min-w-[820px]"
          footer={
            <TablePagination
              page={page}
              pageSize={pageSize}
              total={report.data?.total ?? 0}
              pageSizeSaving={isSaving}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          }
        />
      </section>
      <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
        <h2 className="m-0 flex items-center gap-2 border-b border-[#edf0ec] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">
          <Trophy className="text-[#0f7b62]" size={18} /> برترین دعوت‌کنندگان
        </h2>
        <div className="divide-y divide-[#edf0ec]">
          {(leaderboard.data?.items ?? []).map((item, index) => (
            <div className="flex items-center justify-between px-5 py-4" key={item.userId}>
              <span className="text-[11px] text-[#405753]">
                {index + 1}. {item.displayName}
              </span>
              <span className="text-[10px] text-[#0f7b62]">{item.referrals.toLocaleString("fa-IR")} دعوت موفق</span>
            </div>
          ))}
        </div>
      </section>
      {selectedUser && (
        <ConfirmActionModal
          title="اصلاح موجودی رادیکوین"
          description={`برای ${userName(selectedUser)} یک تراکنش مدیریتی شفاف ثبت می‌شود.`}
          confirmLabel="ثبت اصلاح"
          pending={adjust.isPending}
          onCancel={() => setSelectedUser(null)}
          onConfirm={() => void submitAdjustment()}
        >
          <div className="grid gap-3">
            <FormField label="مقدار رادیکوین" required error={adjustmentForm.formState.errors.points?.message}>
              <TextField
                aria-invalid={Boolean(adjustmentForm.formState.errors.points)}
                inputMode="numeric"
                placeholder="مثلاً ۵۰ یا -۵۰"
                {...adjustmentForm.register("points", { setValueAs: (value) => Number(value) })}
              />
            </FormField>
            <FormField label="دلیل اصلاح" required error={adjustmentForm.formState.errors.description?.message}>
              <TextField
                aria-invalid={Boolean(adjustmentForm.formState.errors.description)}
                placeholder="دلیل اصلاح"
                {...adjustmentForm.register("description")}
              />
            </FormField>
          </div>
        </ConfirmActionModal>
      )}
    </div>
  );
}
