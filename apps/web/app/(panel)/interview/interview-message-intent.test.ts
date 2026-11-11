import { describe, expect, it } from "vitest";
import { isInterviewClarification, isUnrelatedInterviewQuestion } from "./interview-message-intent";

describe("interview message intent", () => {
  it("recognizes unrelated questions even when they do not end in a question mark", () => {
    for (const message of ["رادیکار چیه؟ معرفی‌ش کن", "رادیکار رو معرفی کن", "آیا تو ربات هستی؟"]) {
      expect(isUnrelatedInterviewQuestion(message)).toBe(true);
    }
    expect(isInterviewClarification("هوا امروز چطوره")).toBe(true);
  });

  it("keeps work experience answers and questions about the current prompt distinct", () => {
    expect(isUnrelatedInterviewQuestion("در رادیکار ساختار فرم‌ها را بهبود دادم")).toBe(false);
    expect(isInterviewClarification("در پروژه با تیم دربارهٔ معماری تصمیم گرفتیم")).toBe(false);
    expect(isInterviewClarification("منظورت از نتیجهٔ کار چیه؟")).toBe(true);
  });
});
