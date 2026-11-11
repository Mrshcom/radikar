import Image from "next/image";
import { CheckCircle2, Trophy, TrendingUp } from "lucide-react";
import type { InterviewSessionRecord } from "@/lib/data/models";
import { formatPersianNumber } from "@/lib/fa-number";
import { CircularProgress } from "../_components/circular-progress";
import { InterviewTopicRadar } from "./interview-topic-radar";

export function InterviewResult({ session }: { session: InterviewSessionRecord }) {
  const report = session.report;
  if (!report) return null;
  return (
    <section className="mt-4 space-y-5" aria-label="نتیجه مصاحبه">
      <div className="relative isolate grid gap-6 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_10%_12%,rgba(105,200,165,.3),transparent_30%),radial-gradient(circle_at_68%_92%,rgba(105,200,165,.16),transparent_34%),linear-gradient(120deg,#164c40,#10342f)] p-6 text-white shadow-[0_18px_48px_rgba(22,76,64,.18)] sm:grid-cols-[auto_minmax(0,1fr)_210px] sm:p-8">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-12 size-72 rounded-full border border-white/10"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-12 -left-2 size-52 rounded-full border border-white/10"
        />
        <CircularProgress
          className="relative z-10 size-36 [--progress-track:rgba(255,255,255,.16)] [--progress-value:#84d9b7] before:absolute before:inset-2.5 before:z-0 before:rounded-full before:bg-white/10 before:shadow-[inset_0_0_30px_rgba(255,255,255,.07),0_12px_35px_rgba(0,0,0,.12)]"
          label={`امتیاز مصاحبه ${formatPersianNumber(report.score)} از ۱۰۰`}
          strokeWidth={8}
          value={report.score}
        >
          <Trophy size={22} className="mb-1 text-[#f2d587]" />
          <strong className="text-3xl leading-none">{formatPersianNumber(report.score)}</strong>
          <span className="mt-2 whitespace-nowrap text-[10px] text-[#d2e9dd]">از ۱۰۰ · امتیاز تقریبی</span>
        </CircularProgress>
        <div className="relative z-10 self-center">
          <span className="inline-flex rounded-full border border-[#94d8bc]/25 bg-[#88d2b4]/10 px-2.5 py-1 text-xs text-[#a7e5ce]">
            مصاحبه‌ات کامل شد
          </span>
          <h2 className="mb-3 mt-2 text-xl font-bold">یک قدم نزدیک‌تر به مصاحبهٔ واقعی</h2>
          <p className="m-0 text-sm leading-8 text-[#d5e8e1]">{report.summary}</p>
          <p className="mb-0 mt-3 text-xs text-[#b8d9cd]">این امتیاز برای تمرین است و پیش‌بینی نتیجهٔ استخدام نیست.</p>
        </div>
        <div className="relative hidden min-h-[190px] self-end sm:block" aria-hidden="true">
          <span className="absolute bottom-0 left-1/2 size-40 -translate-x-1/2 rounded-full bg-[#81ceb0]/20 blur-2xl" />
          <Image
            alt=""
            className="absolute bottom-[-32px] left-1/2 h-[250px] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,.2)]"
            height={375}
            priority
            src="/illustrations/radikar-mascot-interview-test-taker-v1.png"
            width={250}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "نقاط قوت تو",
            items: report.strengths,
            Icon: CheckCircle2,
            tone: "border-[#d5eadf] bg-[#eff9f4] text-[#176b57]",
            empty: "هنوز قوت مشخصی در پاسخ‌ها دیده نشده؛ با مثال‌های عملی دوباره تمرین کن.",
          },
          {
            title: "فرصت‌های بهتر شدن",
            items: report.improvements,
            Icon: TrendingUp,
            tone: "border-[#f1dfc8] bg-[#fff8ed] text-[#986624]",
            empty: "مدل نکتهٔ بهبود مشخصی گزارش نکرده است.",
          },
        ].map(({ title, items, Icon, tone, empty }) => (
          <div key={title} className={`rounded-[20px] border p-5 ${tone}`}>
            <h3 className="mb-3 mt-0 flex items-center gap-2 text-base font-bold">
              <Icon size={21} />
              {title}
            </h3>
            {items.length ? (
              <ul className="m-0 list-disc space-y-2 ps-5 text-sm leading-7">
                {items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm leading-7">{empty}</p>
            )}
          </div>
        ))}
      </div>
      <InterviewTopicRadar report={report} questions={session.questions} />
    </section>
  );
}
