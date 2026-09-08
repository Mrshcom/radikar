"use client";

import {
  Activity,
  Bot,
  CircleDollarSign,
  Clock3,
  Download,
  Gauge,
  RefreshCw,
  Send,
} from "lucide-react";
import { useQueryStates } from "nuqs";
import { useAuth } from "@/app/_components/auth";
import { DataTable, type DataTableColumn } from "../../_components/data-table";
import { AdminTablePagination } from "../_components/admin-table-controls";
import {
  useAdminAiSettings,
  useAdminModelUsage,
  type AdminModelUsageStats,
} from "@/lib/admin-stats";
import { useUrlTablePagination } from "@/lib/table-page-size";
import {
  createTableFilterParser,
  modelUsageDaysParser,
  tableQueryStateOptions,
} from "@/lib/table-search-params";

type RecentModelRequest = AdminModelUsageStats["recentRequests"]["items"][number];
const modelUsageFilterParsers = {
  days: modelUsageDaysParser,
  provider: createTableFilterParser(["freeDeepseekAPI", "gapgpt"] as const),
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `model-usage-${data.periodDays}-days.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminModelUsagePage() {
  const { user } = useAuth();
  const [{ days, provider }, setFilters] = useQueryStates(
    modelUsageFilterParsers,
    tableQueryStateOptions,
  );
  const { page, pageSize, setPage, setPageSize, isSaving: pageSizeSaving } =
    useUrlTablePagination();
  const query = useAdminModelUsage(user?.role === "superadmin", days, page, pageSize, provider);
  const aiSettings = useAdminAiSettings(user?.role === "superadmin");

  if (user?.role !== "superadmin") return null;

  const totals = query.data?.totals;
  const successRate = totals?.requests
    ? (totals.successfulRequests / totals.requests) * 100
    : 0;
  const cards = [
    { label: "درخواست‌های بازه", value: number(totals?.requests), icon: Send },
    { label: "درخواست‌های امروز", value: number(query.data?.today.requests), icon: Activity },
    { label: "توکن ورودی", value: number(totals?.inputTokens), icon: Download },
    { label: "توکن خروجی", value: number(totals?.outputTokens), icon: Bot },
    { label: "مجموع توکن", value: number(totals?.totalTokens), icon: Gauge },
    { label: "هزینه برآوردی", value: usd(totals?.estimatedCostMicros), icon: CircleDollarSign, ltr: true, tooltip: aiSettings.data?.current.dollarRateRials ? `${((totals?.estimatedCostMicros ?? 0) / 1_000_000 * aiSettings.data.current.dollarRateRials).toLocaleString("fa-IR", { maximumFractionDigits: 3 })} تومان` : "نرخ دلار تنظیم نشده است" },
    { label: "نرخ موفقیت", value: percent(successRate), icon: Activity },
    { label: "میانگین زمان پاسخ", value: `${number(totals?.averageDurationMs)} ms`, icon: Clock3, ltr: true },
  ];
  const recentColumns: DataTableColumn<RecentModelRequest>[] = [
    {
      key: "user",
      title: "حساب کاربری",
      className: "font-bold text-[#253d39]",
      render: (row) => (
        <span className="whitespace-nowrap" title={`${row.user.fullName || "کاربر بدون نام"} — ${row.user.phone}`}>
          {row.user.fullName || row.user.phone}
          {row.user.fullName ? <small className="mr-1 text-[8px] font-normal text-[#8b9895]">{row.user.phone}</small> : null}
        </span>
      ),
    },
    { key: "operation", title: "عملیات", render: (row) => operationLabels[row.operation] ?? row.operation },
    { key: "model", title: "مدل / Provider", render: (row) => <span className="inline-flex flex-col gap-0.5" dir="ltr" title={`${row.provider} / ${row.model}`}><strong>{row.model}</strong><small className="text-[8px] font-normal text-[#8b9895]">{row.provider}</small></span> },
    { key: "tokens", title: "توکن", className: "whitespace-nowrap", render: (row) => `${number(row.totalTokens)} توکن` },
    { key: "cost", title: "هزینه", className: "font-bold text-[#0f7b62]", render: (row) => <span dir="ltr">{usd(row.estimatedCostMicros)}</span> },
    {
      key: "status",
      title: "وضعیت",
      className: "font-bold",
      render: (row) => <span className={row.successful ? "text-[#14705a]" : "text-[#b65343]"}>{row.successful ? "موفق" : "ناموفق"}</span>,
    },
    { key: "date", title: "تاریخ و ساعت", className: "whitespace-nowrap", render: (row) => <time dateTime={row.createdAt}>{dateTime(row.createdAt)}</time> },
  ];

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]">
            <Bot size={18} /> پایش مصرف هوش مصنوعی
          </span>
          <h1 className="mb-0 mt-3 text-[25px] font-black text-[#19312f]">
            درخواست‌ها، توکن‌ها و هزینه مدل‌ها
          </h1>
          <p className="mb-0 mt-2 text-[10px] leading-7 text-[#7c8b88]">
            هر تماس واقعی با سرویس مدل، شامل تلاش‌های مجدد و درخواست‌های ناموفق، در این گزارش ثبت می‌شود.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="grid gap-1 text-[9px] font-bold text-[#7c8b88]">
            بازه گزارش
            <select aria-label="بازه گزارش" className="h-10 min-w-28 rounded-[10px] border border-[#dfe7e2] bg-white px-3 text-[10px] font-bold text-[#536762] outline-none focus:border-[#0f7b62]" value={days} onChange={(event) => { void setFilters({ days: Number(event.target.value) as typeof days }); setPage(1); }}>
              {[7, 30, 90].map((value) => <option key={value} value={value}>{number(value)} روز</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-[9px] font-bold text-[#7c8b88]">
            Provider
            <select aria-label="Provider" className="h-10 min-w-40 rounded-[10px] border border-[#dfe7e2] bg-white px-3 text-[10px] font-bold text-[#536762] outline-none focus:border-[#0f7b62]" value={provider} onChange={(event) => { void setFilters({ provider: event.target.value as typeof provider }); setPage(1); }}>
              <option value="">همه Providerها</option>
              <option value="freeDeepseekAPI">DeepSeek Local</option>
              <option value="gapgpt">GapGPT</option>
            </select>
          </label>
          <label className="grid gap-1 text-[9px] font-bold text-[#7c8b88]">
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
          <button className="mr-3 inline-flex items-center gap-1 font-bold" onClick={() => void query.refetch()} type="button">
            <RefreshCw size={13} /> تلاش مجدد
          </button>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-4 gap-4 max-[1180px]:grid-cols-3 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">
            {cards.map(({ label, value, icon: Icon, ltr, tooltip }) => (
              <article className="group relative flex items-center gap-3 rounded-[15px] border border-[#e3e9e3] bg-white p-4 shadow-[0_8px_24px_rgba(30,61,53,.05)]" key={label}>
                <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-[#eaf5f0] text-[#0f7b62]"><Icon size={18} /></span>
                <div className="min-w-0">
                  <small className="block text-[9px] font-semibold text-[#81908d]">{label}</small>
                  <strong className="mt-1 block truncate text-[18px] font-black text-[#19312f]" dir={ltr ? "ltr" : undefined}>{query.isLoading ? "…" : value}</strong>
                </div>
                {tooltip ? <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-max max-w-none -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border border-[#28594d] bg-[#19312f] px-3 py-2 text-center text-[10px] leading-5 text-white opacity-0 shadow-[0_10px_30px_rgba(25,49,47,.2)] transition-opacity group-hover:opacity-100">
                  <span className="font-bold text-[#b9ead6]">معادل تومان:</span>{" "}
                  {tooltip}
                </div> : null}
              </article>
            ))}
          </section>

          <section className="rounded-[16px] border border-[#dce9e2] bg-[#f5faf7] px-5 py-4 text-[10px] leading-7 text-[#526762]">
            {number(totals?.providerReportedRequests)} درخواست دارای شمارش توکن اعلام‌شده توسط سرویس و {number(totals?.estimatedRequests)} درخواست دارای شمارش تخمینی است. هزینه با نرخ‌های تنظیم‌شده برای هر یک میلیون توکن محاسبه می‌شود؛ نرخ صفر یعنی قیمت آن مدل هنوز تنظیم نشده است.
          </section>

          <div className="grid grid-cols-2 items-start gap-5 max-[900px]:grid-cols-1">
            <UsageTable
              title="تفکیک بر اساس مدل"
              rows={(query.data?.byModel ?? []).map((item) => ({
                key: `${item.provider}/${item.model}`,
                label: item.model,
                detail: item.provider,
                ...item,
              }))}
            />
            <UsageTable
              title="تفکیک بر اساس عملیات"
              rows={(query.data?.byOperation ?? []).map((item) => ({
                key: item.operation,
                label: operationLabels[item.operation] ?? item.operation,
                detail: item.operation,
                ...item,
              }))}
            />
          </div>

          <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white">
            <h2 className="m-0 border-b border-[#edf1ee] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">آخرین درخواست‌های مدل</h2>
            <DataTable
              columns={recentColumns}
              rows={query.data?.recentRequests.items ?? []}
              getRowKey={(row) => row.id}
              loading={query.isLoading}
              error={query.error}
              retrying={query.isFetching}
              onRetry={() => void query.refetch()}
              minWidthClassName="min-w-[900px]"
              footer={(
                <AdminTablePagination
                  page={page}
                  pageSize={pageSize}
                  total={query.data?.recentRequests.total ?? 0}
                  pageSizeSaving={pageSizeSaving}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            />
          </section>
        </>
      )}
    </div>
  );
}

function UsageTable({
  title,
  rows,
}: {
  title: string;
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
        <div className="divide-y divide-[#edf1ee]">
          <div className="grid grid-cols-[1.4fr_.8fr_1fr_.7fr] items-center gap-2 bg-[#f8faf8] px-5 py-2 text-[8px] font-bold text-[#84918e]">
            <span>مدل / عملیات</span>
            <span className="text-center">درخواست</span>
            <span className="text-center">توکن</span>
            <span className="text-left">هزینه</span>
          </div>
          {rows.map((row) => (
            <div className="grid grid-cols-[1.4fr_.8fr_1fr_.7fr] items-center gap-2 px-5 py-3" key={row.key}>
              <div className="flex min-w-0 items-baseline gap-2">
                <strong className="min-w-0 truncate text-[10px] text-[#253d39]">{row.label}</strong>
                <small className="min-w-0 truncate text-[8px] text-[#8b9895]" dir="ltr">{row.detail}</small>
              </div>
              <span className="whitespace-nowrap text-center text-[9px] text-[#63736f]">{number(row.requests)} درخواست</span>
              <span className="whitespace-nowrap text-center text-[9px] text-[#63736f]">{number(row.totalTokens)} توکن</span>
              <strong className="whitespace-nowrap text-left text-[10px] text-[#0f7b62]" dir="ltr">{usd(row.estimatedCostMicros)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 px-5 py-10 text-center text-[10px] text-[#8a9794]">در این بازه مصرفی ثبت نشده است.</p>
      )}
    </section>
  );
}
