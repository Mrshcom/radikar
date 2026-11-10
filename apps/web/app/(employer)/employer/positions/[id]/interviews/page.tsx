"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, RefreshCw } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/app/(panel)/_components/data-table";
import { TableActionButton } from "@/app/(panel)/_components/table-action-button";
import { Modal, SectionTitle } from "@/app/(panel)/_components/ui";
import { PersianDateTime } from "@/lib/date-time-display";
import { useEmployerPosition, type EmployerCandidate } from "@/lib/employer";

type InvitationFilter = "all" | "waiting" | "started" | "completed" | "expired";

const invitationStates: Record<EmployerCandidate["invitationStatus"], { label: string; className: string }> = {
  not_invited: { label: "دعوت نشده", className: "bg-[#f1f4f1] text-[#687a70]" },
  invited: { label: "لینک دعوت ساخته شد", className: "bg-[#fff2dc] text-[#946b26]" },
  accepted: { label: "دعوت پذیرفته شد", className: "bg-[#eaf2ff] text-[#486f9c]" },
  started: { label: "در حال مصاحبه", className: "bg-[#e9f3fc] text-[#356f9a]" },
  completed: { label: "مصاحبه تکمیل شد", className: "bg-[#e5f4ec] text-[#0f7b62]" },
  expired: { label: "مهلت دعوت گذشت", className: "bg-[#fff0ed] text-[#b2513e]" },
};

function candidateLabel(candidate: EmployerCandidate) {
  return candidate.name || candidate.fileName;
}

function tookPart(candidate: EmployerCandidate) {
  return (
    candidate.invitationStatus === "started" ||
    candidate.invitationStatus === "completed" ||
    Boolean(candidate.interviewAnswers?.some((answer) => answer.trim()))
  );
}

