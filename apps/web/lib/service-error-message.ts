const defaultServiceErrorMessage = "ارتباط با سرویس ناموفق بود.";

export function toPersianServiceErrorMessage(
  value: unknown,
  fallback = defaultServiceErrorMessage,
) {
  const message =
    typeof value === "string"
      ? value.trim()
      : value instanceof Error
        ? value.message.trim()
        : "";
  if (!message) return fallback;
  if (/[؀-ۿ]/.test(message)) return message;
  if (
    /failed to fetch|fetch failed|networkerror|network request failed|load failed/i.test(
      message,
    )
  )
    return "ارتباط با سرویس برقرار نشد. لطفاً اتصال شبکه را بررسی و دوباره تلاش کنید.";
  if (/timeout|timed out|time limit|deadline exceeded/i.test(message))
    return "زمان پاسخ‌گویی سرویس بیش از حد مجاز شد. لطفاً دوباره تلاش کنید.";
  const emptyModelResponse = message.match(
    /(?:deepseek|model).*empty content after (\d+) retr(?:y|ies)/i,
  );
  if (emptyModelResponse)
    return `مدل پس از ${Number(emptyModelResponse[1]).toLocaleString("fa-IR")} تلاش پاسخی برنگرداند. لطفاً دوباره تلاش کنید.`;
  if (/abort(?:ed|error)?|operation was aborted/i.test(message))
    return "عملیات لغو شد.";
  if (/internal server error|server error|service unavailable/i.test(message))
    return "خطای داخلی سرویس رخ داد. لطفاً دوباره تلاش کنید.";
  if (
    /unexpected token|invalid json|json.*(?:parse|position)|body is unusable/i.test(
      message,
    )
  )
    return "پاسخ دریافتی از سرویس معتبر نبود. لطفاً دوباره تلاش کنید.";
  return fallback;
}
