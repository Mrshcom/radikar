import { describe, expect, it } from "vitest";
import { normalizeMatchAnalysisInput } from "./match-analysis";

describe("normalizeMatchAnalysisInput", () => {
  it("امتیازها را محدود و ساختار ناقص مدل را کامل می‌کند", () => {
    const result = normalizeMatchAnalysisInput({
      score: 140.4,
      jobTitle: "  توسعه‌دهنده فرانت‌اند  ",
      breakdown: [{ label: "مهارت‌ها", value: -20 }],
      strengths: [" React ", "", 12],
      gaps: "Testing",
    });

    expect(result.score).toBe(100);
    expect(result.jobTitle).toBe("توسعه‌دهنده فرانت‌اند");
    expect(result.company).toBe("نام شرکت در آگهی مشخص نشده");
    expect(result.breakdown).toHaveLength(4);
    expect(result.breakdown[0]).toEqual({ label: "مهارت‌ها", value: 0 });
    expect(result.strengths).toEqual(["React", "12"]);
    expect(result.gaps).toEqual(["Testing"]);
  });

  it("خروجی‌های بیش‌ازحد مدل را به سقف محصول محدود می‌کند", () => {
    const result = normalizeMatchAnalysisInput({
      score: 72,
      strengths: ["۱", "۲", "۳", "۴", "۵", "۶"],
      gaps: ["الف", "ب", "پ", "ت", "ث"],
    });

    expect(result.strengths).toHaveLength(5);
    expect(result.gaps).toHaveLength(4);
  });
});
