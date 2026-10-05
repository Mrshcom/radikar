"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Pencil, WalletCards } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/app/_components/text-field";
import { useToast } from "@/app/_components/toast";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { FormField } from "../../_components/form-field";
import { JalaliDatePicker } from "../../_components/jalali-date-picker";
import { TableActionButton } from "../../_components/table-action-button";
import { PanelPageTitle } from "../../_components/panel-page-title";
import { ConfirmActionModal } from "../../_components/ui";
import { RadicoinIcon } from "../../_components/radicoin-icon";
import {
  type AdminWalletItem,
  useAdjustRadicoins,
  useAdminRadicoinWallets,
  useGrantPromotionalRadicoins,
} from "@/lib/radicoins";
import { useUrlTablePagination } from "@/lib/table-page-size";
import { tableQueryStateOptions, tableSearchParser } from "@/lib/table-search-params";
import { AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

const actionSchema = z.object({
  amount: z
    .number()
    .int()
    .refine((value) => value !== 0, "مقدار نمی‌تواند صفر باشد."),
  description: z.string().trim().min(3, "دلیل را بنویس.").max(200),
  expiresAt: z.string().optional(),
});
type ActionForm = z.infer<typeof actionSchema>;
const numberValue = { setValueAs: (value: string) => Number(value) };
const userName = (item: AdminWalletItem) => item.user.fullName || item.user.phone || item.user.email || "کاربر رادیکار";

export default function AdminRadicoinsPage() {
  const notify = useToast();
  const [{ search }, setFilters] = useQueryStates(
    { search: tableSearchParser },
    { ...tableQueryStateOptions, urlKeys: { search: "q" } },
  );
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } = useUrlTablePagination();
  const wallets = useAdminRadicoinWallets(search, page, pageSize);
  const [target, setTarget] = useState<AdminWalletItem | null>(null);
  const [mode, setMode] = useState<"adjust" | "gift">("gift");
  const grant = useGrantPromotionalRadicoins();
  const adjust = useAdjustRadicoins();
  const action = useForm<ActionForm>({
    resolver: zodResolver(actionSchema),
    defaultValues: { amount: 50, description: "", expiresAt: "" },
  });
  const submitAction = action.handleSubmit(async (values) => {
    if (!target) return;
    try {
      if (mode === "gift") {
        if (values.amount < 1) throw new Error("هدیه باید مثبت باشد.");
        await grant.mutateAsync({
          userId: target.user.id,
          amount: values.amount,
          description: values.description,
          expiresAt: values.expiresAt ? new Date(`${values.expiresAt}T23:59:59+03:30`).toISOString() : undefined,
        });
      } else
        await adjust.mutateAsync({ userId: target.user.id, amount: values.amount, description: values.description });
      notify(mode === "gift" ? "هدیه رادیکوین ثبت شد." : "موجودی اصلاح شد.");
      setTarget(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : "عملیات ناموفق بود.", "error");
    }
  });
  const open = (item: AdminWalletItem, nextMode: "adjust" | "gift") => {
    setTarget(item);
    setMode(nextMode);
    action.reset({ amount: nextMode === "gift" ? 50 : 0, description: "", expiresAt: "" });
  };
  const columns: DataTableColumn<AdminWalletItem>[] = [
    {
      key: "user",
      title: "کاربر",
      render: (item) => (
        <div>
          <strong className="block text-[11px]">{userName(item)}</strong>
          <span className="text-[9px] text-[#899692]">{item.user.phone || item.user.email}</span>
        </div>
      ),
    },
    {
      key: "available",
      title: "موجودی",
      render: (item) => (
        <span className="inline-flex items-center gap-2">
          <RadicoinIcon className="text-[#526461]" size={20} />
          <strong className="text-[#0f7b62]">{(item.wallet?.availableCoins ?? 0).toLocaleString("fa-IR")}</strong>
        </span>
      ),
    },
    {
      key: "earned",
      title: "کل دریافتی",
      render: (item) => (item.wallet?.lifetimeEarnedCoins ?? 0).toLocaleString("fa-IR"),
    },
    {
      key: "spent",
      title: "مصرف‌شده",
      render: (item) => (item.wallet?.lifetimeSpentCoins ?? 0).toLocaleString("fa-IR"),
    },
    {
      key: "actions",
      title: "عملیات",
      sortable: false,
      render: (item) => (
        <div className="flex gap-2">
          <TableActionButton label="هدیه تبلیغاتی" onClick={() => open(item, "gift")}>
            <Gift size={14} />
          </TableActionButton>
          <TableActionButton label="اصلاح موجودی" onClick={() => open(item, "adjust")}>
            <Pencil size={14} />
          </TableActionButton>
        </div>
      ),
    },
  ];
  return (
    <div className="grid gap-6">
      <PanelPageTitle
        title="اقتصاد وفاداری رادیکار"
        description="موجودی کاربران، گردش کیف پول و هدیه‌های زمان‌دار را بررسی و مدیریت کن."
      />
      <section className="overflow-hidden rounded-[20px] border border-[#dfe8e2] bg-white">
        <h2 className="m-0 flex items-center gap-2 border-b border-[#edf1ee] px-5 py-4 text-[13px] font-black text-[#19312f]">
          <WalletCards className="text-[#0f7b62]" size={18} /> کیف پول کاربران
        </h2>
        <AdminTableToolbar
          search={search}
          searchPlaceholder="نام، موبایل یا ایمیل"
          onSearch={(value) => {
            void setFilters({ search: value });
            setPage(1);
          }}
          onResetFilters={() => {
            void setFilters({ search: "" });
            setPage(1);
          }}
        />
        <DataTable
          columns={columns}
          rows={wallets.data?.items ?? []}
          getRowKey={(item) => item.user.id}
          loading={wallets.isLoading}
          error={wallets.error}
          retrying={wallets.isFetching}
          onRetry={() => void wallets.refetch()}
          filtered={Boolean(search)}
          footer={
            <AdminTablePagination
              page={page}
              pageSize={pageSize}
              total={wallets.data?.total ?? 0}
              pageSizeSaving={pageSizeSaving}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          }
        />
      </section>
      {target && (
        <ConfirmActionModal
          title={mode === "gift" ? "هدیه تبلیغاتی رادیکوین" : "اصلاح موجودی رادیکوین"}
          description={`${userName(target)}؛ ${mode === "gift" ? "هدیه می‌تواند تاریخ انقضا داشته باشد." : "مقدار منفی از موجودی قابل‌استفاده کم می‌کند."}`}
          confirmLabel={mode === "gift" ? "ثبت هدیه" : "ثبت اصلاح"}
          pending={grant.isPending || adjust.isPending}
          onCancel={() => setTarget(null)}
          onConfirm={() => void submitAction()}
        >
          <div className="grid gap-3">
            <FormField label="مقدار رادیکوین" required error={action.formState.errors.amount?.message}>
              <TextField
                aria-invalid={Boolean(action.formState.errors.amount)}
                inputMode="numeric"
                {...action.register("amount", numberValue)}
              />
            </FormField>
            <FormField label="دلیل" required error={action.formState.errors.description?.message}>
              <TextField aria-invalid={Boolean(action.formState.errors.description)} {...action.register("description")} />
            </FormField>
            {mode === "gift" && (
              <FormField label="تاریخ انقضا (اختیاری)">
                <Controller
                  control={action.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <JalaliDatePicker
                      ariaLabel="تاریخ انقضای هدیه"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </FormField>
            )}
          </div>
        </ConfirmActionModal>
      )}
    </div>
  );
}
