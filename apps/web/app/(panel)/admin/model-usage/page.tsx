"use client";

import { Activity, Bot, CircleDollarSign, Clock3, Download, Gauge, RefreshCw, Send } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useAuth } from "@/app/_components/auth";
import { SearchableSelect } from "@/app/_components/searchable-select";
import { PersianDateTime } from "@/lib/date-time-display";
import { DataTable, type DataTableColumn, type SortState } from "../../_components/data-table";
import { CurrencyTooltip } from "../../_components/currency-tooltip";
import { AdminTablePagination } from "../_components/admin-table-controls";
import { useAdminAiSettings, useAdminModelUsage, type AdminModelUsageStats } from "@/lib/admin-stats";
import { useUrlTablePagination } from "@/lib/table-page-size";
import { userDisplayName, userIdentifier } from "@/lib/user-identity";
import {
  createTableFilterParser,
  modelUsageDaysParser,
  tableQueryStateOptions,
  tableSortByParser,
  tableSortDirectionParser,
} from "@/lib/table-search-params";

type RecentModelRequest = AdminModelUsageStats["recentRequests"]["items"][number];
const modelUsageFilterParsers = {
  days: modelUsageDaysParser,
  provider: createTableFilterParser(["freeDeepseekAPI", "gapgpt"] as const),
  sortBy: tableSortByParser,
  sortDirection: tableSortDirectionParser,
};

const operationLabels: Record<string, string> = {
  match_analyze: "تحلیل تطبیق شغلی",
  match_tailor: "رزومه اختصاصی شغل",
  resume_generate: "تولید و بازنویسی رزومه",
  dashboard: "تحلیل داشبورد",
  interview_session: "ساخت جلسه مصاحبه",
  interview_feedback: "بازخورد مصاحبه",
  knowledge_import: "ایمپورت رزومه",
};

function number(value = 0) {
  return Number(value).toLocaleString("fa-IR");
}

function usd(micros = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(micros / 1_000_000);
}

function percent(value: number) {
  return `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(value)}٪`;
}

function dateTime(value: string) {
  return <PersianDateTime value={value} />;
}

