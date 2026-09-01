"use client";

import { ArrowLeft, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import {
  ApiError,
  clearPendingPlanUpgradeMessage,
  getPendingPlanUpgradeMessage,
  PLAN_UPGRADE_REQUIRED_EVENT,
  type PlanUpgradeRequiredEventDetail,
} from "@/lib/api-client";
import { Modal } from "@/app/(panel)/_components/ui";

type ToastVariant = "success" | "error" | "info";
type ToastState = { message: string; variant: ToastVariant };
type ToastNotifier = (message: string, variant?: ToastVariant) => void;

const ToastContext = createContext<ToastNotifier>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [toast, setToast] = useState<ToastState | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const upgradeMessageRef = useRef<string | null>(null);
  const notify = useCallback<ToastNotifier>(
    (message, variant = "success") => {
      if (variant === "error" && message === upgradeMessageRef.current) return;
      setToast({ message, variant });
    },
    [],
  );

  const closeUpgradeModal = useCallback(() => {
    clearPendingPlanUpgradeMessage();
    upgradeMessageRef.current = null;
    setUpgradeMessage(null);
  }, []);

  const openPlans = useCallback(() => {
    closeUpgradeModal();
    router.push("/upgrade");
  }, [closeUpgradeModal, router]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const showUnexpectedError = () =>
      setToast({
        message: "خطای پیش‌بینی‌نشده‌ای رخ داد؛ لطفاً دوباره تلاش کنید.",
        variant: "error",
      });
    const handleWindowError = () => showUnexpectedError();
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof ApiError && event.reason.status === 402) return;
      showUnexpectedError();
    };
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  useEffect(() => {
    const showUpgradeModal = (message: string) => {
      upgradeMessageRef.current = message;
      setToast(null);
      setUpgradeMessage(message);
    };
    const handleUpgradeRequired = (event: Event) => {
      const detail = (event as CustomEvent<PlanUpgradeRequiredEventDetail>)
        .detail;
      if (detail?.message) showUpgradeModal(detail.message);
    };
    window.addEventListener(
      PLAN_UPGRADE_REQUIRED_EVENT,
      handleUpgradeRequired,
    );
    const pendingMessage = getPendingPlanUpgradeMessage();
    if (pendingMessage) showUpgradeModal(pendingMessage);
    return () =>
      window.removeEventListener(
        PLAN_UPGRADE_REQUIRED_EVENT,
        handleUpgradeRequired,
      );
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {upgradeMessage && (
        <Modal
          title="برای ادامه پلن را ارتقا دهید"
          description={upgradeMessage}
          onClose={closeUpgradeModal}
          showCloseButton
        >
          <p className="mb-0 mt-4 rounded-[11px] border border-[#dcebe5] bg-[#f3faf7] px-4 py-3 text-[12px] leading-8 text-[#526461]">
            برای ادامه، لطفاً پلن فعلی خود را ارتقا دهید.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#dfe5df] bg-white px-4 text-[12px] font-bold text-[#526461] hover:bg-[#f7f9f7]"
              type="button"
              onClick={closeUpgradeModal}
            >
              فعلاً نه
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#0f7b62] bg-[#0f7b62] px-4 text-[12px] font-bold text-white transition-colors hover:bg-[#0c6b55]"
              type="button"
              onClick={openPlans}
            >
              مشاهده و ارتقای پلن
              <ArrowLeft size={16} />
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 left-6 z-100 flex min-h-12 max-w-[min(380px,calc(100vw-32px))] items-center gap-[9px] rounded-xl border px-[15px] py-3 text-[12px] font-semibold shadow-[0_15px_45px_rgba(22,63,55,.16)] print:hidden max-[820px]:bottom-20 max-[820px]:left-4",
            toast.variant === "error"
              ? "border-[#efc9c5] bg-[#fff1ef] text-[#a13f37]"
              : toast.variant === "info"
                ? "border-[#cbdde9] bg-[#f1f7fb] text-[#38677f]"
                : "border-[#c9e5da] bg-[#eff9f4] text-[#176b57]",
          )}
          role={toast.variant === "error" ? "alert" : "status"}
          aria-live={toast.variant === "error" ? "assertive" : "polite"}
        >
          {toast.variant === "error" ? (
            <CircleAlert size={19} />
          ) : toast.variant === "info" ? (
            <Info size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
