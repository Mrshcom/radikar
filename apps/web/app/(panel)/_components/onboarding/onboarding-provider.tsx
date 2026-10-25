"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, CircleHelp, Map, X } from "lucide-react";
import { EVENTS, Joyride, ORIGIN, STATUS, type Step, type TooltipRenderProps } from "react-joyride";
import {
  authQueryKey,
  useAuth,
  type CurrentUser,
  type OnboardingState,
  type OnboardingStepId,
} from "@/app/_components/auth";
import { apiRequest } from "@/lib/api-client";
import { OnboardingChecklistModal } from "./onboarding-checklist";

const onboardingSteps: readonly OnboardingStepId[] = [
  "profile",
  "match",
  "resume",
  "application",
  "referral",
  "interview",
];

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
type TourDirection = 1 | -1;
type TourNavigationContextValue = {
  direction: TourDirection;
  moveToNextStep: (direction: TourDirection) => void;
  closeTour: () => void;
};
const TourNavigationContext = createContext<TourNavigationContextValue>({
  direction: 1,
  moveToNextStep: () => undefined,
  closeTour: () => undefined,
});
const tourFloatingOptions = { hideArrow: true };
type TourTailSide = "top" | "right" | "bottom" | "left";
type TourTail = { side: TourTailSide; offset: number };

const userPanelTourSteps = [
  {
    target: "nav-dashboard",
    title: "نمای کلی مسیر",
    content: "وضعیت مهم مسیر شغلی‌ات را از اینجا یک‌جا می‌بینی.",
  },
  {
    target: "nav-profile",
    title: "پروفایل مسیر شغلی",
    content: "تجربه‌ها، توانمندی‌ها و هدف‌هایت را ثبت و به‌روز کن.",
  },
  {
    target: "nav-jobs",
    title: "فرصت‌های مناسب من",
    content: "فرصت‌های شغلی مناسب مسیرت را بررسی کن.",
  },
  {
    target: "nav-match",
    title: "تحلیل تطابق",
    content: "رزومه و آگهی را مقایسه کن تا برای اقدام بعدی دقیق‌تر تصمیم بگیری.",
  },
  {
    target: "nav-resumes",
    title: "رزومه‌های هدفمند",
    content: "برای هر فرصت، رزومه‌ای متناسب با همان موقعیت بساز.",
  },
  {
    target: "nav-applications",
    title: "پیگیری اپلای‌ها",
    content: "وضعیت درخواست‌ها و قدم بعدی هر اپلای را دنبال کن.",
  },
  {
    target: "nav-interview",
    title: "آمادگی مصاحبه",
    content: "مصاحبهٔ تمرینی انجام بده و گزارش شخصی‌سازی‌شده بگیر.",
  },
] as const;

