"use client";

import { InterviewReportView } from "@/app/(panel)/interview/interview-result";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Eye, RefreshCw, Send } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/app/(panel)/_components/data-table";
import { TableActionButton } from "@/app/(panel)/_components/table-action-button";
import { Modal, SectionTitle } from "@/app/(panel)/_components/ui";
import { PersianDateTime } from "@/lib/date-time-display";
import { useEmployerPosition, useSetEmployerInterviewFeedbackSharing, type EmployerCandidate } from "@/lib/employer";

type InvitationFilter = "all" | "waiting" | "started" | "expired";

const invitationStates: Record<EmployerCandidate["invitationStatus"], { label: string; className: string }> = {
  not_invited: { label: "دعوت نشده", className: "bg-[#f1f4f1] text-[#687a70]" },
  invited: { label: "دعوت ارسال شد", className: "bg-[#edf7f2] text-[#0f7b62]" },
  accepted: { label: "دعوت ارسال شد", className: "bg-[#edf7f2] text-[#0f7b62]" },
  started: { label: "شرکت کرده", className: "bg-[#e9f3fc] text-[#356f9a]" },
  completed: { label: "شرکت کرده", className: "bg-[#e5f4ec] text-[#0f7b62]" },
  expired: { label: "مهلت گذشته", className: "bg-[#fff0ed] text-[#b2513e]" },
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
  const feedbackSharing = useSetEmployerInterviewFeedbackSharing(id);
  const [filter, setFilter] = useState<InvitationFilter>("all");
  const [reportId, setReportId] = useState<string | null>(null);
  const position = detail.data?.position;
  const invited = (detail.data?.candidates ?? []).filter((candidate) => candidate.invitationStatus !== "not_invited");
  const startedCount = invited.filter(tookPart).length;
  const waitingCount = invited.filter((candidate) =>
    ["invited", "accepted"].includes(candidate.invitationStatus),
  ).length;
  const expiredCount = invited.filter((candidate) => candidate.invitationStatus === "expired").length;
  const rows = invited
    .filter((candidate) => {
      if (filter === "waiting") return ["invited", "accepted"].includes(candidate.invitationStatus);
      if (filter === "started") return tookPart(candidate);
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
    { key: "waiting", label: "ارسال‌شده", count: waitingCount },
    { key: "started", label: "شرکت‌کرده", count: startedCount },
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
        دعوت‌های ارسال‌شده، شرکت نامزد در مصاحبه و پایان مهلت هر ۱۵ ثانیه به‌روز می‌شوند.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "دعوت ارسال‌شده", value: waitingCount },
          { label: "شرکت‌کرده در مصاحبه", value: startedCount },
          { label: "مهلت‌گذشته", value: expiredCount },
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
            <InterviewReportView report={reportCandidate.interviewReport} questions={reportCandidate.conversationQuestions ?? []} variant="employer" />
            <section className="flex flex-col gap-4 rounded-xl border border-[#dfe9e3] bg-[#f7faf8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="m-0 flex items-center gap-2 text-sm font-bold text-[#19312f]">
                  {reportCandidate.interviewFeedbackSharedAt ? (
                    <CheckCircle2 size={18} className="text-[#0f7b62]" aria-hidden="true" />
                  ) : (
                    <Send size={18} className="text-[#6b8174]" aria-hidden="true" />
                  )}
                  امتیاز و بازخورد برای کارجو نمایش داده شود؟
                </h3>
                <p className="mb-0 mt-1 text-xs leading-6 text-[#6b8174]">
                  با تأیید شما امتیاز، خلاصهٔ گزارش، نقاط قوت و فرصت‌های بهبود در پنل کارجو نمایش داده می‌شود.
                </p>
              </div>
              <button
                type="button"
                className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-bold transition-colors disabled:opacity-50 ${
                  reportCandidate.interviewFeedbackSharedAt
                    ? "border border-[#cfe3d8] bg-white text-[#0f7b62]"
                    : "bg-[#0f7b62] text-white hover:bg-[#0c6954]"
                }`}
                disabled={feedbackSharing.isPending}
                onClick={() =>
                  feedbackSharing.mutate({
                    candidateId: reportCandidate.id,
                    shared: !reportCandidate.interviewFeedbackSharedAt,
                  })
                }
              >
                {feedbackSharing.isPending
                  ? "در حال ذخیره…"
                  : reportCandidate.interviewFeedbackSharedAt
                    ? "لغو نمایش برای کارجو"
                    : "تأیید و نمایش نتیجه"}
              </button>
              {feedbackSharing.error instanceof Error && (
                <p className="m-0 text-xs text-[#b2513e]" role="alert">
                  {feedbackSharing.error.message}
                </p>
              )}
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