export default function EmployerInterviewResultsPage() {
  const { id } = useParams<{ id: string }>();
  const detail = useEmployerPosition(id, 15_000);
  const [filter, setFilter] = useState<InvitationFilter>("all");
  const [reportId, setReportId] = useState<string | null>(null);
  const position = detail.data?.position;
  const invited = (detail.data?.candidates ?? []).filter((candidate) => candidate.invitationStatus !== "not_invited");
  const startedCount = invited.filter(tookPart).length;
  const completedCount = invited.filter((candidate) => candidate.invitationStatus === "completed").length;
  const waitingCount = invited.filter((candidate) =>
    ["invited", "accepted"].includes(candidate.invitationStatus),
  ).length;
  const expiredCount = invited.filter((candidate) => candidate.invitationStatus === "expired").length;
  const rows = invited
    .filter((candidate) => {
      if (filter === "waiting") return ["invited", "accepted"].includes(candidate.invitationStatus);
      if (filter === "started") return tookPart(candidate);
      if (filter === "completed") return candidate.invitationStatus === "completed";
      if (filter === "expired") return candidate.invitationStatus === "expired";
      return true;
    })
    .sort((left, right) => {
      const leftScore = left.interviewReport?.score;
      const rightScore = right.interviewReport?.score;
      if (leftScore === undefined && rightScore === undefined)
        return candidateLabel(left).localeCompare(candidateLabel(right), "fa");
      if (leftScore === undefined) return 1;
      if (rightScore === undefined) return -1;
      return rightScore - leftScore;
    });
  const reportCandidate = invited.find((candidate) => candidate.id === reportId);
  const filters: Array<{ key: InvitationFilter; label: string; count: number }> = [
    { key: "all", label: "همه", count: invited.length },
    { key: "waiting", label: "در انتظار", count: waitingCount },
    { key: "started", label: "شرکت‌کرده", count: startedCount },
    { key: "completed", label: "تکمیل‌شده", count: completedCount },
    { key: "expired", label: "مهلت‌گذشته", count: expiredCount },
  ];
  const columns: DataTableColumn<EmployerCandidate>[] = [
    {
      key: "name",
      title: "نامزد",
      render: (candidate) => (
        <div className="min-w-0">
          <strong className="block text-sm text-[#19312f]">{candidateLabel(candidate)}</strong>
          <span className="mt-1 block truncate text-xs text-[#82958a]" dir="auto">
            {candidate.fileName}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      title: "وضعیت مصاحبه",
      sortable: false,
      render: (candidate) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${invitationStates[candidate.invitationStatus].className}`}
        >
          {invitationStates[candidate.invitationStatus].label}
        </span>
      ),
    },
    {
      key: "deadline",
      title: "مهلت دعوت",
      sortable: false,
      render: (candidate) =>
        candidate.invitationDeadline ? <PersianDateTime value={candidate.invitationDeadline} /> : "—",
    },
    {
      key: "score",
      title: "نمرهٔ مصاحبه",
      render: (candidate) =>
        candidate.interviewReport ? (
          <strong className="text-[#0f7b62]">{candidate.interviewReport.score.toLocaleString("fa-IR")} از ۱۰۰</strong>
        ) : (
          <span className="text-[#82958a]">—</span>
        ),
    },
    {
      key: "actions",
      title: "گزارش",
      sortable: false,
      render: (candidate) =>
        candidate.interviewReport ? (
          <TableActionButton
            label={`مشاهدهٔ گزارش ${candidateLabel(candidate)}`}
            onClick={() => setReportId(candidate.id)}
          >
            <Eye size={15} aria-hidden="true" />
          </TableActionButton>
        ) : (
          <span className="text-xs text-[#82958a]">هنوز آماده نیست</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-1 text-xs font-bold text-[#0f7b62]"
        href={`/employer/positions/${id}`}
      >
        <ArrowRight size={15} aria-hidden="true" /> بازگشت به پوزیشن
      </Link>
      <SectionTitle
        title="پیگیری مصاحبه‌ها"
        description={position ? `وضعیت دعوت و نتیجهٔ مصاحبه‌های پوزیشن «${position.title}»` : undefined}
        action={
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe3d8] bg-white px-4 text-xs font-bold text-[#0f7b62] disabled:opacity-50"
            disabled={detail.isFetching}
            onClick={() => void detail.refetch()}
          >
            <RefreshCw size={15} aria-hidden="true" /> به‌روزرسانی
          </button>
        }
      />
      <p className="m-0 text-xs leading-6 text-[#71877a]">
        «لینک دعوت ساخته شد» به معنی ارسال خودکار آن نیست؛ لینک را باید برای نامزد بفرستی. وضعیت‌ها هر ۱۵ ثانیه به‌روز
        می‌شوند.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "لینک دعوت ساخته‌شده", value: invited.length },
          { label: "شرکت‌کرده در مصاحبه", value: startedCount },
          { label: "مصاحبهٔ تکمیل‌شده", value: completedCount },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#dfe9e3] bg-white p-5">
            <span className="block text-xs text-[#6b8174]">{item.label}</span>
            <strong className="mt-2 block text-2xl text-[#19312f]">{item.value.toLocaleString("fa-IR")}</strong>
          </div>
        ))}
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#dfe9e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6ede8] p-5">
          <h2 className="m-0 text-base font-bold text-[#19312f]">فهرست دعوت‌ها و نتایج</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="فیلتر وضعیت مصاحبه">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-pressed={filter === item.key}
                onClick={() => setFilter(item.key)}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${filter === item.key ? "bg-[#0f7b62] text-white" : "bg-[#f2f7f3] text-[#587267] hover:bg-[#e7f1e9]"}`}
              >
                {item.label} · {item.count.toLocaleString("fa-IR")}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(candidate) => candidate.id}
          loading={detail.isLoading}
          error={detail.error}
          retrying={detail.isFetching}
          onRetry={() => void detail.refetch()}
          filtered={filter !== "all"}
          minWidthClassName="min-w-[760px]"
        />
      </section>
      {reportCandidate?.interviewReport && (
        <Modal
          title={`گزارش مصاحبهٔ ${candidateLabel(reportCandidate)}`}
          onClose={() => setReportId(null)}
          wide
          showCloseButton
        >
          <div className="mt-5 space-y-5 text-right text-sm leading-7 text-[#415b50]">
            <div className="rounded-xl bg-[#edf8f1] p-4">
              <strong className="text-[#0f7b62]">
                نمرهٔ مصاحبه: {reportCandidate.interviewReport.score.toLocaleString("fa-IR")} از ۱۰۰
              </strong>
              <p className="mb-0 mt-2 whitespace-pre-wrap">{reportCandidate.interviewReport.summary}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#dfe9e3] p-4">
                <h3 className="m-0 text-sm font-bold text-[#19312f]">نقاط قوت</h3>
                <ul className="mb-0 mt-2 list-disc space-y-1 pr-5">
                  {reportCandidate.interviewReport.strengths.length ? (
                    reportCandidate.interviewReport.strengths.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))
                  ) : (
                    <li>موردی ثبت نشده است.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-[#dfe9e3] p-4">
                <h3 className="m-0 text-sm font-bold text-[#19312f]">فرصت‌های بهبود</h3>
                <ul className="mb-0 mt-2 list-disc space-y-1 pr-5">
                  {reportCandidate.interviewReport.improvements.length ? (
                    reportCandidate.interviewReport.improvements.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))
                  ) : (
                    <li>موردی ثبت نشده است.</li>
                  )}
                </ul>
              </div>
            </div>
            <div>
              <h3 className="m-0 text-sm font-bold text-[#19312f]">پرسش‌ها و پاسخ‌های ثبت‌شده</h3>
              <ol className="mb-0 mt-3 space-y-3">
                {(reportCandidate.interviewAnswers ?? []).map((answer, index) => (
                  <li key={index} className="rounded-xl border border-[#e2ebe4] p-4">
                    <strong className="block text-[#19312f]">
                      {reportCandidate.conversationQuestions?.[index] || position?.interviewQuestions?.[index] || `سؤال ${index + 1}`}
                    </strong>
                    <p className="mb-0 mt-2 whitespace-pre-wrap">{answer || "پاسخی ثبت نشده است."}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
