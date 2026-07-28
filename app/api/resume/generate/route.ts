import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getWriteConfig } from "@/lib/provider-config";
import { emptyResumeData, hasResumeContent, type ResumeData } from "@/app/(panel)/resumes/resume-data";
import type { KnowledgeProfileRecord } from "@/lib/data/models";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { resume?: Partial<ResumeData>; knowledge?: Partial<KnowledgeProfileRecord>; instruction?: string };
  if (!hasResumeContent(body.resume)) {
    return NextResponse.json({ error: "ابتدا اطلاعات واقعی رزومه را وارد کن." }, { status: 422 });
  }
  const resume = { ...emptyResumeData, ...body.resume };
  try {
    const generated = await chatJson<Partial<ResumeData>>(getWriteConfig(), [
      { role: "system", content: "تو رزومه‌نویس حرفه‌ای فارسی هستی. فقط JSON معتبر برگردان. اطلاعات جعلی نساز؛ فیلدهای موجود را کامل، تمیز و حرفه‌ای کن." },
      { role: "user", content: `رزومه فعلی:\n${JSON.stringify(resume, null, 2)}\nپایگاه دانش کاربر، شامل تمام تجربه‌ها و سوابق تحصیلی:\n${JSON.stringify(body.knowledge || {}, null, 2)}\nدرخواست کاربر: ${body.instruction || "رزومه را حرفه‌ای، ATS-friendly و فارسی تکمیل کن."}\nاطلاعات چند سابقه را بدون جعل و به‌شکل خوانا در فیلدهای متنی مرتبط جمع‌بندی کن. JSON شامل همه فیلدهای ResumeData برگردان.` },
    ]);
    return NextResponse.json({ resume: { ...resume, ...generated, photoUrl: generated.photoUrl || resume.photoUrl } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "مدل رزومه‌ساز پاسخ نداد." }, { status: 502 });
  }
}
