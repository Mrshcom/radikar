"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Maximize,
  MessageCircleQuestion,
  ShieldAlert,
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { employerKeys } from "@/lib/employer";
import { InterviewPracticeDialog } from "../../interview/interview-practice-dialog";
import { InterviewConversation } from "../../interview/interview-conversation";
import { InterviewAnswerComposer } from "../../interview/interview-answer-composer";
import { isInterviewClarification } from "../../interview/interview-message-intent";
import {
  InterviewReportHero,
  InterviewReportView,
  type InterviewReportViewData,
} from "../../interview/interview-result";
import { ConfirmActionModal, SectionTitle } from "../../_components/ui";

type Invitation = {
  companyName: string;
  title: string;
  deadline: string | null;
  status: string;
  owned: boolean;
  questions: string[] | null;
  answers: string[] | null;
  replies: string[] | null;
  clarifications: Array<{ questionIndex: number; user: string; reply: string }> | null;
  report: InterviewReportViewData | null;
  reportReady: boolean;
  feedbackShared: boolean;
};

type AlertTone = "success" | "warning" | "error";

const alertStyles: Record<AlertTone, { box: string; icon: string; title: string; description: string }> = {
  success: {
    box: "border-[#cce6d5] bg-[#eff9f2]",
    icon: "bg-[#d8f0e2] text-[#0d7757]",
    title: "text-[#0d7757]",
    description: "text-[#43826c]",
  },
  warning: {
    box: "border-[#f0dca8] bg-[#fff9ea]",
    icon: "bg-[#ffedbf] text-[#aa701f]",
    title: "text-[#8b5a1d]",
    description: "text-[#997144]",
  },
  error: {
    box: "border-[#f0c9c7] bg-[#fff4f2]",
    icon: "bg-[#ffe1dd] text-[#b44c45]",
    title: "text-[#a43d37]",
    description: "text-[#a65a54]",
  },
};

