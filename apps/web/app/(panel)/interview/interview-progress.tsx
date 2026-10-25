type InterviewProgressProps = {
  total: number;
  currentIndex: number;
};

export function InterviewProgress({ total, currentIndex }: InterviewProgressProps) {
  if (total < 1) return null;

  return (
    <div
      className="mt-4 flex gap-1"
      role="progressbar"
      aria-label="پیشرفت مصاحبه"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(currentIndex + 1, total)}
    >
      {Array.from({ length: total }, (_, index) => (
        <span key={index} aria-hidden="true" className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e7ebe6]">
          <span
            className={`block h-full w-full origin-right rounded-full bg-[linear-gradient(to_left,#0f7b62,#2db28b)] shadow-[0_0_10px_rgba(15,123,98,.25)] transition-transform duration-500 ease-[cubic-bezier(0.55,0,0.2,1)] motion-reduce:transition-none ${index <= currentIndex ? "scale-x-100" : "scale-x-0"}`}
            style={{
              backgroundSize: `${total * 100}% 100%`,
              backgroundPosition: `${total === 1 ? 100 : 100 - (index / (total - 1)) * 100}% 0`,
            }}
          />
        </span>
      ))}
    </div>
  );
}
