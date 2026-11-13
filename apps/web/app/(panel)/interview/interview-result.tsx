import Image from "next/image";
import { CheckCircle2, Clock3, Trophy, TrendingUp } from "lucide-react";
import type { InterviewReport } from "@radikar/shared-types";
import type { InterviewSessionRecord } from "@/lib/data/models";
import { formatPersianNumber } from "@/lib/fa-number";
import { CircularProgress } from "../_components/circular-progress";
import { InterviewTopicRadar } from "./interview-topic-radar";

export type InterviewReportViewData = Pick<InterviewReport, "score" | "summary" | "strengths" | "improvements"> &
  Partial<Pick<InterviewReport, "questions" | "topics">>;

export function InterviewReportHero({
  variant,
  report,
}: {
  variant: "practice" | "invited" | "employer" | "expired" | "private";
  report?: InterviewReportViewData;
}) {
  const expired = variant === "expired";
  const privateReport = variant === "private";
  const statusOnly = expired || privateReport;
  return (
    <div className="relative isolate grid min-h-[300px] gap-6 overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_10%_12%,rgba(105,200,165,.3),transparent_30%),radial-gradient(circle_at_68%_92%,rgba(105,200,165,.16),transparent_34%),linear-gradient(120deg,#164c40,#10342f)] p-6 text-white shadow-[0_18px_48px_rgba(22,76,64,.18)] sm:grid-cols-[auto_minmax(0,1fr)_210px] sm:p-8">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-12 size-72 rounded-full border border-white/10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-12 -left-2 size-52 rounded-full border border-white/10"
      />
      <CircularProgress
        className="relative z-10 size-36 self-center [--progress-track:rgba(255,255,255,.16)] [--progress-value:#84d9b7] before:absolute before:inset-2.5 before:z-0 before:rounded-full before:bg-white/10 before:shadow-[inset_0_0_30px_rgba(255,255,255,.07),0_12px_35px_rgba(0,0,0,.12)]"
        label={
          statusOnly
            ? expired
              ? "وضعیت مصاحبه: مهلت دعوت به پایان رسیده است"
              : "وضعیت مصاحبه: تکمیل‌شده، نتیجه خصوصی است"
            : `امتیاز مصاحبه ${formatPersianNumber(report!.score)} از ۱۰۰`
        }
        strokeWidth={8}
        value={statusOnly ? 0 : report!.score}
      >
        {statusOnly ? (
          <Clock3 size={22} className="mb-1 text-[#f2d587]" />
        ) : (
          <Trophy size={22} className="mb-1 text-[#f2d587]" />
        )}
        <strong className="text-2xl leading-none">
          {expired ? "پایان" : privateReport ? "ثبت شد" : formatPersianNumber(report!.score)}
        </strong>
        <span className="mt-2 whitespace-nowrap text-[10px] text-[#d2e9dd]">
          {expired ? "مهلت دعوت" : privateReport ? "نتیجه خصوصی" : "از ۱۰۰ · امتیاز تقریبی"}
        </span>
      </CircularProgress>
      <div className="relative z-10 self-center">
        <span className="inline-flex rounded-full border border-[#94d8bc]/25 bg-[#88d2b4]/10 px-2.5 py-1 mb-3 text-xs text-[#a7e5ce]">
          {expired
            ? "مهلت‌گذشته"
            : privateReport || variant === "invited" || variant === "employer"
              ? "مصاحبه تکمیل و ارسال شد"
              : "مصاحبه‌ات کامل شد"}
        </span>
        <h2 className="mb-3 mt-2 text-xl font-bold">
          {expired
            ? "مهلت این دعوت به پایان رسیده است"
            : privateReport
              ? "مصاحبهٔ تو تکمیل شد"
              : variant === "employer"
                ? "گزارش مصاحبهٔ شغلی"
                : variant === "invited"
                ? "گزارش مصاحبهٔ شغلی تو"
                : "یک قدم نزدیک‌تر به مصاحبهٔ واقعی"}
        </h2>
        <p className="m-0 text-sm leading-8 text-[#d5e8e1]">
          {expired
            ? "زمان پاسخ‌گویی به این دعوت تمام شده و امکان شروع یا ادامهٔ مصاحبه وجود ندارد."
            : privateReport
              ? "پاسخ‌هایت ثبت شده و نتیجه برای کارفرما آماده است."
              : report!.summary}
        </p>
        {variant !== "employer" && <p className="mb-0 mt-3 text-xs text-[#b8d9cd]">
          {expired
            ? "برای دریافت فرصت جدید، با کارفرما هماهنگ کن."
            : privateReport
              ? "امتیاز و بازخورد پس از تأیید کارفرما در همین صفحه نمایش داده می‌شود."
              : variant === "invited"
                ? "این گزارش بر اساس پاسخ‌های ثبت‌شده آماده و برای کارفرما ارسال شده است."
                : "این امتیاز برای تمرین است و پیش‌بینی نتیجهٔ استخدام نیست."}
        </p>}
      </div>
      <div className="relative hidden min-h-[190px] self-end sm:block" aria-hidden="true">
        <span className="absolute bottom-0 left-1/2 size-40 -translate-x-1/2 rounded-full bg-[#81ceb0]/20 blur-2xl" />
        <Image
          alt=""
          className="absolute bottom-[-32px] left-1/2 h-[250px] w-auto max-w-none -translate-x-1/2 object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,.2)]"
          height={375}
          priority
          src={
            variant === "practice"
              ? "/illustrations/radikar-mascot-interview-test-taker-v1.png"
              : "/illustrations/radikar-mascot-invited-interview-formal-v1.png"
          }
          width={250}
        />
      </div>
    </div>
  );
}

