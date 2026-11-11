"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { interviewSessionStore } from "@/lib/data/stores";
import { SectionTitle } from "../../../_components/ui";
import { InterviewResult } from "../../interview-result";

export default function InterviewResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const {
    data: session,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["interview", "report", sessionId],
    queryFn: () => interviewSessionStore.get(sessionId),
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto w-full max-w-6xl pb-10" dir="rtl">
      <SectionTitle
        title={session?.report ? `گزارش ${session.title}` : "گزارش مصاحبه"}
        className="mb-5 items-center [&_h1]:!text-[28px]"
        action={
          session?.report ? (
            <button
              type="button"
              onClick={() => router.push(`/interview?restart=${encodeURIComponent(session.id)}`)}
              className="rounded-xl border-0 bg-[#0f7b62] px-5 py-3 text-xs font-normal text-white"
            >
              تمرین دوبارهٔ این مصاحبه
            </button>
          ) : undefined
        }
        leading={
          <button type="button" onClick={() => router.push("/interview")} aria-label="بازگشت به مصاحبه‌های آزمایشی" className="grid size-9 shrink-0 place-items-center rounded-full text-[#19312f] hover:bg-[#e6f2eb] hover:text-[#0f7b62]">
            <ArrowRight size={20} />
          </button>
        }
      />
      {isPending ? (
        <div className="flex min-h-[320px] items-center justify-center gap-3 text-[#0f7b62]" role="status">
          <LoaderCircle className="animate-spin motion-reduce:animate-none" size={24} />
          در حال بارگذاری گزارش مصاحبه...
        </div>
      ) : isError || !session?.report ? (
        <div className="rounded-2xl border border-[#e1e9e2] bg-white p-8 text-center">
          <h2 className="mt-0 text-xl text-[#19312f]">گزارش مصاحبه پیدا نشد</h2>
          <p className="mb-0 text-sm text-[#61746f]">
            ممکن است این جلسه هنوز کامل نشده باشد یا به این فضای کاری تعلق نداشته باشد.
          </p>
        </div>
      ) : (
        <InterviewResult session={session} />
      )}
    </div>
  );
}
