import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getWriteConfig } from "@/lib/provider-config";
import { emptyResumeData, hasResumeContent, type ResumeData } from "@/app/(panel)/resumes/resume-data";
import { validateJobDescription } from "@/lib/job-description-validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { jobDescription?: string; resume?: Partial<ResumeData> };
  const jobDescription = body.jobDescription?.trim() ?? "";
  const validation = validateJobDescription(jobDescription);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }
  if (!hasResumeContent(body.resume)) {
    return NextResponse.json({ error: "رزومه مبنا خالی است." }, { status: 422 });
  }

  const resume = { ...emptyResumeData, ...body.resume };

  try {
    const tailored = await chatJson<Partial<ResumeData>>(getWriteConfig(), [
      { role: "system", content: "تو رزومه‌نویس حرفه‌ای فارسی هستی. فقط JSON معتبر برگردان. اطلاعات غیرواقعی نساز؛ فقط متن رزومه را با تمرکز بر آگهی بازنویسی کن." },
      { role: "user", content: `رزومه پایه:\n${JSON.stringify(resume, null, 2)}\n\nشرح شغل هدف:\n${jobDescription}\n\nفقط همین فیلدهای JSON را با متن فارسی بهینه برگردان: summary, experienceTitle, experience, skills. experience هر دستاورد را با \n جدا کند.` },
    ]);

    return NextResponse.json({ resume: { ...resume, ...tailored } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ساخت رزومه اختصاصی با مدل ناموفق بود." }, { status: 502 });
  }
}
