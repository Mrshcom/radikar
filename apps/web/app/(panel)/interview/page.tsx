"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { interviewDepthMinutes, type InterviewDepth, type InterviewReport } from "@radikar/shared-types";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronLeft,
  CircleUserRound,
  Clock3,
  FileCheck2,
  MessageSquareText,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  X,
  LoaderCircle,
} from "lucide-react";
import { InterviewSkeleton } from "../_components/skeletons";
import { useToast } from "@/app/_components/toast";
import { UpgradeLink } from "@/app/_components/upgrade-link";
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
import { InterviewDepthChooser, interviewDepthLabel } from "./interview-depth-chooser";
import { submitInterviewAnswerOnEnter } from "./interview-answer-keyboard";
import { isInterviewClarification } from "./interview-message-intent";
import { InterviewConversation } from "./interview-conversation";
import { ModelThinkingOrb } from "../_components/model-thinking-orb";
import { formatPersianNumber, toPersianDigits } from "@/lib/fa-number";
import { apiRequest } from "@/lib/api-client";
import { SectionTitle } from "../_components/ui";

type PracticeCard = { title: string; text: string; tone: string };
type SessionData = {
  title: string;
  subtitle: string;
  duration: string;
  questions: string[];
  cards: PracticeCard[];
  chatToken?: string;
};
const answerSchema = z.object({
  answer: z.string().trim().min(1, "ابتدا پاسخ این سؤال را بنویس.").max(8_000, "پاسخ باید حداکثر ۸۰۰۰ کاراکتر باشد."),
});
const icons = [CircleUserRound, BriefcaseBusiness, FileCheck2];
const comprehensiveMode = "مصاحبه جامع";
const focusedModePrefix = "تمرین تخصصی: ";
const isComprehensiveMode = (value: string) => value === comprehensiveMode || value === "مصاحبه شخصی‌سازی‌شده";
const isAffirmativeReadiness = (value: string) =>
  /^(?:الان\s+)?(?:(?:آره|اره|بله|بلی|آری|باشه)(?:[،, ]+(?:آماده(?:‌| )ام|شروع کن(?:یم)?|بزن بریم))?|آماده(?:‌| )ام|آمادم|حاضرم|اوکی(?:‌| )?ام|اوکیم|اکیم|بزن بریم|شروع کن(?:یم)?)[!.؟\s]*$/u.test(
    value.trim(),
  );
const isReadySession = (record: InterviewSessionRecord) =>
  Boolean(
    record.readyAt ||
    record.readinessMessages?.some((message) => isAffirmativeReadiness(message.text)) ||
    record.answers?.some(Boolean) ||
    record.clarifications?.length ||
    record.replies?.length,
  );

