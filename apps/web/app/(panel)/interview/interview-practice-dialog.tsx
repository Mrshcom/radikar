"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, LogOut, Sparkles, X } from "lucide-react";
import { HoverTooltip } from "../_components/hover-tooltip";
import { ModelThinkingOrb } from "../_components/model-thinking-orb";

type InterviewPracticeDialogProps = {
  title: string;
  closeDisabled?: boolean;
  analysisPending?: boolean;
  exitDescription?: string;
  exitConfirmLabel?: string;
  onClose: () => void;
  children: ReactNode;
};

export function InterviewPracticeDialog({
  title,
  closeDisabled = false,
  analysisPending = false,
  exitDescription = "پاسخ‌های فعلی‌ات ذخیره می‌شوند و بعداً می‌توانی مصاحبه را ادامه بدهی.",
  exitConfirmLabel = "ذخیره و خروج",
  onClose,
  children,
}: InterviewPracticeDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  const analysisPendingRef = useRef(analysisPending);

  const requestClose = () => {
    if (!closeDisabledRef.current) {
      confirmOpenRef.current = true;
      setConfirmOpen(true);
    }
  };

  const cancelClose = () => {
    confirmOpenRef.current = false;
    returnFocusRef.current = true;
    setConfirmOpen(false);
  };

  const confirmClose = () => {
    confirmOpenRef.current = false;
    setConfirmOpen(false);
    onCloseRef.current();
  };

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
    analysisPendingRef.current = analysisPending;
    if (analysisPending) analysisRef.current?.focus();
  }, [onClose, closeDisabled, analysisPending]);

  useEffect(() => {
    if (confirmOpen) confirmRef.current?.querySelector<HTMLElement>("button")?.focus();
    else if (returnFocusRef.current) {
      returnFocusRef.current = false;
      closeButtonRef.current?.focus();
    }
  }, [confirmOpen]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstButton = dialogRef.current?.querySelector<HTMLElement>("button:not(:disabled)");
    (firstButton ?? dialogRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (confirmOpenRef.current) cancelClose();
        else requestClose();
        return;
      }
      if (event.key !== "Tab") return;
      if (confirmOpenRef.current) {
        const buttons = Array.from(confirmRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
        if (!buttons.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (analysisPendingRef.current) {
        event.preventDefault();
        analysisRef.current?.focus();
        return;
      }
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-[#f8f9f5]" dir="rtl">
      <Image
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        src="/illustrations/radikar-interview-room-v2.png"
        className="pointer-events-none object-contain object-center opacity-[0.12]"
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-dialog-title"
        aria-busy={analysisPending}
        tabIndex={-1}
        className="relative flex h-dvh flex-col outline-none"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_22%,rgba(202,232,215,.45),transparent_36%),radial-gradient(circle_at_90%_84%,rgba(244,229,198,.3),transparent_34%)]"
        />
        <header
          className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-[#e1e9e2] bg-white/90 px-5 py-4 shadow-[0_8px_30px_rgba(27,55,50,.035)] backdrop-blur-xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,transparent,#a9d9c1,transparent)] sm:px-8"
          inert={confirmOpen}
        >
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0f7b62]">
              <Sparkles size={13} /> فضای مصاحبه
            </span>
            <h2 id="interview-dialog-title" className="m-0 truncate text-base font-bold text-[#19312f] sm:text-lg">
              {title}
            </h2>
          </div>
          <HoverTooltip
            key={confirmOpen ? "confirm-open" : "confirm-closed"}
            content={confirmOpen ? null : "خروج از مصاحبه"}
            showOnFocus={false}
          >
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="خروج از مصاحبه"
              disabled={closeDisabled}
              onClick={requestClose}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#e1e9e2] bg-white text-[#526461] transition-colors hover:bg-[#edf6ef] disabled:cursor-wait disabled:opacity-45"
            >
              <X size={20} />
            </button>
          </HoverTooltip>
        </header>
        <div
          className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10"
          aria-hidden={analysisPending}
          inert={analysisPending || confirmOpen}
        >
          {children}
        </div>
        {analysisPending && (
          <div
            ref={analysisRef}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-[#f7f9f6]/90 px-6 text-center backdrop-blur-md"
            role="status"
            aria-live="polite"
            tabIndex={-1}
          >
            <span className="relative grid size-24 place-items-center">
              <ModelThinkingOrb label="در حال تحلیل پاسخ‌های مصاحبه" />
            </span>
            <div className="max-w-lg">
              <h3 className="m-0 text-xl font-bold text-[#19312f] sm:text-2xl">در حال تحلیل مصاحبهٔ تو هستیم</h3>
              <p className="mb-0 mt-3 text-sm leading-8 text-[#61746f]">
                پاسخ‌هایت را بررسی می‌کنیم تا امتیاز، نقاط قوت و پیشنهادهای بهبود را در گزارش نهایی نشان دهیم.
              </p>
            </div>
          </div>
        )}
        {confirmOpen && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-[#19312f]/45 px-4 backdrop-blur-sm">
            <div
              ref={confirmRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="interview-exit-title"
              aria-describedby="interview-exit-description"
              className="w-full max-w-md rounded-[24px] border border-white/70 bg-white p-6 text-right shadow-[0_28px_80px_rgba(10,38,33,.22)] sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff2e3] text-[#a96724]">
                  <LogOut size={24} strokeWidth={1.8} />
                </span>
                <h3 id="interview-exit-title" className="m-0 text-xl font-bold text-[#19312f]">
                  از مصاحبه خارج می‌شوی؟
                </h3>
              </div>
              <p id="interview-exit-description" className="mb-0 mt-3 text-sm leading-7 text-[#61746f]">
                {exitDescription}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={cancelClose}
                  className="min-h-11 flex-1 rounded-xl border border-[#dfe5df] bg-white px-5 text-sm font-bold text-[#526461] transition-colors hover:bg-[#f4f7f5]"
                >
                  ادامهٔ مصاحبه
                </button>
                <button
                  type="button"
                  onClick={confirmClose}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f7b62] px-5 text-sm font-bold text-white transition-colors hover:bg-[#0c6b55]"
                >
                  {exitConfirmLabel} <ArrowLeft size={17} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
