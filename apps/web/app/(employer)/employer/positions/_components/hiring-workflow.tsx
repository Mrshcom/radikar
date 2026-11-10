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
    <nav aria-label="مراحل جذب برای این پوزیشن" className="rounded-[20px] border border-[#dfe9e3] bg-white p-4 sm:p-5">
      <ol className="grid grid-cols-4">
        {steps.map((step) => {
          const complete = step.number < availableStep;
          const active = step.number === currentStep;
          const content = (
            <>
              <span
                className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 text-xs font-black sm:size-10 ${
                  active
                    ? "border-[#0f7b62] bg-[#0f7b62] text-white ring-4 ring-[#e7f5ed]"
                    : complete
                      ? "border-[#0f7b62] bg-white text-[#0f7b62]"
                      : "border-[#dce6df] bg-white text-[#819188]"
                }`}
              >
                {step.number.toLocaleString("fa-IR")}
              </span>
              <span className="min-w-0 text-center">
                <strong
                  className={`block text-[10px] leading-5 sm:text-xs ${active ? "text-[#0b6c56]" : complete ? "text-[#29463d]" : "text-[#819188]"}`}
                >
                  {step.title}
                </strong>
                <span className="mt-0.5 hidden text-[10px] text-[#71847b] sm:block">{step.description}</span>
              </span>
            </>
          );
          const stepClass = "relative z-10 flex w-full flex-col items-center gap-3 px-1 py-1 text-center sm:gap-2";
          return (
            <li key={step.number} className="relative isolate min-w-0">
              {step.number < 4 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-[21px] right-1/2 -left-1/2 z-0 h-0.5 sm:top-[23px] ${complete ? "bg-[#80c5a4]" : "bg-[#e2eae4]"}`}
                />
              )}
              {onStepChange ? (
                <button
                  type="button"
                  className={`${stepClass} rounded-lg outline-offset-4 enabled:cursor-pointer enabled:hover:[&_strong]:text-[#0f7b62] focus-visible:outline-2 focus-visible:outline-[#0f7b62] disabled:cursor-not-allowed`}
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
