"use client";

import Image from "next/image";
import { Bot } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

function SentTime({ value }: { value?: string }) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (
    <time dateTime={value} className="absolute right-[calc(100%+0.5rem)] bottom-1 whitespace-nowrap text-[9px] leading-3 text-[#899793] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      {new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(date)}
    </time>
  );
}

function ChatMessage({
  kind,
  sentAt,
  children,
  className = "",
}: {
  kind: "user" | "agent";
  sentAt?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`group relative flex justify-start ${className}`}>
      <span
        aria-label={kind === "user" ? "کاربر" : "مصاحبه‌گر"}
        className="absolute right-0 top-1 grid size-7 scale-90 place-items-center overflow-hidden rounded-full bg-[#e7f5ee] text-[#0f7b62] opacity-0 transition-[opacity,transform] duration-200 group-hover:scale-100 group-hover:opacity-100"
      >
        {kind === "user" ? (
          <Image alt="" src="/illustrations/default-profile-avatar.svg" width={28} height={28} className="size-full" />
        ) : (
          <Bot aria-hidden="true" size={17} />
        )}
      </span>
      <div className="relative max-w-[calc(100%-5rem)] transition-transform duration-200 ease-out group-hover:-translate-x-9 motion-reduce:transition-none">
        {children}
        <SentTime value={sentAt} />
      </div>
    </div>
  );
}

export function InterviewConversation({
  ready = true,
  readinessMessages = [],
  questions,
  answers,
  answerSentAt,
  replies,
  replySentAt,
  clarifications,
  currentIndex,
  pending,
  intro,
  introSentAt,
  firstQuestionSentAt,
  children,
}: {
  ready?: boolean;
  readinessMessages?: Array<{ text: string; sentAt: string }>;
  questions: string[];
  answers: string[];
  answerSentAt?: string[];
  replies: string[];
  replySentAt?: string[];
  clarifications: Array<{ questionIndex: number; user: string; reply: string; sentAt?: string; replySentAt?: string }>;
  currentIndex: number;
  pending?: boolean;
  intro: string;
  introSentAt?: string;
  firstQuestionSentAt?: string;
  children: ReactNode;
}) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [visibleReadyAt, setVisibleReadyAt] = useState(firstQuestionSentAt);
  const showFirstQuestion = !firstQuestionSentAt || visibleReadyAt === firstQuestionSentAt;
  const scrollToLatest = () => {
    const messages = messagesRef.current;
    if (!messages) return;
    messages.scrollTop = messages.scrollHeight;
    isNearBottomRef.current = true;
  };

  useLayoutEffect(() => {
    if (isNearBottomRef.current) scrollToLatest();
  }, [questions, answers, replies, clarifications, readinessMessages, currentIndex, pending, showFirstQuestion]);

  useEffect(() => {
    if (!ready || showFirstQuestion) return;
    const timeout = window.setTimeout(() => setVisibleReadyAt(firstQuestionSentAt), 700);
    return () => window.clearTimeout(timeout);
  }, [ready, showFirstQuestion, firstQuestionSentAt]);

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#dce8e1] bg-white shadow-[0_18px_48px_rgba(27,55,50,.09)]">
      <div
        ref={messagesRef}
        onCopyCapture={(event) => event.preventDefault()}
        onCutCapture={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        onScroll={(event) => {
          const messages = event.currentTarget;
          isNearBottomRef.current = messages.scrollHeight - messages.scrollTop - messages.clientHeight <= 80;
        }}
        className="min-h-0 flex-1 select-none space-y-3 overflow-y-auto bg-white px-4 py-6 text-right sm:px-6"
        role="log"
        aria-label="گفت‌وگوی مصاحبه"
      >
        <ChatMessage kind="agent" sentAt={introSentAt} className="mb-4">
          <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#304c40]">{intro}</p>
        </ChatMessage>
        {readinessMessages.map((message, index) => (
          <ChatMessage key={`ready-${index}`} kind="user" sentAt={message.sentAt}>
            <p className="m-0 whitespace-pre-wrap rounded-xl bg-[#e9f4ee] px-4 py-1 text-sm leading-7 text-[#243c32]">
              {message.text}
            </p>
          </ChatMessage>
        ))}
        {!ready && readinessMessages.length > 0 && (
          <ChatMessage kind="agent" sentAt={readinessMessages[readinessMessages.length - 1]?.sentAt}>
            <p className="m-0 text-sm leading-7 text-[#304c40]">هر وقت آماده بودی، بگو «آره» تا شروع کنیم.</p>
          </ChatMessage>
        )}
        {ready && readinessMessages.length > 0 && (
          <ChatMessage kind="agent" sentAt={firstQuestionSentAt}>
            <p className="m-0 text-sm leading-7 text-[#304c40]">
              اوکی، حالا که آماده‌ای، بگذار مصاحبه را شروع کنیم.
            </p>
          </ChatMessage>
        )}
        {ready && showFirstQuestion && questions.slice(0, currentIndex + 1).map((question, index) => (
          <div key={index} className="space-y-3">
            <ChatMessage kind="agent" sentAt={index === 0 ? firstQuestionSentAt : replySentAt?.[index - 1]} className="mb-4">
              <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#243c32]">
                {index > 0 && replies[index - 1]?.trim() && (
                  <>
                    <span>{replies[index - 1]}</span>
                    <br />
                  </>
                )}
                <span>{question}</span>
              </p>
            </ChatMessage>
            {clarifications
              .filter((item) => item.questionIndex === index)
              .map((item, clarificationIndex) => (
                <div key={`${index}-${clarificationIndex}`} className="space-y-3">
                  <ChatMessage kind="user" sentAt={item.sentAt}>
                    <p className="m-0 whitespace-pre-wrap rounded-2xl bg-[#e9f4ee] px-4 py-3 text-sm leading-7 text-[#243c32]">
                      {item.user}
                    </p>
                  </ChatMessage>
                  {item.reply.trim() && (
                    <ChatMessage kind="agent" sentAt={item.replySentAt}>
                      <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#304c40]">{item.reply}</p>
                    </ChatMessage>
                  )}
                </div>
              ))}
            {answers[index]?.trim() && (
              <ChatMessage kind="user" sentAt={answerSentAt?.[index]}>
                <p className="m-0 whitespace-pre-wrap rounded-2xl bg-[#e9f4ee] px-4 py-1 text-sm leading-7 text-[#243c32]">
                  {answers[index]}
                </p>
              </ChatMessage>
            )}
            {replies[index]?.trim() && (index === currentIndex || !questions[index + 1]) && (
              <ChatMessage kind="agent" sentAt={replySentAt?.[index]}>
                <p className="m-0 whitespace-pre-wrap text-sm leading-7 text-[#304c40]">{replies[index]}</p>
              </ChatMessage>
            )}
          </div>
        ))}
      </div>
      <div
        className="shrink-0 bg-white p-4 sm:p-5"
        onSubmitCapture={scrollToLatest}
        onClickCapture={(event) => {
          if (event.target instanceof Element && event.target.closest('button[type="button"]')) scrollToLatest();
        }}
      >
        {pending && (
          <div role="status" className="mb-5 text-right text-xs text-[#0f7b62]">
            <span className="bg-[linear-gradient(90deg,#718b80_35%,#c9e3d6_50%,#718b80_65%)] bg-[length:250%_100%] bg-clip-text text-transparent animate-[interview-text-shimmer_2.4s_linear_infinite] motion-reduce:animate-none motion-reduce:text-[#0f7b62]">
              مصاحبه‌گر در حال بررسی پاسخ شماست...
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
