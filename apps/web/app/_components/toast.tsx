"use client";

import { CheckCircle2, CircleAlert, Info } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ToastVariant = "success" | "error" | "info";
type ToastState = { message: string; variant: ToastVariant };
type ToastNotifier = (message: string, variant?: ToastVariant) => void;

const ToastContext = createContext<ToastNotifier>(() => undefined);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const notify = useCallback<ToastNotifier>(
    (message, variant = "success") => setToast({ message, variant }),
    [],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
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
