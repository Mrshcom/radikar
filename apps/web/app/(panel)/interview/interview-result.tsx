import Image from "next/image";
import { CheckCircle2, ChevronDown, Lightbulb, Trophy, TrendingUp } from "lucide-react";
import type { InterviewSessionRecord } from "@/lib/data/models";
import { formatPersianNumber } from "@/lib/fa-number";
import { CircularProgress } from "../_components/circular-progress";

export function InterviewResult({ session, onRestart }: { session: InterviewSessionRecord; onRestart: () => void }) {
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
      <div>
        <h3 className="mb-3 mt-6 text-base font-bold text-[#19312f]">بررسی سؤال‌به‌سؤال</h3>
        <p className="mb-4 text-sm text-[#61746f]">
          هر سؤال را باز کن تا پاسخ خودت، نکته‌های بهبود و نمونهٔ پاسخ بهتر را ببینی.
        </p>
        <div className="space-y-3">
          {report.questions.map((item) => (
            <details
              key={item.questionIndex}
              className="group overflow-hidden rounded-[18px] border border-[#e1e8e2] bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e6f4ee] text-sm font-bold text-[#0f7b62]">
                  {formatPersianNumber(item.questionIndex + 1)}
                </span>
                <p className="min-w-0 flex-1 text-sm leading-7 text-[#19312f]">
                  {session.questions[item.questionIndex]}
                </p>
                <span className="shrink-0 text-sm font-bold text-[#0f7b62]">
                  {formatPersianNumber(item.score)} از ۱۰۰
                </span>
                <ChevronDown size={18} className="shrink-0 text-[#61746f] transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t border-[#e9eeea] p-5 text-sm leading-8">
                <div className="rounded-xl bg-[#f6f8f5] p-4">
                  <h4 className="m-0 text-[#19312f]">پاسخ تو</h4>
                  <p className="mb-0 mt-1 whitespace-pre-wrap text-[#61746f]">
                    {session.answers?.[item.questionIndex]}
                  </p>
                </div>
                <p className="m-0 text-[#19312f]">{item.feedback}</p>
                {item.strengths.length > 0 && (
                  <div>
                    <h4 className="m-0 text-[#176b57]">چه چیزی خوب بود؟</h4>
                    <ul className="my-1 list-disc ps-5 text-[#61746f]">
                      {item.strengths.map((text, index) => (
                        <li key={index}>{text}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.issues.length > 0 && (
                  <div>
                    <h4 className="m-0 text-[#986624]">چه چیزی بهتر شود؟</h4>
                    <ul className="my-1 list-disc ps-5 text-[#61746f]">
                      {item.issues.map((text, index) => (
                        <li key={index}>{text}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-xl border border-[#d5eadf] bg-[#eff9f4] p-4">
                  <h4 className="m-0 flex items-center gap-2 text-[#176b57]">
                    <Lightbulb size={18} />
                    نمونهٔ پاسخ بهتر
                  </h4>
                  <p className="mb-0 mt-2 whitespace-pre-wrap text-[#365e52]">{item.suggestedAnswer}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl border-0 bg-[#0f7b62] px-5 py-3 text-sm font-bold text-white"
        >
          تمرین دوبارهٔ این مصاحبه
        </button>
      </div>
    </section>
  );
}
