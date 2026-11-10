"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Clock3, Maximize, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { employerKeys } from "@/lib/employer";
import { FormField } from "../../_components/form-field";
import { TextAreaField } from "@/app/_components/text-field";
import { InterviewPracticeDialog } from "../../interview/interview-practice-dialog";
import { InterviewConversation } from "../../interview/interview-conversation";
import { submitInterviewAnswerOnEnter } from "../../interview/interview-answer-keyboard";
import { isInterviewClarification } from "../../interview/interview-message-intent";

type Invitation = {
  companyName: string;
  title: string;
  deadline: string | null;
  status: string;
  questions: string[] | null;
  answers: string[] | null;
  replies: string[] | null;
  clarifications: Array<{ questionIndex: number; user: string; reply: string }> | null;
};
const answerSchema = z.object({
  answer: z.string().trim().min(1, "ابتدا پیام خودت را بنویس.").max(8_000, "پاسخ باید حداکثر ۸۰۰۰ کاراکتر باشد."),
});

export default function InvitedInterview() {
  const { value } = useParams<{ value: string }>();
  const router = useRouter();
  const client = useQueryClient();
  const [selectedQuestionIndex, setQuestionIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [dialogueQuestions, setDialogueQuestions] = useState<string[]>([]);
  const [dialogueReplies, setDialogueReplies] = useState<string[]>([]);
  const [dialogueClarifications, setDialogueClarifications] = useState<
    Array<{ questionIndex: number; user: string; reply: string }>
  >([]);
  const [started, setStarted] = useState(false);
  const [fullscreenReady, setFullscreenReady] = useState(false);
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);
  const invitation = useQuery({
    queryKey: ["employer", "invitation", value],
    queryFn: () => apiRequest<Invitation>(`/api/employer/interviews/${value}`),
    staleTime: 5_000,
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
  const invalidate = async () => {
    await client.invalidateQueries({ queryKey: ["employer", "invitation", value] });
    await client.invalidateQueries({ queryKey: employerKeys.interviews });
  };
  const accept = useMutation({
    mutationFn: () => apiRequest(`/api/employer/invitations/${value}/accept`, { method: "POST" }),
    onSuccess: async () => {
      await invalidate();
      setStarted(true);
    },
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
  const interviewIsActive =
    !invitationExpired && (started || Boolean(invitation.data?.questions && invitation.data.status !== "completed"));
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
    return (
      <p role="alert" className="text-red-600">
        {invitation.error?.message ?? "مصاحبه پیدا نشد."}
      </p>
    );
  const data = invitation.data;
  const expired = invitationExpired;
  const questions = dialogueQuestions.length ? dialogueQuestions : (data.questions ?? []);
  const activeAnswers = answers.length ? answers : (data.answers ?? questions.map(() => ""));
  const interviewStarted = started || Boolean(data.questions && data.status !== "completed");
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
    void complete.mutateAsync().then(() => setStarted(false)).catch(() => undefined);
  };
  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-[15px] text-[11px] font-bold text-white no-underline shadow-[0_8px_18px_rgba(15,123,98,.16)] transition-colors hover:bg-[#0d6b57] disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2 sm:py-5">
      {expired && data.status !== "completed" && (
        <section
          role="alert"
          className="flex items-center gap-4 rounded-2xl border border-[#f0dca8] bg-[#fff9ea] px-5 py-4 text-[#8b5a1d] shadow-[0_8px_22px_rgba(126,86,25,.05)]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#ffedbf] text-[#aa701f]">
            <Clock3 size={20} />
          </span>
          <div>
            <strong className="block text-sm">مهلت این دعوت به پایان رسیده است</strong>
            <span className="mt-1 block text-xs leading-6 text-[#997144]">
              برای دریافت فرصت جدید، با کارفرما هماهنگ کن.
            </span>
          </div>
        </section>
      )}
      <header className="relative overflow-hidden rounded-[28px] border border-[#d9e7de] bg-white px-6 py-7 shadow-[0_12px_34px_rgba(30,67,55,.05)] sm:px-9 sm:py-8">
        <div aria-hidden className="absolute -left-12 -top-14 size-44 rounded-full bg-[#e7f5ee] blur-2xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <h1 className="m-0 text-[25px] font-black tracking-[-.035em] text-[#19312f] sm:text-[32px]">
                مصاحبهٔ {data.title}
              </h1>
              <p className="mb-0 mt-3 text-sm leading-7 text-[#60766a]">
                پاسخ‌ها با هوش مصنوعی تحلیل می‌شوند و گزارش نهایی برای کارفرما ارسال خواهد شد.
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#d8e9df] bg-[#f4faf7] px-3 py-2 text-xs font-bold text-[#46695c]">
              <BriefcaseBusiness size={16} className="text-[#0f7b62]" /> {data.companyName}
            </div>
          </div>
          <div className="mt-6 flex w-fit items-center gap-2 rounded-xl bg-[#f7faf8] px-3 py-2 text-xs font-bold text-[#60766a]">
            <Clock3 size={16} className="text-[#0f7b62]" />
            مهلت پاسخ: {data.deadline ? new Date(data.deadline).toLocaleString("fa-IR") : "—"}
          </div>
        </div>
      </header>
      {data.status === "completed" ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#cce6d5] bg-[#eff9f2] p-5 text-sm font-bold text-[#0f7b62]">
          <CheckCircle2 size={20} /> مصاحبه تکمیل شد و نتیجه به کارفرما رسید.
        </div>
      ) : !expired && !data.questions ? (
        <section className="mx-auto max-w-2xl rounded-[26px] border border-[#dce8df] bg-white p-6 text-center shadow-[0_14px_38px_rgba(30,67,55,.06)] sm:p-8">
          <span className="mx-auto grid size-13 place-items-center rounded-2xl bg-[#e8f5ee] text-[#0f7b62]">
            <ShieldAlert size={27} />
          </span>
          <h2 className="mb-0 mt-4 text-xl font-black text-[#19312f]">آمادهٔ شروع مصاحبه‌ای؟</h2>
          <p className="mx-auto mb-6 mt-2 max-w-lg text-sm leading-8 text-[#61746f]">
            با پذیرش دعوت، پاسخ‌ها در فضای امن ثبت و گزارش نهایی فقط برای کارفرمای این پوزیشن نمایش داده می‌شود.
          </p>
          <button
            disabled={accept.isPending}
            onClick={() =>
              void enterFullscreen().then((ready) => {
                if (ready) accept.mutate();
              })
            }
            className={primaryButton}
          >
            <Maximize size={17} /> {accept.isPending ? "در حال آماده‌سازی..." : "پذیرش دعوت و شروع"}
          </button>
          {accept.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {accept.error.message}
            </p>
          )}
        </section>
      ) : null}
      {interviewStarted && !expired && questions.length > 0 && !fullscreenReady && (
        <section className="mx-auto max-w-2xl rounded-[26px] border border-[#d9e7de] bg-white p-6 text-center shadow-[0_14px_38px_rgba(30,67,55,.06)] sm:p-8">
          <span className="mx-auto grid size-13 place-items-center rounded-2xl bg-[#e8f5ee] text-[#0f7b62]">
            <ShieldAlert size={27} />
          </span>
          <h2 className="mb-0 mt-4 text-xl font-black text-[#19312f]">ورود امن به مصاحبه</h2>
          <p className="mx-auto mb-6 mt-2 max-w-xl text-sm leading-8 text-[#61746f]">
            مصاحبه در حالت تمام‌صفحه انجام می‌شود. کپی و پیست غیرفعال است و خروج از تب یا تمام‌صفحه هشدار داده می‌شود.
          </p>
          {integrityWarning && (
            <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              {integrityWarning}
            </p>
          )}
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
          exitDescription={concluded
            ? "گفت‌وگو کامل شده است. با ثبت نتیجه، پاسخ‌ها برای کارفرما ارسال می‌شوند."
            : "با خروج، مصاحبه همان لحظه نهایی می‌شود و امکان شروع یا ادامهٔ دوباره نداری. همین پاسخ‌های ثبت‌شده تصحیح و نتیجه برای کارفرما ارسال خواهد شد."}
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
                <button
                  type="button"
                  className={primaryButton}
                  disabled={busy}
                  onClick={finishInterview}
                >
                  {complete.isPending ? "در حال ثبت نتیجه..." : "ثبت نتیجه و پایان"}
                  <ArrowLeft size={16} />
                </button>
                {complete.error && <p role="alert" className="w-full text-sm text-red-600">{complete.error.message}</p>}
              </div>
            ) : <form
              onSubmit={form.handleSubmit(
                (input) => void (isInterviewClarification(input.answer) ? askInterviewer(input) : submitAnswer(input)),
              )}
            >
              <FormField
                label="پاسخ تو"
                htmlFor="invited-interview-answer"
                errorId="invited-interview-answer-error"
                error={form.formState.errors.answer?.message}
                className="text-xs font-normal text-[#60716e]"
              >
                <TextAreaField
                  id="invited-interview-answer"
                  {...form.register("answer")}
                  className="bg-[#fcfdfb]"
                  disabled={busy}
                  autoComplete="off"
                  onCopy={(event) => event.preventDefault()}
                  onCut={(event) => event.preventDefault()}
                  onPaste={(event) => event.preventDefault()}
                  onDrop={(event) => event.preventDefault()}
                  onContextMenu={(event) => event.preventDefault()}
                  onKeyDown={(event) => submitInterviewAnswerOnEnter(event, busy)}
                  maxLength={8_000}
                  aria-invalid={Boolean(form.formState.errors.answer)}
                  aria-describedby={form.formState.errors.answer ? "invited-interview-answer-error" : undefined}
                  placeholder="پاسخت را بنویس..."
                />
              </FormField>
              {integrityWarning && (
                <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  {integrityWarning}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-xs text-[#61746f]">Enter برای ارسال · Shift+Enter برای خط بعد</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="min-h-10 rounded-xl border border-[#cfe3d8] bg-white px-3 text-xs font-bold text-[#0f7b62] disabled:opacity-50"
                    disabled={busy}
                    onClick={() => void form.handleSubmit((input) => askInterviewer(input))()}
                  >
                    {clarify.isPending ? "در حال پاسخ..." : "از مصاحبه‌گر بپرس"}
                  </button>
                  <button className={primaryButton} type="submit" disabled={busy}>
                    {complete.isPending
                      ? "در حال ثبت نتیجه..."
                      : turn.isPending
                        ? "در حال فکر کردن..."
                        : "ارسال پاسخ"}
                    <ArrowLeft size={16} />
                  </button>
                </div>
              </div>
              {turn.error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {turn.error.message}
                </p>
              )}
              {clarify.error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {clarify.error.message}
                </p>
              )}
              {complete.error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {complete.error.message}
                </p>
              )}
              {exit.error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  ثبت نهایی خروج انجام نشد: {exit.error.message}
                </p>
              )}
            </form>}
          </InterviewConversation>
        </InterviewPracticeDialog>
      )}
    </div>
  );
}
