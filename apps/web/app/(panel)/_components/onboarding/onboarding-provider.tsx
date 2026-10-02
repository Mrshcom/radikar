"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, CircleHelp, Sparkles, X } from "lucide-react";
import { EVENTS, Joyride, STATUS, type Step, type TooltipRenderProps } from "react-joyride";
import {
  authQueryKey,
  useAuth,
  type CurrentUser,
  type OnboardingState,
  type OnboardingStepId,
} from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { OnboardingChecklistModal } from "./onboarding-checklist";

const onboardingSteps: readonly OnboardingStepId[] = ["profile", "match", "resume", "application"];

type AuthResponse = { user: CurrentUser };
type OnboardingContextValue = {
  state: OnboardingState | null;
  startTour: () => void;
  openChecklist: () => void;
  closeChecklist: () => void;
  markCompleted: (steps: OnboardingStepId[]) => void;
  isSaving: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function buildTourSteps(): Step[] {
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  if (isMobile) {
    return [
      {
        target: "[data-tour='nav-dashboard']",
        title: "نمای کلی مسیر",
        content: "همه وضعیت‌های مهم مسیر شغلی‌ات را از اینجا یک‌جا می‌بینی.",
        placement: "top",
      },
      {
        target: "[data-tour='nav-jobs']",
        title: "فرصت‌های مناسب",
        content: "آگهی‌ها و فرصت‌هایی که برایت وارد شده‌اند را اینجا بررسی کن.",
        placement: "top",
      },
      {
        target: "[data-tour='nav-match']",
        title: "تحلیل تطابق",
        content: "رزومه و آگهی را مقایسه کن تا برای اقدام بعدی دقیق‌تر تصمیم بگیری.",
        placement: "top",
      },
      {
        target: "[data-tour='nav-resumes']",
        title: "رزومه هدفمند",
        content: "برای هر فرصت، رزومه‌ای متناسب با همان موقعیت بساز.",
        placement: "top",
      },
    ];
  }

  return [
    {
      target: "[data-tour='nav-dashboard']",
      title: "نمای کلی مسیر",
      content: "همه وضعیت‌های مهم مسیر شغلی‌ات را از اینجا یک‌جا می‌بینی.",
      placement: "left",
    },
    {
      target: "[data-tour='nav-profile']",
      title: "پروفایل مسیر شغلی",
      content: "توانمندی‌ها، تجربه‌ها و هدف‌های شغلی‌ات را کامل کن تا پیشنهادها دقیق‌تر شوند.",
      placement: "left",
    },
    {
      target: "[data-tour='nav-match']",
      title: "تحلیل تطابق",
      content: "رزومه و آگهی را مقایسه کن تا شکاف‌ها و نقاط قوتت روشن شوند.",
      placement: "left",
    },
    {
      target: "[data-tour='nav-resumes']",
      title: "رزومه هدفمند",
      content: "برای هر فرصت، رزومه‌ای متناسب با همان موقعیت بساز.",
      placement: "left",
    },
  ];
}

function TourTooltip({
  backProps,
  closeProps,
  index,
  isLastStep,
  primaryProps,
  size,
  skipProps,
  step,
  tooltipProps,
}: TooltipRenderProps) {
  return (
    <section
      {...tooltipProps}
      dir="rtl"
      className="w-[min(340px,calc(100vw-32px))] rounded-[18px] border border-[#d8e7e0] bg-white p-4 text-right shadow-[0_20px_55px_rgba(13,53,44,.24)]"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e5f4ed] text-[#0f7b62]">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[9px] font-bold text-[#0f7b62]">
            {`${(index + 1).toLocaleString("fa-IR")} از ${size.toLocaleString("fa-IR")}`}
          </p>
          {step.title && <h2 className="mb-1 mt-1 text-[13px] text-[#19312f]">{step.title}</h2>}
          <div className="text-[10px] leading-6 text-[#667672]">{step.content}</div>
        </div>
        <button
          {...closeProps}
          className="grid size-7 shrink-0 place-items-center rounded-lg border border-[#e5ebe7] bg-white text-[#80908c] hover:bg-[#f3f7f4]"
          type="button"
        >
          <X size={15} />
        </button>
      </div>
      <footer className="mt-4 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3">
        <button
          {...skipProps}
          className="border-0 bg-transparent px-1 py-2 text-[9px] text-[#7a8985] hover:text-[#19312f]"
          type="button"
        >
          رد کردن
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="rounded-[9px] border border-[#dfe7e2] bg-white px-3 py-2 text-[9px] font-bold text-[#61716d]"
              type="button"
            >
              قبلی
            </button>
          )}
          <button
            {...primaryProps}
            className="inline-flex items-center gap-1 rounded-[9px] bg-[#0f7b62] px-3 py-2 text-[9px] font-bold text-white shadow-[0_6px_16px_rgba(15,123,98,.2)]"
            type="button"
          >
            {isLastStep ? "شروع مسیر" : "بعدی"} <ChevronLeft size={13} />
          </button>
        </div>
      </footer>
    </section>
  );
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [checklistOpenedManually, setChecklistOpenedManually] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const [tourSteps, setTourSteps] = useState<Step[]>([]);
  const state = user?.onboardingState ?? null;
  const checklistOpen =
    user?.role === "user" && (checklistOpenedManually || (state?.status === "not_started" && !checklistDismissed));
  const mutation = useMutation({
    mutationFn: (onboardingState: OnboardingState) =>
      apiRequest<AuthResponse>("/api/account/onboarding", {
        method: "PATCH",
        body: JSON.stringify(onboardingState),
      }),
    onMutate: async (onboardingState) => {
      await queryClient.cancelQueries({ queryKey: authQueryKey });
      const previous = queryClient.getQueryData<AuthResponse>(authQueryKey);
      queryClient.setQueryData<AuthResponse>(authQueryKey, (current) =>
        current ? { user: { ...current.user, onboardingState } } : current,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(authQueryKey, context.previous);
    },
    onSuccess: (response) => queryClient.setQueryData(authQueryKey, response),
  });

  const saveState = useCallback((nextState: OnboardingState) => mutation.mutate(nextState), [mutation]);
  const startTour = useCallback(() => {
    if (!state) return;
    setChecklistDismissed(true);
    setChecklistOpenedManually(false);
    setTourSteps(buildTourSteps());
    setTourRunning(true);
    if (state.status === "not_started" || state.status === "dismissed") {
      saveState({ ...state, status: "active" });
    }
  }, [saveState, state]);
  const openChecklist = useCallback(() => setChecklistOpenedManually(true), []);
  const closeChecklist = useCallback(() => {
    setChecklistDismissed(true);
    setChecklistOpenedManually(false);
    if (state?.status === "not_started") saveState({ ...state, status: "dismissed" });
  }, [saveState, state]);
  const markCompleted = useCallback(
    (steps: OnboardingStepId[]) => {
      if (!state) return;
      const completedSteps = onboardingSteps.filter((step) => steps.includes(step));
      const status = completedSteps.length === onboardingSteps.length ? "completed" : "active";
      const isSame = status === state.status && completedSteps.join(",") === state.completedSteps.join(",");
      if (!isSame) saveState({ ...state, status, completedSteps });
    },
    [saveState, state],
  );
  const value = useMemo(
    () => ({ state, startTour, openChecklist, closeChecklist, markCompleted, isSaving: mutation.isPending }),
    [closeChecklist, markCompleted, mutation.isPending, openChecklist, startTour, state],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {checklistOpen && <OnboardingChecklistModal onClose={closeChecklist} />}
      <Joyride
        continuous
        locale={{
          back: "قبلی",
          close: "بستن",
          last: "شروع مسیر",
          next: "بعدی",
          nextWithProgress: "بعدی",
          open: "باز کردن راهنما",
          skip: "رد کردن",
        }}
        onEvent={(event) => {
          if (event.type === EVENTS.TOUR_END || event.status === STATUS.FINISHED || event.status === STATUS.SKIPPED)
            setTourRunning(false);
        }}
        options={{
          overlayColor: "rgba(9, 41, 34, .64)",
          primaryColor: "#0f7b62",
          showProgress: true,
          spotlightPadding: 7,
          zIndex: 90,
          skipBeacon: true,
        }}
        run={tourRunning}
        scrollToFirstStep
        steps={tourSteps}
        tooltipComponent={TourTooltip}
      />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding باید داخل OnboardingProvider استفاده شود.");
  return context;
}

export function OnboardingLauncher() {
  const { openChecklist } = useOnboarding();
  return (
    <button
      aria-label="باز کردن راهنمای رادیکار"
      className="fixed bottom-5 left-5 z-70 grid size-12 place-items-center rounded-full border border-[#d5e8df] bg-white text-[#0f7b62] shadow-[0_10px_28px_rgba(13,53,44,.18)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7b62] max-[620px]:bottom-[72px] max-[620px]:left-3"
      data-tour="help-launcher"
      onClick={openChecklist}
      type="button"
    >
      <CircleHelp aria-hidden="true" size={22} strokeWidth={2} />
    </button>
  );
}
