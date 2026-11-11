export const unrelatedInterviewQuestionReply = "این سؤال مربوط به این جلسهٔ مصاحبه نیست؛ لطفاً نپرس.";

export function isUnrelatedInterviewQuestion(message: string) {
  const text = message.trim().replace(/\u200c/gu, " ");
  if (!text || text.length > 160) return false;
  const asksQuestion = /[؟?]/u.test(text) || /(?:معرفی(?:ش)? کن|بگو|توضیح بده)[.!؟\s]*$/u.test(text);
  return (
    asksQuestion &&
    /(?:رادیکار|radikar|(?:تو|شما)\s+(?:ربات|هوش مصنوعی|کی هستی))/iu.test(text)
  );
}

export function isInterviewClarification(message: string) {
  const text = message.trim();
  if (!text || text.length > 160) return false;
  return (
    /[؟?]/u.test(text) ||
    /^(?:منظور(?:ت|تان| شما)?|یعنی|میشه|می‌شه|آیا|چرا|چطور|چگونه|چی|چه|کجا|کی)(?:\s|$)/u.test(text) ||
    /(?:چیه|چیست|چطوره|هستی|معرفی کن|توضیح بده)[.!؟\s]*$/u.test(text)
  );
}
