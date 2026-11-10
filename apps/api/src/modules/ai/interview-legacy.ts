import { chatJson, getAnalyzeConfig, type ChatJsonOptions } from "@radikar/ai";
import { z } from "zod";
import { normalizeImportedText, normalizeImportedTextArray } from "@radikar/validators";
import { asObject, type JsonObject } from "./helpers";
import { interviewReportSystemPrompt, parseInterviewReport } from "./interview-report";
import {
  interviewTurnPrompt,
  interviewClarificationPrompt,
  type InterviewTurnInput,
  type InterviewClarificationInput,
} from "./interview-agent";

type SessionInput = {
  resume: JsonObject;
  knowledge: JsonObject;
  mode: string;
  questionCount?: number;
  depth?: "quick" | "standard" | "deep";
  durationMinutes?: number;
  focusArea?: string;
  jobDescription: string;
};

const textOf = normalizeImportedText;

export async function createLegacyInterviewSession(input: SessionInput, options: ChatJsonOptions) {
  const countInstruction = input.questionCount
    ? `دقیقاً ${input.questionCount} موضوع آغازین متنوع بساز؛ این‌ها تعداد نهایی پرسش‌ها نیستند.`
    : "۴ تا ۶ موضوع پیشنهادی برای شروع گفت‌وگو بساز؛ تعداد نهایی سؤال‌ها ثابت نیست.";
  const interviewScope = input.focusArea
    ? `مصاحبه تخصصی فقط درباره «${input.focusArea}»: ${countInstruction} همهٔ سؤال‌ها مرتبط با همین موضوع باشند. رزومه فقط برای شخصی‌سازی سطح و مثال‌هاست؛ به حوزه‌های دیگر نرو.`
    : `مصاحبه جامع: ${countInstruction} مهارت‌های اصلی، تجربه‌های واقعی، حل مسئله و همکاری یا رهبری متناسب با رزومه را پوشش بده. سؤال‌ها نباید همگی روی یک موضوع متمرکز باشند.`;
  const result = await chatJson<JsonObject>(
    getAnalyzeConfig(),
    [
      {
        role: "system",
        content: "تو مربی مصاحبه شغلی هستی. دستور محدودهٔ مصاحبه را رعایت کن و فقط JSON معتبر فارسی برگردان.",
      },
      {
        role: "user",
        content: `محدودهٔ مصاحبه: ${interviewScope}\nعمق گفت‌وگو: ${input.depth ?? "standard"}. مدت هدف: ${input.durationMinutes ?? "نامشخص"} دقیقه؛ مدت به معنی تعداد ثابت سؤال نیست.\nبرای cards سه موضوع مشخص و قابل تمرین مرتبط با رزومه پیشنهاد بده؛ عنوان هر کارت نام یک حوزهٔ تخصصی باشد، نه ویژگی محصول یا نتیجهٔ مصاحبه.\nرزومه:\n${JSON.stringify(input.resume, null, 2)}\nپایگاه دانش:\n${JSON.stringify(input.knowledge, null, 2)}\nحالت: ${input.mode}\nشرح شغل: ${input.jobDescription || "ندارد"}\nJSON: {"title":string,"subtitle":string,"duration":string,"questions":string[],"cards":[{"title":string,"text":string,"tone":"lavender|mint|peach"}]}`,
      },
    ],
    { ...options, maxAttempts: 2, maxOutputTokens: input.questionCount && input.questionCount > 6 ? 4_096 : 2_048 },
  );
  const questions = normalizeImportedTextArray(result.questions);
  if (
    !textOf(result.title).trim() ||
    !textOf(result.subtitle).trim() ||
    !textOf(result.duration).trim() ||
    !questions.length ||
    (input.questionCount !== undefined && questions.length !== input.questionCount)
  )
    throw new Error("مدل جلسه مصاحبه کامل تولید نکرد.");
  return {
    title: textOf(result.title).trim(),
    subtitle: textOf(result.subtitle).trim(),
    duration: textOf(result.duration).trim(),
    questions: questions.slice(0, input.questionCount ?? 6),
    cards: (Array.isArray(result.cards) ? result.cards : result.cards ? [result.cards] : [])
      .slice(0, 3)
      .map((card) => {
        const safeCard = asObject(card);
        const tone = textOf(safeCard.tone);
        return {
          title: textOf(safeCard.title),
          text: textOf(safeCard.text),
          tone: ["lavender", "mint", "peach"].includes(tone) ? tone : "mint",
        };
      })
      .filter((card) => card.title && card.text),
  };
}

export async function createLegacyInterviewReport(
  input: { mode: string; responses: Array<{ question: string; answer: string }> },
  options: ChatJsonOptions,
) {
  const result = await chatJson<unknown>(
    getAnalyzeConfig(),
    [
      { role: "system", content: interviewReportSystemPrompt },
      { role: "user", content: JSON.stringify(input) },
    ],
    { ...options, maxAttempts: 2, maxOutputTokens: input.responses.length > 6 ? 8_192 : 6_144 },
  );
  return parseInterviewReport(result, input.responses.length);
}

export async function createLegacyInterviewTurn(input: InterviewTurnInput, options: ChatJsonOptions) {
  const result = await chatJson<unknown>(getAnalyzeConfig(), [{ role: "user", content: interviewTurnPrompt(input) }], {
    ...options,
    maxAttempts: 2,
    maxOutputTokens: 300,
  });
  return z
    .object({ reply: z.string().trim().min(5).max(350), question: z.string().trim().max(500), complete: z.boolean().default(false) })
    .refine((turn) => turn.complete || turn.question.length >= 10, "سؤال بعدی مصاحبه معتبر نیست.")
    .parse(result);
}

export async function createLegacyInterviewClarification(input: InterviewClarificationInput, options: ChatJsonOptions) {
  const result = await chatJson<unknown>(
    getAnalyzeConfig(),
    [{ role: "user", content: interviewClarificationPrompt(input) }],
    { ...options, maxAttempts: 2, maxOutputTokens: 400 },
  );
  return z.object({ reply: z.string().trim().min(5).max(700) }).parse(result);
}
