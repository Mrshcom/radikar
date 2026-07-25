import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getAnalyzeConfig } from "@/lib/provider-config";
import { emptyResumeData, hasResumeContent, type ResumeData } from "@/app/(panel)/resumes/resume-data";

type DashboardData = {
  greeting: string; subtitle: string; profileScore: number; heroTitle: string; heroText: string;
  aiTitle: string; aiText: string;
};

function normalize(data: Partial<DashboardData>): DashboardData {
  const requiredText = [data.greeting, data.subtitle, data.heroTitle, data.heroText, data.aiTitle, data.aiText];
  if (requiredText.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error("خروجی مدل برای ساخت داشبورد کامل نیست.");
  }
  const profileScore = Number(data.profileScore);
  if (!Number.isFinite(profileScore)) throw new Error("مدل امتیاز معتبر رزومه برنگرداند.");
  return {
    greeting: data.greeting!.trim(),
    subtitle: data.subtitle!.trim(),
    profileScore: Math.min(100, Math.max(0, Math.round(profileScore))),
    heroTitle: data.heroTitle!.trim(),
    heroText: data.heroText!.trim(),
    aiTitle: data.aiTitle!.trim(),
    aiText: data.aiText!.trim(),
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { resume?: Partial<ResumeData> };
  if (!hasResumeContent(body.resume)) {
    return NextResponse.json({ error: "برای ساخت داشبورد ابتدا رزومه را تکمیل کن." }, { status: 422 });
  }
  const resume = { ...emptyResumeData, ...body.resume };
  try {
    const data = await chatJson<Partial<DashboardData>>(getAnalyzeConfig(), [
      { role: "system", content: "تو تحلیل‌گر رزومه هستی. فقط JSON معتبر و فارسی برگردان. سابقه اپلای، شغل، آمار یا داده‌ای که در رزومه نیست نساز." },
      { role: "user", content: `فقط کیفیت و مسیر بهبود این رزومه را تحلیل کن:\n${JSON.stringify(resume, null, 2)}\nساختار JSON: {"greeting":string,"subtitle":string,"profileScore":number,"heroTitle":string,"heroText":string,"aiTitle":string,"aiText":string}` },
    ]);
    return NextResponse.json(normalize(data));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "مدل داشبورد پاسخ نداد." }, { status: 502 });
  }
}
