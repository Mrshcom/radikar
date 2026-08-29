"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  CircleUserRound,
  Clock3,
  FileCheck2,
  MessageSquareText,
  Sparkles,
  X,
} from "lucide-react";
import { SectionTitle } from "../_components/ui";
import {
  FeedbackSkeleton,
  InterviewSkeleton,
} from "../_components/loading-skeletons";
import { useToast } from "../_components/panel-shell";
import { useModelTasks } from "../_components/model-task-provider";
import {
  createRecordId,
  getActiveProfileId,
  getLatestResume,
  interviewSessionStore,
  knowledgeProfileStore,
} from "@/lib/data/stores";
import type {
  InterviewFeedbackRecord,
  InterviewSessionRecord,
} from "@/lib/data/models";
import { formatPersianNumber, toPersianDigits } from "@/lib/fa-number";
import { apiUrl } from "@/lib/api-url";

type PracticeCard = { title: string; text: string; tone: string };
type SessionData = {
  title: string;
  subtitle: string;
  duration: string;
  questions: string[];
  cards: PracticeCard[];
};
type Feedback = { title: string; text: string };
const icons = [CircleUserRound, BriefcaseBusiness, FileCheck2];

export default function InterviewPage() {
  const notify = useToast();
  const { isRunning, runModelTask } = useModelTasks();
  const [sessionRecord, setSessionRecord] =
    useState<InterviewSessionRecord | null>(null);
  const [hasResume, setHasResume] = useState(true);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("مصاحبه شخصی‌سازی‌شده");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState("");
  const sessionBuilding = loading || isRunning("interview-session");
  const feedbackBusy =
    feedbackLoading || isRunning("interview-feedback");

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
        setSessionRecord(sessions[0] || null);
        if (sessions[0]) setMode(sessions[0].mode);
      } catch (event) {
        if (active) {
          const message =
            event instanceof Error
              ? event.message
              : "خواندن جلسه‌های ذخیره‌شده ناموفق بود.";
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
  }, [notify]);

  const loadSession = async (selectedMode = mode, startAfterLoad = false) => {
    setLoading(true);
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
          const [resume, knowledge] = await Promise.all([
            getLatestResume(),
            knowledgeProfileStore.get(profileId),
          ]);
          const resumeData = resume?.data ?? knowledge?.resumeData;
          if (!resumeData)
            throw new Error(
              "برای ساخت جلسه مصاحبه ابتدا پایگاه دانش یا رزومه را تکمیل کن.",
            );
          const response = await fetch(apiUrl("/api/interview/session"), {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              resume: resumeData,
              knowledge,
              mode: selectedMode,
            }),
          });
          const result = (await response.json()) as SessionData & {
            error?: string;
          };
          if (!response.ok)
            throw new Error(result.error || "ساخت جلسه مصاحبه ناموفق بود.");
          const now = new Date().toISOString();
          const record: InterviewSessionRecord = {
            id: createRecordId("interview"),
            ...result,
            mode: selectedMode,
            feedbacks: [],
            createdAt: now,
            updatedAt: now,
          };
          await interviewSessionStore.put(record);
          return record;
        },
      });
      setSessionRecord(record);
      setMode(selectedMode);
      setQuestionIndex(0);
      setStarted(startAfterLoad);
      notify("جلسه مصاحبه با موفقیت ساخته شد.");
    } catch (event) {
      const message =
        event instanceof Error ? event.message : "مدل مصاحبه پاسخ نداد.";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const startPractice = (selectedMode: string) => {
    setMode(selectedMode);
    setFeedback(null);
    setAnswer("");
    if (!sessionRecord || sessionRecord.mode !== selectedMode) {
      void loadSession(selectedMode, true);
    } else {
      setStarted(true);
    }
  };

  const currentQuestion = sessionRecord?.questions[questionIndex] || "";
  const requestFeedback = async () => {
    if (!sessionRecord || !currentQuestion || !answer.trim()) return;
    setFeedbackLoading(true);
    setFeedback(null);
    try {
      const { result, updated } = await runModelTask({
        key: "interview-feedback",
        title: "ارزیابی پاسخ مصاحبه",
        pendingLabel: "مدل در حال بررسی پاسخ شما است",
        completedLabel: "بازخورد پاسخ آماده شد",
        href: "/interview",
        run: async () => {
          const response = await fetch(apiUrl("/api/interview/feedback"), {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ question: currentQuestion, answer }),
          });
          const result = (await response.json()) as Feedback & {
            error?: string;
          };
          if (!response.ok)
            throw new Error(result.error || "دریافت بازخورد ناموفق بود.");
          const feedbackRecord: InterviewFeedbackRecord = {
            question: currentQuestion,
            answer: answer.trim(),
            title: result.title,
            text: result.text,
            createdAt: new Date().toISOString(),
          };
          const updated = {
            ...sessionRecord,
            feedbacks: [...sessionRecord.feedbacks, feedbackRecord],
            updatedAt: feedbackRecord.createdAt,
          };
          await interviewSessionStore.put(updated);
          return { result, updated };
        },
      });
      setSessionRecord(updated);
      setFeedback(result);
      notify("بازخورد پاسخ با موفقیت آماده شد.");
    } catch (event) {
      notify(
        event instanceof Error ? event.message : "مدل بازخورد پاسخ نداد.",
        "error",
      );
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (sessionBuilding) return <InterviewSkeleton />;
  const primaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border-0 bg-[#0f7b62] px-[15px] text-[11px] font-bold text-white no-underline disabled:cursor-not-allowed disabled:opacity-45";
  const secondaryButton =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-[#e1e6e0] bg-white px-[15px] text-[11px] font-bold text-[#526461]";
  if (!hasResume)
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[15px] border border-dashed border-[#dce3dc] text-[#8b9996] [&_h3]:mb-[3px] [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:text-[#19312f] [&_p]:mb-[14px] [&_p]:mt-0 [&_p]:text-[9px]">
        <FileCheck2 size={34} />
        <h3>اطلاعاتی برای تمرین وجود ندارد</h3>
        <p>
          ابتدا پایگاه دانش را کامل کن تا سؤال‌ها براساس اطلاعات واقعی تو تولید
          شوند.
        </p>
        <Link className={primaryButton} href="/knowledge-base">
          تکمیل پایگاه دانش
        </Link>
      </div>
    );

  const iconTones: Record<string, string> = {
    mint: "bg-[#d8eee5] text-[#0c765d]",
    peach: "bg-[#fae8dc] text-[#bb704e]",
    lavender: "bg-[#eee9f8] text-[#7660a8]",
    sky: "bg-[#e5eff7] text-[#547da5]",
  };
  return (
    <>
      <SectionTitle
        title="آمادگی مصاحبه"
        description="جلسه‌ها و بازخوردهای تولیدشده ذخیره می‌شوند و از اطلاعات واقعی رزومه استفاده می‌کنند."
      />
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#efcfb8] bg-[#fff5ed] p-3 text-[#9a572d]">
          <Sparkles size={20} />
          <div className="flex flex-1 flex-col">
            <strong className="text-[10px]">ساخت جلسه انجام نشد</strong>
            <span className="text-[8px]">{error}</span>
          </div>
          <button
            className="border-0 bg-transparent"
            onClick={() => setError("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <div className="relative flex min-h-[265px] items-center overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_12%_15%,rgba(80,157,139,.33),transparent_30%),linear-gradient(128deg,#173f39,#0f2f2d)] px-[clamp(24px,3vw,38px)] py-[34px] text-white max-[560px]:min-h-[350px] max-[560px]:items-start max-[560px]:p-7">
        <div className="relative z-2 max-w-[610px]">
          <span className="inline-flex w-fit items-center gap-1 rounded-lg border border-white/8 bg-white/10 px-[9px] py-1.5 text-[9px] text-[#cce7df]">
            <Sparkles size={14} /> تمرین مدل‌محور
          </span>
          <h2 className="mb-1.5 mt-[13px] text-[clamp(16px,2.25vw,24px)] leading-[1.6]">
            {sessionRecord?.title || "هنوز جلسه‌ای ساخته نشده است"}
          </h2>
          <p className="mb-3 mt-0 max-w-[500px] text-[10px] leading-[1.9] text-[#abc4be]">
            {sessionRecord?.subtitle ||
              "یک جلسه تازه بساز تا سؤال‌ها براساس رزومه واقعی تو تولید شوند."}
          </p>
          <div className="mb-4 flex gap-4 text-[9px] text-[#bad0ca] [&_span]:flex [&_span]:items-center [&_span]:gap-1">
            <span>
              <Clock3 size={15} />{" "}
              {sessionRecord?.duration
                ? toPersianDigits(sessionRecord.duration)
                : "—"}
            </span>
            <span>
              <MessageSquareText size={15} />{" "}
              {formatPersianNumber(sessionRecord?.feedbacks.length || 0)}{" "}
              بازخورد ذخیره‌شده
            </span>
          </div>
          <button
            className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-[10px] border-0 bg-white px-[17px] text-[11px] font-bold text-[#123c37] transition hover:bg-[#f2f8f5]"
            onClick={() =>
              sessionRecord ? setStarted(true) : void loadSession()
            }
          >
            {sessionRecord ? "شروع مصاحبه آزمایشی" : "ساخت جلسه مصاحبه"}{" "}
            <ArrowLeft size={17} />
          </button>
        </div>
        <div className="relative z-2 mr-auto grid size-[132px] min-w-[132px] place-items-center rounded-full border-[8px] border-[#60c6a8] bg-[#153a36]/45 text-[#60c6a8] shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)] max-[560px]:absolute max-[560px]:bottom-[25px] max-[560px]:left-[25px] max-[560px]:size-[100px] max-[560px]:min-w-[100px]">
          <MessageSquareText size={40} />
        </div>
        <div className="absolute -bottom-[120px] -left-[35px] size-[230px] rounded-full border border-white/6 shadow-[0_0_0_35px_rgba(255,255,255,.02),0_0_0_75px_rgba(255,255,255,.015)]" />
      </div>
      {started && sessionRecord && (
        <section className="mt-4 rounded-[17px] border border-[#e7ebe6] bg-white p-[22px] shadow-[0_12px_36px_rgba(27,55,50,.055)] max-[820px]:p-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-md bg-[#e6f4ee] px-2 py-1 text-[8px] font-bold text-[#0f7b62]">
                جلسه فعال
              </span>
              <h3 className="mb-0 mt-[9px] text-[13px]">{mode}</h3>
            </div>
            <button
              className="grid place-items-center border-0 bg-transparent p-[5px] text-[#9ba5a3]"
              onClick={() => setStarted(false)}
            >
              <X size={19} />
            </button>
          </div>
          <div className="my-[18px] rounded-[13px] bg-[#f1f6f2] p-[18px]">
            <span className="text-[8px] font-bold text-[#0f7b62]">
              سؤال {formatPersianNumber(questionIndex + 1)} از{" "}
              {formatPersianNumber(sessionRecord.questions.length)}
            </span>
            <h2 className="mb-0 mt-2 text-[15px] leading-[1.9]">
              {currentQuestion}
            </h2>
          </div>
          <label className="grid gap-2 text-[9px] text-[#60716e]">
            پاسخ تو
            <textarea
              className="min-h-[125px] w-full resize-y rounded-[11px] border border-[#dfe5df] bg-[#fbfcfa] p-[13px] text-[12px] leading-8 outline-0 focus:border-[#72b7a2] focus:shadow-[0_0_0_3px_#e7f3ef]"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                setFeedback(null);
              }}
              placeholder="پاسخ خودت را وارد کن..."
            />
          </label>
          {feedbackBusy && <FeedbackSkeleton />}
          {feedback && (
            <div className="mt-3 flex items-start gap-[9px] rounded-[10px] bg-[#edf8f3] p-3 text-[#176b57]">
              <CheckCircle2 size={19} />
              <div>
                <strong className="text-[10px]">{feedback.title}</strong>
                <p className="mb-0 mt-[3px] text-[8px] leading-[1.8] text-[#66847b]">
                  {feedback.text}
                </p>
              </div>
            </div>
          )}
          <div className="mt-[14px] flex justify-between gap-[10px] max-[560px]:flex-col-reverse">
            <button
              className={secondaryButton}
              onClick={() => {
                setQuestionIndex((current) =>
                  Math.min(current + 1, sessionRecord.questions.length - 1),
                );
                setAnswer("");
                setFeedback(null);
                notify("سؤال بعدی نمایش داده شد");
              }}
            >
              سؤال بعدی <ArrowLeft size={16} />
            </button>
            <button
              className={primaryButton}
              disabled={!answer.trim() || feedbackBusy}
              onClick={() => void requestFeedback()}
            >
              <Sparkles size={17} />{" "}
              {feedbackBusy ? "در حال دریافت بازخورد..." : "دریافت بازخورد"}
            </button>
          </div>
        </section>
      )}
      <div className="mt-4 grid grid-cols-3 gap-3 max-[820px]:grid-cols-1">
        {(sessionRecord?.cards || []).map((item, index) => {
          const Icon = icons[index] || CircleUserRound;
          return (
            <article
              className="rounded-[17px] border border-[#e7ebe6] bg-white p-5 shadow-[0_12px_36px_rgba(27,55,50,.055)]"
              key={item.title}
            >
              <div
                className={`grid size-[39px] place-items-center rounded-xl ${iconTones[item.tone] ?? iconTones.mint}`}
              >
                <Icon size={22} />
              </div>
              <h3 className="mb-1 mt-4 text-[12px]">{item.title}</h3>
              <p className="m-0 text-[9px] leading-[1.8] text-[#758582]">
                {item.text}
              </p>
              <button
                className="mt-3 flex items-center gap-[3px] border-0 bg-transparent p-1.5 text-[10px] font-bold text-[#0f7b62]"
                onClick={() => startPractice(item.title)}
              >
                شروع تمرین <ChevronLeft size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </>
  );
}
