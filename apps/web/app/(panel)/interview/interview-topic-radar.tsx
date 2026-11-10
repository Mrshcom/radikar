"use client";

import { useState } from "react";
import type { InterviewReport } from "@radikar/shared-types";
import { formatPersianNumber } from "@/lib/fa-number";

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

function point(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return `${(160 + Math.cos(angle) * radius).toFixed(1)},${(160 + Math.sin(angle) * radius).toFixed(1)}`;
}

export function InterviewTopicRadar({ report, questions }: { report: InterviewReport; questions: string[] }) {
  const { topics, estimated } = getInterviewTopics(report, questions);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeTopic = activeIndex === null ? null : topics[activeIndex];
  return (
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
        <p className="mt-6 text-sm text-[#61746f]">برای این گفت‌وگو شواهد کافی برای امتیازدهی به مباحث ثبت نشده است.</p>
      ) : (
        <div className="mt-5 grid items-center gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {topics.length >= 3 ? (
            <div className="mx-auto w-full max-w-90">
              <svg
                viewBox="0 0 320 320"
                role="img"
                aria-label={`نمودار رادار امتیاز ${formatPersianNumber(topics.length)} مبحث از ۱۰۰`}
                className="w-full overflow-visible"
              >
                {[25, 50, 75, 100].map((level) => (
                  <polygon
                    key={level}
                    points={topics.map((_, index) => point(index, topics.length, (level / 100) * 112)).join(" ")}
                    fill={level === 100 ? "#f6faf7" : "none"}
                    stroke="#dbe9e1"
                    strokeWidth="1"
                  />
                ))}
                {topics.map((_, index) => (
                  <line
                    key={index}
                    x1="160"
                    y1="160"
                    x2={point(index, topics.length, 112).split(",")[0]}
                    y2={point(index, topics.length, 112).split(",")[1]}
                    stroke={activeIndex === index ? "#0f7b62" : "#dbe9e1"}
                    strokeWidth={activeIndex === index ? 2 : 1}
                    className="transition-all duration-300 motion-reduce:transition-none"
                  />
                ))}
                <polygon
                  points={topics
                    .map((topic, index) => point(index, topics.length, (topic.score / 100) * 112))
                    .join(" ")}
                  fill="rgba(15,123,98,.22)"
                  stroke="#0f7b62"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  className="transition-opacity duration-300 motion-reduce:transition-none"
                  opacity={activeIndex === null ? 1 : 0.65}
                />
                {topics.map((topic, index) => (
                  <g
                    key={`${topic.title}-${index}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onFocus={() => setActiveIndex(index)}
                    onBlur={() => setActiveIndex(null)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${topic.title}، ${formatPersianNumber(topic.score)} از ۱۰۰`}
                    className="cursor-pointer outline-none"
                  >
                    <circle
                      cx={point(index, topics.length, (topic.score / 100) * 112).split(",")[0]}
                      cy={point(index, topics.length, (topic.score / 100) * 112).split(",")[1]}
                      r={activeIndex === index ? 15 : 11}
                      fill={activeIndex === index ? "#cdeedf" : "transparent"}
                      className="transition-all duration-300 motion-reduce:transition-none"
                    />
                    <circle
                      cx={point(index, topics.length, (topic.score / 100) * 112).split(",")[0]}
                      cy={point(index, topics.length, (topic.score / 100) * 112).split(",")[1]}
                      r={activeIndex === index ? 8 : 5}
                      fill="#0f7b62"
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-300 motion-reduce:transition-none"
                    />
                    <text
                      x={point(index, topics.length, 132).split(",")[0]}
                      y={point(index, topics.length, 132).split(",")[1]}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={activeIndex === index ? "#0f7b62" : "#365e52"}
                      fontSize="14"
                      fontWeight="700"
                      className="transition-colors duration-300 motion-reduce:transition-none"
                    >
                      {formatPersianNumber(index + 1)}
                    </text>
                  </g>
                ))}
              </svg>
              <div aria-live="polite" className="min-h-12 text-center text-sm leading-6 text-[#365e52]">
                {activeTopic ? (
                  <span className="inline-flex rounded-full bg-[#e6f4ee] px-3 py-1.5 font-bold text-[#0f7b62]">
                    {activeTopic.title} · {formatPersianNumber(activeTopic.score)} از ۱۰۰
                  </span>
                ) : (
                  <span className="text-xs text-[#61746f]">روی هر نقطه یا مبحث برو تا امتیازش برجسته شود.</span>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-xl bg-[#f6faf7] p-4 text-sm leading-7 text-[#61746f]">
              گفت‌وگو فقط {formatPersianNumber(topics.length)} مبحث قابل‌ارزیابی داشته است.
            </p>
          )}
          <ol className="m-0 space-y-3 p-0">
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
        </div>
      )}
    </section>
  );
}
