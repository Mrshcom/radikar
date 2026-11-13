"use client";

import { useEffect, useRef, type FormEvent, type ReactNode, type RefObject } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { LoaderCircle, SendHorizontal } from "lucide-react";
import { submitInterviewAnswerOnEnter } from "./interview-answer-keyboard";

type InterviewAnswerComposerProps = {
  registration: UseFormRegisterReturn<"answer">;
  answer: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  busy: boolean;
  readOnly?: boolean;
  sending?: boolean;
  sendLabel?: string;
  ariaLabel?: string;
  error?: string;
  notice?: ReactNode;
  footer?: ReactNode;
  restrictClipboard?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
};

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "48px";
  textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
}

export function InterviewAnswerComposer({
  registration,
  answer,
  onSubmit,
  busy,
  readOnly = false,
  sending = false,
  sendLabel = "ارسال پاسخ",
  ariaLabel = "پاسخ مصاحبه",
  error,
  notice,
  footer,
  restrictClipboard = false,
  textareaRef,
}: InterviewAnswerComposerProps) {
  const localTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    resizeTextarea(localTextareaRef.current);
  }, [answer]);

  return (
    <form onSubmit={onSubmit}>
      {notice}
      <div className="relative">
        <textarea
          id="interview-answer"
          {...registration}
          rows={1}
          autoComplete="off"
          ref={(element) => {
            registration.ref(element);
            localTextareaRef.current = element;
            if (textareaRef) textareaRef.current = element;
            resizeTextarea(element);
          }}
          className="block h-12 min-h-12 w-full resize-none overflow-hidden rounded-[10px] border border-[#dfe6e0] bg-[#fcfdfb] py-2 pl-14 pr-3 text-[13px] leading-5 text-[#405753] outline-none placeholder:text-[#9aa7a3] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10 disabled:opacity-60"
          readOnly={readOnly}
          onInput={(event) => resizeTextarea(event.currentTarget)}
          onPaste={(event) => event.preventDefault()}
          onDrop={(event) => event.preventDefault()}
          onCopy={restrictClipboard ? (event) => event.preventDefault() : undefined}
          onCut={restrictClipboard ? (event) => event.preventDefault() : undefined}
          onContextMenu={restrictClipboard ? (event) => event.preventDefault() : undefined}
          onKeyDown={(event) => submitInterviewAnswerOnEnter(event, busy)}
          maxLength={8_000}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "interview-answer-error" : undefined}
          placeholder="پاسخت را بنویس..."
        />
        <button
          className="absolute left-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg bg-[#0f7b62] text-white shadow-[0_4px_10px_rgba(15,123,98,.16)] transition-colors hover:bg-[#0d6b57] disabled:cursor-not-allowed disabled:bg-[#d7e4de] disabled:text-[#8ba39a] disabled:shadow-none"
          type="submit"
          disabled={!answer.trim() || busy}
          aria-label={sendLabel}
          title={sendLabel}
        >
          {sending ? (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" size={15} aria-hidden="true" />
          ) : (
            <SendHorizontal className="-scale-x-100" size={15} aria-hidden="true" />
          )}
        </button>
      </div>
      {error && <p id="interview-answer-error" role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[8px] text-[#61746f]">Enter برای ارسال · Shift+Enter برای خط بعد</p>
        {footer}
      </div>
    </form>
  );
}
