import assert from "node:assert/strict";
import test from "node:test";
import { interviewReportRequestSchema, parseInterviewReport } from "../src/modules/ai/interview-report";

test("deep interview accepts and evaluates all fifteen answers", () => {
  const responses = Array.from({ length: 15 }, (_, index) => ({
    question: `سؤال ${index + 1}؟`,
    answer: `پاسخ ${index + 1}`,
  }));
  assert.equal(interviewReportRequestSchema.safeParse({ mode: "جامع", responses }).success, true);
  const report = parseInterviewReport(
    {
      summary: "جمع‌بندی",
      strengths: [],
      improvements: [],
      questions: responses.map((_, questionIndex) => ({
        questionIndex,
        score: 80,
        feedback: "بازخورد",
        strengths: [],
        issues: [],
        suggestedAnswer: "پاسخ پیشنهادی",
      })),
    },
    responses.length,
  );
  assert.equal(report.questions.length, 15);
  assert.equal(report.score, 80);
});