export function InterviewReportView({
  report,
  questions,
  variant = "practice",
  showFeedback = true,
  showHero = true,
}: {
  report: InterviewReportViewData;
  questions: string[];
  variant?: "practice" | "invited" | "employer";
  showFeedback?: boolean;
  showHero?: boolean;
}) {
  const isInvited = variant === "invited";
  const feedbackSections = [
    {
      title: variant === "employer" ? "نقاط قوت کارجو" : "نقاط قوت تو",
      items: report.strengths,
      Icon: CheckCircle2,
      tone: "border-[#d5eadf] bg-[#eff9f4] text-[#176b57]",
      empty: variant === "employer" ? "نقطهٔ قوت مشخصی در گزارش ثبت نشده است." : "هنوز قوت مشخصی در پاسخ‌ها دیده نشده؛ با مثال‌های عملی دوباره تمرین کن.",
    },
    {
      title: "فرصت‌های بهتر شدن",
      items: report.improvements,
      Icon: TrendingUp,
      tone: "border-[#f1dfc8] bg-[#fff8ed] text-[#986624]",
      empty: "مدل نکتهٔ بهبود مشخصی گزارش نکرده است.",
    },
  ].filter(({ items }) => showFeedback && (!isInvited || items.length > 0));
  return (
    <section className="mt-4 space-y-5" aria-label="نتیجه مصاحبه">
      {showHero && <InterviewReportHero report={report} variant={variant} />}
      {feedbackSections.length > 0 && (
        <div className={`grid gap-4 ${feedbackSections.length > 1 ? "md:grid-cols-2" : ""}`}>
          {feedbackSections.map(({ title, items, Icon, tone, empty }) => (
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
      )}
      {Boolean(report.topics?.length || report.questions?.length) && (
        <InterviewTopicRadar report={{ ...report, questions: report.questions ?? [] }} questions={questions} />
      )}
      {variant === "employer" && !report.topics?.length && !report.questions?.length && (
        <p className="rounded-xl border border-[#dfe9e3] bg-white p-4 text-sm text-[#526461]">
          امتیاز تفکیکی مباحث برای این گزارش ثبت نشده است.
        </p>
      )}
    </section>
  );
}

export function InterviewResult({ session }: { session: InterviewSessionRecord }) {
  const report = session.report;
  if (!report) return null;
  return <InterviewReportView report={report} questions={session.questions} />;
}
