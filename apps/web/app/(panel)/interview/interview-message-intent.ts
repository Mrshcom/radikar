export function isInterviewClarification(message: string) {
  const text = message.trim();
  if (!text || text.length > 160) return false;
  return /[؟?]$/u.test(text) || /^(منظور(?:ت|تان| شما)?|یعنی|میشه توضیح|می‌شه توضیح)/u.test(text);
}
