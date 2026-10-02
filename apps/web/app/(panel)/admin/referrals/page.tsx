"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Coins, Gift, Pencil, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Checkbox } from "@/app/_components/checkbox";
import { TextField } from "@/app/_components/text-field";
import { useToast } from "@/app/_components/toast";
import { PersianDateTime } from "@/lib/date-time-display";
import { type AdminReferral, type ReferralSettings, useAdjustReferralPoints, useAdminReferrals, useReferralLeaderboard, useReferralSettings, useUpdateReferralSettings } from "@/lib/referrals";
import { useUrlTablePagination } from "@/lib/table-page-size";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { HoverTooltip } from "../../_components/hover-tooltip";
import { PanelPageTitle } from "../../_components/panel-page-title";
import { TablePagination } from "../../_components/table-pagination";
import { TableActionButton } from "../../_components/table-action-button";
import { ConfirmActionModal } from "../../_components/ui";

const settingsSchema = z.object({ isActive: z.boolean(), referrerPoints: z.number().int().min(0).max(10_000), referredPoints: z.number().int().min(0).max(10_000) });
const adjustmentSchema = z.object({ points: z.number().int().min(-10_000).max(10_000).refine((value) => value !== 0), description: z.string().trim().min(3).max(200) });
type SettingsValues = z.infer<typeof settingsSchema>;
type AdjustmentValues = z.infer<typeof adjustmentSchema>;

function userName(user: AdminReferral["referrer"]) { return user.fullName || user.phone || user.email || "کاربر"; }

