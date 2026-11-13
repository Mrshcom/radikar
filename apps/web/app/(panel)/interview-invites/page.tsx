"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { employerKeys } from "@/lib/employer";
import { SectionTitle } from "../_components/ui";
import { useToast } from "@/app/_components/toast";

type Interview = {
  id: string;
  title: string;
  companyName: string;
  status: string;
  deadline: string | null;
  cancelledAt?: string;
};

function invitationStatus(status: string) {
  if (status === "completed") return { label: "انجام‌شده", tone: "text-[#0d7757]" };
  if (status === "expired") return { label: "مهلت‌گذشته", tone: "text-[#b65a48]" };
  if (status === "started") return { label: "در حال انجام", tone: "text-[#9a692e]" };
  if (status === "cancelled") return { label: "لغوشده", tone: "text-[#718078]" };
  return { label: "در انتظار انجام", tone: "text-[#3973b8]" };
}

function invitationActionLabel(status: string) {
  if (status === "completed") return "مشاهدهٔ گزارش";
  if (status === "expired") return "مشاهدهٔ جزئیات";
  if (status === "started") return "ادامهٔ مصاحبه";
  if (status === "cancelled") return "لغوشده";
  return "شروع مصاحبه";
}

function isActionableInvitation(status: string) {
  return status === "invited" || status === "accepted";
}

export default function InterviewInvitesPage() {
  const notify = useToast();
  const lastNotifiedErrorAt = useRef(0);
  const interviews = useQuery({
    queryKey: employerKeys.interviews,
    queryFn: () => apiRequest<Interview[]>("/api/employer/interviews"),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!interviews.error || interviews.errorUpdatedAt <= lastNotifiedErrorAt.current) return;
    lastNotifiedErrorAt.current = interviews.errorUpdatedAt;
    notify(interviews.error.message, "error");
  }, [interviews.error, interviews.errorUpdatedAt, notify]);

  const sortedInterviews = [...(interviews.data ?? [])].sort((left, right) => {
    const priority = Number(isActionableInvitation(right.status)) - Number(isActionableInvitation(left.status));
    if (priority !== 0) return priority;
    const leftDeadline = left.deadline ? new Date(left.deadline).getTime() : 0;
    const rightDeadline = right.deadline ? new Date(right.deadline).getTime() : 0;
    return rightDeadline - leftDeadline;
  });

  return (
    <div className="space-y-6">
      <SectionTitle
        title="مصاحبه‌های دعوتی"
        description="دعوت‌های شغلی‌ات را اینجا ببین و تا پایان مهلت، در همان فضای مصاحبه پاسخ بده."
      />
      {interviews.isLoading && <p className="text-sm text-[#61746f]">در حال دریافت دعوت‌ها...</p>}
      {interviews.error && !interviews.data?.length && (
        <div className="rounded-2xl border border-dashed border-[#cbded1] bg-white p-8 text-center">
          <button
            type="button"
            disabled={interviews.isFetching}
            onClick={() => void interviews.refetch()}
            className="min-h-10 rounded-xl border border-[#cfe3d8] bg-white px-4 text-sm font-bold text-[#0f7b62] hover:bg-[#eff8f2] disabled:opacity-50"
          >
            {interviews.isFetching ? "در حال دریافت..." : "تلاش دوباره برای دریافت مصاحبه‌ها"}
          </button>
        </div>
      )}
      {!interviews.isLoading && !interviews.error && !interviews.data?.length && (
        <div className="rounded-2xl border border-dashed border-[#cbded1] bg-white p-8 text-center text-[#688074]">
          هنوز مصاحبهٔ دعوتی فعالی نداری.
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedInterviews.map((interview) => {
          const status = invitationStatus(interview.status);
          const actionable = isActionableInvitation(interview.status);
          const cardClassName = `group flex min-w-0 flex-col gap-1 rounded-2xl border p-5 ${
            actionable
              ? "border-amber-200 bg-linear-to-bl from-amber-50 via-white to-white shadow-[0_8px_24px_rgba(146,92,21,.09)] hover:border-amber-400"
              : "border-[#dce9df] bg-white shadow-[0_8px_24px_rgba(27,55,50,.04)] hover:border-[#9bcdb8]"
          }`;
          const content = (
            <>
              <div className="flex items-start justify-between gap-2">
                <strong className={`min-w-0 wrap-break-word text-[#19312f] ${actionable ? "text-base" : "text-sm"}`}>{interview.title}</strong>
                <span className={`shrink-0 text-[11px] font-normal ${status.tone}`}>{status.label}</span>
              </div>
              <span className="text-xs text-[#61746f]">{interview.companyName}</span>
              {interview.status === "started" && (
                <p className="mb-0 mt-2 text-xs leading-6 text-[#61746f]">
                  تا پایان مهلت فرصت داری مصاحبه‌ات را کامل کنی.
                </p>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
                <span className={`text-[11px] ${actionable ? "font-semibold text-amber-900" : "text-[#61746f]"}`}>
                  {interview.status === "cancelled"
                    ? `لغو در: ${interview.cancelledAt ? new Date(interview.cancelledAt).toLocaleString("fa-IR") : "—"}`
                    : `مهلت تا: ${interview.deadline ? new Date(interview.deadline).toLocaleString("fa-IR") : "—"}`}
                </span>
                {interview.status !== "cancelled" && (
                  <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap ${
                    actionable
                      ? "min-h-9 rounded-xl bg-[#0f7b62] px-3 text-xs font-semibold text-white group-hover:bg-[#0d6b57]"
                      : "text-[10px] font-normal text-[#0f7b62]"
                  }`}>
                    {invitationActionLabel(interview.status)}
                    <ArrowLeft aria-hidden="true" size={15} />
                  </span>
                )}
              </div>
            </>
          );
          return interview.status === "cancelled" ? (
            <article key={interview.id} className={cardClassName} aria-label={`مصاحبهٔ لغوشدهٔ ${interview.title}`}>
              {content}
            </article>
          ) : (
            <Link
              key={interview.id}
              href={`/interview-invites/${interview.id}`}
              className={`${cardClassName} no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
