"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { InterviewReport } from "@radikar/shared-types";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  CircleUserRound,
  Clock3,
  FileCheck2,
  MessageSquareText,
  Sparkles,
  X,
  LoaderCircle,
} from "lucide-react";
import { InterviewSkeleton } from "../_components/skeletons";
import { useToast } from "@/app/_components/toast";
import { TextAreaField } from "@/app/_components/text-field";
import { FormField } from "../_components/form-field";
import { isModelTaskCanceledError, useModelTasks } from "../_components/model-task-provider";
import {
  createRecordId,
  getActiveProfileId,
  getLatestResume,
  interviewSessionStore,
  knowledgeProfileStore,
} from "@/lib/data/stores";
import type { InterviewSessionRecord } from "@/lib/data/models";
import { InterviewPracticeDialog } from "./interview-practice-dialog";
import { InterviewProgress } from "./interview-progress";
import { formatPersianNumber, toPersianDigits } from "@/lib/fa-number";
import { apiRequest } from "@/lib/api-client";

type PracticeCard = { title: string; text: string; tone: string };
type SessionData = {
  title: string;
  subtitle: string;
  duration: string;
  questions: string[];
  cards: PracticeCard[];
};
const answerSchema = z.object({
  answer: z.string().trim().min(1, "ابتدا پاسخ این سؤال را بنویس.").max(8_000, "پاسخ باید حداکثر ۸۰۰۰ کاراکتر باشد."),
});
const icons = [CircleUserRound, BriefcaseBusiness, FileCheck2];
const comprehensiveMode = "مصاحبه جامع";
const focusedModePrefix = "تمرین تخصصی: ";
const isComprehensiveMode = (value: string) => value === comprehensiveMode || value === "مصاحبه شخصی‌سازی‌شده";

