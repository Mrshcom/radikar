"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { employerKeys } from "@/lib/employer";
import { SectionTitle } from "../_components/ui";
import { useToast } from "@/app/_components/toast";

type Interview = { id: string; title: string; companyName: string; status: string; deadline: string | null };

function invitationStatus(status: string) {
  if (status === "completed") return { label: "انجام‌شده", tone: "text-[#0d7757]" };
  if (status === "expired") return { label: "مهلت‌گذشته", tone: "text-[#b65a48]" };
  if (status === "started") return { label: "در حال انجام", tone: "text-[#9a692e]" };
  return { label: "آمادهٔ مصاحبه", tone: "text-[#0f7b62]" };
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
        {interviews.data?.map((interview) => {
          const status = invitationStatus(interview.status);
          return (
            <Link
              key={interview.id}
              href={`/interview-invites/${interview.id}`}
              className="flex flex-col gap-1 rounded-2xl border border-[#dce9df] bg-white p-5 no-underline shadow-[0_8px_24px_rgba(27,55,50,.04)] transition-colors hover:border-[#9bcdb8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
            >
              <div className="flex items-start justify-between gap-2">
                <strong className="min-w-0 text-sm text-[#19312f]">{interview.title}</strong>
                <span className={`shrink-0 text-[11px] font-normal ${status.tone}`}>{status.label}</span>
              </div>
              <span className="text-xs text-[#61746f]">{interview.companyName}</span>
              <div className="flex items-center justify-between gap-2 pt-2 mt-4">
                <span className="whitespace-nowrap text-[10px] text-[#61746f]">
                  مهلت تا: {interview.deadline ? new Date(interview.deadline).toLocaleString("fa-IR") : "—"}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[10px] font-normal text-[#0f7b62]">
                  {interview.status === "completed" ? "مشاهدهٔ مصاحبه" : "مشاهده و ادامه"}
                  <ArrowLeft aria-hidden="true" size={15} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
