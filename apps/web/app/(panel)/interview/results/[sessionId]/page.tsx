"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/app/_components/toast";
import { createRecordId, interviewSessionStore } from "@/lib/data/stores";
import { InterviewResult } from "../../interview-result";

export default function InterviewResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const notify = useToast();
  const [restarting, setRestarting] = useState(false);
  const {
    data: session,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["interview", "report", sessionId],
    queryFn: () => interviewSessionStore.get(sessionId),
    staleTime: 60_000,
  });

  const restart = async () => {
    if (!session || restarting) return;
    setRestarting(true);
    try {
      const now = new Date().toISOString();
      const record = {
        ...session,
        id: createRecordId("interview"),
        answers: [],
        currentQuestionIndex: 0,
        report: undefined,
        feedbacks: [],
        createdAt: now,
        updatedAt: now,
      };
      await interviewSessionStore.put(record);
      router.push(`/interview?session=${encodeURIComponent(record.id)}`);
    } catch {
      notify("شروع دوباره انجام نشد؛ دوباره تلاش کن.", "error");
      setRestarting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl pb-10" dir="rtl">
      <Link
        href="/interview"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#0f7b62] no-underline"
      >
        <ArrowRight size={18} /> بازگشت به آمادگی مصاحبه
      </Link>
      {isPending ? (
        <div className="flex min-h-[320px] items-center justify-center gap-3 text-[#0f7b62]" role="status">
          <LoaderCircle className="animate-spin motion-reduce:animate-none" size={24} />
          در حال بارگذاری گزارش مصاحبه...
        </div>
      ) : isError || !session?.report ? (
        <div className="rounded-2xl border border-[#e1e9e2] bg-white p-8 text-center">
          <h1 className="mt-0 text-xl text-[#19312f]">گزارش مصاحبه پیدا نشد</h1>
          <p className="mb-0 text-sm text-[#61746f]">
            ممکن است این جلسه هنوز کامل نشده باشد یا به این فضای کاری تعلق نداشته باشد.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <span className="text-xs font-bold text-[#0f7b62]">{session.mode}</span>
            <h1 className="mb-0 mt-1 text-2xl font-bold text-[#19312f]">گزارش {session.title}</h1>
          </div>
          <InterviewResult session={session} onRestart={() => void restart()} />
          {restarting && (
            <p className="text-sm text-[#61746f]" role="status">
              در حال آماده‌کردن تمرین دوباره...
            </p>
          )}
        </>
      )}
    </div>
  );
}
