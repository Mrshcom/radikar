"use client";

import { useState } from "react";
import { Clock3, History, LogIn, LogOut, MapPin, MonitorSmartphone, RefreshCw } from "lucide-react";
import { useAuth } from "@/app/_components/auth";
import { ConfirmActionModal } from "../_components/ui";
import { PersianDateTime } from "@/lib/date-time-display";
import { type AccountSession, useAccountSessions, useRevokeAccountSession } from "@/lib/account-security";
import { DataTable, type DataTableColumn } from "../_components/data-table";
import { PanelPageTitle } from "../_components/panel-page-title";
import { TablePagination } from "../_components/table-pagination";

const sessionStatus: Record<AccountSession["status"], string> = {
  active: "فعال",
  logged_out: "خروج انجام‌شده",
  expired: "منقضی‌شده",
};

function IpAddress({ value }: { value: string | null }) {
  return (
    <bdi className="font-normal text-[#405753]" dir="ltr">
      {value || "ثبت نشده"}
    </bdi>
  );
}

export default function SettingsPage() {
  const [securityTab, setSecurityTab] = useState<"active" | "history">("active");
  const [sessionToRevoke, setSessionToRevoke] = useState<AccountSession | null>(null);
  const { user } = useAuth();
  const sessions = useAccountSessions(Boolean(user));
  const revokeSession = useRevokeAccountSession();
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const activeSessions = sessions.data?.sessions.filter((session) => session.status === "active") ?? [];
  const historyRows = sessions.data?.sessions ?? [];
  const historyTotalPages = Math.max(1, Math.ceil(historyRows.length / historyPageSize));
  const visibleHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyStart = (visibleHistoryPage - 1) * historyPageSize;
  const historyPageRows = historyRows.slice(historyStart, historyStart + historyPageSize);

  const historyColumns: DataTableColumn<AccountSession>[] = [
    {
      key: "status",
      title: "وضعیت",
      render: (session) => (
        <span
          className={`inline-flex rounded-md px-2 py-1 text-[9px] ${session.status === "active" ? "bg-[#eaf5f0] text-[#0f705a]" : "bg-[#f1f3f1] text-[#687873]"}`}
        >
          {sessionStatus[session.status]}
          {session.current ? " · فعلی" : ""}
        </span>
      ),
      sortable: false,
    },
    {
      key: "login",
      title: "ورود",
      render: (session) => (
        <div className="grid gap-1 text-[9px] text-[#74847f]">
          <span className="flex items-center gap-1 text-[#405753]">
            <LogIn size={13} className="text-[#0f7b62]" />
            <PersianDateTime value={session.createdAt} />
          </span>
          <span>
            IP: <IpAddress value={session.loginIp} />
          </span>
        </div>
      ),
      sortable: false,
    },
    {
      key: "logout",
      title: "پایان نشست",
      render: (session) => (
        <div className="grid gap-1 text-[9px] text-[#74847f]">
          <span className="flex items-center gap-1 text-[#405753]">
            <LogOut size={13} className="text-[#a35a4d]" />
            {session.endedAt ? <PersianDateTime value={session.endedAt} /> : "هنوز فعال است"}
          </span>
          <span>
            IP: <IpAddress value={session.logoutIp} />
          </span>
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PanelPageTitle description="نشست‌های فعال و تاریخچه ورود به حساب خودت را مدیریت کن." title="امنیت و ورود" />

      <section className="overflow-hidden rounded-[20px] border border-[#e3e9e3] bg-white">
        <div
          className="grid grid-cols-2 gap-1 border-b border-[#edf0ec] bg-[#f7faf8] p-2"
          role="tablist"
          aria-label="نشست‌ها و تاریخچه ورود"
        >
          <button
            aria-selected={securityTab === "active"}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-4 text-[11px] transition-colors ${securityTab === "active" ? "bg-white font-bold text-[#0f7b62] shadow-[0_3px_12px_rgba(25,49,47,.07)]" : "font-normal text-[#71817d] hover:bg-white/70"}`}
            onClick={() => setSecurityTab("active")}
            role="tab"
            type="button"
          >
            <MonitorSmartphone size={16} />
            نشست‌های فعال
            <span className="rounded-md bg-[#eaf5f0] px-2 py-0.5 text-[9px] font-normal text-[#0f705a]">
              {activeSessions.length.toLocaleString("fa-IR")}
            </span>
          </button>
          <button
            aria-selected={securityTab === "history"}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-[12px] px-4 text-[11px] transition-colors ${securityTab === "history" ? "bg-white font-bold text-[#0f7b62] shadow-[0_3px_12px_rgba(25,49,47,.07)]" : "font-normal text-[#71817d] hover:bg-white/70"}`}
            onClick={() => setSecurityTab("history")}
            role="tab"
            type="button"
          >
            <History size={16} />
            تاریخچه ورود و خروج
          </button>
        </div>

        {securityTab === "active" ? (
          <div role="tabpanel">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf0ec] px-6 py-5">
              <div>
                <h2 className="m-0 flex items-center gap-2 text-[14px] font-extrabold text-[#19312f]">
                  <MonitorSmartphone className="text-[#0f7b62]" size={18} /> نشست‌های فعال
                </h2>
                <p className="mb-0 mt-1 text-[9px] text-[#82908d]">
                  نشست‌هایی که هنوز معتبر هستند و به حساب دسترسی دارند.
                </p>
              </div>
              <span className="rounded-lg bg-[#eaf5f0] px-2.5 py-1 text-[10px] text-[#0f705a]">
                {activeSessions.length.toLocaleString("fa-IR")} نشست
              </span>
            </div>
            <div className="grid gap-3 p-4">
              {sessions.isLoading ? (
                <p className="m-0 p-5 text-center text-[10px] text-[#81908d]">در حال دریافت نشست‌ها...</p>
              ) : null}
              {sessions.isError ? (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#fff7f5] p-4 text-[10px] text-[#a34e45]">
                  <span>دریافت نشست‌های حساب ناموفق بود.</span>
                  <button
                    className="inline-flex items-center gap-1 font-bold"
                    onClick={() => void sessions.refetch()}
                    type="button"
                  >
                    <RefreshCw size={13} /> تلاش مجدد
                  </button>
                </div>
              ) : null}
              {!sessions.isLoading && !sessions.isError && activeSessions.length === 0 ? (
                <p className="m-0 p-5 text-center text-[10px] text-[#81908d]">نشست فعالی ثبت نشده است.</p>
              ) : null}
              {activeSessions.map((session) => (
                <article
                  className="grid gap-3 rounded-[14px] bg-[#f7faf8] p-4 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center"
                  key={session.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-[10px] bg-[#e3f2ec] text-[#0f7b62]">
                      <MonitorSmartphone size={17} />
                    </span>
                    <div>
                      <strong className="block text-[11px] text-[#233d38]">
                        {session.current ? "همین دستگاه" : "نشست فعال"}
                      </strong>
                      <span className="mt-1 block text-[9px] text-[#7b8b86]">
                        آخرین فعالیت: <PersianDateTime value={session.lastSeenAt} />
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] leading-6 text-[#74847f]">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> IP ورود
                    </span>
                    <IpAddress value={session.loginIp} />
                  </div>
                  <div className="text-[9px] leading-6 text-[#74847f]">
                    <span className="flex items-center gap-1">
                      <Clock3 size={13} /> شروع نشست
                    </span>
                    <span className="font-normal text-[#405753]">
                      <PersianDateTime value={session.createdAt} />
                    </span>
                  </div>
                  {session.current ? (
                    <span className="inline-flex min-h-8 items-center justify-center rounded-lg bg-[#0f7b62] px-3 text-[9px] font-normal text-white">
                      فعلی
                    </span>
                  ) : (
                    <button
                      className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-[#efc9c5] bg-white px-3 text-[9px] font-normal text-[#a13f37] transition-colors hover:bg-[#fff7f5]"
                      onClick={() => setSessionToRevoke(session)}
                      type="button"
                    >
                      <LogOut size={13} /> پایان نشست
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div role="tabpanel">
            <div className="border-b border-[#edf0ec] px-6 py-5">
              <h2 className="m-0 flex items-center gap-2 text-[14px] font-extrabold text-[#19312f]">
                <History className="text-[#0f7b62]" size={18} /> تاریخچه ورود و خروج
              </h2>
              <p className="mb-0 mt-1 text-[9px] text-[#82908d]">آخرین ۱۰۰ نشست حساب همراه با IP ورود و پایان نشست.</p>
            </div>
            <DataTable
              columns={historyColumns}
              rows={historyPageRows}
              getRowKey={(session) => session.id}
              loading={sessions.isLoading}
              error={sessions.error}
              retrying={sessions.isFetching}
              onRetry={() => void sessions.refetch()}
              minWidthClassName="min-w-[680px]"
              footer={
                <TablePagination
                  page={visibleHistoryPage}
                  pageSize={historyPageSize}
                  total={historyRows.length}
                  onPageChange={setHistoryPage}
                  onPageSizeChange={(size) => {
                    setHistoryPageSize(size);
                    setHistoryPage(1);
                  }}
                />
              }
            />
          </div>
        )}
      </section>

      {sessionToRevoke ? (
        <ConfirmActionModal
          title="پایان نشست"
          description="آیا می‌خواهی این نشست از حساب خارج شود؟ دسترسی آن دستگاه بلافاصله قطع خواهد شد."
          confirmLabel="بله، پایان نشست"
          confirmIcon={<LogOut size={15} />}
          tone="danger"
          pending={revokeSession.isPending}
          onCancel={() => setSessionToRevoke(null)}
          onConfirm={() => {
            void revokeSession.mutateAsync(sessionToRevoke.id).then(() => setSessionToRevoke(null));
          }}
        />
      ) : null}
    </div>
  );
}
