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
      className={`relative grid shrink-0 place-items-center rounded-full ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={value}
    >
      <svg
        className="absolute inset-0 z-1 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className="fill-none stroke-[var(--progress-track,#dcefe7)]"
          cx="50"
          cy="50"
          r={radius}
          pathLength="100"
          strokeWidth={strokeWidth}
        />
        <circle
          className="fill-none stroke-[var(--progress-value,#60c6a8)] transition-[stroke-dashoffset] duration-350"
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
      <div className="relative z-2 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
