import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getAnalyzeConfig } from "@/lib/provider-config";
import { emptyResumeData, hasResumeContent, type ResumeData } from "@/app/(panel)/resumes/resume-data";
import { validateJobDescription } from "@/lib/job-description-validation";

type AnalyzeResponse = {
  score: number;
  jobTitle: string;
  company: string;
  breakdown: Array<{ label: string; value: number }>;
  strengths: string[];
  gaps: string[];
};

type ModelAnalyzeResponse = Partial<Omit<AnalyzeResponse, "breakdown">> & {
  isJobPosting?: boolean;
  invalidReason?: string;
  breakdown?: Array<{ label?: string; value?: number }>;
};

const BREAKDOWN_WEIGHTS = [0.3, 0.35, 0.25, 0.1] as const;

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeAnalysis(result: ModelAnalyzeResponse): AnalyzeResponse {
  if (result.isJobPosting !== true) {
    throw new Error(result.invalidReason?.trim() || "متن واردشده یک آگهی شغلی قابل تحلیل نیست.");
  }

  if (!Array.isArray(result.breakdown) || result.breakdown.length < 4) {
    throw new Error("مدل شواهد کافی برای محاسبه امتیاز تطبیق ارائه نکرد.");
  }

  const breakdown = result.breakdown.slice(0, 4).map((item, index) => ({
    label: item.label?.trim() || [
      "تناسب عنوان و حوزه شغلی",
      "همپوشانی مهارت‌های الزامی",
      "ارتباط سابقه و مسئولیت‌ها",
      "تحصیلات و شرایط تکمیلی",
    ][index],
    value: clampScore(item.value),
  }));

  const score = Math.round(breakdown.reduce(
    (total, item, index) => total + item.value * BREAKDOWN_WEIGHTS[index],
    0,
  ));

  return {
    score,
    jobTitle: result.jobTitle?.trim() || "عنوان شغل در آگهی مشخص نشده",
    company: result.company?.trim() || "نام شرکت در آگهی مشخص نشده",
    breakdown,
    strengths: (result.strengths ?? []).filter(Boolean).slice(0, 5),
    gaps: (result.gaps ?? []).filter(Boolean).slice(0, 4),
  };
}

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
    const result = await chatJson<ModelAnalyzeResponse>(getAnalyzeConfig(), [
      {
        role: "system",
        content: "تو یک متخصص سخت‌گیر ATS هستی. فقط JSON معتبر بدون markdown برگردان. هیچ امتیازی را بر اساس کیفیت کلی رزومه یا حدس خودت نده؛ فقط همپوشانی صریح رزومه با نیازمندی‌های همین آگهی ملاک است.",
      },
      {
        role: "user",
        content: `ابتدا بررسی کن متن واقعاً آگهی شغلی است و حداقل عنوان یا حوزه شغلی، مسئولیت‌ها یا شرایط استخدامی قابل تشخیص دارد. متن بی‌معنا، تکراری، تبلیغاتی یا فاقد نیازمندی شغلی را با isJobPosting=false برگردان.

اگر آگهی معتبر بود، چهار امتیاز مستقل ۰ تا ۱۰۰ بده:
۱) تناسب عنوان و حوزه شغلی، وزن ۳۰٪
۲) همپوشانی مهارت‌های الزامی، وزن ۳۵٪
۳) ارتباط سابقه و مسئولیت‌ها، وزن ۲۵٪
۴) تحصیلات و شرایط تکمیلی، وزن ۱۰٪

قواعد سخت‌گیرانه: نبود شواهد یعنی صفر؛ مهارت یا دستاوردی که آگهی نخواسته امتیاز ندارد؛ اگر حوزه شغلی متفاوت است امتیاز بخش اول حداکثر ۲۰ باشد؛ اگر هیچ مهارت سخت مشترکی نیست بخش دوم حداکثر ۲۰ باشد. عنوان شغل و شرکت را فقط از آگهی استخراج کن و نساز.

رزومه کاربر:
${JSON.stringify(resume, null, 2)}

شرح شغل:
${jobDescription}

ساختار دقیق خروجی:
{"isJobPosting": boolean, "invalidReason": string, "jobTitle": string, "company": string, "breakdown": [{"label":"تناسب عنوان و حوزه شغلی","value":number},{"label":"همپوشانی مهارت‌های الزامی","value":number},{"label":"ارتباط سابقه و مسئولیت‌ها","value":number},{"label":"تحصیلات و شرایط تکمیلی","value":number}], "strengths": string[], "gaps": string[]}`,
      },
    ]);

    return NextResponse.json(normalizeAnalysis(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "تحلیل مدل ناموفق بود.";
    const invalidInput = message.includes("آگهی شغلی قابل تحلیل نیست");
    return NextResponse.json({ error: message }, { status: invalidInput ? 422 : 502 });
  }
}