function InterviewInviteAlert({
  tone,
  title,
  description,
}: {
  tone: AlertTone;
  title: string;
  description?: ReactNode;
}) {
  const styles = alertStyles[tone];
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? Clock3 : ShieldAlert;
  return (
    <section
      role="alert"
      className={`flex items-center gap-4 rounded-2xl border px-5 py-4 shadow-[0_8px_22px_rgba(27,55,50,.04)] sm:px-6 ${styles.box}`}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${styles.icon}`}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <strong className={`block text-sm font-bold ${styles.title}`}>{title}</strong>
        {description && <p className={`mb-0 mt-1 text-xs leading-6 ${styles.description}`}>{description}</p>}
      </div>
    </section>
  );
}

const answerSchema = z.object({
  answer: z.string().trim().min(1, "ابتدا پیام خودت را بنویس.").max(8_000, "پاسخ باید حداکثر ۸۰۰۰ کاراکتر باشد."),
});

function formatInvitationDeadline(deadline: string | null) {
  if (!deadline) return "—";
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return "—";

  const day = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return `${day}، ${time}`;
}

function RollingCountdownDigit({ from, digit }: { from: string; digit: string }) {
  const isRolling = from !== digit;

  return (
    <span className="relative block h-9 w-[0.65em] overflow-hidden text-3xl font-black leading-9 tabular-nums text-[#0f7b62] sm:h-10 sm:text-4xl sm:leading-10">
      <span
        key={digit}
        className={`block ${isRolling ? "motion-safe:animate-[invitation-countdown-roll_420ms_cubic-bezier(0.22,1,0.36,1)_forwards]" : ""}`}
      >
        <span className="block h-9 sm:h-10">{from}</span>
        <span className="block h-9 sm:h-10">{digit}</span>
      </span>
    </span>
  );
}

function RollingCountdownNumber({ value, previousValue }: { value: string; previousValue: string }) {
  return (
    <span className="flex" aria-label={value}>
      {Array.from(value).map((digit, index) => (
        <RollingCountdownDigit key={index} digit={digit} from={Array.from(previousValue)[index] ?? digit} />
      ))}
    </span>
  );
}

function InvitationDeadlineCountdown({ deadline }: { deadline: string | null }) {
  const [clock, setClock] = useState(() => {
    const now = Date.now();
    return { now, previousNow: now };
  });

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => {
      setClock((current) => ({ previousNow: current.now, now: Date.now() }));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (!deadline || Number.isNaN(new Date(deadline).getTime())) return null;

  const deadlineTime = new Date(deadline).getTime();
  const remaining = (timestamp: number) => {
    const seconds = Math.max(0, Math.floor((deadlineTime - timestamp) / 1_000));
    return {
      days: Math.floor(seconds / 86_400),
      hours: Math.floor((seconds % 86_400) / 3_600),
      minutes: Math.floor((seconds % 3_600) / 60),
      seconds: seconds % 60,
    };
  };
  const current = remaining(clock.now);
  const previous = remaining(clock.previousNow);
  const number = (value: number, minimumIntegerDigits = 1) =>
    new Intl.NumberFormat("fa-IR", { minimumIntegerDigits, useGrouping: false }).format(value);
  const units = [
    { label: "روز", value: number(current.days, 2), previousValue: number(previous.days, 2) },
    { label: "ساعت", value: number(current.hours, 2), previousValue: number(previous.hours, 2) },
    { label: "دقیقه", value: number(current.minutes, 2), previousValue: number(previous.minutes, 2) },
    { label: "ثانیه", value: number(current.seconds, 2), previousValue: number(previous.seconds, 2) },
  ];

  return (
    <section aria-label="شمارش معکوس مهلت مصاحبه" aria-live="polite" className="flex justify-center pt-1 mt-3">
      <div className="rounded-2xl border border-[#d8e9df] bg-white px-5 py-4 text-center shadow-[0_10px_26px_rgba(30,67,55,.06)] motion-safe:animate-[invitation-countdown-box-pulse_2.4s_ease-in-out_infinite] sm:px-7">
        <p className="m-0 text-sm font-bold text-[#526c63]">تا پایان مهلت مصاحبه</p>
        <div className="mt-3 flex items-start justify-center gap-2.5" dir="ltr">
            {units.map((unit, index) => (
              <div key={unit.label} className="flex items-start gap-2.5">
                {index > 0 && <span className="mt-1 text-3xl font-bold leading-none text-[#9ab1a7]">:</span>}
                <div className="flex min-w-12 flex-col items-center">
                  <RollingCountdownNumber value={unit.value} previousValue={unit.previousValue} />
                  <span className="mt-2 text-[11px] font-bold text-[#60766a]">{unit.label}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export default function InvitedInterview() {
  const { value } = useParams<{ value: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const claimAttempted = useRef(false);
  const [selectedQuestionIndex, setQuestionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [dialogueQuestions, setDialogueQuestions] = useState<string[]>([]);
  const [dialogueReplies, setDialogueReplies] = useState<string[]>([]);
  const [dialogueClarifications, setDialogueClarifications] = useState<
    Array<{ questionIndex: number; user: string; reply: string }>
  >([]);
  const [started, setStarted] = useState(false);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const [fullscreenReady, setFullscreenReady] = useState(false);
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);
  const invitation = useQuery({
    queryKey: ["employer", "invitation", value],
    queryFn: () => apiRequest<Invitation>(`/api/employer/interviews/${value}`),
    staleTime: 5_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status !== "completed") return false;
      return !data.reportReady ? 1_500 : !data.feedbackShared ? 15_000 : false;
    },
  });
  const initialAnswers = invitation.data?.answers ?? invitation.data?.questions?.map(() => "") ?? [];
  const firstUnanswered = initialAnswers.findIndex((answer) => !answer.trim());
  const questionIndex =
    selectedQuestionIndex ??
    (firstUnanswered >= 0
      ? firstUnanswered
      : Math.max(0, Math.min(initialAnswers.length, (invitation.data?.questions?.length ?? 1) - 1)));
  const form = useForm<z.infer<typeof answerSchema>>({
    resolver: zodResolver(answerSchema),
    values: { answer: (answers.length ? answers : initialAnswers)[questionIndex] ?? "" },
  });
  const answerValue = useWatch({ control: form.control, name: "answer" });
  const invalidate = async () => {
    await client.invalidateQueries({ queryKey: ["employer", "invitation", value] });
    await client.invalidateQueries({ queryKey: employerKeys.interviews });
  };
  const claim = useMutation({
    mutationFn: () => apiRequest(`/api/employer/invitations/${value}/accept`, { method: "POST" }),
    onSuccess: invalidate,
  });
  const turn = useMutation({
    mutationFn: (input: { questionIndex: number; answer: string }) =>
      apiRequest<{ questions: string[]; answers: string[]; replies: string[]; complete: boolean }>(
        `/api/employer/interviews/${value}/turn`,
        { method: "POST", body: JSON.stringify(input) },
      ),
  });
  const clarify = useMutation({
    mutationFn: (input: { questionIndex: number; userMessage: string }) =>
      apiRequest<{ clarifications: Array<{ questionIndex: number; user: string; reply: string }> }>(
        `/api/employer/interviews/${value}/clarify`,
        { method: "POST", body: JSON.stringify(input) },
      ),
  });
  const complete = useMutation({
    mutationFn: () => apiRequest(`/api/employer/interviews/${value}/complete`, { method: "POST" }),
    onSuccess: invalidate,
  });
  const exit = useMutation({
    mutationFn: (nextAnswers: string[]) =>
      apiRequest(`/api/employer/interviews/${value}/exit`, {
        method: "POST",
        body: JSON.stringify({ answers: nextAnswers }),
      }),
    onSuccess: async () => {
      await invalidate();
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      router.push("/interview");
    },
  });
  const invitationExpired = Boolean(invitation.data?.deadline && new Date(invitation.data.deadline) < new Date());
  const isInvitationToken = /^[a-f0-9]{64}$/.test(value);
  const interviewIsActive = !invitationExpired && (started || invitation.data?.status === "started");
  useEffect(() => {
    const data = invitation.data;
    if (
      claimAttempted.current ||
      !isInvitationToken ||
      !data ||
      invitationExpired ||
      data.status === "completed" ||
      data.owned
    )
      return;
    claimAttempted.current = true;
    claim.mutate();
  }, [claim, invitation.data, invitationExpired, isInvitationToken]);
  useEffect(() => {
    if (!interviewIsActive) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIntegrityWarning("خروج از تب مصاحبه ثبت شد. برای ادامه دوباره وارد حالت تمام‌صفحه شو.");
        setFullscreenReady(Boolean(document.fullscreenElement));
      }
    };
    const handleFullscreenChange = () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      setFullscreenReady(isFullscreen);
      if (!isFullscreen) setIntegrityWarning("از حالت تمام‌صفحه خارج شدی. پاسخ‌گویی تا ورود دوباره متوقف است.");
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [interviewIsActive]);

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      setFullscreenReady(true);
      setIntegrityWarning(null);
      return true;
    } catch {
      setIntegrityWarning("مرورگر اجازهٔ تمام‌صفحه نداد. دسترسی Full Screen را فعال و دوباره تلاش کن.");
      return false;
    }
  };

  if (invitation.isLoading) return <p>در حال دریافت مصاحبه...</p>;
  if (invitation.error || !invitation.data)
    return <InterviewInviteAlert tone="error" title="مصاحبه پیدا نشد" description={invitation.error?.message} />;
  const data = invitation.data;
  const expired = invitationExpired;
  const questions = dialogueQuestions.length ? dialogueQuestions : (data.questions ?? []);
  const activeAnswers = answers.length ? answers : (data.answers ?? questions.map(() => ""));
  const interviewStarted = started || data.status === "started";
  const activeReplies = dialogueReplies.length ? dialogueReplies : (data.replies ?? []);
  const concluded =
    questions.length > 0 &&
    activeAnswers.length === questions.length &&
    activeAnswers.every((answer) => answer.trim()) &&
    Boolean(activeReplies[questions.length - 1]?.trim());
  const busy = turn.isPending || clarify.isPending || complete.isPending || exit.isPending;
  const submitAnswer = async ({ answer }: z.infer<typeof answerSchema>) => {
    if (answer.trim().length < 10) {
      form.setError("answer", { message: "برای ثبت پاسخ، دست‌کم ۱۰ کاراکتر بنویس." });
      return;
    }
    const result = await turn.mutateAsync({ questionIndex, answer: answer.trim() });
    setAnswers(result.answers);
    setDialogueQuestions(result.questions);
    setDialogueReplies(result.replies);
    if (result.complete) {
      form.reset({ answer: "" });
      return;
    }
    setQuestionIndex(result.answers.length);
    form.reset({ answer: "" });
  };
  const askInterviewer = async ({ answer }: z.infer<typeof answerSchema>) => {
    const result = await clarify.mutateAsync({ questionIndex, userMessage: answer.trim() });
    setDialogueClarifications(result.clarifications);
    form.reset({ answer: "" });
  };
  const closeInterview = () => {
    const nextAnswers = activeAnswers.map((item, index) =>
      index === questionIndex ? form.getValues("answer").trim() : item,
    );
    exit.mutate(nextAnswers);
  };
  const finishInterview = () => {
    void complete
      .mutateAsync()
      .then(() => setStarted(false))
      .catch(() => undefined);
  };
  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-[15px] text-[11px] font-bold text-white no-underline shadow-[0_8px_18px_rgba(15,123,98,.16)] transition-colors hover:bg-[#0d6b57] disabled:cursor-not-allowed disabled:opacity-45";
  const isCompleted = data.status === "completed";
  const completedWithReport = isCompleted && data.feedbackShared && Boolean(data.report);

  return (
    <div className="mx-auto w-full pb-10 max-w-6xl">
      <SectionTitle
        title={`${isCompleted && data.feedbackShared ? "گزارش " : ""}مصاحبهٔ ${data.title}`}
        className="mb-5 items-center [&_h1]:!text-[28px]"
        action={
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#d8e9df] bg-[#f4faf7] px-3 py-2 text-xs font-bold text-[#46695c]">
            <BriefcaseBusiness size={16} className="text-[#0f7b62]" /> {data.companyName}
          </div>
        }
        leading={
          <button
            type="button"
            onClick={() => router.push("/interview-invites")}
            aria-label="بازگشت به مصاحبه‌های دعوتی"
            className="grid size-9 shrink-0 place-items-center rounded-full text-[#19312f] hover:bg-[#e6f2eb] hover:text-[#0f7b62]"
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        }
      />
      {expired && !isCompleted && <InterviewReportHero variant="expired" />}
      {!fullscreenReady && integrityWarning && (
        <InterviewInviteAlert
          tone="warning"
          title="برای ادامهٔ مصاحبه وارد تمام‌صفحه شو"
          description={integrityWarning}
        />
      )}
      {claim.error && (
        <InterviewInviteAlert tone="error" title="ثبت دعوت در حساب انجام نشد" description={claim.error.message} />
      )}
      {completedWithReport && data.report && (
        <InterviewReportView
          report={data.report}
          questions={data.questions ?? []}
          showFeedback={data.feedbackShared}
          variant="invited"
        />
      )}
      {isCompleted && data.reportReady && !data.feedbackShared && <InterviewReportHero variant="private" />}
      {isCompleted && !data.reportReady && (
        <div
          role="status"
          className="flex min-h-[360px] items-center justify-center gap-3 rounded-[22px] bg-[linear-gradient(120deg,#164c40,#10342f)] px-6 text-sm text-[#d5e8e1] shadow-[0_18px_48px_rgba(22,76,64,.18)]"
        >
          <LoaderCircle className="animate-spin motion-reduce:animate-none" size={22} aria-hidden="true" />
          در حال دریافت گزارش مصاحبه...
        </div>
      )}
      {!isCompleted && !expired && !interviewStarted ? (
        <>
          <section className="w-full max-w-none rounded-[26px] border border-[#dce8df] bg-white p-6 text-center shadow-[0_14px_38px_rgba(30,67,55,.06)] sm:p-8">
            <span className="mx-auto grid size-13 place-items-center rounded-2xl bg-[#e8f5ee] text-[#0f7b62]">
              <ShieldAlert size={27} />
            </span>
            <h2 className="mb-0 mt-4 text-xl font-black text-[#19312f]">آمادهٔ شروع مصاحبه‌ای؟</h2>
            <p className="mx-auto mb-6 mt-2 max-w-lg text-sm leading-8 text-[#61746f]">
              این دعوت در فهرست مصاحبه‌های دعوتی تو ذخیره شده است و می‌توانی تا پایان تاریخ{" "}
              <strong className="font-bold text-[#3e5f55]">{formatInvitationDeadline(data.deadline)}</strong> مصاحبه را شروع کنی.
            </p>
            <button
              type="button"
              disabled={claim.isPending}
              onClick={() => setShowStartConfirmation(true)}
              className={primaryButton}
            >
              <MessageCircleQuestion size={17} /> {claim.isPending ? "در حال ثبت دعوت..." : "شروع مصاحبه"}
            </button>
          </section>
          <InvitationDeadlineCountdown deadline={data.deadline} />
          {showStartConfirmation && (
            <ConfirmActionModal
              title="آمادهٔ شروع مصاحبهٔ دعوتی هستی؟"
              description="وقتی آماده‌ای و وقت کافی داری، مصاحبه را شروع کن."
              confirmLabel="شرایط را می‌پذیرم و شروع می‌کنم"
              onCancel={() => setShowStartConfirmation(false)}
              onConfirm={() => {
                setShowStartConfirmation(false);
                void (async () => {
                  if (!data.owned && isInvitationToken) {
                    try {
                      await claim.mutateAsync();
                    } catch {
                      return;
                    }
                  }
                  if (await enterFullscreen()) setStarted(true);
                })();
              }}
            >
              <ul className="list-disc space-y-2 ps-5 text-sm leading-7 text-[#526461]">
                <li>مصاحبه در حالت تمام‌صفحه برگزار می‌شود. در تب مصاحبه بمان و پاسخ‌ها را بدون کمک ابزارهای هوش مصنوعی بنویس.</li>
                <li>خروج از تمام‌صفحه یا جابه‌جایی بین تب‌ها در طول مصاحبه رصد می‌شود و رعایت‌نکردن شرایط می‌تواند در ارزیابی کارفرما اثر بگذارد.</li>
                <li>با ثبت خروج از جلسه، مصاحبه پایان می‌یابد و امکان ادامه وجود ندارد. نتیجه بر اساس پاسخ‌های ثبت‌شده برای کارفرما ارسال می‌شود.</li>
              </ul>
            </ConfirmActionModal>
          )}
        </>
      ) : null}
      {interviewStarted && !expired && questions.length > 0 && !fullscreenReady && (
        <section className="w-full max-w-none rounded-[26px] border border-[#d9e7de] bg-white p-6 text-center shadow-[0_14px_38px_rgba(30,67,55,.06)] sm:p-8">
          <span className="mx-auto grid size-13 place-items-center rounded-2xl bg-[#e8f5ee] text-[#0f7b62]">
            <ShieldAlert size={27} />
          </span>
          <h2 className="mb-0 mt-4 text-xl font-black text-[#19312f]">ورود امن به مصاحبه</h2>
          <p className="mx-auto mb-6 mt-2 max-w-xl text-sm leading-8 text-[#61746f]">
            مصاحبه در حالت تمام‌صفحه انجام می‌شود. کپی و پیست غیرفعال است و خروج از تب یا تمام‌صفحه هشدار داده می‌شود.
          </p>
          <button className={primaryButton} type="button" onClick={() => void enterFullscreen()}>
            <Maximize size={17} /> ورود به تمام‌صفحه و ادامه
          </button>
        </section>
      )}
      {interviewStarted && !expired && questions.length > 0 && fullscreenReady && (
        <InterviewPracticeDialog
          chatLayout
          title={`مصاحبهٔ ${data.title}`}
          analysisPending={complete.isPending}
          closeDisabled={busy}
          topNotice={
            integrityWarning || turn.error || clarify.error || complete.error || exit.error ? (
              <div className="space-y-2">
                {integrityWarning && (
                  <InterviewInviteAlert
                    tone="warning"
                    title="وضعیت تمام‌صفحه تغییر کرد"
                    description={integrityWarning}
                  />
                )}
                {turn.error && (
                  <InterviewInviteAlert tone="error" title="ثبت پاسخ انجام نشد" description={turn.error.message} />
                )}
                {clarify.error && (
                  <InterviewInviteAlert
                    tone="error"
                    title="دریافت توضیح انجام نشد"
                    description={clarify.error.message}
                  />
                )}
                {complete.error && (
                  <InterviewInviteAlert tone="error" title="ثبت نتیجه انجام نشد" description={complete.error.message} />
                )}
                {exit.error && (
                  <InterviewInviteAlert
                    tone="error"
                    title="ثبت نهایی خروج انجام نشد"
                    description={exit.error.message}
                  />
                )}
              </div>
            ) : undefined
          }
          exitDescription={
            concluded
              ? "گفت‌وگو کامل شده است. با ثبت نتیجه، پاسخ‌ها برای کارفرما ارسال می‌شوند."
              : "با خروج، مصاحبه همان لحظه نهایی می‌شود و امکان شروع یا ادامهٔ دوباره نداری. همین پاسخ‌های ثبت‌شده تصحیح و نتیجه برای کارفرما ارسال خواهد شد."
          }
          exitConfirmLabel={complete.isPending || exit.isPending ? "در حال ثبت نهایی..." : "ثبت نهایی و خروج"}
          onClose={concluded ? finishInterview : closeInterview}
        >
          <InterviewConversation
            questions={questions}
            answers={activeAnswers}
            replies={activeReplies}
            currentIndex={questionIndex}
            clarifications={dialogueClarifications.length ? dialogueClarifications : (data.clarifications ?? [])}
            pending={turn.isPending || clarify.isPending}
            intro={`سلام! من مصاحبه‌گر رادیکار برای موقعیت «${data.title}» در ${data.companyName} هستم. با هم دربارهٔ تجربه‌ها و روش کارت صحبت می‌کنیم.`}
          >
            {concluded ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-sm text-[#61746f]">گفت‌وگو تمام شد. جمع‌بندی مصاحبه‌گر را در بالا می‌بینی.</p>
                <button type="button" className={primaryButton} disabled={busy} onClick={finishInterview}>
                  {complete.isPending ? "در حال ثبت نتیجه..." : "ثبت نتیجه و پایان"}
                  <ArrowLeft size={16} />
                </button>
              </div>
            ) : (
              <InterviewAnswerComposer
                registration={form.register("answer")}
                answer={answerValue ?? ""}
                onSubmit={form.handleSubmit(
                  (input) =>
                    void (isInterviewClarification(input.answer) ? askInterviewer(input) : submitAnswer(input)),
                )}
                busy={busy}
                readOnly={busy}
                sending={turn.isPending || clarify.isPending}
                sendLabel={turn.isPending || clarify.isPending ? "در حال دریافت پاسخ مصاحبه‌گر" : "ارسال پاسخ"}
                ariaLabel="پاسخ تو"
                restrictClipboard
                error={form.formState.errors.answer?.message}
                footer={
                  <button
                    type="button"
                    className="rounded-lg border border-[#cfe3d8] bg-white px-3 py-1.5 text-xs text-[#0f7b62] disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void form.handleSubmit((input) => askInterviewer(input))()}
                  >
                    {clarify.isPending ? "در حال پاسخ..." : "از مصاحبه‌گر بپرس"}
                  </button>
                }
              />
            )}
          </InterviewConversation>
        </InterviewPracticeDialog>
      )}
    </div>
  );
}
