import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getAnalyzeConfig } from "@/lib/provider-config";
import { emptyResumeData, hasResumeContent, type ResumeData } from "@/app/(panel)/resumes/resume-data";
import type { KnowledgeProfileRecord } from "@/lib/data/models";

type InterviewSession = { title: string; subtitle: string; duration: string; questions: string[]; cards: Array<{ title: string; text: string; tone: string }> };

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { resume?: Partial<ResumeData>; knowledge?: Partial<KnowledgeProfileRecord>; mode?: string; jobDescription?: string };
  if (!hasResumeContent(body.resume)) {
    return NextResponse.json({ error: "برای ساخت جلسه مصاحبه ابتدا رزومه را تکمیل کن." }, { status: 422 });
  }
  const resume = { ...emptyResumeData, ...body.resume };
  try {
    const result = await chatJson<Partial<InterviewSession>>(getAnalyzeConfig(), [
      { role: "system", content: "تو مربی مصاحبه شغلی هستی. فقط JSON معتبر فارسی برگردان." },
      { role: "user", content: `برای این کاربر جلسه تمرین مصاحبه شخصی‌سازی‌شده بساز.\nرزومه:\n${JSON.stringify(resume, null, 2)}\nاطلاعات تکمیلی پایگاه دانش:\n${JSON.stringify(body.knowledge || {}, null, 2)}\nحالت تمرین: ${body.mode || "ترکیبی"}\nشرح شغل اختیاری: ${body.jobDescription || "ندارد"}\nJSON: {"title":string,"subtitle":string,"duration":string,"questions":string[],"cards":[{"title":string,"text":string,"tone":"lavender|mint|peach"}]}` },
    ]);
    if (!result.title?.trim() || !result.subtitle?.trim() || !result.duration?.trim() || !result.questions?.length) {
      return NextResponse.json({ error: "مدل جلسه مصاحبه کامل تولید نکرد." }, { status: 502 });
    }
    return NextResponse.json({ title: result.title.trim(), subtitle: result.subtitle.trim(), duration: result.duration.trim(), questions: result.questions.slice(0, 6), cards: (result.cards || []).slice(0, 3) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "مدل مصاحبه پاسخ نداد." }, { status: 502 });
  }
}