export default function InterviewPage() {
  const router = useRouter();
  const notify = useToast();
  const { isRunning, runModelTask } = useModelTasks();
  const [sessionRecord, setSessionRecord] = useState<InterviewSessionRecord | null>(null);
  const [completedSessions, setCompletedSessions] = useState<InterviewSessionRecord[]>([]);
  const [hasResume, setHasResume] = useState(true);
  const [started, setStarted] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [choosingDepthFor, setChoosingDepthFor] = useState<string | null>(null);
  const [mode, setMode] = useState(comprehensiveMode);
  const [answers, setAnswers] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setFocus,
    control,
    formState: { errors },
  } = useForm<z.infer<typeof answerSchema>>({ resolver: zodResolver(answerSchema), defaultValues: { answer: "" } });
  const answerValue = useWatch({ control, name: "answer" });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const [activeSince, setActiveSince] = useState<number | null>(null);
  const [error, setError] = useState("");
  const sessionCreationControllerRef = useRef<AbortController | null>(null);
  const answerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isCreatingSession = creatingSession || isRunning("interview-session");
  const feedbackBusy = feedbackLoading || isRunning("interview-feedback");
  const activeSessionId = sessionRecord?.id;
  const hasReport = Boolean(sessionRecord?.report);
  const resizeAnswerTextarea = useCallback((textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = "40px";
    textarea.style.height = `${Math.max(40, textarea.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => resizeAnswerTextarea(answerTextareaRef.current));
    return () => window.cancelAnimationFrame(frame);
  }, [questionIndex, resizeAnswerTextarea, sessionRecord?.id, started]);
  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [started]);
  useEffect(() => {
    if (started && activeSessionId && !hasReport && !isCreatingSession && !feedbackBusy) setFocus("answer");
  }, [started, activeSessionId, hasReport, isCreatingSession, feedbackBusy, questionIndex, setFocus]);
  const reportMutation = useMutation({
    mutationFn: ({
      body,
      signal,
    }: {
      body: { mode: string; chatToken?: string; responses: Array<{ question: string; answer: string }> };
      signal: AbortSignal;
    }) => apiRequest<InterviewReport>("/api/interview/report", { method: "POST", body: JSON.stringify(body), signal }),
  });
  const nextQuestionMutation = useMutation({
    mutationFn: (body: {
      mode: string;
      depth?: InterviewDepth;
      chatToken?: string;
      targetTimeReached?: boolean;
      mustConclude?: boolean;
      nextTopic: string;
      topicShiftRequired?: boolean;
      history: Array<{ question: string; answer: string }>;
    }) =>
      apiRequest<{ reply: string; question: string; complete: boolean; chatToken?: string }>(
        "/api/interview/next-question",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      ),
  });
  const clarifyMutation = useMutation({
    mutationFn: (body: {
      mode: string;
      chatToken?: string;
      question: string;
      userMessage: string;
      history: Array<{ question: string; answer: string }>;
    }) =>
      apiRequest<{ reply: string; chatToken?: string }>("/api/interview/clarify", {
        method: "POST",
        body: JSON.stringify(body),
      }),
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
          setActiveSince(isReadySession(requestedSession) ? Date.now() : null);
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

  const loadSession = async (
    selectedMode: string,
    depth: InterviewDepth,
    startAfterLoad = false,
    replaceSessionId?: string,
  ) => {
    const controller = new AbortController();
    sessionCreationControllerRef.current = controller;
    setCreatingSession(true);
    setError("");
    try {
      const record = await runModelTask({
        key: "interview-session",
        title: "ساخت جلسه مصاحبه",
        pendingLabel: "مصاحبه‌گر در حال پیوستن به جلسهٔ مصاحبه است...",
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
              depth,
              type: selectedMode.startsWith(focusedModePrefix) ? "focused" : "comprehensive",
              ...(selectedMode.startsWith(focusedModePrefix)
                ? { focusArea: selectedMode.slice(focusedModePrefix.length) }
                : {}),
            }),
            signal: controller.signal,
          });
          const now = new Date().toISOString();
          const record: InterviewSessionRecord = {
            id: replaceSessionId ?? createRecordId("interview"),
            ...result,
            plannedTopics: [...result.questions],
            agentChatToken: result.chatToken,
            mode: selectedMode,
            depth,
            elapsedMs: 0,
            feedbacks: [],
            answers: [],
            answerSentAt: [],
            replies: [],
            clarifications: [],
            currentQuestionIndex: 0,
            createdAt: now,
            updatedAt: now,
          };
          await interviewSessionStore.put(record);
          return record;
        },
      });
      restoreSession(record);
      setActiveSince(startAfterLoad && isReadySession(record) ? Date.now() : null);
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
    if (sessionRecord?.mode === selectedMode && !sessionRecord.report) {
      setActiveSince(isReadySession(sessionRecord) ? Date.now() : null);
      setStarted(true);
    } else {
      setChoosingDepthFor(selectedMode);
    }
  };

  const chooseDepth = (depth: InterviewDepth) => {
    if (!choosingDepthFor) return;
    const selectedMode = choosingDepthFor;
    setChoosingDepthFor(null);
    void loadSession(selectedMode, depth, true);
  };

  const restartPractice = () => {
    if (!sessionRecord) return;
    setRestartConfirmOpen(false);
    void loadSession(
      sessionRecord.mode,
      sessionRecord.depth ?? "standard",
      true,
      sessionRecord.report ? undefined : sessionRecord.id,
    );
  };

  const elapsedMs = (sessionRecord?.elapsedMs ?? 0) + (activeSince ? Math.max(0, clockNow - activeSince) : 0);
  const durationMs = interviewDepthMinutes[sessionRecord?.depth ?? "standard"] * 60_000;
  const timeRemainingMs = Math.max(0, durationMs - elapsedMs);
  const remainingSeconds = Math.ceil(timeRemainingMs / 1_000);
  const timeValue =
    timeRemainingMs > 0
      ? `${toPersianDigits(String(Math.floor(remainingSeconds / 60)).padStart(2, "0"))}:${toPersianDigits(String(remainingSeconds % 60).padStart(2, "0"))} باقی‌مانده`
      : "زمان انتخابی تمام شد؛ گفت‌وگو تا جمع‌بندی ادامه دارد";
  const concluded = Boolean(
    sessionRecord?.questions.length &&
    sessionRecord.answers?.length === sessionRecord.questions.length &&
    sessionRecord.answers.every((answer) => answer.trim()) &&
    sessionRecord.replies?.[sessionRecord.questions.length - 1]?.trim(),
  );
  const ready = sessionRecord ? isReadySession(sessionRecord) : false;
  const respondToReadiness = async (answer: string) => {
    if (!sessionRecord || saving) return;
    reset({ answer: "" });
    setSaving(true);
    try {
      const sentAt = new Date().toISOString();
      const affirmative = isAffirmativeReadiness(answer);
      const updated = {
        ...sessionRecord,
        readinessMessages: [...(sessionRecord.readinessMessages ?? []), { text: answer.trim(), sentAt }],
        readyAt: affirmative ? sentAt : sessionRecord.readyAt,
        updatedAt: sentAt,
      };
      await interviewSessionStore.put(updated);
      setSessionRecord(updated);
      if (affirmative) setActiveSince(new Date(sentAt).getTime());
    } catch {
      reset({ answer });
      notify("ذخیرهٔ پاسخ انجام نشد؛ دوباره تلاش کن.", "error");
    } finally {
      setSaving(false);
    }
  };
  const persistAnswers = async (answer: string, nextIndex = questionIndex, sentAt?: string) => {
    if (!sessionRecord) return;
    const pausedAt = new Date().getTime();
    const nextAnswers = sessionRecord.questions.map((_, index) =>
      index === questionIndex ? answer.trim() : (answers[index] ?? ""),
    );
    const updated = {
      ...sessionRecord,
      answers: nextAnswers,
      answerSentAt: sentAt
        ? sessionRecord.questions.map((_, index) =>
            index === questionIndex ? sentAt : (sessionRecord.answerSentAt?.[index] ?? ""),
          )
        : sessionRecord.answerSentAt,
      elapsedMs: (sessionRecord.elapsedMs ?? 0) + (activeSince ? pausedAt - activeSince : 0),
      currentQuestionIndex: nextIndex,
      updatedAt: new Date(pausedAt).toISOString(),
    };
    setActiveSince(null);
    setSessionRecord(updated);
    await interviewSessionStore.put(updated);
    setAnswers(nextAnswers);
    return updated;
  };

  const moveQuestion = async (answer: string, nextIndex: number) => {
    if (!sessionRecord || nextIndex < 0 || nextIndex > 30) return;
    reset({ answer: "" });
    setSaving(true);
    setAgentThinking(true);
    let complete = false;
    let finished = false;
    try {
      const draft = await persistAnswers(answer, questionIndex, new Date().toISOString());
      if (!draft) return;
      let question = draft.questions[nextIndex] ?? "دربارهٔ یک تصمیم مهم در کار قبلی‌ات و نتیجهٔ آن توضیح می‌دهی؟";
      let reply = "ممنون که توضیح دادی. برای شناخت بهتر تجربه‌ات ادامه بدهیم.";
      let agentChatToken = draft.agentChatToken;
      try {
        const generated = await nextQuestionMutation.mutateAsync({
          mode: draft.mode,
          depth: draft.depth,
          chatToken: draft.agentChatToken,
          targetTimeReached: timeRemainingMs === 0,
          mustConclude: nextIndex >= 30,
          nextTopic:
            (draft.plannedTopics ?? draft.questions)[Math.ceil(nextIndex / 2)] ??
            "یکی از مهارت‌های مرتبط با نقش که در پرسش‌های قبلی پوشش داده نشده است",
          topicShiftRequired: nextIndex > 1 && nextIndex % 2 === 0,
          history: draft.questions
            .slice(0, nextIndex)
            .map((item, index) => ({ question: item, answer: draft.answers[index] })),
        });
        question = generated.question;
        reply = generated.reply;
        complete = generated.complete || nextIndex >= 30;
        if (complete && !generated.complete)
          reply = "ممنون از وقتی که برای این گفت‌وگو گذاشتی. مصاحبه به پایان رسید و پاسخ‌هایت بررسی می‌شوند.";
        agentChatToken = generated.chatToken ?? agentChatToken;
      } catch {
        reset({ answer });
        notify("پاسخ مصاحبه‌گر آماده نشد. پاسخ تو ذخیره شده است؛ دوباره تلاش کن.", "error");
        return;
      }
      const updated = {
        ...draft,
        questions: complete
          ? draft.questions.slice(0, nextIndex)
          : nextIndex < draft.questions.length
            ? draft.questions.map((item, index) => (index === nextIndex ? question : item))
            : [...draft.questions, question],
        answers: complete ? draft.answers.slice(0, nextIndex) : draft.answers,
        replies: [...(draft.replies ?? []).slice(0, questionIndex), reply],
        agentChatToken,
        currentQuestionIndex: complete ? questionIndex : nextIndex,
        updatedAt: new Date().toISOString(),
      };
      await interviewSessionStore.put(updated);
      setSessionRecord(updated);
      setAnswers(updated.answers);
      setQuestionIndex(complete ? questionIndex : nextIndex);
      finished = complete;
    } catch {
      reset({ answer });
      notify("ذخیرهٔ پاسخ انجام نشد؛ دوباره تلاش کن.", "error");
    } finally {
      setSaving(false);
      setAgentThinking(false);
      if (!finished) setActiveSince(new Date().getTime());
    }
  };

  const clarifyQuestion = async (userMessage: string) => {
    if (!sessionRecord || clarifyMutation.isPending) return;
    reset({ answer: "" });
    const sentAt = new Date().toISOString();
    const paused = {
      ...sessionRecord,
      elapsedMs: (sessionRecord.elapsedMs ?? 0) + (activeSince ? new Date(sentAt).getTime() - activeSince : 0),
      updatedAt: sentAt,
    };
    setActiveSince(null);
    setSessionRecord(paused);
    setAgentThinking(true);
    try {
      await interviewSessionStore.put(paused);
      const result = await clarifyMutation.mutateAsync({
        mode: paused.mode,
        chatToken: paused.agentChatToken,
        question: paused.questions[questionIndex],
        userMessage: userMessage.trim(),
        history: paused.questions.slice(0, questionIndex).map((question, index) => ({
          question,
          answer: answers[index] ?? "",
        })),
      });
      const updated = {
        ...paused,
        clarifications: [
          ...(paused.clarifications ?? []),
          { questionIndex, user: userMessage.trim(), reply: result.reply, sentAt },
        ],
        agentChatToken: result.chatToken ?? paused.agentChatToken,
        updatedAt: new Date().toISOString(),
      };
      await interviewSessionStore.put(updated);
      setSessionRecord(updated);
    } catch (event) {
      reset({ answer: userMessage });
      notify(event instanceof Error ? event.message : "پاسخ مصاحبه‌گر آماده نشد.", "error");
    } finally {
      setActiveSince(new Date().getTime());
      setAgentThinking(false);
    }
  };

  const closePractice = async () => {
    setSaving(true);
    try {
      if (sessionRecord && !sessionRecord.report && isReadySession(sessionRecord)) {
        await persistAnswers(getValues("answer"));
      }
      setActiveSince(null);
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

  const requestFeedback = async () => {
    if (!sessionRecord || feedbackBusy) return;
    setFeedbackLoading(true);
    const pausedAt = new Date().getTime();
    const paused = {
      ...sessionRecord,
      elapsedMs: (sessionRecord.elapsedMs ?? 0) + (activeSince ? pausedAt - activeSince : 0),
      updatedAt: new Date(pausedAt).toISOString(),
    };
    setActiveSince(null);
    setSessionRecord(paused);
    setAgentThinking(true);
    try {
      await interviewSessionStore.put(paused);
      const draft = paused;
      if (!concluded) throw new Error("ابتدا گفت‌وگو را با مصاحبه‌گر به پایان برسان.");
      const responses = draft.questions
        .map((question, index) => ({ question, answer: draft.answers?.[index] ?? "" }))
        .filter(({ answer }) => answer.trim());
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
              chatToken: draft.agentChatToken,
              responses,
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
      setAgentThinking(false);
    }
  };

  if (loading) return <InterviewSkeleton />;
  const answerField = register("answer");
  const hasAnswer = Boolean(answerValue?.trim());
  const submitAnswer = handleSubmit(({ answer }) => {
    return !ready
      ? respondToReadiness(answer)
      : isInterviewClarification(answer)
        ? clarifyQuestion(answer)
        : moveQuestion(answer, questionIndex + 1);
  });
  const handleAnswerFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    answerTextareaRef.current?.focus();
    void submitAnswer(event);
  };
  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-[15px] text-[11px] font-bold text-white no-underline shadow-[0_8px_18px_rgba(15,123,98,.16)] transition-colors hover:bg-[#0d6b57] disabled:cursor-not-allowed disabled:opacity-45";
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
  const interviewOverview = sessionRecord?.mode.startsWith(focusedModePrefix)
    ? `در این تمرین، دربارهٔ «${sessionRecord.mode.slice(focusedModePrefix.length)}» گفت‌وگو می‌کنی. پرسش‌ها با پاسخ‌هایت پیش می‌روند و در پایان، ارزیابی مباحث را می‌بینی.`
    : "در مصاحبهٔ جامع، دربارهٔ تجربه‌های فنی، حل مسئله و همکاری‌ات گفت‌وگو می‌کنی. پرسش‌ها با پاسخ‌هایت پیش می‌روند و در پایان، ارزیابی مباحث را می‌بینی.";
  return (
    <>
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#efcfb8] bg-[#fff5ed] p-3 text-[#9a572d]">
          <Sparkles size={20} />
          <div className="flex flex-1 flex-col">
            <strong className="text-[12px]">ساخت جلسه انجام نشد</strong>
            <span className="mt-1 text-[11px]">{error}</span>
            <UpgradeLink className="mt-2 text-[11px]" message={error} />
          </div>
          <button className="border-0 bg-transparent" onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}
      <section aria-label="آمادگی برای مصاحبه">
        <SectionTitle title="آمادگی برای مصاحبه" description="تمرین شخصی‌سازی‌شده براساس رزومه و مسیر شغلی تو." />
        <div className="relative flex min-h-[380px] flex-col overflow-hidden rounded-[22px] bg-[#f8f8f3] text-[#19312f] lg:flex-row-reverse lg:items-center">
          <div className="relative w-full shrink-0 self-center lg:w-[56%]">
            <Image
              alt="تصویرسازی کامل اتاق و میز آمادگی مصاحبه"
              className="block h-auto w-full [mask-image:linear-gradient(to_right,black_86%,transparent)]"
              height={1024}
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              src="/illustrations/radikar-interview-room-v2.png"
              width={1536}
            />
          </div>
          <div className="relative flex-1 px-[clamp(24px,3vw,44px)] py-8 max-[560px]:p-7">
            <p className="mb-4 mt-0 max-w-[500px] text-[15px] leading-[1.9] text-[#405b54]">
              {sessionRecord
                ? interviewOverview
                : "یک مصاحبهٔ تمرینی بر اساس رزومه و مسیر شغلی‌ات شروع کن. زمان پاسخ‌گویی را انتخاب می‌کنی و در پایان، ارزیابی مباحث را می‌بینی."}
            </p>
            {sessionRecord?.title === "تکمیل اطلاعات شغل" && (
              <p className="mb-4 mt-0 max-w-[500px] text-xs leading-6 text-[#61746f]">
                برای پرسش‌های دقیق‌تر، عنوان شغل و مسئولیت‌های اصلی‌ات را در پروفایل مسیر شغلی تکمیل کن.
              </p>
            )}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#61746f] [&_span]:flex [&_span]:items-center [&_span]:gap-1">
              <span>
                <Clock3 size={18} />{" "}
                {sessionRecord
                  ? `زمان پاسخ‌گویی انتخابی: ${toPersianDigits(interviewDepthMinutes[sessionRecord.depth ?? "standard"])} دقیقه`
                  : "زمان پاسخ‌گویی: ۸، ۱۵ یا ۲۵ دقیقه به انتخاب تو"}
              </span>
              <span>
                <MessageSquareText size={18} />{" "}
                {sessionRecord?.report ? "گزارش مصاحبه آماده است" : "گزارش عملکرد پس از پایان"}
              </span>
            </div>
            <p className="mb-0 mt-2 text-xs leading-6 text-[#61746f]">
              زمان فکرکردن و پاسخ‌گویی مصاحبه‌گر از زمان تو کم نمی‌شود.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                className="group inline-flex min-h-12 w-fit items-center justify-center gap-4 rounded-2xl border-0 bg-[linear-gradient(115deg,#0f7b62,#149c7c)] py-2 pl-2.5 pr-5 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(15,123,98,.22)] transition-shadow duration-300 hover:shadow-[0_17px_34px_rgba(15,123,98,.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0f7b62] motion-reduce:transition-none"
                onClick={() => startPractice(comprehensiveSession ? sessionRecord.mode : comprehensiveMode)}
              >
                {comprehensiveSession && !sessionRecord.report && sessionRecord.answers?.some(Boolean)
                  ? "ادامه مصاحبه جامع"
                  : "شروع مصاحبه جامع"}
                <span className="grid size-9 place-items-center rounded-xl bg-white/15 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transform-none motion-reduce:transition-none">
                  <ArrowLeft size={20} />
                </span>
              </button>
              {sessionRecord ? (
                <button
                  type="button"
                  aria-expanded={restartConfirmOpen}
                  onClick={() => setRestartConfirmOpen((open) => !open)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-[#cfe3d8] bg-white px-4 text-sm font-bold text-[#0f7b62] transition-colors hover:bg-[#eff8f2]"
                >
                  <RotateCcw size={17} /> شروع دوباره
                </button>
              ) : null}
            </div>
            {restartConfirmOpen && sessionRecord ? (
              <div
                role="alert"
                className="mt-4 max-w-[500px] rounded-2xl border border-[#eacb9d] bg-[#fff9ed] p-4 text-sm text-[#72502b]"
              >
                <p className="m-0 leading-7">
                  {sessionRecord.report
                    ? "یک مصاحبهٔ تازه با همین تنظیمات آغاز می‌شود و گزارش قبلی‌ات حفظ خواهد شد."
                    : "با شروع دوباره، پاسخ‌های این تمرین پاک می‌شوند و مصاحبه از ابتدا آغاز می‌شود."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={restartPractice}
                    className="min-h-10 rounded-xl bg-[#0f7b62] px-4 font-bold text-white"
                  >
                    تأیید و شروع دوباره
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestartConfirmOpen(false)}
                    className="min-h-10 rounded-xl border border-[#dec7a6] bg-white px-4 font-bold text-[#72502b]"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {(choosingDepthFor || isCreatingSession || started) && (
          <InterviewPracticeDialog
            chatLayout={Boolean(started && sessionRecord && !sessionRecord.report)}
            timeLabel={started && ready && sessionRecord && !sessionRecord.report ? "زمان کاربر:" : undefined}
            timeValue={timeValue}
            timePaused={agentThinking && timeRemainingMs > 0}
            title={
              choosingDepthFor
                ? "انتخاب نوع مصاحبه"
                : isCreatingSession
                  ? "در حال ساخت جلسهٔ تازه"
                  : (sessionRecord?.title ?? mode)
            }
            closeDisabled={
              saving || feedbackBusy || clarifyMutation.isPending || (started && Boolean(sessionRecord?.report))
            }
            analysisPending={feedbackBusy}
            exitDescription={
              choosingDepthFor
                ? "هنوز جلسه‌ای شروع نشده است. هر زمان خواستی می‌توانی برگردی."
                : isCreatingSession
                  ? "ساخت این جلسه لغو می‌شود. هر زمان خواستی می‌توانی یک جلسهٔ تازه بسازی."
                  : undefined
            }
            exitConfirmLabel={choosingDepthFor ? "بازگشت" : isCreatingSession ? "لغو ساخت و خروج" : undefined}
            onClose={() =>
              choosingDepthFor
                ? setChoosingDepthFor(null)
                : isCreatingSession
                  ? cancelSessionCreation()
                  : void closePractice()
            }
          >
            {choosingDepthFor ? (
              <InterviewDepthChooser onSelect={chooseDepth} />
            ) : isCreatingSession ? (
              <div
                className="flex min-h-full flex-col items-center justify-center gap-4 text-center"
                role="status"
                aria-live="polite"
              >
                <span className="grid size-20 place-items-center">
                  <ModelThinkingOrb label="مصاحبه‌گر در حال پیوستن به جلسهٔ مصاحبه است..." />
                </span>
                <h3 className="mb-0 mt-2 text-xl font-bold text-[#19312f]">
                  مصاحبه‌گر در حال پیوستن به جلسهٔ مصاحبه است...
                </h3>
                <p className="m-0 max-w-md text-sm leading-7 text-[#61746f]">
                  مصاحبه‌گر پرسش‌ها را بر اساس رزومه و مسیر شغلی‌ات تنظیم می‌کند. گفت‌وگو پس از آماده‌شدن جلسه شروع
                  می‌شود.
                </p>
              </div>
            ) : sessionRecord?.report ? (
              <div className="flex min-h-full items-center justify-center gap-3 text-[#0f7b62]" role="status">
                <LoaderCircle className="animate-spin motion-reduce:animate-none" size={24} />
                در حال باز کردن گزارش مصاحبه...
              </div>
            ) : sessionRecord ? (
              <InterviewConversation
                ready={ready}
                readinessMessages={sessionRecord.readinessMessages ?? []}
                questions={sessionRecord.questions}
                answers={answers}
                answerSentAt={sessionRecord.answerSentAt ?? []}
                replies={sessionRecord.replies ?? []}
                clarifications={sessionRecord.clarifications ?? []}
                currentIndex={questionIndex}
                pending={ready && (saving || clarifyMutation.isPending)}
                intro={`سلام! من مصاحبه‌گر رادیکار هستم. در این ${mode} دربارهٔ تجربه‌هایت گفت‌وگو می‌کنیم. آماده‌ای؟`}
              >
                {concluded ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="m-0 text-sm text-[#61746f]">
                      گفت‌وگو تمام شد. جمع‌بندی مصاحبه‌گر را در بالا می‌بینی.
                    </p>
                    <button
                      type="button"
                      className={primaryButton}
                      disabled={feedbackBusy}
                      onClick={() => void requestFeedback()}
                    >
                      {feedbackBusy ? "در حال آماده‌سازی گزارش..." : "دریافت نتیجهٔ مصاحبه"}
                      <ArrowLeft size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAnswerFormSubmit}>
                    <div className="relative">
                      <textarea
                        id="interview-answer"
                        {...answerField}
                        rows={1}
                        ref={(element) => {
                          answerField.ref(element);
                          answerTextareaRef.current = element;
                          resizeAnswerTextarea(element);
                        }}
                        className="block h-10 min-h-10 w-full resize-none overflow-hidden rounded-[10px] border border-[#dfe6e0] bg-[#fcfdfb] py-2 pl-14 pr-3 text-[13px] leading-5 text-[#405753] outline-none placeholder:text-[#9aa7a3] focus:border-[#0f7b62] focus:ring-4 focus:ring-[#0f7b62]/10"
                        readOnly={feedbackBusy || saving || clarifyMutation.isPending}
                        onInput={(event) => resizeAnswerTextarea(event.currentTarget)}
                        onKeyDown={(event) =>
                          submitInterviewAnswerOnEnter(event, feedbackBusy || saving || clarifyMutation.isPending)
                        }
                        maxLength={8_000}
                        aria-label="پاسخ مصاحبه"
                        aria-invalid={Boolean(errors.answer)}
                        placeholder="پاسخت را بنویس..."
                      />
                      <button
                        className="absolute left-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg bg-[#0f7b62] text-white shadow-[0_4px_10px_rgba(15,123,98,.16)] transition-colors hover:bg-[#0d6b57] disabled:cursor-not-allowed disabled:bg-[#d7e4de] disabled:text-[#8ba39a] disabled:shadow-none"
                        type="submit"
                        disabled={!hasAnswer || saving || feedbackBusy || clarifyMutation.isPending}
                        aria-label="ارسال پاسخ"
                        title="ارسال پاسخ"
                      >
                        <SendHorizontal className="-scale-x-100" size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-start">
                      <p className="m-0 text-[8px] text-[#61746f]">Enter برای ارسال · Shift+Enter برای خط بعد</p>
                    </div>
                  </form>
                )}
              </InterviewConversation>
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
                  className="pointer-events-none absolute bottom-2 left-2 size-24 text-[#19312f] opacity-[0.05]"
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
                  <span className="text-xs font-bold text-[#0f7b62]">
                    {session.mode}
                    {session.depth ? ` · ${interviewDepthLabel(session.depth)}` : ""}
                  </span>
                  <strong className="text-sm text-[#19312f]">{session.title}</strong>
                  <span className="text-xs text-[#61746f]">
                    امتیاز {formatPersianNumber(session.report?.score ?? 0)} از ۱۰۰
                  </span>
                  <span className="mt-1 inline-flex self-end items-center gap-1 text-xs font-bold text-[#0f7b62]">
                    مشاهده گزارش <ArrowLeft size={15} />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
    </>
  );
}
