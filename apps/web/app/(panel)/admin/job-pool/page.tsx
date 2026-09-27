"use client";

import { Activity, BriefcaseBusiness, CircleDollarSign, Database, Info, Search, ServerCog } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/app/_components/auth";
import { SearchableSelect } from "@/app/_components/searchable-select";
import { RangeInput } from "@/app/_components/range-input";
import { PersianDateTime } from "@/lib/date-time-display";
import { formatGroupedNumericText } from "@/lib/fa-number";
import { type AdminJobPoolListing, type AdminJobPoolReport, useAdminAiSettings, useAdminJobPoolListings, useAdminJobPoolReport } from "@/lib/admin-stats";
import { useUrlTablePagination } from "@/lib/table-page-size";
import { modelUsageDaysParser, tableOptionalFilterParser, tableQueryStateOptions, tableSearchParser, tableSortByParser, tableSortDirectionParser } from "@/lib/table-search-params";
import { DataTable, type DataTableColumn, type SortState } from "../../_components/data-table";
import { PanelLink } from "../../_components/panel-link";
import { Modal } from "../../_components/ui";
import { AdminFilterSelect, AdminTablePagination, AdminTableToolbar } from "../_components/admin-table-controls";

const parsers = {
  days: modelUsageDaysParser, search: tableSearchParser, location: tableOptionalFilterParser,
  salaryMin: tableOptionalFilterParser, salaryMax: tableOptionalFilterParser,
  salaryCurrency: tableOptionalFilterParser,
  sortBy: tableSortByParser, sortDirection: tableSortDirectionParser,
};
const number = (value = 0) => value.toLocaleString("fa-IR");
const usd = (micros = 0) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(micros / 1_000_000);
const dateTime = (value: string | null) => value ? <PersianDateTime value={value} /> : "—";
const apifyText = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map((item) => typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)).join("، ") || "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};
const apifyField = (row: AdminJobPoolListing, key: string) => apifyText(row.rawPayload?.[key]);
const apifyFieldLabels: Record<string, string> = {
  dynamicFilterMatch: "تطبیق فیلتر پویا", jobTitle: "عنوان شغل", companyName: "نام شرکت", companyLogo: "لوگوی شرکت", location: "موقعیت مکانی",
  salaryInfo: "اطلاعات حقوق", contractType: "نوع قرارداد", experienceLevel: "سطح تجربه", yearsOfExperience: "سال‌های تجربه", jobId: "شناسه آگهی",
  jobUrl: "لینک آگهی", companyUrl: "لینک شرکت", jobDescription: "توضیحات شغلی", description: "توضیحات", skills: "مهارت‌ها",
  postedTime: "زمان انتشار", publishedAt: "تاریخ انتشار", searchString: "عبارت جست‌وجو", searchUrl: "لینک جست‌وجو", workplaceType: "نوع محل کار",
  workType: "نوع محل کار", employmentType: "نوع همکاری", jobType: "نوع شغل", seniorityLevel: "سطح ارشدیت", company: "شرکت",
};
const apifyFieldLabel = (key: string) => apifyFieldLabels[key] ?? "اطلاعات تکمیلی";
const apifyValue = (value: unknown): ReactNode => {
  if (typeof value === "string" && /^https?:\/\/\S+$/i.test(value.trim())) {
    return <PanelLink className="break-all text-[#0f7b62]" href={value} external>{value}</PanelLink>;
  }
  if (Array.isArray(value)) return <div className="grid gap-1">{value.map((item, index) => <div key={index}>{apifyValue(item)}</div>)}</div>;
  if (value && typeof value === "object") return <div className="grid gap-2">{Object.entries(value).map(([key, item]) => <div key={key}><strong className="ml-2 text-[#536562]">{apifyFieldLabel(key)}:</strong>{apifyValue(item)}</div>)}</div>;
  return String(value ?? "—");
};
const apifyLogo = (row: AdminJobPoolListing) => {
  const value = row.rawPayload?.companyLogo;
  return typeof value === "string" && /^https?:\/\//i.test(value) ? value : null;
};
const summarizeRunError = (value: string | null) => {
  if (!value) return "—";
  if (value.includes("job_listings") || value.includes("invalid input syntax")) return "خطای ثبت آگهی در دیتابیس";
  return value.length > 90 ? `${value.slice(0, 90)}…` : value;
};