export default function InterviewPage() {
  const router = useRouter();
  const notify = useToast();
  const { isRunning, runModelTask } = useModelTasks();
  const [sessionRecord, setSessionRecord] = useState<InterviewSessionRecord | null>(null);
  const [completedSessions, setCompletedSessions] = useState<InterviewSessionRecord[]>([]);
  const [hasResume, setHasResume] = useState(true);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState(comprehensiveMode);
  const [answers, setAnswers] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<z.infer<typeof answerSchema>>({ resolver: zodResolver(answerSchema), defaultValues: { answer: "" } });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sessionCreationControllerRef = useRef<AbortController | null>(null);
  const isCreatingSession = creatingSession || isRunning("interview-session");
  const feedbackBusy = feedbackLoading || isRunning("interview-feedback");
  const reportMutation = useMutation({
    mutationFn: ({
      body,
      signal,
    }: {
      body: { mode: string; responses: Array<{ question: string; answer: string }> };
      signal: AbortSignal;
    }) => apiRequest<InterviewReport>("/api/interview/report", { method: "POST", body: JSON.stringify(body), signal }),
  });

  const restoreSession = useCallback(
    (record: InterviewSessionRecord) => {
      const index = Math.min(Math.max(record.currentQuestionIndex ?? 0, 0), Math.max(record.questions.length - 1, 0));
      setSessionRecord(record);
      setAnswers(record.answers ?? []);
      setQuestionIndex(index);
      reset({ answer: record.answers?.[index] ?? "" });
      setMode(record.mode);
    },
    [reset],
  );

  useEffect(() => {
    let active = true;
    const loadStoredData = async () => {
      try {
        const profileId = await getActiveProfileId();
        const [resume, knowledge, sessions] = await Promise.all([
          getLatestResume(),
          knowledgeProfileStore.get(profileId),
          interviewSessionStore.list(),
        ]);
        if (!active) return;
        setHasResume(Boolean(resume || knowledge));
        setCompletedSessions(sessions.filter((session) => Boolean(session.report)));
        const requestedId = new URLSearchParams(window.location.search).get("session");
        const requestedSession = sessions.find((session) => session.id === requestedId);
        if (requestedSession && !requestedSession.report) {
          restoreSession(requestedSession);
          setStarted(true);
        } else if (sessions[0]) restoreSession(sessions[0]);
      } catch (event) {
        if (active) {
          const message = event instanceof Error ? event.message : "خواندن جلسه‌های ذخیره‌شده ناموفق بود.";
          setError(message);
          notify(message, "error");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadStoredData();
    return () => {
      active = false;
    };
  }, [notify, restoreSession]);

  const loadSession = async (selectedMode = mode, startAfterLoad = false) => {
    const controller = new AbortController();
    sessionCreationControllerRef.current = controller;
    setCreatingSession(true);
    setError("");
    try {
      const record = await runModelTask({
        key: "interview-session",
        title: "ساخت جلسه مصاحبه",
        pendingLabel: "مدل در حال آماده‌سازی پرسش‌های مصاحبه است",
        completedLabel: "جلسه مصاحبه آماده شد",
        href: "/interview",
        run: async () => {
          const profileId = await getActiveProfileId();
          const [resume, knowledge] = await Promise.all([getLatestResume(), knowledgeProfileStore.get(profileId)]);
          const resumeData = resume?.data ?? knowledge?.resumeData;
          if (!resumeData) throw new Error("برای ساخت جلسه مصاحبه ابتدا پروفایل مسیر شغلی یا رزومه‌ات را تکمیل کن.");
          const result = await apiRequest<SessionData & { error?: string }>("/api/interview/session", {
            method: "POST",
            body: JSON.stringify({
              resume: resumeData,
              knowledge,
              mode: selectedMode,
              type: selectedMode.startsWith(focusedModePrefix) ? "focused" : "comprehensive",
              ...(selectedMode.startsWith(focusedModePrefix)
                ? { focusArea: selectedMode.slice(focusedModePrefix.length) }
                : {}),
            }),
            signal: controller.signal,
          });
          const now = new Date().toISOString();
          const record: InterviewSessionRecord = {
            id: createRecordId("interview"),
            ...result,
            mode: selectedMode,
            feedbacks: [],
            answers: [],
            currentQuestionIndex: 0,
            createdAt: now,
            updatedAt: now,
          };
          await interviewSessionStore.put(record);
          return record;
        },
      });
      restoreSession(record);
      setStarted(startAfterLoad);
    } catch (event) {
      if (isModelTaskCanceledError(event) || (event instanceof DOMException && event.name === "AbortError")) return;
      const message = event instanceof Error ? event.message : "مدل مصاحبه پاسخ نداد.";
      setError(message);
      notify(message, "error");
    } finally {
      if (sessionCreationControllerRef.current === controller) {
        sessionCreationControllerRef.current = null;
        setCreatingSession(false);
      }
    }
  };

  const startPractice = (selectedMode: string) => {
    setMode(selectedMode);
    if (!sessionRecord || sessionRecord.mode !== selectedMode) {
      void loadSession(selectedMode, true);
    } else if (sessionRecord.report) {
      router.push(`/interview/results/${sessionRecord.id}`);
    } else {
      setStarted(true);
    }
  };

  const currentQuestion = sessionRecord?.questions[questionIndex] || "";
  const lastQuestion = questionIndex === (sessionRecord?.questions.length ?? 0) - 1;
  const persistAnswers = async (answer: string, nextIndex = questionIndex) => {
    if (!sessionRecord) return;
    const nextAnswers = sessionRecord.questions.map((_, index) =>
      index === questionIndex ? answer.trim() : (answers[index] ?? ""),
    );
    const updated = {
      ...sessionRecord,
      answers: nextAnswers,
      currentQuestionIndex: nextIndex,
      updatedAt: new Date().toISOString(),
    };
    await interviewSessionStore.put(updated);
    setSessionRecord(updated);
    setAnswers(nextAnswers);
    return updated;
  };

  const moveQuestion = async (answer: string, nextIndex: number) => {
    if (!sessionRecord || nextIndex < 0 || nextIndex >= sessionRecord.questions.length) return;
    setSaving(true);
    try {
      const updated = await persistAnswers(answer, nextIndex);
      if (!updated) return;
      setQuestionIndex(nextIndex);
      reset({ answer: updated.answers[nextIndex] ?? "" });
    } catch {
      notify("ذخیرهٔ پاسخ انجام نشد؛ دوباره تلاش کن.", "error");
    } finally {
      setSaving(false);
    }
  };

  const closePractice = async () => {
    setSaving(true);
    try {
      if (!sessionRecord?.report) await persistAnswers(getValues("answer"));
      setStarted(false);
      if (window.location.search) router.replace("/interview");
    } catch {
      notify("ذخیرهٔ پاسخ انجام نشد؛ دوباره تلاش کن.", "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelSessionCreation = () => {
    sessionCreationControllerRef.current?.abort();
    setCreatingSession(false);
    setStarted(false);
  };

  const requestFeedback = async (answer: string) => {
    if (!sessionRecord || !lastQuestion || feedbackBusy) return;
    setFeedbackLoading(true);
    try {
      const draft = await persistAnswers(answer);
      if (!draft || draft.answers.some((item) => !item.trim()))
        throw new Error("برای دریافت نتیجه، پاسخ همهٔ سؤال‌ها را بنویس.");
      const updated = await runModelTask({
        key: "interview-feedback",
        title: "ارزیابی کامل مصاحبه",
        pendingLabel: "مدل در حال بررسی همهٔ پاسخ‌های مصاحبه است",
        completedLabel: "گزارش مصاحبه آماده شد",
        href: "/interview",
        run: async (signal) => {
          const result = await reportMutation.mutateAsync({
            signal,
            body: {
              mode: draft.mode,
              responses: draft.questions.map((question, index) => ({ question, answer: draft.answers[index] })),
            },
          });
          const updated = {
            ...draft,
            report: { ...result, createdAt: new Date().toISOString() },
            updatedAt: new Date().toISOString(),
          };
          await interviewSessionStore.put(updated);
          return updated;
        },
      });
      setSessionRecord(updated);
      router.push(`/interview/results/${updated.id}`);
    } catch (event) {
      notify(
        event instanceof Error ? event.message : "گزارش آماده نشد؛ پاسخ‌ها ذخیره‌اند و می‌توانی دوباره تلاش کنی.",
        "error",
      );
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) return <InterviewSkeleton />;
  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-[15px] text-[11px] font-bold text-white no-underline shadow-[0_8px_18px_rgba(15,123,98,.16)] transition-colors hover:bg-[#0d6b57] disabled:cursor-not-allowed disabled:opacity-45";
  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold text-[#526461] transition-colors hover:bg-[#f3f8f4]";
  if (!hasResume)
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[15px] border border-dashed border-[#dce3dc] text-[#8b9996] [&_h3]:mb-[3px] [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:text-[#19312f] [&_p]:mb-[14px] [&_p]:mt-0 [&_p]:text-[9px]">
        <FileCheck2 size={34} />
        <h3>اطلاعاتی برای تمرین وجود ندارد</h3>
        <p>ابتدا پروفایل مسیر شغلی را کامل کن تا سؤال‌ها براساس اطلاعات واقعی تو تولید شوند.</p>
        <Link className={primaryButton} href="/knowledge-base">
          تکمیل پروفایل مسیر شغلی
        </Link>
      </div>
    );

  const iconTones: Record<string, string> = {
    mint: "bg-[#d8eee5] text-[#0c765d]",
    peach: "bg-[#fae8dc] text-[#bb704e]",
    lavender: "bg-[#eee9f8] text-[#7660a8]",
    sky: "bg-[#e5eff7] text-[#547da5]",
  };
  const cardTones: Record<string, string> = {
    mint: "border-[#d5eadf] bg-[linear-gradient(145deg,#fff_35%,#eef9f3_100%)]",
    peach: "border-[#f1dfd3] bg-[linear-gradient(145deg,#fff_35%,#fff3eb_100%)]",
    lavender: "border-[#e6def2] bg-[linear-gradient(145deg,#fff_35%,#f5f1fc_100%)]",
    sky: "border-[#dce9f2] bg-[linear-gradient(145deg,#fff_35%,#f1f7fb_100%)]",
  };
  const comprehensiveSession = sessionRecord && isComprehensiveMode(sessionRecord.mode);
  return (
    <>
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#efcfb8] bg-[#fff5ed] p-3 text-[#9a572d]">
          <Sparkles size={20} />
          <div className="flex flex-1 flex-col">
            <strong className="text-[12px]">ساخت جلسه انجام نشد</strong>
            <span className="text-[11px] mt-1">{error}</span>
          </div>
          <button className="border-0 bg-transparent" onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}
      <div className="relative flex min-h-[584px] flex-col overflow-hidden rounded-[22px] bg-[#f8f8f3] text-[#19312f] lg:flex-row-reverse lg:items-start">
        <div className="relative w-full shrink-0 self-center lg:w-[55%]">
          <Image
            alt="تصویرسازی کامل اتاق و میز آمادگی مصاحبه"
            className="block h-auto w-full [mask-image:linear-gradient(to_right,black_86%,transparent)]"
            height={1024}
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            src="/illustrations/radikar-interview-room-v2.png"
            width={1536}
          />
        </div>
        <div className="relative flex-1 px-[clamp(24px,3vw,44px)] pb-[52px] pt-8 max-[560px]:p-7 lg:pb-[180px] lg:pt-10">
          <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-[#e6f4ee] px-[11px] py-2 text-[12px] text-[#0f7b62]">
            <Sparkles size={17} /> آمادگی مصاحبه
          </span>
          <h1 className="mb-1.5 mt-[13px] text-[clamp(20px,2.5vw,28px)] leading-[1.6]">
            {sessionRecord?.title || "هنوز جلسه‌ای ساخته نشده است"}
          </h1>
          <p className="mb-3 mt-0 max-w-[500px] text-[15px] leading-[1.9] text-[#61746f]">
            {sessionRecord?.subtitle || "یک جلسه تازه بساز تا سؤال‌ها براساس رزومه واقعی تو تولید شوند."}
          </p>
          <div className="flex gap-4 text-[13px] text-[#61746f] [&_span]:flex [&_span]:items-center [&_span]:gap-1">
            <span>
              <Clock3 size={18} /> {sessionRecord?.duration ? toPersianDigits(sessionRecord.duration) : "—"}
            </span>
            <span>
              <MessageSquareText size={18} />{" "}
              {formatPersianNumber((sessionRecord?.feedbacks.length || 0) + (sessionRecord?.report ? 1 : 0))} بازخورد
              ذخیره‌شده
            </span>
          </div>
          <button
            className="group mt-10 inline-flex min-h-12 w-fit items-center justify-center gap-4 rounded-2xl border-0 bg-[linear-gradient(115deg,#0f7b62,#149c7c)] py-2 pl-2.5 pr-5 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(15,123,98,.22)] transition-shadow duration-300 hover:shadow-[0_17px_34px_rgba(15,123,98,.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7b62] motion-reduce:transition-none"
            onClick={() => startPractice(comprehensiveSession ? sessionRecord.mode : comprehensiveMode)}
          >
            {comprehensiveSession && sessionRecord.report
              ? "مشاهده نتیجه مصاحبه"
              : comprehensiveSession && sessionRecord.answers?.some(Boolean)
                ? "ادامه مصاحبه جامع"
                : "شروع مصاحبه جامع"}
            <span className="grid size-9 place-items-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none motion-reduce:transition-none">
              <ArrowLeft size={20} />
            </span>
          </button>
        </div>
        <div className="relative z-10 grid w-full gap-3 px-6 pb-6 sm:grid-cols-3 lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-8 lg:pb-8">
          {[
            {
              title: "بر پایه رزومه",
              text: "سؤال‌های متناسب با تجربهٔ تو",
              icon: FileCheck2,
              card: "bg-[#eff9f4]/85",
              iconStyle: "bg-[#dff4ea] text-[#0f7b62]",
            },
            {
              title: "تمرین نقش‌محور",
              text: "سناریوهای نزدیک به موقعیت واقعی",
              icon: BriefcaseBusiness,
              card: "bg-[#fff7ed]/85",
              iconStyle: "bg-[#ffecd5] text-[#b96b2d]",
            },
            {
              title: "گزارش کامل مصاحبه",
              text: "امتیاز و بررسی پاسخ‌ها در پایان",
              icon: MessageSquareText,
              card: "bg-[#fffbed]/85",
              iconStyle: "bg-[#fff1bd] text-[#9a7010]",
            },
          ].map(({ title, text, icon: Icon, card, iconStyle }) => (
            <div
              className={`flex min-h-[112px] items-center gap-4 rounded-[18px] p-4 shadow-[0_10px_30px_rgba(27,63,54,.1)] backdrop-blur-md ${card}`}
              key={title}
            >
              <span className={`grid size-12 shrink-0 place-items-center rounded-[16px] ${iconStyle}`}>
                <Icon size={23} />
              </span>
              <div className="min-w-0">
                <strong className="block text-[14px] font-bold text-[#19312f]">{title}</strong>
                <span className="mt-1 block text-[12px] leading-6 text-[#61746f]">{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {(isCreatingSession || started) && (
        <InterviewPracticeDialog
          title={isCreatingSession ? "در حال ساخت جلسهٔ تازه" : (sessionRecord?.title ?? mode)}
          closeDisabled={saving || feedbackBusy || Boolean(sessionRecord?.report)}
          analysisPending={feedbackBusy}
          exitDescription={
            isCreatingSession
              ? "ساخت این جلسه لغو می‌شود. هر زمان خواستی می‌توانی یک جلسهٔ تازه بسازی."
              : undefined
          }
          exitConfirmLabel={isCreatingSession ? "لغو ساخت و خروج" : undefined}
          onClose={() => (isCreatingSession ? cancelSessionCreation() : void closePractice())}
        >
          {isCreatingSession ? (
            <div
              className="flex min-h-full flex-col items-center justify-center gap-4 text-center"
              role="status"
              aria-live="polite"
            >
              <span className="grid size-20 place-items-center rounded-[24px] bg-[#e6f4ee] text-[#0f7b62]">
                <LoaderCircle className="animate-spin motion-reduce:animate-none" size={36} />
              </span>
              <h3 className="mb-0 mt-2 text-xl font-bold text-[#19312f]">سؤال‌های مصاحبه در حال آماده‌شدن هستند</h3>
              <p className="m-0 max-w-md text-sm leading-7 text-[#61746f]">
                پرسش‌ها براساس رزومه و مسیر شغلی تو ساخته می‌شوند. تا چند لحظهٔ دیگر تمرین شروع می‌شود.
              </p>
            </div>
          ) : sessionRecord?.report ? (
            <div className="flex min-h-full items-center justify-center gap-3 text-[#0f7b62]" role="status">
              <LoaderCircle className="animate-spin motion-reduce:animate-none" size={24} />
              در حال باز کردن گزارش مصاحبه...
            </div>
          ) : sessionRecord ? (
            <form
              onSubmit={handleSubmit(({ answer }) =>
                lastQuestion ? requestFeedback(answer) : moveQuestion(answer, questionIndex + 1),
              )}
              className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[20px] border border-[#dce8e1] bg-white p-[22px] shadow-[0_18px_48px_rgba(27,55,50,.09)] max-[820px]:p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e6f4ee] px-2 py-1 text-[11px] font-bold text-[#0f7b62]">
                    <span className="size-1.5 rounded-full bg-[#26a77e]" /> جلسه فعال
                  </span>
                  <h3 className="mb-0 mt-[9px] text-[13px]">{mode}</h3>
                </div>
              </div>
              <InterviewProgress total={sessionRecord.questions.length} currentIndex={questionIndex} />
              <div className="my-[18px] rounded-[13px] border border-[#e0eee4] border-r-[3px] border-r-[#56b08c] bg-[linear-gradient(120deg,#edf7f0,#f6faf5)] p-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
                <span className="text-[12px] font-bold text-[#0f7b62]">
                  سؤال {formatPersianNumber(questionIndex + 1)} از {formatPersianNumber(sessionRecord.questions.length)}
                </span>
                <h2 className="mb-0 mt-2 text-[15px] leading-[1.9]">{currentQuestion}</h2>
              </div>
              <FormField
                label="پاسخ تو"
                htmlFor="interview-answer"
                errorId="interview-answer-error"
                error={errors.answer?.message}
                className="text-[11px] font-normal text-[#60716e]"
              >
                <TextAreaField
                  id="interview-answer"
                  {...register("answer")}
                  className="bg-[#fcfdfb] shadow-[inset_0_2px_8px_rgba(27,55,50,.025)]"
                  disabled={feedbackBusy || saving}
                  maxLength={8_000}
                  aria-invalid={Boolean(errors.answer)}
                  aria-describedby={errors.answer ? "interview-answer-error" : undefined}
                  placeholder="پاسخ خودت را وارد کن..."
                />
              </FormField>
              <p className="mb-0 mt-3 text-xs leading-6 text-[#61746f]">
                با تغییر سؤال یا بستن جلسه، پاسخ‌ها ذخیره می‌شوند. بعد از سؤال آخر، گزارش کامل مصاحبه را دریافت می‌کنی.
              </p>
              <div className="mt-[14px] flex justify-between gap-[10px] border-t border-[#edf1ed] pt-4 max-[560px]:flex-col-reverse">
                {questionIndex > 0 ? (
                  <button
                    className={secondaryButton}
                    type="button"
                    disabled={saving || feedbackBusy}
                    onClick={() => void moveQuestion(getValues("answer"), questionIndex - 1)}
                  >
                    <ArrowRight size={16} /> سؤال قبلی
                  </button>
                ) : (
                  <span />
                )}
                <button className={primaryButton} type="submit" disabled={saving || feedbackBusy}>
                  {lastQuestion ? (
                    <>
                      <Sparkles size={17} />{" "}
                      {feedbackBusy ? "در حال آماده‌سازی گزارش..." : "پایان مصاحبه و دریافت نتیجه"}
                    </>
                  ) : (
                    <>
                      سؤال بعدی <ArrowLeft size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : null}
        </InterviewPracticeDialog>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3 max-[820px]:grid-cols-1">
        {(sessionRecord?.cards || []).map((item, index) => {
          const Icon = icons[index] || CircleUserRound;
          return (
            <article
              className={`relative flex min-h-[220px] flex-col overflow-hidden rounded-[22px] border p-5 shadow-[0_12px_36px_rgba(27,55,50,.055)] transition-shadow duration-200 hover:shadow-[0_18px_42px_rgba(27,55,50,.12)] ${cardTones[item.tone] ?? cardTones.mint}`}
              key={item.title}
            >
              <Icon
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -left-4 size-24 text-[#19312f] opacity-[0.05]"
              />
              <div className="relative mb-4 flex items-center gap-3">
                <div
                  className={`grid size-12 shrink-0 place-items-center rounded-[16px] shadow-[0_6px_16px_rgba(27,55,50,.06)] ${iconTones[item.tone] ?? iconTones.mint}`}
                >
                  <Icon size={24} />
                </div>
                <h3 className="m-0 text-[14px] font-bold text-[#19312f]">{item.title}</h3>
              </div>
              <p className="relative m-0 text-[12px] text-justify leading-[1.9] text-[#61746f]">{item.text}</p>
              <div className="relative mt-auto flex justify-end pt-4">
                <button
                  className="inline-flex w-fit items-center gap-1 rounded-lg border-0 bg-white/75 px-3 py-2 text-[12px] font-bold text-[#0f7b62] shadow-[0_3px_10px_rgba(27,55,50,.06)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f7b62]"
                  onClick={() => startPractice(`${focusedModePrefix}${item.title}`)}
                >
                  تمرین تخصصی این موضوع <ChevronLeft size={18} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {completedSessions.length > 0 && (
        <section className="mt-10" aria-labelledby="interview-history-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 id="interview-history-title" className="m-0 text-lg font-bold text-[#19312f]">
                نتایج مصاحبه‌های قبلی
              </h2>
              <p className="mb-0 mt-1 text-sm text-[#61746f]">گزارش هر جلسه را هر زمان خواستی دوباره ببین.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {completedSessions.map((session) => (
              <Link
                key={session.id}
                href={`/interview/results/${session.id}`}
                className="group flex flex-col gap-2 rounded-2xl border border-[#dce9df] bg-white p-5 no-underline shadow-[0_8px_24px_rgba(27,55,50,.04)] hover:border-[#9bcdb8]"
              >
                <span className="text-xs font-bold text-[#0f7b62]">{session.mode}</span>
                <strong className="text-sm text-[#19312f]">{session.title}</strong>
                <span className="text-xs text-[#61746f]">
                  امتیاز {formatPersianNumber(session.report?.score ?? 0)} از ۱۰۰
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#0f7b62]">
                  مشاهده گزارش <ArrowLeft size={15} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
