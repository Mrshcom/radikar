import {
  normalizeImportedText,
  normalizeImportedTextArray,
} from "@radicar/validators";

export type MatchAnalysis = {
  score: number;
  jobTitle: string;
  company: string;
  breakdown: Array<{ label: string; value: number }>;
  strengths: string[];
  gaps: string[];
};

const defaultBreakdownLabels = [
  "تناسب عنوان و حوزه شغلی",
  "همپوشانی مهارت‌های الزامی",
  "ارتباط سابقه و مسئولیت‌ها",
  "تحصیلات و شرایط تکمیلی",
] as const;

function objectOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function boundedScore(value: unknown) {
  const score = Number(value);
  return Number.isFinite(score)
    ? Math.min(100, Math.max(0, Math.round(score)))
    : 0;
}

export function normalizeMatchAnalysisInput(value: unknown): MatchAnalysis {
  const record = objectOf(value);
  const rawBreakdown = Array.isArray(record.breakdown) ? record.breakdown : [];
  const breakdown = defaultBreakdownLabels.map((fallbackLabel, index) => {
    const item = objectOf(rawBreakdown[index]);
    return {
      label: normalizeImportedText(item.label) || fallbackLabel,
      value: boundedScore(item.value),
    };
  });

  return {
    score: boundedScore(record.score),
    jobTitle:
      normalizeImportedText(record.jobTitle) ||
      "عنوان شغل در آگهی مشخص نشده",
    company:
      normalizeImportedText(record.company) ||
      "نام شرکت در آگهی مشخص نشده",
    breakdown,
    strengths: normalizeImportedTextArray(record.strengths).slice(0, 5),
    gaps: normalizeImportedTextArray(record.gaps).slice(0, 4),
  };
}