function buildTourSteps(): Step[] {
  const isMobile = window.matchMedia("(max-width: 820px)").matches;
  if (isMobile) {
    return [
      {
        target: "[data-tour='mobile-panel-menu']",
        title: "همهٔ بخش‌های پنل",
        content: "از این منو به بخش‌های اصلی مسیر شغلی، از پروفایل و فرصت‌ها تا مصاحبه، دسترسی داری.",
        placement: "top",
        floatingOptions: tourFloatingOptions,
        offset: 28,
      },
      {
        target: "[data-tour='account-menu']",
        title: "منوی حساب کاربری",
        content: "مرکز حساب، کیف پول و تازه‌های رادیکار را از این منو باز کن.",
        placement: "top",
        floatingOptions: tourFloatingOptions,
        offset: 28,
      },
    ];
  }

  return [
    ...userPanelTourSteps.map((step) => ({
      ...step,
      target: `[data-tour='${step.target}']`,
      placement: "left" as const,
      floatingOptions: tourFloatingOptions,
      offset: 28,
    })),
    {
      target: "[data-tour='account-menu']",
      title: "منوی حساب کاربری",
      content: "مرکز حساب، کیف پول و تازه‌های رادیکار را از این منو باز کن.",
      placement: "bottom",
      floatingOptions: tourFloatingOptions,
      offset: 20,
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
  const shouldReduceMotion = useReducedMotion();
  const { closeTour, direction, moveToNextStep } = useContext(TourNavigationContext);
  const slideDistance = direction * 24;
  const isTopPlacement = step.placement === "top";
  const target = step.target;
  const tooltipRef = useRef<HTMLElement>(null);
  const [tail, setTail] = useState<TourTail>({ side: isTopPlacement ? "bottom" : "right", offset: 28 });
  const tailClasses: Record<TourTailSide, string> = {
    top: "-top-4 h-4 w-8",
    right: "-right-4 h-8 w-4",
    bottom: "-bottom-4 h-4 w-8",
    left: "-left-4 h-8 w-4",
  };
  const tailPoints: Record<TourTailSide, string> = {
    top: "0,16 16,0 32,16",
    right: "0,0 16,16 0,32",
    bottom: "0,0 16,16 32,0",
    left: "16,0 0,16 16,32",
  };
  const tailBorderClasses: Record<TourTailSide, string> = {
    top: "border-t-0",
    right: "border-r-0",
    bottom: "border-b-0",
    left: "border-l-0",
  };
  const tailPosition: CSSProperties =
    tail.side === "top" || tail.side === "bottom" ? { left: tail.offset } : { top: tail.offset };

  useEffect(() => {
    const updateTailPosition = () => {
      const tooltip = tooltipRef.current;
      const targetElement =
        typeof target === "string"
          ? document.querySelector(target)
          : typeof target === "function"
            ? target()
            : target instanceof Element
              ? target
              : target.current;
      if (!tooltip || !targetElement) return;

      const tooltipRect = tooltip.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const horizontalDistance = targetRect.left + targetRect.width / 2 - (tooltipRect.left + tooltipRect.width / 2);
      const verticalDistance = targetRect.top + targetRect.height / 2 - (tooltipRect.top + tooltipRect.height / 2);
      const side: TourTailSide =
        Math.abs(horizontalDistance) > Math.abs(verticalDistance)
          ? horizontalDistance > 0
            ? "right"
            : "left"
          : verticalDistance > 0
            ? "bottom"
            : "top";
      const rawOffset =
        side === "top" || side === "bottom"
          ? targetRect.left + targetRect.width / 2 - tooltipRect.left - 16
          : targetRect.top + targetRect.height / 2 - tooltipRect.top - 16;
      const limit = side === "top" || side === "bottom" ? tooltipRect.width : tooltipRect.height;
      const offset = Math.max(24, Math.min(rawOffset, limit - 56));

      setTail((current) =>
        current.side === side && Math.abs(current.offset - offset) < 1 ? current : { side, offset },
      );
    };

    const frame = window.requestAnimationFrame(updateTailPosition);
    window.addEventListener("resize", updateTailPosition);
    window.addEventListener("scroll", updateTailPosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTailPosition);
      window.removeEventListener("scroll", updateTailPosition, true);
    };
  }, [index, target]);

  const runStepTransition =
    (handler: TooltipRenderProps["primaryProps"]["onClick"], nextDirection: TourDirection) =>
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      const viewTransitionDocument = document as Document & {
        startViewTransition?: (updateCallback: () => void) => unknown;
      };
      const updateStep = () => {
        flushSync(() => {
          handler(event);
          moveToNextStep(nextDirection);
        });
      };

      if (shouldReduceMotion || !viewTransitionDocument.startViewTransition) {
        updateStep();
        return;
      }

      viewTransitionDocument.startViewTransition(updateStep);
    };

  return (
    <motion.section
      {...tooltipProps}
      ref={tooltipRef}
      dir="rtl"
      className={`[view-transition-name:radikar-tour-tooltip] w-[min(340px,calc(100vw-32px))] rounded-[18px] border border-[#d8e7e0] bg-white p-4 text-right shadow-[0_20px_55px_rgba(13,53,44,.24)] ${tailBorderClasses[tail.side]}`}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <svg
        aria-hidden="true"
        className={`pointer-events-none absolute text-white ${tailClasses[tail.side]}`}
        style={tailPosition}
        viewBox={tail.side === "top" || tail.side === "bottom" ? "0 0 32 16" : "0 0 16 32"}
      >
        <polygon fill="currentColor" points={tailPoints[tail.side]} />
      </svg>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={index}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.985, x: -slideDistance }}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985, x: slideDistance }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start gap-3">
            <motion.span
              animate={shouldReduceMotion ? undefined : { scale: [1, 1.08, 1] }}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e5f4ed] text-[#0f7b62]"
              transition={{ delay: 0.08, duration: 0.36, ease: "easeOut" }}
            >
              <Map size={18} />
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[10px] font-bold text-[#0f7b62]">
                {`${(index + 1).toLocaleString("fa-IR")} از ${size.toLocaleString("fa-IR")}`}
              </p>
              {step.title && <h2 className="mb-1 mt-1 text-[13px] text-[#19312f]">{step.title}</h2>}
              <div className="text-[12px] leading-6 text-[#667672]">{step.content}</div>
            </div>
            <button
              {...closeProps}
              className="grid size-7 shrink-0 place-items-center rounded-lg border border-[#e5ebe7] bg-white text-[#80908c] hover:bg-[#f3f7f4]"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                closeTour();
              }}
              type="button"
            >
              <X size={15} />
            </button>
          </div>
          <footer className="mt-4 flex items-center justify-between gap-2 border-t border-[#edf1ee] pt-3">
            <button
              {...skipProps}
              className="border-0 bg-transparent px-1 py-2 text-[10px] text-[#7a8985] hover:text-[#19312f]"
              type="button"
            >
              رد کردن
            </button>
            <div className="flex items-center gap-2">
              {index > 0 && (
                <motion.button
                  {...backProps}
                  className="rounded-[9px] border border-[#dfe7e2] bg-white px-3 py-2 text-[10px] font-bold text-[#61716d]"
                  onClick={runStepTransition(backProps.onClick, -1)}
                  type="button"
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
                >
                  قبلی
                </motion.button>
              )}
              <motion.button
                {...primaryProps}
                className="inline-flex items-center gap-1 rounded-[9px] bg-[#0f7b62] px-3 py-2 text-[10px] font-bold text-white shadow-[0_6px_16px_rgba(15,123,98,.2)]"
                onClick={
                  isLastStep
                    ? (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        closeTour();
                      }
                    : runStepTransition(primaryProps.onClick, 1)
                }
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              >
                {isLastStep ? "شروع مسیر" : "بعدی"} <ChevronLeft size={13} />
              </motion.button>
            </div>
          </footer>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [checklistOpenedManually, setChecklistOpenedManually] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourDirection, setTourDirection] = useState<TourDirection>(1);
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
  const moveToNextStep = useCallback(
    (direction: TourDirection) => {
      setTourDirection(direction);
      setTourStepIndex((current) => {
        const next = current + direction;
        return next >= 0 && next < tourSteps.length ? next : current;
      });
    },
    [tourSteps.length],
  );
  const closeTour = useCallback(() => {
    setTourRunning(false);
    setTourStepIndex(0);
    setTourDirection(1);
  }, []);
  const startTour = useCallback(() => {
    if (!state) return;
    setChecklistDismissed(true);
    setChecklistOpenedManually(false);
    setTourSteps(buildTourSteps());
    setTourStepIndex(0);
    setTourDirection(1);
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
      <TourNavigationContext.Provider value={{ closeTour, direction: tourDirection, moveToNextStep }}>
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
            if (
              event.origin === ORIGIN.OVERLAY ||
              event.type === EVENTS.TOUR_END ||
              event.status === STATUS.FINISHED ||
              event.status === STATUS.SKIPPED
            ) {
              closeTour();
            }
          }}
          options={{
            overlayClickAction: "close",
            overlayColor: "rgba(9, 41, 34, .64)",
            primaryColor: "#0f7b62",
            showProgress: true,
            spotlightPadding: 7,
            zIndex: 90,
            skipBeacon: true,
          }}
          run={tourRunning}
          scrollToFirstStep
          stepIndex={tourStepIndex}
          steps={tourSteps}
          tooltipComponent={TourTooltip}
        />
      </TourNavigationContext.Provider>
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
      className="fixed bottom-5 left-5 z-70 grid size-14 place-items-center rounded-full bg-[#0f7b62] text-white shadow-[0_14px_32px_rgba(15,123,98,.38)] ring-4 ring-[#0f7b62]/15 transition hover:scale-105 hover:bg-[#0b684f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7b62] max-[620px]:bottom-[72px] max-[620px]:left-3"
      data-tour="help-launcher"
      onClick={openChecklist}
      type="button"
    >
      <CircleHelp aria-hidden="true" size={26} strokeWidth={2.25} />
    </button>
  );
}
