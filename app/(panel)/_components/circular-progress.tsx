import type { ReactNode } from "react";

type CircularProgressProps = {
  value: number;
  max?: number;
  label: string;
  className?: string;
  strokeWidth?: number;
  startAngle?: number;
  children: ReactNode;
};

export function CircularProgress({
  value,
  max = 100,
  label,
  className = "",
  strokeWidth = 8,
  startAngle = -90,
  children,
}: CircularProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const percentage = Math.min(Math.max(value / safeMax, 0), 1) * 100;
  const radius = 50 - strokeWidth / 2;

  return (
    <div
      className={`circular-progress ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle
          className="circular-progress__track"
          cx="50"
          cy="50"
          r={radius}
          pathLength="100"
          strokeWidth={strokeWidth}
        />
        <circle
          className="circular-progress__value"
          cx="50"
          cy="50"
          r={radius}
          pathLength="100"
          strokeWidth={strokeWidth}
          strokeDasharray="100"
          strokeDashoffset={100 - percentage}
          strokeLinecap="round"
          transform={`rotate(${startAngle} 50 50)`}
        />
      </svg>
      <div className="circular-progress__content">{children}</div>
    </div>
  );
}