export default function AdminReferralsPage() {
  const notify = useToast();
  const { page, pageSize, setPage, setPageSize, isSaving } = useUrlTablePagination();
  const settings = useReferralSettings();
  const leaderboard = useReferralLeaderboard();
  const report = useAdminReferrals(page, pageSize);
  const update = useUpdateReferralSettings();
  const adjust = useAdjustReferralPoints();
  const [selectedUser, setSelectedUser] = useState<AdminReferral["referrer"] | null>(null);
  const [activeChange, setActiveChange] = useState<boolean | null>(null);
  const settingsForm = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), defaultValues: { isActive: true, referrerPoints: 100, referredPoints: 50 } });
  const adjustmentForm = useForm<AdjustmentValues>({ resolver: zodResolver(adjustmentSchema), defaultValues: { points: 0, description: "" } });
  const isReferralActive = useWatch({ control: settingsForm.control, name: "isActive" });

  useEffect(() => { if (settings.data?.settings) settingsForm.reset(settings.data.settings); }, [settings.data, settingsForm]);

  const confirmActiveChange = async () => {
    if (activeChange == null) return;
    try {
      const response = await update.mutateAsync({ ...settingsForm.getValues(), isActive: activeChange } as ReferralSettings);
      settingsForm.reset(response.settings);
      notify(activeChange ? "سیستم ریفرال فعال شد." : "سیستم ریفرال غیرفعال شد.");
      setActiveChange(null);
    } catch (error) { notify(error instanceof Error ? error.message : "تغییر وضعیت ناموفق بود.", "error"); }
  };

  const columns: DataTableColumn<AdminReferral>[] = [
    { key: "referrer", title: "دعوت‌کننده", render: (item) => <span>{userName(item.referrer)}</span> },
    { key: "referred", title: "کاربر دعوت‌شده", render: (item) => <span>{userName(item.referred)}</span> },
    { key: "status", title: "وضعیت", render: (item) => <span className={`rounded-md px-2 py-1 text-[9px] ${item.status === "confirmed" ? "bg-[#eaf5f0] text-[#0f705a]" : "bg-[#f2f4f2] text-[#71817e]"}`}>{item.status === "confirmed" ? "تأییدشده" : item.status === "pending" ? "در انتظار" : "ردشده"}</span> },
    { key: "date", title: "تاریخ", render: (item) => <PersianDateTime value={item.createdAt} />, className: "whitespace-nowrap" },
    { key: "actions", title: "عملیات", sortable: false, render: (item) => <HoverTooltip content="اصلاح رادیکوین"><TableActionButton label="اصلاح رادیکوین" onClick={() => { setSelectedUser(item.referrer); adjustmentForm.reset({ points: 0, description: "" }); }}><Pencil size={14} /></TableActionButton></HoverTooltip> },
  ];

  const submitAdjustment = adjustmentForm.handleSubmit(async (values) => {
    if (!selectedUser) return;
    try { await adjust.mutateAsync({ userId: selectedUser.id, ...values }); notify("موجودی رادیکوین اصلاح شد."); setSelectedUser(null); }
    catch (error) { notify(error instanceof Error ? error.message : "اصلاح رادیکوین ناموفق بود.", "error"); }
  });

  return <div className="grid gap-6">
    <PanelPageTitle icon={Gift} title="دعوت‌های رادیکار" />
    <section className="grid gap-4 rounded-[18px] border border-[#e3e9e3] bg-white p-6 md:grid-cols-[1fr_auto] md:items-center"><div><div className="inline-flex items-center gap-3"><Checkbox checked={isReferralActive} id="referral-active" name="isActive" onChange={(event) => setActiveChange(event.target.checked)} /><label className="cursor-pointer text-[10px] font-bold text-[#526461]" htmlFor="referral-active">فعال‌بودن سیستم ریفرال</label></div><p className="mb-0 mt-3 text-[9px] leading-6 text-[#7b8986]">مقادیر پاداش دعوت‌کننده و دعوت‌شونده از مرکز مدیریت رادیکوین تنظیم می‌شوند.</p></div><Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#e8f5ef] px-4 text-[10px] font-bold text-[#0f705a]" href="/admin/radicoins"><Coins size={16} /> مدیریت پاداش‌ها <ArrowLeft size={14} /></Link></section>
    <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white"><h2 className="m-0 flex items-center gap-2 border-b border-[#edf0ec] px-5 py-4 text-[13px] font-extrabold text-[#19312f]"><Gift className="text-[#0f7b62]" size={18} /> دعوت‌های ثبت‌شده</h2><DataTable columns={columns} rows={report.data?.items ?? []} getRowKey={(item) => item.id} loading={report.isLoading} error={report.error} retrying={report.isFetching} onRetry={() => void report.refetch()} minWidthClassName="min-w-[820px]" footer={<TablePagination page={page} pageSize={pageSize} total={report.data?.total ?? 0} pageSizeSaving={isSaving} onPageChange={setPage} onPageSizeChange={setPageSize} />} /></section>
    <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white"><h2 className="m-0 flex items-center gap-2 border-b border-[#edf0ec] px-5 py-4 text-[13px] font-extrabold text-[#19312f]"><Trophy className="text-[#0f7b62]" size={18} /> برترین دعوت‌کنندگان</h2><div className="divide-y divide-[#edf0ec]">{(leaderboard.data?.items ?? []).map((item, index) => <div className="flex items-center justify-between px-5 py-4" key={item.userId}><span className="text-[11px] text-[#405753]">{index + 1}. {item.displayName}</span><span className="text-[10px] text-[#0f7b62]">{item.referrals.toLocaleString("fa-IR")} دعوت موفق</span></div>)}</div></section>
    {selectedUser && <ConfirmActionModal title="اصلاح موجودی رادیکوین" description={`برای ${userName(selectedUser)} یک تراکنش مدیریتی شفاف ثبت می‌شود.`} confirmLabel="ثبت اصلاح" pending={adjust.isPending} onCancel={() => setSelectedUser(null)} onConfirm={() => void submitAdjustment()}><div className="grid gap-3"><TextField inputMode="numeric" placeholder="مثلاً ۵۰ یا -۵۰" {...adjustmentForm.register("points", { setValueAs: (value) => Number(value) })} /><TextField placeholder="دلیل اصلاح" {...adjustmentForm.register("description")} /></div></ConfirmActionModal>}
    {activeChange != null && <ConfirmActionModal title="تأیید تغییر وضعیت ریفرال" description={activeChange ? "سیستم ریفرال فعال شود؟ دعوت‌های تأییدشده مطابق قوانین رادیکوین پاداش می‌گیرند." : "سیستم ریفرال غیرفعال شود؟ لینک‌ها همچنان باز می‌شوند اما دعوت جدیدی ثبت نخواهد شد."} confirmLabel={activeChange ? "بله، فعال شود" : "بله، غیرفعال شود"} pending={update.isPending} tone={activeChange ? "primary" : "danger"} onCancel={() => setActiveChange(null)} onConfirm={() => void confirmActiveChange()} />}
  </div>;
}
