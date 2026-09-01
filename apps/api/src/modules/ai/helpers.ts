import { normalizeImportedText } from "@radicar/validators";

type ValidationResult = { valid: true } | { valid: false; error: string };

export type JsonObject = Record<string, unknown>;

export function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

export function hasResumeContent(resume: JsonObject) {
  return Object.entries(resume).some(
    ([key, value]) =>
      key !== "photoUrl" &&
      ((typeof value === "string" && value.trim().length > 0) ||
        (Array.isArray(value) && value.length > 0)),
  );
}

export function validateJobDescription(
  jobDescription: string,
): ValidationResult {
  const normalized = jobDescription.replace(/\s+/g, " ").trim();
  if (normalized.length < 80) {
    return {
      valid: false,
      error:
        "متن آگهی خیلی کوتاه است. عنوان شغل، مسئولیت‌ها و شرایط موردنیاز را کامل‌تر وارد کن.",
    };
  }

  const words =
    normalized
      .toLocaleLowerCase("fa")
      .match(/[\p{L}\p{N}][\p{L}\p{N}+#./-]*/gu) ?? [];
  const meaningfulWords = words.filter((word) => word.length > 1);
  const uniqueWords = new Set(meaningfulWords);
  const lexicalDiversity = meaningfulWords.length
    ? uniqueWords.size / meaningfulWords.length
    : 0;
  if (
    meaningfulWords.length < 12 ||
    uniqueWords.size < 8 ||
    lexicalDiversity < 0.28
  ) {
    return {
      valid: false,
      error:
        "این متن شبیه یک آگهی شغلی معتبر نیست یا بیش‌ازحد تکراری است. شرح واقعی موقعیت، مسئولیت‌ها و مهارت‌های لازم را وارد کن.",
    };
  }

  const letters = normalized.match(/\p{L}/gu) ?? [];
  const uniqueLetters = new Set(
    letters.map((letter) => letter.toLocaleLowerCase("fa")),
  );
  if (uniqueLetters.size < 8 || /(.)\1{7,}/u.test(normalized)) {
    return {
      valid: false,
      error:
        "متن واردشده قابل تحلیل نیست. لطفاً متن واقعی و خوانای آگهی شغلی را وارد کن.",
    };
  }
  return { valid: true };
}

function isStandaloneTechnicalToken(value: string) {
  return (
    value.includes(".") ||
    /[a-z][A-Z]/.test(value) ||
    /(?:JS|SQL|HTML|CSS|PHP|API|AWS|GCP|UI|UX)$/i.test(value)
  );
}

export function serializeResumeSkills(value: unknown) {
  const rawItems = Array.isArray(value) ? value : [value];
  return rawItems
    .flatMap((item) => normalizeImportedText(item).split(/[,،;؛|\n]/))
    .flatMap((item) => {
      const trimmed = item.trim();
      if (!trimmed || !/\s/.test(trimmed)) return trimmed ? [trimmed] : [];
      const tokens = trimmed.split(/\s+/);
      return tokens.length > 1 && tokens.every(isStandaloneTechnicalToken)
        ? tokens
        : [trimmed];
    })
    .filter(Boolean)
    .join(", ");
}
