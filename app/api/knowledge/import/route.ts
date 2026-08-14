import { NextRequest, NextResponse } from "next/server";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";
import * as mammoth from "mammoth";
import { chatJson } from "@/lib/llm-client";
import { getAnalyzeConfig } from "@/lib/provider-config";
import { serializeResumeSkills } from "@/lib/resume-skills";
import type {
  ResumeData,
  ResumeProject,
} from "@/app/(panel)/resumes/resume-data";
import type {
  KnowledgeExperience,
  KnowledgeLanguage,
  KnowledgeQualification,
} from "@/lib/data/models";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 24_000;
const MAX_PDF_PAGES = 30;

type ImportedKnowledge = {
  resumeData: Partial<ResumeData>;
  experiences: Array<Omit<KnowledgeExperience, "id">>;
  qualifications: Array<Omit<KnowledgeQualification, "id">>;
  projects: Array<Omit<ResumeProject, "id">>;
  skills: string | string[];
  languages: string;
  languageItems: Array<
    Omit<KnowledgeLanguage, "id" | "name"> & {
      languageName?: string;
      name?: string;
    }
  >;
  careerGoals: string;
  preferredRoles: string;
  preferredIndustries: string;
  workPreferences: string;
  interviewContext: string;
  interviewChallenges: string;
};

function extensionOf(filename: string) {
  return filename.toLowerCase().split(".").pop() ?? "";
}

async function extractFileText(file: File) {
  const extension = extensionOf(file.name);
  const buffer = await file.arrayBuffer();

  if (extension === "pdf") {
    const document = await getDocumentProxy(new Uint8Array(buffer));
    try {
      if (document.numPages > MAX_PDF_PAGES) {
        throw new Error("فایل PDF باید حداکثر ۳۰ صفحه داشته باشد.");
      }
      const result = await extractPdfText(document, { mergePages: true });
      return result.text;
    } finally {
      if (typeof document.destroy === "function") {
        await document.destroy();
      }
    }
  }
  if (extension === "docx") {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value;
  }
  if (extension === "txt") {
    return new TextDecoder().decode(buffer);
  }
  throw new Error("فرمت فایل پشتیبانی نمی‌شود.");
}

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("resume");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "فایل رزومه ارسال نشده است." },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "حجم فایل رزومه باید کمتر از ۸ مگابایت باشد." },
      { status: 413 },
    );
  }
  if (!["pdf", "docx", "txt"].includes(extensionOf(file.name))) {
    return NextResponse.json(
      { error: "فقط فایل‌های PDF، DOCX و TXT پشتیبانی می‌شوند." },
      { status: 415 },
    );
  }

  try {
    const text = (await extractFileText(file))
      .replace(/\0/g, "")
      .trim()
      .slice(0, MAX_TEXT_LENGTH);
    if (text.length < 50) {
      return NextResponse.json(
        {
          error:
            "متن کافی از فایل استخراج نشد. فایل PDF اسکن‌شده به OCR نیاز دارد.",
        },
        { status: 422 },
      );
    }

    const analyzeConfig = getAnalyzeConfig();
    const importConfig =
      analyzeConfig.provider === "freeDeepseekAPI"
        ? { ...analyzeConfig, model: "deepseek-chat" }
        : analyzeConfig;
    const extracted = await chatJson<Partial<ImportedKnowledge>>(
      importConfig,
      [
        {
          role: "system",
          content:
            "تو سامانه استخراج اطلاعات رزومه هستی. فقط JSON معتبر فارسی برگردان. هیچ اطلاعاتی نساز و برای موارد ناموجود رشته خالی یا آرایه خالی بگذار. هر مهارت را حتماً به‌صورت یک عضو جدا در آرایه skills برگردان، حتی اگر در متن PDF فقط با فاصله از مهارت بعدی جدا شده باشد.",
        },
        {
          role: "user",
          content: `اطلاعات رزومه زیر را بدون جعل به ساختار مشخص‌شده تبدیل کن.
متن رزومه:
${text}

ساختار JSON:
{
  "resumeData":{"fullName":string,"jobTitle":string,"photoUrl":"","email":string,"phone":string,"location":string,"website":string,"summary":string},
  "experiences":[{"jobTitle":string,"company":string,"location":string,"startDate":string,"endDate":string,"isCurrent":boolean,"description":string,"technologies":string}],
  "qualifications":[{"institution":string,"credential":string,"startDate":string,"endDate":string,"isCurrent":boolean}],
  "projects":[{"name":string,"role":string,"url":string,"startDate":string,"endDate":string,"isCurrent":boolean,"description":string,"technologies":string}],
  "skills":[string],
  "languages":string,
  "languageItems":[{"languageName":string,"proficiency":"elementary"|"limited-working"|"professional-working"|"full-professional"|"native-bilingual"}],
  "careerGoals":string,
  "preferredRoles":string,
  "preferredIndustries":string,
  "workPreferences":string,
  "interviewContext":string,
  "interviewChallenges":string
}`,
        },
      ],
    );

    return NextResponse.json({
      resumeData: extracted.resumeData ?? {},
      experiences: Array.isArray(extracted.experiences)
        ? extracted.experiences
        : [],
      qualifications: Array.isArray(extracted.qualifications)
        ? extracted.qualifications
        : [],
      projects: Array.isArray(extracted.projects) ? extracted.projects : [],
      skills: serializeResumeSkills(extracted.skills),
      languages: extracted.languages ?? "",
      languageItems: Array.isArray(extracted.languageItems)
        ? extracted.languageItems
            .map((language) => ({
              name: language.languageName ?? language.name ?? "",
              proficiency: language.proficiency ?? "",
            }))
            .filter((language) => language.name)
        : [],
      careerGoals: extracted.careerGoals ?? "",
      preferredRoles: extracted.preferredRoles ?? "",
      preferredIndustries: extracted.preferredIndustries ?? "",
      workPreferences: extracted.workPreferences ?? "",
      interviewContext: extracted.interviewContext ?? "",
      interviewChallenges: extracted.interviewChallenges ?? "",
      fileName: file.name,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "پردازش رزومه ناموفق بود.",
      },
      { status: 502 },
    );
  }
}
