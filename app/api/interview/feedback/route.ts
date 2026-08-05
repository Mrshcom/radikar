import { NextRequest, NextResponse } from "next/server";
import { chatJson } from "@/lib/llm-client";
import { getAnalyzeConfig } from "@/lib/provider-config";

type Feedback = { title: string; text: string };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    question?: string;
    answer?: string;
  };
  if (!body.answer?.trim())
    return NextResponse.json(
      { error: "پاسخ برای دریافت بازخورد کافی نیست." },
      { status: 400 },
    );
  try {
    const result = await chatJson<Partial<Feedback>>(getAnalyzeConfig(), [
      {
        role: "system",
        content: "تو مربی مصاحبه هستی. فقط JSON معتبر فارسی و کوتاه برگردان.",
      },
      {
        role: "user",
        content: `سؤال: ${body.question}\nپاسخ کاربر: ${body.answer}\nبازخورد بده. JSON: {"title":string,"text":string}`,
      },
    ]);
    if (!result.title?.trim() || !result.text?.trim()) {
      return NextResponse.json(
        { error: "مدل بازخورد کامل تولید نکرد." },
        { status: 502 },
      );
    }
    return NextResponse.json({
      title: result.title.trim(),
      text: result.text.trim(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "مدل بازخورد پاسخ نداد.",
      },
      { status: 502 },
    );
  }
}
