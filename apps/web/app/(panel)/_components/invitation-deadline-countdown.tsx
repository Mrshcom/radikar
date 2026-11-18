"use client";

import { useEffect, useState } from "react";

type CountdownVariant = "default" | "compact";

function RollingCountdownDigit({
  from,
  digit,
  variant,
}: {
  from: string;
  digit: string;
  variant: CountdownVariant;
}) {
  const isRolling = from !== digit;
  const compact = variant === "compact";

  return (
    <span
      className={`relative block overflow-hidden font-black tabular-nums text-[#0f7b62] ${
        compact ? "h-5 w-[0.62em] text-lg leading-5" : "h-9 w-[0.65em] text-3xl leading-9 sm:h-10 sm:text-4xl sm:leading-10"
      }`}
    >
      <span
        key={digit}
        className={`block ${isRolling ? "motion-safe:animate-[invitation-countdown-roll_420ms_cubic-bezier(0.22,1,0.36,1)_forwards]" : ""}`}
      >
        <span className={`block ${compact ? "h-5" : "h-9 sm:h-10"}`}>{from}</span>
        <span className={`block ${compact ? "h-5" : "h-9 sm:h-10"}`}>{digit}</span>
      </span>
    </span>
  );
}

function RollingCountdownNumber({
  value,
  previousValue,
  variant,
}: {
  value: string;
  previousValue: string;
  variant: CountdownVariant;
}) {
  return (
    <span className="flex" aria-label={value}>
      {Array.from(value).map((digit, index) => (
        <RollingCountdownDigit
          key={index}
          digit={digit}
          from={Array.from(previousValue)[index] ?? digit}
          variant={variant}
        />
      ))}
    </span>
  );
}

export function InvitationDeadlineCountdown({
  deadline,
  variant = "default",
}: {
  deadline: string | null;
  variant?: CountdownVariant;
}) {
  const [clock, setClock] = useState(() => {
    const now = Date.now();
    return { now, previousNow: now };
  });

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => {
      setClock((current) => ({ previousNow: current.now, now: Date.now() }));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (!deadline || Number.isNaN(new Date(deadline).getTime())) return null;

  const deadlineTime = new Date(deadline).getTime();
  const remaining = (timestamp: number) => {
    const seconds = Math.max(0, Math.floor((deadlineTime - timestamp) / 1_000));
    return {
      days: Math.floor(seconds / 86_400),
      hours: Math.floor((seconds % 86_400) / 3_600),
      minutes: Math.floor((seconds % 3_600) / 60),
      seconds: seconds % 60,
    };
  };
  const current = remaining(clock.now);
  const previous = remaining(clock.previousNow);
  const number = (value: number, minimumIntegerDigits = 1) =>
    new Intl.NumberFormat("fa-IR", { minimumIntegerDigits, useGrouping: false }).format(value);
  const units = [
    { label: "روز", value: number(current.days, 2), previousValue: number(previous.days, 2) },
    { label: "ساعت", value: number(current.hours, 2), previousValue: number(previous.hours, 2) },
    { label: "دقیقه", value: number(current.minutes, 2), previousValue: number(previous.minutes, 2) },
    { label: "ثانیه", value: number(current.seconds, 2), previousValue: number(previous.seconds, 2) },
  ];
  const compact = variant === "compact";

  return (
    <section
      aria-label="شمارش معکوس مهلت مصاحبه"
      aria-live="polite"
      className={compact ? "min-w-0" : "mt-3 flex justify-center pt-1"}
    >
      <div
        className={
          compact
            ? "rounded-xl bg-amber-50/80 px-2.5 py-2 text-right"
            : "rounded-2xl border border-[#d8e9df] bg-white px-5 py-4 text-center shadow-[0_10px_26px_rgba(30,67,55,.06)] motion-safe:animate-[invitation-countdown-box-pulse_2.4s_ease-in-out_infinite] sm:px-7"
        }
      >
        <p className={`m-0 font-bold text-[#526c63] ${compact ? "mb-1 text-center text-[10px]" : "text-sm"}`}>
          {compact ? "مهلت" : "تا پایان مهلت مصاحبه"}
        </p>
        <div className={`${compact ? "flex items-center gap-1.5" : "mt-3 flex items-start justify-center gap-2.5"}`} dir="ltr">
          {units.map((unit, index) => (
            <div key={unit.label} className={`${compact ? "flex items-center gap-1" : "flex items-start gap-2.5"}`}>
              {index > 0 && (
                <span className={compact ? "text-sm font-bold leading-none text-[#9ab1a7]" : "mt-1 text-3xl font-bold leading-none text-[#9ab1a7]"}>
                  :
                </span>
              )}
              <div className={`flex flex-col items-center ${compact ? "min-w-7" : "min-w-12"}`}>
                <RollingCountdownNumber value={unit.value} previousValue={unit.previousValue} variant={variant} />
                <span className={`font-bold text-[#60766a] ${compact ? "mt-0.5 text-[8px] leading-none" : "mt-2 text-[11px]"}`}>
                  {unit.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
