"use client";

import { useState } from "react";
import type { InterviewReport } from "@radikar/shared-types";
import { formatPersianNumber } from "@/lib/fa-number";
import { InterviewRadarChart } from "./interview-radar-chart";

type Topic = { title: string; score: number; evidence: string };

const legacyCategories = [
  { title: "معماری و استانداردها", pattern: /معماری|استاندارد|طراحی سیستم|ساختار پروژه/ },
  { title: "همکاری و ارتباط", pattern: /تیم|همکار|هماهنگ|مخالفت|بازخورد|جلسه|ارتباط/ },
  { title: "ابزار و ساختار توسعه", pattern: /مونورپو|مونو.?ریپو|turborepo|توربو|ابزار/i },
  { title: "پیاده‌سازی و کامپوننت‌ها", pattern: /پیاده.?سازی|کامپوننت|کدنویسی/ },
  { title: "حل مسئله و تصمیم‌گیری", pattern: /تصمیم|انتخاب|چالش|مشکل|مسئله|راهکار/ },
  { title: "نتیجه و اثرگذاری", pattern: /نتیجه|اثر|تأثیر|بهبود|کاهش|افزایش|دستاورد/ },
  {
    title: "مهارت‌های فنی دیگر",
    pattern: /فنی|فناوری|تکنولوژی/,
  },
] as const;

export function getInterviewTopics(
  report: InterviewReport,
  questions: string[],
): { topics: Topic[]; estimated: boolean } {
  if (report.topics?.length) return { topics: report.topics, estimated: false };

  const groups = new Map<string, number[]>();
  for (const item of report.questions) {
    const question = questions[item.questionIndex] ?? "";
    const category = legacyCategories.find(({ pattern }) => pattern.test(question))?.title ?? "سایر مباحث گفت‌وگو";
    groups.set(category, [...(groups.get(category) ?? []), item.score]);
  }

  return {
    topics: [...groups].slice(0, 8).map(([title, scores]) => ({
      title,
      score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      evidence: `برآورد بر اساس ${formatPersianNumber(scores.length)} پاسخ مرتبط در گزارش قبلی`,
    })),
    estimated: true,
  };
}

export function InterviewTopicRadar({ report, questions }: { report: InterviewReport; questions: string[] }) {
  const { topics, estimated } = getInterviewTopics(report, questions);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  return (
    <div className={topics.length >= 3 ? "grid items-start gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]" : ""}>
      {topics.length >= 3 && (
        <InterviewRadarChart topics={topics} activeIndex={activeIndex} onActiveIndexChange={setActiveIndex} />
      )}
      <section
        className="rounded-[20px] border border-[#e1e8e2] bg-white p-5 sm:p-7"
        aria-labelledby="interview-topics-heading"
      >
        <h3 id="interview-topics-heading" className="m-0 text-base font-bold text-[#19312f]">
          ارزیابی مباحث گفت‌وگو
        </h3>
        <p className="mb-0 mt-2 text-sm leading-7 text-[#61746f]">
          امتیاز مباحثی که در مصاحبه درباره‌شان گفت‌وگو شده است. این ارزیابی برای تمرین است.
        </p>
        {estimated && topics.length > 0 && (
          <p className="mb-0 mt-1 text-xs leading-6 text-[#61746f]">
            امتیازهای این گزارش قدیمی، برآوردی از سؤال‌های مرتبط هستند.
          </p>
        )}
        {topics.length === 0 ? (
          <p className="mt-6 text-sm text-[#61746f]">
            برای این گفت‌وگو شواهد کافی برای امتیازدهی به مباحث ثبت نشده است.
          </p>
        ) : (
          <>
            <ol className="m-0 mt-5 space-y-3 p-0">
              {topics.map((topic, index) => (
                <li
                  key={`${topic.title}-${index}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  tabIndex={0}
                  className={`list-none rounded-xl border p-3.5 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62] motion-reduce:transition-none ${activeIndex === index ? "border-[#8fcfb3] bg-[#f0f9f4] shadow-sm" : "border-[#e1e8e2]"}`}
                >
                  <div className="flex items-center gap-2 text-sm font-bold text-[#19312f]">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e6f4ee] text-[#0f7b62]">
                      {formatPersianNumber(index + 1)}
                    </span>
                    <span className="min-w-0 flex-1">{topic.title}</span>
                    <span className="shrink-0 text-[#0f7b62]">{formatPersianNumber(topic.score)} از ۱۰۰</span>
                  </div>
                  <p className="mb-0 mt-2 text-xs leading-6 text-[#61746f]">{topic.evidence}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
