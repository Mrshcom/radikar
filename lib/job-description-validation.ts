type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const MIN_CHARACTERS = 80;
const MIN_WORDS = 12;
const MIN_UNIQUE_WORDS = 8;
const MIN_LEXICAL_DIVERSITY = 0.28;

export function validateJobDescription(jobDescription: string): ValidationResult {
  const normalized = jobDescription.replace(/\s+/g, " ").trim();

  if (normalized.length < MIN_CHARACTERS) {
    return {
      valid: false,
      error: "متن آگهی خیلی کوتاه است. عنوان شغل، مسئولیت‌ها و شرایط موردنیاز را کامل‌تر وارد کن.",
    };
  }

  const words = normalized.toLocaleLowerCase("fa").match(/[\p{L}\p{N}][\p{L}\p{N}+#./-]*/gu) ?? [];
  const meaningfulWords = words.filter((word) => word.length > 1);
  const uniqueWords = new Set(meaningfulWords);
  const lexicalDiversity = meaningfulWords.length ? uniqueWords.size / meaningfulWords.length : 0;

  if (
    meaningfulWords.length < MIN_WORDS
    || uniqueWords.size < MIN_UNIQUE_WORDS
    || lexicalDiversity < MIN_LEXICAL_DIVERSITY
  ) {
    return {
      valid: false,
      error: "این متن شبیه یک آگهی شغلی معتبر نیست یا بیش‌ازحد تکراری است. شرح واقعی موقعیت، مسئولیت‌ها و مهارت‌های لازم را وارد کن.",
    };
  }

  const letters = normalized.match(/\p{L}/gu) ?? [];
  const uniqueLetters = new Set(letters.map((letter) => letter.toLocaleLowerCase("fa")));

  if (uniqueLetters.size < 8 || /(.)\1{7,}/u.test(normalized)) {
    return {
      valid: false,
      error: "متن واردشده قابل تحلیل نیست. لطفاً متن واقعی و خوانای آگهی شغلی را وارد کن.",
    };
  }

  return { valid: true };
}
