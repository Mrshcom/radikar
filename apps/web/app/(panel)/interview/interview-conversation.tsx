"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

function SentTime({ value }: { value?: string }) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (
    <time dateTime={value} className="absolute right-0 top-full whitespace-nowrap text-[9px] leading-3 text-[#899793] opacity-0 transition-opacity group-hover:opacity-100">
      {new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(date)}
    </time>
  );
}

export function InterviewConversation({
  ready = true,
  readinessMessages = [],
  questions,
  answers,
  answerSentAt,
  replies,
  clarifications,
  currentIndex,
  pending,
  intro,
  children,
}: {
  ready?: boolean;
  readinessMessages?: Array<{ text: string; sentAt: string }>;
  questions: string[];
  answers: string[];
  answerSentAt?: string[];
  replies: string[];
  clarifications: Array<{ questionIndex: number; user: string; reply: string; sentAt?: string }>;
  currentIndex: number;
  pending?: boolean;
  intro: string;
  children: ReactNode;
}) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const scrollToLatest = () => {
    const messages = messagesRef.current;
    if (!messages) return;
    messages.scrollTop = messages.scrollHeight;
    isNearBottomRef.current = true;
  };

  useLayoutEffect(() => {
    if (isNearBottomRef.current) scrollToLatest();
  }, [questions, answers, replies, clarifications, readinessMessages, currentIndex, pending]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#dce8e1] bg-white shadow-[0_18px_48px_rgba(27,55,50,.09)]">
      <div
        ref={messagesRef}
        onScroll={(event) => {
          const messages = event.currentTarget;
          isNearBottomRef.current = messages.scrollHeight - messages.scrollTop - messages.clientHeight <= 80;
        }}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-white px-4 py-6 text-right sm:px-6"
        role="log"
        aria-label="گفت‌وگوی مصاحبه"
      >
        <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#304c40] mb-4">{intro}</p>
        {readinessMessages.map((message, index) => (
          <div key={`ready-${index}`} className="group relative flex justify-start">
            <div className="max-w-[88%]">
              <p className="m-0 whitespace-pre-wrap rounded-xl bg-[#e9f4ee] px-4 py-1 text-sm leading-7 text-[#243c32]">
                {message.text}
              </p>
              <SentTime value={message.sentAt} />
            </div>
          </div>
        ))}
        {!ready && readinessMessages.length > 0 && (
          <p className="m-0 text-sm leading-7 text-[#304c40]">هر وقت آماده بودی، بگو «آره» تا شروع کنیم.</p>
        )}
        {ready && questions.slice(0, currentIndex + 1).map((question, index) => (
          <div key={index} className="space-y-3">
              <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#243c32] mb-4">
                {index > 0 && replies[index - 1]?.trim() && (
                  <>
                    <span>{replies[index - 1]}</span>
                    <br />
                  </>
                )}
                <span>{question}</span>
              </p>
            {clarifications
              .filter((item) => item.questionIndex === index)
              .map((item, clarificationIndex) => (
                <div key={`${index}-${clarificationIndex}`} className="space-y-3">
                  <div className="group relative flex justify-start">
                    <div className="max-w-[88%]">
                      <p className="m-0 whitespace-pre-wrap rounded-2xl bg-[#e9f4ee] px-4 py-3 text-sm leading-7 text-[#243c32]">
                        {item.user}
                      </p>
                      <SentTime value={item.sentAt} />
                    </div>
                  </div>
                  <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#304c40]">{item.reply}</p>
                </div>
              ))}
            {answers[index]?.trim() && (
              <div className="group relative flex justify-start">
                <div className="max-w-[88%]">
                  <p className="m-0 whitespace-pre-wrap rounded-2xl bg-[#e9f4ee] px-4 py-1 text-sm leading-7 text-[#243c32]">
                    {answers[index]}
                  </p>
                  <SentTime value={answerSentAt?.[index]} />
                </div>
              </div>
            )}
            {replies[index]?.trim() && (index === currentIndex || !questions[index + 1]) && (
              <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#304c40]">{replies[index]}</p>
            )}
          </div>
        ))}
        {pending && (
          <div role="status" className="mt-10 text-right text-xs text-[#0f7b62]">
            <span className="bg-[linear-gradient(90deg,#718b80_35%,#c9e3d6_50%,#718b80_65%)] bg-[length:250%_100%] bg-clip-text text-transparent animate-[interview-text-shimmer_2.4s_linear_infinite] motion-reduce:animate-none motion-reduce:text-[#0f7b62]">
              مصاحبه‌گر در حال بررسی پاسخ شماست...
            </span>
          </div>
        )}
      </div>
      <div
        className="shrink-0 border-t border-[#e8eee9] bg-white p-4 sm:p-5"
        onSubmitCapture={scrollToLatest}
        onClickCapture={(event) => {
          if (event.target instanceof Element && event.target.closest('button[type="button"]')) scrollToLatest();
        }}
      >
        {children}
      </div>
    </div>
  );
}
