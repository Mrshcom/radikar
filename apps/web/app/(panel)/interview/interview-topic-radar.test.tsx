import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { InterviewReport } from "@radikar/shared-types";
import { getInterviewTopics, InterviewTopicRadar } from "./interview-topic-radar";

const report: InterviewReport = {
  score: 60,
  summary: "خلاصه",
  strengths: [],
  improvements: [],
  questions: [
    { questionIndex: 0, score: 50, feedback: "", strengths: [], issues: [], suggestedAnswer: "" },
    { questionIndex: 1, score: 70, feedback: "", strengths: [], issues: [], suggestedAnswer: "" },
    { questionIndex: 2, score: 60, feedback: "", strengths: [], issues: [], suggestedAnswer: "" },
  ],
};

describe("interview topic scores", () => {
  it("uses evidence-based topic scores from new reports", () => {
    const topics = [{ title: "همکاری تیمی", score: 75, evidence: "نمونهٔ همکاری بیان شد" }];
    expect(getInterviewTopics({ ...report, topics }, [])).toEqual({ topics, estimated: false });
  });

  it("groups repeated questions about a topic in older reports", () => {
    const result = getInterviewTopics(report, [
      "معماری فرانت‌اند را چطور طراحی کردید؟",
      "چه استانداردهای معماری تعیین کردید؟",
      "چطور با اعضای تیم هماهنگ شدید؟",
    ]);
    expect(result.estimated).toBe(true);
    expect(result.topics.map(({ title, score }) => ({ title, score }))).toEqual([
      { title: "معماری و استانداردها", score: 60 },
      { title: "همکاری و ارتباط", score: 60 },
    ]);
  });

  it("shows a radar chart and topic evidence without question cards", () => {
    render(
      <InterviewTopicRadar
        report={{
          ...report,
          topics: [
            { title: "معماری", score: 70, evidence: "ساختار پروژه را توضیح داد" },
            { title: "همکاری", score: 60, evidence: "از جلسهٔ تیم گفت" },
            { title: "اجرا", score: 80, evidence: "پیاده‌سازی را شرح داد" },
          ],
        }}
        questions={[]}
      />,
    );
    expect(screen.getByRole("img", { name: /نمودار رادار/ })).toBeTruthy();
    expect(screen.getByText("ساختار پروژه را توضیح داد")).toBeTruthy();
    expect(screen.queryByText("بررسی سؤال‌به‌سؤال")).toBeNull();
  });

  it("adds one axis per covered topic and highlights the hovered topic", () => {
    const topics = ["معماری", "اجرا", "همکاری", "حل مسئله", "اثرگذاری"].map((title, index) => ({
      title,
      score: 50 + index * 10,
      evidence: `شاهد ${index + 1}`,
    }));
    render(<InterviewTopicRadar report={{ ...report, topics }} questions={[]} />);
    expect(screen.getByRole("img", { name: /۵ مبحث/ })).toBeTruthy();
    const axis = screen.getByRole("button", { name: "همکاری، ۷۰ از ۱۰۰" });
    fireEvent.mouseEnter(axis);
    expect(screen.getByText("همکاری · ۷۰ از ۱۰۰")).toBeTruthy();
    fireEvent.mouseLeave(axis);
    expect(screen.queryByText("همکاری · ۷۰ از ۱۰۰")).toBeNull();
  });
});
