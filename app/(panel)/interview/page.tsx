"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, ChevronLeft, CircleUserRound, Clock3, FileCheck2, MessageSquareText, Sparkles, X } from "lucide-react";
import { SectionTitle } from "../_components/ui";
import { FeedbackSkeleton, InterviewSkeleton } from "../_components/loading-skeletons";
import { useToast } from "../_components/panel-shell";
import { createRecordId, getLatestResume, interviewSessionStore } from "@/lib/data/stores";
import type { InterviewFeedbackRecord, InterviewSessionRecord } from "@/lib/data/models";

type PracticeCard = { title: string; text: string; tone: string };
type SessionData = { title: string; subtitle: string; duration: string; questions: string[]; cards: PracticeCard[] };
type Feedback = { title: string; text: string };
const icons = [CircleUserRound, BriefcaseBusiness, FileCheck2];

export default function InterviewPage() {
  const notify = useToast();
  const [sessionRecord, setSessionRecord] = useState<InterviewSessionRecord | null>(null);
  const [hasResume, setHasResume] = useState(true);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState("مصاحبه شخصی‌سازی‌شده");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadStoredData = async () => {
      try {
        const [resume, sessions] = await Promise.all([getLatestResume(), interviewSessionStore.list()]);
        if (!active) return;
        setHasResume(Boolean(resume));
        setSessionRecord(sessions[0] || null);
        if (sessions[0]) setMode(sessions[0].mode);
      } catch (event) {
        if (active) setError(event instanceof Error ? event.message : "خواندن جلسه‌های ذخیره‌شده ناموفق بود.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadStoredData();
    return () => { active = false; };
  }, []);

  const loadSession = async (selectedMode = mode, startAfterLoad = false) => {
    setLoading(true);
    setError("");
    try {
      const resume = await getLatestResume();
      if (!resume) throw new Error("برای ساخت جلسه مصاحبه ابتدا رزومه را تکمیل کن.");
      const response = await fetch("/api/interview/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resume: resume.data, mode: selectedMode }),
      });
      const result = await response.json() as SessionData & { error?: string };
      if (!response.ok) throw new Error(result.error || "ساخت جلسه مصاحبه ناموفق بود.");
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
      setSessionRecord(record);
      setMode(selectedMode);
      setQuestionIndex(0);
      setStarted(startAfterLoad);
    } catch (event) {
      setError(event instanceof Error ? event.message : "مدل مصاحبه پاسخ نداد.");
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
      const response = await fetch("/api/interview/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: currentQuestion, answer }),
      });
      const result = await response.json() as Feedback & { error?: string };
      if (!response.ok) throw new Error(result.error || "دریافت بازخورد ناموفق بود.");
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
      setSessionRecord(updated);
      setFeedback(result);
    } catch (event) {
      notify(event instanceof Error ? event.message : "مدل بازخورد پاسخ نداد.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) return <InterviewSkeleton />;
  if (!hasResume) return <div className="empty-results"><FileCheck2 size={34} /><h3>رزومه‌ای برای تمرین وجود ندارد</h3><p>ابتدا رزومه خودت را بساز تا سؤال‌ها براساس اطلاعات واقعی تو تولید شوند.</p><Link className="primary-btn" href="/resumes">ساخت رزومه</Link></div>;

  return <><SectionTitle title="آمادگی مصاحبه" description="جلسه‌ها و بازخوردهای تولیدشده ذخیره می‌شوند و از اطلاعات واقعی رزومه استفاده می‌کنند." />{error && <div className="success-banner warning-banner"><Sparkles size={20} /><div><strong>ساخت جلسه انجام نشد</strong><span>{error}</span></div><button onClick={() => setError("")}><X size={18} /></button></div>}<div className="interview-hero"><div><span className="soft-badge"><Sparkles size={14} /> تمرین مدل‌محور</span><h2>{sessionRecord?.title || "هنوز جلسه‌ای ساخته نشده است"}</h2><p>{sessionRecord?.subtitle || "یک جلسه تازه بساز تا سؤال‌ها براساس رزومه واقعی تو تولید شوند."}</p><div className="interview-meta"><span><Clock3 size={15} /> {sessionRecord?.duration || "—"}</span><span><MessageSquareText size={15} /> {sessionRecord?.feedbacks.length || 0} بازخورد ذخیره‌شده</span></div><button className="light-btn" onClick={() => sessionRecord ? setStarted(true) : void loadSession()}>{sessionRecord ? "شروع مصاحبه آزمایشی" : "ساخت جلسه مصاحبه"} <ArrowLeft size={17} /></button></div><div className="orb"><MessageSquareText size={40} /></div></div>{started && sessionRecord && <section className="panel interview-session"><div className="session-head"><div><span className="great-label">جلسه فعال</span><h3>{mode}</h3></div><button className="icon-button" onClick={() => setStarted(false)}><X size={19} /></button></div><div className="question-box"><span>سؤال {questionIndex + 1} از {sessionRecord.questions.length}</span><h2>{currentQuestion}</h2></div><label>پاسخ تو<textarea value={answer} onChange={(event) => { setAnswer(event.target.value); setFeedback(null); }} placeholder="پاسخ خودت را وارد کن..." /></label>{feedbackLoading && <FeedbackSkeleton />}{feedback && <div className="feedback-box"><CheckCircle2 size={19} /><div><strong>{feedback.title}</strong><p>{feedback.text}</p></div></div>}<div className="session-actions"><button className="secondary-btn" onClick={() => { setQuestionIndex((current) => Math.min(current + 1, sessionRecord.questions.length - 1)); setAnswer(""); setFeedback(null); notify("سؤال بعدی نمایش داده شد"); }}>سؤال بعدی <ArrowLeft size={16} /></button><button className="primary-btn" disabled={!answer.trim() || feedbackLoading} onClick={() => void requestFeedback()}><Sparkles size={17} /> {feedbackLoading ? "در حال دریافت بازخورد..." : "دریافت بازخورد"}</button></div></section>}<div className="practice-grid">{(sessionRecord?.cards || []).map((item, index) => { const Icon = icons[index] || CircleUserRound; return <article className="panel" key={item.title}><div className={`icon-tile ${item.tone}`}><Icon size={22} /></div><h3>{item.title}</h3><p>{item.text}</p><button className="text-btn" onClick={() => startPractice(item.title)}>شروع تمرین <ChevronLeft size={16} /></button></article>; })}</div></>;
}
