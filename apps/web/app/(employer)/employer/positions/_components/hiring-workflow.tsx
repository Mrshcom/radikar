import type { EmployerCandidate, EmployerPosition } from "@/lib/employer";

export function availableHiringStep(position: EmployerPosition, candidates: EmployerCandidate[]): 2 | 3 | 4 {
  const hasInvitations = candidates.some((candidate) => candidate.invitationStatus !== "not_invited");
  if (!candidates.length && position.screeningStatus === "not_started") return 2;
  if (hasInvitations || position.screeningStatus === "completed" || position.reviewMethod === "manual") return 4;
  if (position.screeningStatus === "processing" || position.reviewMethod === "smart") return 3;
  return position.workflowStage === 3 || position.workflowStage === 4 ? position.workflowStage : 2;
}

const steps = [
  { number: 1, title: "تعریف پوزیشن", description: "عنوان و شرایط" },
  { number: 2, title: "افزودن رزومه", description: "PDF یا DOCX" },
  { number: 3, title: "روش بررسی", description: "هوشمند یا دستی" },
  { number: 4, title: "انتخاب و دعوت", description: "نامزدها و لینک مصاحبه" },
] as const;

type HiringWorkflowProps = {
  currentStep: 1 | 2 | 3 | 4;
  availableStep?: 1 | 2 | 3 | 4;
  onStepChange?: (step: 1 | 2 | 3 | 4) => void;
};

export function HiringWorkflow({ currentStep, availableStep = currentStep, onStepChange }: HiringWorkflowProps) {
  return (
    <nav
      aria-label="مراحل جذب برای این پوزیشن"
      className="overflow-hidden rounded-[22px] border border-[#dce9e3] bg-[radial-gradient(circle_at_50%_0%,#f1faf5_0%,#ffffff_52%)] px-4 py-5 sm:px-7 sm:py-6"
    >
      <ol className="grid grid-cols-4">
        {steps.map((step) => {
          const complete = step.number < availableStep;
          const active = step.number === currentStep;
          const content = (
            <>
              <span
                className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 text-xs font-black transition sm:size-11 ${
                  active
                    ? "border-[#0f7b62] bg-[#0f7b62] text-white shadow-[0_0_0_5px_#e6f5ec,0_8px_18px_rgba(15,123,98,.18)]"
                    : complete
                      ? "border-[#74bd9b] bg-[#f7fcf8] text-[#0f7b62]"
                      : "border-[#dbe7df] bg-white text-[#8a9991]"
                }`}
              >
                {step.number.toLocaleString("fa-IR")}
              </span>
              <span className="min-w-0 text-center">
                <strong
                  className={`block text-[10px] leading-5 sm:text-xs ${active ? "text-[#0b7058]" : complete ? "text-[#29463d]" : "text-[#71837a]"}`}
                >
                  {step.title}
                </strong>
                <span className="mt-0.5 hidden text-[10px] text-[#87968f] sm:block">{step.description}</span>
              </span>
            </>
          );
          const stepClass = "relative z-10 flex w-full flex-col items-center gap-2 px-1 text-center outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#0f7b62]";
          return (
            <li key={step.number} className="relative isolate min-w-0">
              {step.number < 4 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-5 right-[calc(50%+20px)] left-[calc(-50%+20px)] z-0 h-px sm:top-[22px] sm:right-[calc(50%+22px)] sm:left-[calc(-50%+22px)] ${complete ? "bg-[#77c5a0]" : "bg-[#dfe9e3]"}`}
                />
              )}
              {onStepChange ? (
                <button
                  type="button"
                  className={`${stepClass} enabled:cursor-pointer enabled:hover:[&_strong]:text-[#0f7b62] disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-current={active ? "step" : undefined}
                  disabled={step.number > availableStep}
                  onClick={() => onStepChange(step.number)}
                >
                  {content}
                </button>
              ) : (
                <div className={stepClass} aria-current={active ? "step" : undefined}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type NextStepGuideProps = {
  title: string;
  description: string;
  href: string;
  action: string;
};

export function NextStepGuide({ title, description, href, action }: NextStepGuideProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-[#bcdccb] bg-[linear-gradient(110deg,#edf8f1,#f8fbf7)] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="text-[11px] font-bold text-[#0f7b62]">قدم بعدی</span>
        <h2 className="mb-1 mt-1 text-base font-black text-[#19312f]">{title}</h2>
        <p className="m-0 text-xs leading-6 text-[#5f756b]">{description}</p>
      </div>
      <a
        href={href}
        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-[#0f7b62] px-5 text-xs font-bold text-white no-underline"
      >
        {action}
      </a>
    </section>
  );
}
