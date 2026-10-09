import assert from "node:assert/strict";
import test from "node:test";
import { interviewReportRequestSchema, parseInterviewReport } from "../src/modules/ai/interview-report";

const question = (questionIndex: number, score: number) => ({
  questionIndex,
  score,
  feedback: "ارزیابی پاسخ",
  strengths: ["وضوح"],
  issues: ["مثال عملی کم است"],
  suggestedAnswer: "نمونهٔ بهتر",
});
const report = {
  summary: "جمع‌بندی مصاحبه",
  strengths: ["وضوح"],
  improvements: ["مثال بیشتر"],
  questions: [question(1, 60), question(0, 80)],
};

test("interview report orders every question and derives the overall score from answers", () => {
  const result = parseInterviewReport(report, 2);
  assert.equal(result.score, 70);
  assert.deepEqual(
    result.questions.map((item) => item.questionIndex),
    [0, 1],
  );
});

test("interview report rejects missing, duplicate, out-of-range and invalid results", () => {
  for (const questions of [
    [question(0, 80)],
    [question(0, 80), question(0, 60)],
    [question(0, 80), question(2, 60)],
    [question(0, 101), question(1, 60)],
  ]) {
    assert.throws(() => parseInterviewReport({ ...report, questions }, 2));
  }
});

test("interview report requires non-empty bounded answers before requesting a model", () => {
  for (const responses of [
    [],
    [{ question: "سؤال", answer: " " }],
    [{ question: "سؤال", answer: "a".repeat(8_001) }],
  ]) {
    assert.equal(interviewReportRequestSchema.safeParse({ mode: "فنی", responses }).success, false);
  }
});