export default function AdminJobPoolPage() {
  const { user } = useAuth();
  const [{ days, search, location, salaryMin, salaryMax, salaryCurrency, sortBy, sortDirection }, setFilters] = useQueryStates(
    parsers, { ...tableQueryStateOptions, urlKeys: { search: "q", location: "loc", salaryMin: "minSalary", salaryMax: "maxSalary", salaryCurrency: "currency" } },
  );
  const { page, pageSize, setPage, setPageSize, isSaving } = useUrlTablePagination();
  const sort: SortState = sortBy && (sortDirection === "asc" || sortDirection === "desc") ? { key: sortBy, direction: sortDirection } : null;
  const report = useAdminJobPoolReport(user?.role === "superadmin", days);
  const jobs = useAdminJobPoolListings(user?.role === "superadmin", { query: search, location, salaryMin: salaryMin ? Number(salaryMin) : undefined, salaryMax: salaryMax ? Number(salaryMax) : undefined, salaryCurrency, page, pageSize, sortBy, sortDirection });
  const aiSettings = useAdminAiSettings(user?.role === "superadmin");
  const [detailsJob, setDetailsJob] = useState<AdminJobPoolListing | null>(null);
  if (user?.role !== "superadmin") return null;

  const totals = report.data?.totals;
  const activeFilterCount = Number(Boolean(location)) + Number(Boolean(salaryMin)) + Number(Boolean(salaryMax)) + Number(Boolean(salaryCurrency));
  const toman = (totals?.estimatedCostUsdMicros ?? 0) / 1_000_000 * (aiSettings.data?.current.dollarRateRials ?? 0);
  const cards = [
    ["جست‌وجوهای اجراشده", number(totals?.searches), Search], ["رکورد دریافت‌شده", number(totals?.received), Database], ["آگهی جدید", number(totals?.inserted), BriefcaseBusiness], ["آگهی به‌روزشده", number(totals?.updated), Activity], ["آگهی فعال", number(totals?.activeJobs), ServerCog], ["هزینه تخمینی", usd(totals?.estimatedCostUsdMicros), CircleDollarSign],
  ] as const;
  const runColumns: DataTableColumn<AdminJobPoolReport["runs"][number]>[] = [
    { key: "status", title: "وضعیت", render: (row) => <div className="grid gap-0.5"><span className={row.status === "completed" ? "font-bold text-[#14705a]" : row.status === "failed" ? "font-bold text-[#b65343]" : "font-bold text-[#a36a17]"}>{row.status === "completed" ? "موفق" : row.status === "failed" ? "ناموفق" : "در حال اجرا"}</span>{row.errorMessage && <small className="block max-w-[220px] truncate text-[8px] font-normal text-[#b65343]" title={summarizeRunError(row.errorMessage)}>{summarizeRunError(row.errorMessage)}</small>}</div> },
    { key: "searches", title: "جست‌وجو", render: (row) => number(row.searchCount) }, { key: "received", title: "دریافت‌شده", render: (row) => number(row.receivedCount) }, { key: "new", title: "جدید / بروزرسانی", render: (row) => `${number(row.insertedCount)} / ${number(row.updatedCount)}` }, { key: "cost", title: "هزینه", render: (row) => <bdi dir="ltr">{usd(row.estimatedCostUsdMicros)}</bdi> },
    { key: "date", title: "تاریخ و ساعت", render: (row) => dateTime(row.startedAt) },
  ];
  const jobColumns: DataTableColumn<AdminJobPoolListing>[] = [
    { key: "company", title: "شرکت", render: (row) => { const logo = apifyLogo(row); return <div className="flex min-w-[170px] items-center gap-2"><span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded bg-[#f3f6f4]">{logo ? <img className="size-full object-contain" src={logo} alt={`لوگوی ${row.companyName}`} loading="lazy" /> : <BriefcaseBusiness size={15} className="text-[#8b9a95]" />}</span><span className="font-semibold">{row.companyName}</span></div>; } },
    { key: "title", title: "عنوان شغل", className: "font-bold text-[#253d39]", render: (row) => <PanelLink className="text-[#0f7b62]" href={row.canonicalUrl} external>{row.title}</PanelLink> },
    { key: "location", title: "موقعیت مکانی", render: (row) => row.location || "—" },
    { key: "salary", title: "بازه حقوق", render: (row) => <div className="grid gap-1"><bdi dir="ltr">{formatGroupedNumericText(row.salaryText || apifyField(row, "salaryInfo"))}</bdi><span className="text-[8px] font-bold text-[#70817b]">{row.salaryPeriod === "monthly" ? "ماهانه" : row.salaryPeriod === "yearly" ? "سالانه" : "دوره نامشخص"}</span></div> },
    { key: "date", title: "تاریخ انتشار", render: (row) => dateTime(row.postedAt) },
    { key: "details", title: "عملیات", sortable: false, render: (row) => <button aria-label={`مشاهده جزئیات ${row.title}`} className="inline-grid size-8 place-items-center rounded-lg border border-[#b9d9cc] bg-[#f4faf7] text-[#0f705a] transition hover:bg-[#e5f4ed]" title="مشاهده جزئیات" type="button" onClick={() => setDetailsJob(row)}><Info size={14} /></button> },
  ];
  return <div className="grid gap-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><span className="flex items-center gap-2 text-[12px] font-bold text-[#0f7b62]"><BriefcaseBusiness size={18} /> گزارش Job Pool و Apify</span><h1 className="mb-0 mt-3 text-[25px] font-black text-[#19312f]">پایش دریافت و آگهی‌های شغلی</h1><p className="mb-0 mt-2 text-[10px] leading-7 text-[#7c8b88]">هزینه، جست‌وجوها، اجرای Worker و آگهی‌های ذخیره‌شده در یک‌جا.</p></div><label className="grid gap-1 text-[9px] font-bold text-[#7c8b88]">بازه گزارش<SearchableSelect options={[{ value: "7", label: "۷ روز" }, { value: "30", label: "۳۰ روز" }, { value: "90", label: "۹۰ روز" }]} value={String(days)} onChange={(value) => void setFilters({ days: Number(value) as typeof days })} /></label></header>
    <section className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[520px]:grid-cols-1">{cards.map(([label, value, Icon]) => <article className="group relative flex items-center gap-3 rounded-[15px] border border-[#e3e9e3] bg-white p-4 shadow-[0_8px_24px_rgba(30,61,53,.05)]" key={label}><span className="grid size-10 place-items-center rounded-[11px] bg-[#eaf5f0] text-[#0f7b62]"><Icon size={18} /></span><div><small className="block text-[9px] font-semibold text-[#81908d]">{label}</small><strong className="mt-1 block text-[17px] font-black text-[#19312f]" dir={label === "هزینه تخمینی" ? "ltr" : undefined}>{report.isLoading ? "…" : value}</strong></div>{label === "هزینه تخمینی" && <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2 whitespace-nowrap rounded-xl border border-[#28594d] bg-[#19312f] px-3 py-2 text-center text-[10px] text-white opacity-0 shadow-[0_10px_30px_rgba(25,49,47,.2)] transition-opacity group-hover:opacity-100">معادل تومان: {aiSettings.data?.current.dollarRateRials ? `${toman.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} تومان` : "نرخ دلار ثبت نشده است."}</div>}</article>)}</section>
    <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white"><h2 className="m-0 border-b border-[#edf1ee] px-5 py-4 text-[13px] font-extrabold text-[#19312f]">تاریخچه اجراهای Apify</h2><DataTable columns={runColumns} rows={report.data?.runs ?? []} getRowKey={(row) => row.id} loading={report.isLoading} error={report.error} retrying={report.isFetching} onRetry={() => void report.refetch()} minWidthClassName="min-w-[900px]" /></section>
    <section className="overflow-hidden rounded-[18px] border border-[#e3e9e3] bg-white"><div className="border-b border-[#edf1ee] px-5 py-4"><h2 className="m-0 text-[13px] font-extrabold text-[#19312f]">آگهی‌های دریافت‌شده</h2><p className="mb-0 mt-1 text-[9px] text-[#81908d]">فیلتر براساس موقعیت شغلی، محل کار و حقوق اعلام‌شده.</p></div><AdminTableToolbar search={search} searchPlaceholder="پوزیشن کاری" activeFilterCount={activeFilterCount} onSearch={(value) => { void setFilters({ search: value }); setPage(1); }} onResetFilters={() => { void setFilters({ location: "", salaryMin: "", salaryMax: "", salaryCurrency: "" }); setPage(1); }}><label className="grid gap-1.5 text-[8px] font-bold text-[#74837f]">لوکیشن<input className="h-10 rounded-[10px] border border-[#dfe6e0] bg-white px-3 text-[9px] text-[#405753] outline-none" value={location} onChange={(event) => { void setFilters({ location: event.target.value }); setPage(1); }} placeholder="مثلاً Remote" /></label><RangeInput label="بازه حقوق" minValue={salaryMin} maxValue={salaryMax} inputMode="numeric" onMinChange={(value) => { void setFilters({ salaryMin: value.replace(/\D/g, "") }); setPage(1); }} onMaxChange={(value) => { void setFilters({ salaryMax: value.replace(/\D/g, "") }); setPage(1); }} /><AdminFilterSelect label="ارز" value={salaryCurrency} options={[{ value: "", label: "همه ارزها" }, { value: "USD", label: "دلار" }, { value: "EUR", label: "یورو" }, { value: "GBP", label: "پوند" }]} onChange={(value) => { void setFilters({ salaryCurrency: value }); setPage(1); }} /></AdminTableToolbar><DataTable columns={jobColumns} rows={jobs.data?.items ?? []} getRowKey={(row) => row.id} loading={jobs.isLoading} error={jobs.error} retrying={jobs.isFetching} onRetry={() => void jobs.refetch()} filtered={Boolean(search || activeFilterCount)} sort={sort} onSortChange={(next) => { void setFilters({ sortBy: next?.key ?? "", sortDirection: next?.direction ?? "" }); setPage(1); }} minWidthClassName="min-w-[900px]" footer={<AdminTablePagination page={page} pageSize={pageSize} total={jobs.data?.total ?? 0} pageSizeSaving={isSaving} onPageChange={setPage} onPageSizeChange={setPageSize} />} /></section>
    {detailsJob && <Modal title="جزئیات کامل آگهی" description={detailsJob.title} onClose={() => setDetailsJob(null)} wide showCloseButton><div className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(detailsJob.rawPayload).map(([key, value]) => <div className="rounded-xl border border-[#e3e9e3] bg-[#fbfcfa] p-3" key={key}><strong className="block text-[10px] font-bold text-[#536562]">{apifyFieldLabel(key)}</strong><div className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-6 text-[#19312f]" dir="ltr">{apifyValue(value)}</div></div>)}</div></Modal>}
  </div>;
}
