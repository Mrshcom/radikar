import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getWriteConfig } from "@/lib/provider-config";
import {
  emptyResumeData,
  hasResumeContent,
  type ResumeData,
  type ResumeLanguage,
} from "@/app/(panel)/resumes/resume-data";
import type { KnowledgeProfileRecord } from "@/lib/data/models";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    resume?: Partial<ResumeData>;
    knowledge?: Partial<KnowledgeProfileRecord>;
    instruction?: string;
    language?: ResumeLanguage;
  };
  if (!hasResumeContent(body.resume)) {
    return NextResponse.json(
      { error: "ابتدا اطلاعات واقعی رزومه را وارد کن." },
      { status: 422 },
    );
  }
  const resume = { ...emptyResumeData, ...body.resume };
  const language: ResumeLanguage = body.language === "en" ? "en" : "fa";
  const languageName = language === "en" ? "English" : "Persian";
  try {
    const generated = await chatJson<Partial<ResumeData>>(getWriteConfig(), [
      {
        role: "system",
        content: `You are a professional ${languageName} resume writer. Return valid JSON only. Do not invent facts. Complete and polish the existing fields and write every human-readable resume field in ${languageName}. Preserve photoUrl, email, phone, website, every experiences item, every educations item and their ids. Never collapse multiple work or education records into one.`,
      },
      {
        role: "user",
        content: `Current resume:\n${JSON.stringify(resume, null, 2)}\nUser knowledge base, including all work and education history:\n${JSON.stringify(body.knowledge || {}, null, 2)}\nUser instruction: ${body.instruction || `Create a professional ATS-friendly resume in ${languageName}.`}\nKeep every item in experiences and educations. Improve each item separately without fabrication. Translate or transliterate human-readable content into ${languageName} when necessary. Return JSON containing every ResumeData field.`,
      },
    ]);
    return NextResponse.json({
      resume: {
        ...resume,
        ...generated,
        experiences: Array.isArray(generated.experiences)
          ? generated.experiences
          : resume.experiences,
        educations: Array.isArray(generated.educations)
          ? generated.educations
          : resume.educations,
        photoUrl: resume.photoUrl,
        email: resume.email,
        phone: resume.phone,
        website: resume.website,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "مدل رزومه‌ساز پاسخ نداد.",
      },
      { status: 502 },
    );
  }
}
