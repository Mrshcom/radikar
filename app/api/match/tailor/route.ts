import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getWriteConfig } from "@/lib/provider-config";
import {
  emptyResumeData,
  hasResumeContent,
  type ResumeData,
  type ResumeLanguage,
} from "@/app/(panel)/resumes/resume-data";
import { validateJobDescription } from "@/lib/job-description-validation";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    jobDescription?: string;
    resume?: Partial<ResumeData>;
    language?: ResumeLanguage;
  };
  const jobDescription = body.jobDescription?.trim() ?? "";
  const validation = validateJobDescription(jobDescription);

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 });
  }
  if (!hasResumeContent(body.resume)) {
    return NextResponse.json(
      { error: "رزومه مبنا خالی است." },
      { status: 422 },
    );
  }

  const resume = { ...emptyResumeData, ...body.resume };
  const language: ResumeLanguage = body.language === "en" ? "en" : "fa";
  const languageName = language === "en" ? "English" : "Persian";

  try {
    const tailored = await chatJson<Partial<ResumeData>>(getWriteConfig(), [
      {
        role: "system",
        content: `You are a professional ${languageName} resume writer. Return valid JSON only. Do not invent facts. Rewrite the resume for the target job and make every human-readable resume field ${languageName}. Preserve photoUrl, email, phone, website and every experiences, projects and educations record with its id. Never collapse multiple records into one.`,
      },
      {
        role: "user",
        content: `Base resume:\n${JSON.stringify(resume, null, 2)}\n\nTarget job description:\n${jobDescription}\n\nWrite all human-readable fields in ${languageName}, including every item in experiences, projects and educations. Keep all records and ids, tailor each record separately, transliterate proper names when needed, and never invent data. Put each experience or project achievement on a separate line. Return a JSON object containing every ResumeData field.`,
      },
    ]);

    return NextResponse.json({
      resume: {
        ...resume,
        ...tailored,
        experiences: Array.isArray(tailored.experiences)
          ? tailored.experiences
          : resume.experiences,
        projects: Array.isArray(tailored.projects)
          ? tailored.projects
          : resume.projects,
        educations: Array.isArray(tailored.educations)
          ? tailored.educations
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
          error instanceof Error
            ? error.message
            : "ساخت رزومه اختصاصی با مدل ناموفق بود.",
      },
      { status: 502 },
    );
  }
}
