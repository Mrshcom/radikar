import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getAnalyzeConfig } from "@/lib/provider-config";
import {
  emptyResumeData,
  hasResumeContent,
  type ResumeData,
} from "@/app/(panel)/resumes/resume-data";
import type {
  KnowledgeExperience,
  KnowledgeQualification,
} from "@/lib/data/models";

type DashboardData = {
  greeting: string;
  subtitle: string;
  profileScore: number;
  heroTitle: string;
  heroText: string;
  aiTitle: string;
  aiText: string;
};

function buildGreeting(fullName: string) {
  const firstName = fullName.trim().split(/\s+/)[0];
  return firstName
    ? `سلام ${firstName}، آماده‌ی یک قدم تازه‌ای؟`
    : "سلام، آماده‌ی یک قدم تازه‌ای؟";
}

function normalize(
  data: Partial<DashboardData>,
  fullName: string,
): DashboardData {
  const requiredText = [
    data.subtitle,
    data.heroTitle,
    data.heroText,
    data.aiTitle,
    data.aiText,
  ];
  if (
    requiredText.some((value) => typeof value !== "string" || !value.trim())
  ) {
    throw new Error("خروجی مدل برای ساخت داشبورد کامل نیست.");
  }
  const profileScore = Number(data.profileScore);
  if (!Number.isFinite(profileScore))
    throw new Error("مدل امتیاز معتبر رزومه برنگرداند.");
  return {
    greeting: buildGreeting(fullName),
    subtitle: data.subtitle!.trim(),
    profileScore: Math.min(100, Math.max(0, Math.round(profileScore))),
    heroTitle: data.heroTitle!.trim(),
    heroText: data.heroText!.trim(),
    aiTitle: data.aiTitle!.trim(),
    aiText: data.aiText!.trim(),
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    resume?: Partial<ResumeData>;
    knowledge?: {
      experiences?: KnowledgeExperience[];
      qualifications?: KnowledgeQualification[];
      skills?: string;
      languages?: string;
      careerGoals?: string;
      preferredRoles?: string;
      preferredIndustries?: string;
      workPreferences?: string;
      interviewContext?: string;
      interviewChallenges?: string;
    };
  };
  if (!hasResumeContent(body.resume)) {
    return NextResponse.json(
      { error: "برای ساخت داشبورد ابتدا رزومه را تکمیل کن." },
      { status: 422 },
    );
  }
  const resume = { ...emptyResumeData, ...body.resume };
  try {
    const data = await chatJson<Partial<DashboardData>>(getAnalyzeConfig(), [
      {
        role: "system",
        content:
          "تو تحلیل‌گر پروفایل حرفه‌ای هستی. فقط JSON معتبر و فارسی برگردان. سابقه اپلای، شغل، آمار یا داده‌ای که در اطلاعات کاربر نیست نساز.",
      },
      {
        role: "user",
        content: `کیفیت و مسیر بهبود اطلاعات حرفه‌ای زیر را تحلیل کن. subtitle باید یک توضیح کوتاه و حداکثر ۱۲ کلمه باشد؛ متن تحلیل اصلی را فقط در heroText بنویس:\nرزومه:\n${JSON.stringify(resume, null, 2)}${body.knowledge ? `\nپایگاه دانش:\n${JSON.stringify(body.knowledge, null, 2)}` : ""}\nساختار JSON: {"subtitle":string,"profileScore":number,"heroTitle":string,"heroText":string,"aiTitle":string,"aiText":string}`,
      },
    ]);
    return NextResponse.json(normalize(data, resume.fullName));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "مدل داشبورد پاسخ نداد.",
      },
      { status: 502 },
    );
  }
}
