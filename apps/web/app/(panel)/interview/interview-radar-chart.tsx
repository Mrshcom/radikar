"use client";

import { formatPersianNumber } from "@/lib/fa-number";

type RadarTopic = { title: string; score: number };

function point(index: number, total: number, radius: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return `${(160 + Math.cos(angle) * radius).toFixed(1)},${(160 + Math.sin(angle) * radius).toFixed(1)}`;
}

export function InterviewRadarChart({
  topics,
  activeIndex,
  onActiveIndexChange,
}: {
  topics: RadarTopic[];
  activeIndex: number | null;
  onActiveIndexChange: (index: number | null) => void;
}) {
  const activeTopic = activeIndex === null ? null : topics[activeIndex];
  return (
    <div className="mx-auto w-full max-w-90 rounded-[24px] border border-[#dcece2] bg-gradient-to-br from-[#f2f9f5] via-white to-[#f8fbf9] p-4 shadow-[0_12px_32px_rgba(27,55,50,.045)] sm:p-5">
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#365e52]">
        <span>نقشهٔ مباحث</span>
        <span className="rounded-full border border-[#dcece2] bg-white px-2.5 py-1 text-[10px] text-[#61746f]">
          امتیاز از ۱۰۰
        </span>
      </div>
      <svg
        viewBox="0 0 320 320"
        role="img"
        aria-label={`نمودار رادار امتیاز ${formatPersianNumber(topics.length)} مبحث از ۱۰۰`}
        className="mt-2 w-full overflow-visible"
      >
        <defs>
          <linearGradient id="interview-radar-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#37ad86" stopOpacity=".36" />
            <stop offset="100%" stopColor="#0f7b62" stopOpacity=".14" />
          </linearGradient>
        </defs>
        {Array.from({ length: 10 }, (_, index) => (index + 1) * 10).map((level) => (
          <polygon
            key={level}
            points={topics.map((_, index) => point(index, topics.length, (level / 100) * 112)).join(" ")}
            fill={level === 100 ? "rgba(255,255,255,.72)" : "none"}
            stroke={level === 100 ? "#b4d4bf" : level === 50 ? "#c2dccb" : "#d4e5d9"}
            strokeWidth={level === 100 || level === 50 ? 1.5 : 1}
          />
        ))}
        {topics.map((_, index) => (
          <line
            key={index}
            x1="160"
            y1="160"
            x2={point(index, topics.length, 112).split(",")[0]}
            y2={point(index, topics.length, 112).split(",")[1]}
            stroke="#d4e5d9"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={topics.map((topic, index) => point(index, topics.length, (topic.score / 100) * 112)).join(" ")}
          fill="url(#interview-radar-fill)"
          stroke="#0f7b62"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx="160" cy="160" r="3" fill="#9ccfba" />
        {topics.map((topic, index) => (
          <g
            key={`${topic.title}-${index}`}
            onMouseEnter={() => onActiveIndexChange(index)}
            onMouseLeave={() => onActiveIndexChange(null)}
            onFocus={() => onActiveIndexChange(index)}
            onBlur={() => onActiveIndexChange(null)}
            tabIndex={0}
            role="button"
            aria-label={`${topic.title}، ${formatPersianNumber(topic.score)} از ۱۰۰`}
            className="cursor-pointer outline-none"
          >
            <line
              aria-hidden="true"
              x1="160"
              y1="160"
              x2={point(index, topics.length, 112).split(",")[0]}
              y2={point(index, topics.length, 112).split(",")[1]}
              stroke="transparent"
              strokeWidth="18"
              pointerEvents="stroke"
            />
            <circle
              cx={point(index, topics.length, (topic.score / 100) * 112).split(",")[0]}
              cy={point(index, topics.length, (topic.score / 100) * 112).split(",")[1]}
              r="13"
              fill="transparent"
              pointerEvents="all"
            />
            <circle
              cx={point(index, topics.length, (topic.score / 100) * 112).split(",")[0]}
              cy={point(index, topics.length, (topic.score / 100) * 112).split(",")[1]}
              r={activeIndex === index ? 7.7 : 4.9}
              fill={activeIndex === index ? "#cdeedf" : "transparent"}
              pointerEvents="none"
              className="transition-all duration-300 motion-reduce:transition-none"
            />
            <circle
              cx={point(index, topics.length, (topic.score / 100) * 112).split(",")[0]}
              cy={point(index, topics.length, (topic.score / 100) * 112).split(",")[1]}
              r={activeIndex === index ? 4.9 : 4.2}
              fill="#0f7b62"
              stroke="white"
              strokeWidth="1.4"
              className="transition-all duration-300 motion-reduce:transition-none"
            />
            <circle
              cx={point(index, topics.length, 137).split(",")[0]}
              cy={point(index, topics.length, 137).split(",")[1]}
              r="13"
              fill={activeIndex === index ? "#0f7b62" : "#fff"}
              stroke={activeIndex === index ? "#0f7b62" : "#d5e8dc"}
              strokeWidth="1.5"
              className="transition-colors duration-300 motion-reduce:transition-none"
            />
            <text
              x={point(index, topics.length, 137).split(",")[0]}
              y={point(index, topics.length, 137).split(",")[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={activeIndex === index ? "#fff" : "#365e52"}
              fontSize="12"
              fontWeight="700"
              className="transition-colors duration-300 motion-reduce:transition-none"
            >
              {formatPersianNumber(index + 1)}
            </text>
          </g>
        ))}
      </svg>
      <div
        aria-live="polite"
        className="flex min-h-12 items-center justify-center text-center text-sm leading-6 text-[#365e52]"
      >
        {activeTopic ? (
          <span className="inline-flex rounded-full bg-[#e6f4ee] px-3 py-1.5 text-[#0f7b62]">
            {activeTopic.title} · {formatPersianNumber(activeTopic.score)} از ۱۰۰
          </span>
        ) : (
          <span className="text-xs text-[#61746f]">روی هر نقطه یا مبحث برو تا امتیازش برجسته شود.</span>
        )}
      </div>
    </div>
  );
}