function downloadCsv(data: AdminModelUsageStats) {
  const rows = [
    ["date", "requests", "input_tokens", "output_tokens", "total_tokens", "estimated_cost_usd"],
    ...data.daily.map((item) => [
      item.date,
      item.requests,
      item.inputTokens,
      item.outputTokens,
      item.totalTokens,
      (item.estimatedCostMicros / 1_000_000).toFixed(6),
    ]),
  ];
  const csv = rows.map((row) => row.join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `model-usage-${data.periodDays}-days.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminModelUsagePage() {
  const { user } = useAuth();
  const [{ days, provider, sortBy, sortDirection }, setFilters] = useQueryStates(
    modelUsageFilterParsers,
    tableQueryStateOptions,
  );
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } = useUrlTablePagination();
  const sort: SortState =
    sortBy && (sortDirection === "asc" || sortDirection === "desc") ? { key: sortBy, direction: sortDirection } : null;
  const query = useAdminModelUsage(user?.role === "superadmin", days, page, pageSize, provider, sortBy, sortDirection);
  const aiSettings = useAdminAiSettings(user?.role === "superadmin");

  if (user?.role !== "superadmin") return null;

  const totals = query.data?.totals;
  const successRate = totals?.requests ? (totals.successfulRequests / totals.requests) * 100 : 0;
  const cards = [
    { label: "درخواست‌های بازه", value: number(totals?.requests), icon: Send },
    { label: "درخواست‌های امروز", value: number(query.data?.today.requests), icon: Activity },
    { label: "توکن ورودی", value: number(totals?.inputTokens), icon: Download },
    { label: "توکن خروجی", value: number(totals?.outputTokens), icon: Bot },
    { label: "مجموع توکن", value: number(totals?.totalTokens), icon: Gauge },
    { label: "هزینه برآوردی", value: usd(totals?.estimatedCostMicros), icon: CircleDollarSign, ltr: true },
    { label: "نرخ موفقیت", value: percent(successRate), icon: Activity },
    { label: "میانگین زمان پاسخ", value: `${number(totals?.averageDurationMs)} ms`, icon: Clock3, ltr: true },
  ];
  const recentColumns: DataTableColumn<RecentModelRequest>[] = [
    {
      key: "user",
      title: "حساب کاربری",
      className: "font-bold text-[#253d39]",
      render: (row) => (
        <span className="whitespace-nowrap" title={`${userDisplayName(row.user)} — ${userIdentifier(row.user)}`}>
          {userDisplayName(row.user)}
          {row.user.fullName ? (
            <small className="mr-1 text-[9px] font-normal text-[#8b9895]">{userIdentifier(row.user)}</small>
          ) : null}
        </span>
      ),
    },
    { key: "operation", title: "عملیات", render: (row) => operationLabels[row.operation] ?? row.operation },
    {
      key: "model",
      title: "مدل / Provider",
      render: (row) => (
        <span className="inline-flex flex-col gap-0.5" dir="ltr" title={`${row.provider} / ${row.model}`}>
          <strong>{row.model}</strong>
          <small className="text-[9px] font-normal text-[#8b9895]">{row.provider}</small>
        </span>
      ),
    },
    {
      key: "tokens",
      title: "توکن",
      className: "whitespace-nowrap",
      render: (row) => `${number(row.totalTokens)} توکن`,
    },
    {
      key: "cost",
      title: "هزینه",
      className: "font-bold text-[#0f7b62]",
      render: (row) => (
        <CurrencyTooltip
          amount={row.estimatedCostMicros}
          dollarRateRials={aiSettings.data?.current.dollarRateRials}
          className="inline-flex"
        >
          <span dir="ltr">{usd(row.estimatedCostMicros)}</span>
        </CurrencyTooltip>
      ),
    },
    {
      key: "status",
      title: "وضعیت",
      className: "font-bold",
      render: (row) => (
        <span className={row.successful ? "text-[#14705a]" : "text-[#b65343]"}>
          {row.successful ? "موفق" : "ناموفق"}
        </span>
      ),
    },
    {
      key: "date",
      title: "تاریخ و ساعت",
      className: "whitespace-nowrap",
      render: (row) => <time dateTime={row.createdAt}>{dateTime(row.createdAt)}</time>,
    },
  ];

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-0 flex items-center gap-2 text-[25px] font-black text-[#19312f]">
            <Bot size={22} /> مصرف و هزینه مدل‌ها
          </h1>
          <p className="mb-0 mt-2 text-[10px] leading-7 text-[#7c8b88]">
            هر تماس واقعی با سرویس مدل، شامل تلاش‌های مجدد و درخواست‌های ناموفق، در این گزارش ثبت می‌شود.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="grid gap-1 text-[10px] font-bold text-[#7c8b88]">
            بازه گزارش
            <SearchableSelect
              ariaLabel="بازه گزارش"
              className="min-w-28"
              options={[7, 30, 90].map((value) => ({ value: String(value), label: `${number(value)} روز` }))}
              value={String(days)}
              onChange={(value) => {
                void setFilters({ days: Number(value) as typeof days });
                setPage(1);
              }}
            />
          </label>
          <label className="grid gap-1 text-[10px] font-bold text-[#7c8b88]">
            Provider
            <SearchableSelect
              ariaLabel="Provider"
              className="min-w-40"
              options={[
                { value: "", label: "همه Providerها" },
                { value: "freeDeepseekAPI", label: "DeepSeek Local" },
                { value: "gapgpt", label: "GapGPT" },
              ]}
              value={provider}
              onChange={(value) => {
                void setFilters({ provider: String(value) as typeof provider });
                setPage(1);
              }}
            />
          </label>
          <label className="grid gap-1 text-[10px] font-bold text-[#7c8b88]">
            خروجی
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#dfe7e2] bg-white px-4 text-[10px] font-bold text-[#536762] disabled:opacity-50"
              disabled={!query.data}
              onClick={() => query.data && downloadCsv(query.data)}
              type="button"
            >
              <Download size={14} /> فایل CSV
            </button>
          </label>
        </div>
      </header>

      {query.isError ? (
        <section className="rounded-[16px] border border-[#f2d4d0] bg-[#fff8f7] p-5 text-[11px] text-[#9b3f35]">
          دریافت گزارش مصرف مدل‌ها ناموفق بود.
          <button
            className="mr-3 inline-flex items-center gap-1 font-bold"
            onClick={() => void query.refetch()}
            type="button"
          >
            <RefreshCw size={13} /> تلاش مجدد
          </button>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-4 gap-4 max-[1180px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
            {cards.map(({ label, value, icon: Icon, ltr }) => (
              <CurrencyTooltip
                as="article"
                className="flex items-center gap-3 rounded-[15px] border border-[#e3e9e3] bg-white p-4 shadow-[0_8px_24px_rgba(30,61,53,.05)]"
                currency={label === "هزینه برآوردی" ? "USD" : null}
                amount={totals?.estimatedCostMicros ?? 0}
                dollarRateRials={aiSettings.data?.current.dollarRateRials}
                contentClassName="max-w-none leading-5"
                key={label}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#eaf5f0] text-[#0f7b62]">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <small className="block text-[9px] font-semibold text-[#81908d]">{label}</small>
                  <strong
                    className="mt-1 block truncate text-[18px] font-black text-[#19312f]"
                    dir={ltr ? "ltr" : undefined}
                  >
                    {query.isLoading ? "…" : value}
                  </strong>
                </div>
              </CurrencyTooltip>
            ))}
          </section>

          <section className="rounded-[16px] border border-[#dce9e2] bg-[#f5faf7] px-5 py-4 text-[10px] leading-7 text-[#526762]">
            {number(totals?.providerReportedRequests)} درخواست دارای شمارش توکن اعلام‌شده توسط سرویس و{" "}
            {number(totals?.estimatedRequests)} درخواست دارای شمارش تخمینی است. هزینه با نرخ‌های تنظیم‌شده برای هر یک
            میلیون توکن محاسبه می‌شود؛ نرخ صفر یعنی قیمت آن مدل هنوز تنظیم نشده است.
          </section>

          <div className="grid grid-cols-2 items-start gap-5 max-[900px]:grid-cols-1">
            <UsageTable
              title="تفکیک بر اساس مدل"
              dollarRateRials={aiSettings.data?.current.dollarRateRials}
              rows={(query.data?.byModel ?? []).map((item) => ({
                key: `${item.provider}/${item.model}`,
                label: item.model,
                detail: item.provider,
                ...item,
              }))}
            />
            <UsageTable
              title="تفکیک بر اساس عملیات"
              dollarRateRials={aiSettings.data?.current.dollarRateRials}
              rows={(query.data?.byOperation ?? []).map((item) => ({
                key: item.operation,
                label: operationLabels[item.operation] ?? item.operation,
                detail: item.operation,
                ...item,
              }))}
            />
          </div>

          <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
            <h2 className="m-0 border-b border-[#edf1ee] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">
              آخرین درخواست‌های مدل
            </h2>
            <DataTable
              columns={recentColumns}
              rows={query.data?.recentRequests.items ?? []}
              getRowKey={(row) => row.id}
              loading={query.isLoading}
              error={query.error}
              retrying={query.isFetching}
              onRetry={() => void query.refetch()}
              sort={sort}
              onSortChange={(next) => {
                void setFilters({ sortBy: next?.key ?? "", sortDirection: next?.direction ?? "" });
                setPage(1);
              }}
              minWidthClassName="min-w-[900px]"
              footer={
                <AdminTablePagination
                  page={page}
                  pageSize={pageSize}
                  total={query.data?.recentRequests.total ?? 0}
                  pageSizeSaving={pageSizeSaving}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              }
            />
          </section>
        </>
      )}
    </div>
  );
}

function UsageTable({
  title,
  dollarRateRials,
  rows,
}: {
  title: string;
  dollarRateRials?: number | null;
  rows: Array<{
    key: string;
    label: string;
    detail: string;
    requests: number;
    totalTokens: number;
    estimatedCostMicros: number;
  }>;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
      <h2 className="m-0 border-b border-[#edf1ee] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">{title}</h2>
      {rows.length ? (
        <div className="grid gap-3 p-3 min-[681px]:block min-[681px]:divide-y min-[681px]:divide-[#edf1ee] min-[681px]:p-0">
          <div className="hidden grid-cols-[1.4fr_.8fr_1fr_.7fr] items-center gap-2 bg-[#f8faf8] px-5 py-2 text-[9px] font-bold text-[#84918e] min-[681px]:grid">
            <span>مدل / عملیات</span>
            <span className="text-center">درخواست</span>
            <span className="text-center">توکن</span>
            <span className="text-left">هزینه</span>
          </div>
          {rows.map((row) => (
            <article
              className="grid grid-cols-2 items-center gap-3 rounded-[14px] border border-[#e1e8e3] bg-white p-4 shadow-[0_7px_20px_rgba(27,63,54,.045)] min-[681px]:grid-cols-[1.4fr_.8fr_1fr_.7fr] min-[681px]:gap-2 min-[681px]:rounded-none min-[681px]:border-0 min-[681px]:px-5 min-[681px]:py-3 min-[681px]:shadow-none"
              key={row.key}
            >
              <div className="col-span-2 flex min-w-0 items-baseline gap-2 min-[681px]:col-span-1">
                <strong className="min-w-0 truncate text-[11px] text-[#253d39]">{row.label}</strong>
                <small className="min-w-0 truncate text-[9px] text-[#8b9895]" dir="ltr">
                  {row.detail}
                </small>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3 min-[681px]:block min-[681px]:border-0 min-[681px]:pt-0 min-[681px]:text-center">
                <small className="text-[9px] font-bold text-[#84918e] min-[681px]:hidden">درخواست</small>
                <span className="whitespace-nowrap text-[10px] text-[#63736f]">{number(row.requests)} درخواست</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3 min-[681px]:block min-[681px]:border-0 min-[681px]:pt-0 min-[681px]:text-center">
                <small className="text-[9px] font-bold text-[#84918e] min-[681px]:hidden">توکن</small>
                <span className="whitespace-nowrap text-[10px] text-[#63736f]">{number(row.totalTokens)} توکن</span>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3 min-[681px]:col-span-1 min-[681px]:block min-[681px]:border-0 min-[681px]:pt-0 min-[681px]:text-left">
                <small className="text-[9px] font-bold text-[#84918e] min-[681px]:hidden">هزینه</small>
                <CurrencyTooltip
                  amount={row.estimatedCostMicros}
                  dollarRateRials={dollarRateRials}
                  className="inline-flex"
                >
                  <strong className="whitespace-nowrap text-[11px] text-[#0f7b62]" dir="ltr">
                    {usd(row.estimatedCostMicros)}
                  </strong>
                </CurrencyTooltip>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="m-0 px-5 py-10 text-center text-[10px] text-[#8a9794]">در این بازه مصرفی ثبت نشده است.</p>
      )}
    </section>
  );
}
