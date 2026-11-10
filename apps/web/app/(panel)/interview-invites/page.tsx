"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BriefcaseBusiness, CalendarClock } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { employerKeys } from "@/lib/employer";
import { SectionTitle } from "../_components/ui";
import { useToast } from "@/app/_components/toast";

type Interview = { id: string; title: string; companyName: string; status: string; deadline: string | null };

function invitationStatus(status: string) {
  if (status === "completed") return { label: "انجام‌شده", tone: "bg-[#e7f5ec] text-[#0d7757]" };
  if (status === "expired") return { label: "مهلت‌گذشته", tone: "bg-[#fff0eb] text-[#b65a48]" };
  if (status === "started") return { label: "در حال انجام", tone: "bg-[#fff3df] text-[#9a692e]" };
  return { label: "آمادهٔ مصاحبه", tone: "bg-[#e9f5ef] text-[#0f7b62]" };
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
      <div className="grid gap-5 md:grid-cols-2">
        {interviews.data?.map((interview) => {
          const status = invitationStatus(interview.status);
          return (
            <Link
              key={interview.id}
              href={`/interview-invites/${interview.id}`}
              className="group flex min-h-48 flex-col rounded-3xl border border-[#dce8df] bg-white p-5 text-[#19312f] no-underline shadow-[0_10px_30px_rgba(27,55,50,.045)] transition-all duration-200 hover:-translate-y-1 hover:border-[#91c8a4] hover:shadow-[0_18px_40px_rgba(27,55,50,.09)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0f7b62] sm:p-6 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eaf5ef] text-[#0f7b62]">
                    <BriefcaseBusiness aria-hidden="true" size={23} />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <strong className="block text-lg leading-7 sm:text-xl">{interview.title}</strong>
                    <span className="mt-1 block text-sm text-[#688074]">{interview.companyName}</span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${status.tone}`}>{status.label}</span>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-[#e8efea] pt-4 text-sm">
                <span className="inline-flex items-center gap-2 text-[#61746f]">
                  <CalendarClock aria-hidden="true" size={17} className="shrink-0 text-[#0f7b62]" />
                  <span>
                    مهلت: {interview.deadline ? new Date(interview.deadline).toLocaleString("fa-IR") : "—"}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#0f7b62]">
                  {interview.status === "completed" ? "مشاهدهٔ مصاحبه" : "مشاهده و ادامه"}
                  <ArrowLeft aria-hidden="true" size={17} className="transition-transform group-hover:-translate-x-1 motion-reduce:transform-none" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
