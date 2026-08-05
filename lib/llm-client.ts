import type { ProviderConfig } from "./provider-config";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{ text?: string }>
        | Record<string, unknown>
        | null;
      reasoning_content?: string;
      tool_calls?: Array<{
        function?: {
          name?: string;
          arguments?: unknown;
        };
      }>;
    };
    delta?: { content?: unknown };
    text?: unknown;
    finish_reason?: string;
  }>;
  error?: { message?: string };
  content?: unknown;
  output_text?: unknown;
  response?: unknown;
  result?: unknown;
  data?: unknown;
  output?: unknown;
};

const MAX_EMPTY_RESPONSE_ATTEMPTS = 3;

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractJson<T>(content: string): T {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const raw = fenced ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("LLM response did not include JSON.");
  }

  return JSON.parse(raw.slice(start, end + 1)) as T;
}

function parseJsonCandidate<T>(value: unknown, depth = 0): T | undefined {
  if (depth > 4) return undefined;
  if (Array.isArray(value)) {
    for (const part of value) {
      const parsed = parseJsonCandidate<T>(part, depth + 1);
      if (parsed) return parsed;
    }
    return undefined;
  }
  if (isJsonObject(value)) {
    if (Object.keys(value).length === 0) return undefined;
    const wrapperValues = [
      value.text,
      value.content,
      value.value,
      value.json,
      value.output_text,
    ].filter((nested) => nested !== undefined);
    const isContentWrapper =
      wrapperValues.length > 0 &&
      Object.keys(value).every((key) =>
        [
          "type",
          "role",
          "text",
          "content",
          "value",
          "json",
          "output_text",
        ].includes(key),
      );
    if (isContentWrapper) {
      for (const nested of wrapperValues) {
        const parsed = parseJsonCandidate<T>(nested, depth + 1);
        if (parsed) return parsed;
      }
      return undefined;
    }
    return value as T;
  }
  if (typeof value !== "string" || !value.includes("{")) return undefined;

  try {
    const decoded = JSON.parse(value.trim()) as unknown;
    const parsed = parseJsonCandidate<T>(decoded, depth + 1);
    if (parsed) return parsed;
  } catch {
    // Some providers wrap JSON in Markdown or explanatory text.
  }
  try {
    return parseJsonCandidate<T>(extractJson<unknown>(value), depth + 1);
  } catch {
    return undefined;
  }
}

function findResponseJson<T>(
  payload: ChatCompletionResponse | undefined,
): T | undefined {
  if (!payload) return undefined;
  const choice = payload.choices?.[0];
  const message = choice?.message;
  const candidates: unknown[] = [
    message?.content,
    message?.reasoning_content,
    ...(message?.tool_calls?.map((toolCall) =>
      toolCall.function?.arguments,
    ) ?? []),
    choice?.delta?.content,
    choice?.text,
    payload.content,
    payload.output_text,
    payload.response,
    payload.result,
    payload.data,
    payload.output,
  ];

  for (const candidate of candidates) {
    const parsed = parseJsonCandidate<T>(candidate);
    if (parsed) return parsed;
    if (Array.isArray(candidate)) {
      for (const part of candidate) {
        const nested = parseJsonCandidate<T>(
          isJsonObject(part) ? (part.text ?? part.content) : part,
        );
        if (nested) return nested;
      }
    }
  }

  if (
    isJsonObject(payload) &&
    !("choices" in payload) &&
    !("error" in payload)
  ) {
    return payload as T;
  }
  return undefined;
}

function parseEventStreamJson<T>(rawResponse: string): T | undefined {
  const events = rawResponse
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter((line) => line && line !== "[DONE]");
  if (!events.length) return undefined;

  const fragments: string[] = [];
  for (const event of events) {
    let payload: ChatCompletionResponse | undefined;
    try {
      payload = JSON.parse(event) as ChatCompletionResponse;
    } catch {
      continue;
    }
    const complete = findResponseJson<T>(payload);
    if (complete) return complete;
    const choice = payload.choices?.[0];
    for (const fragment of [
      choice?.delta?.content,
      choice?.message?.content,
      choice?.message?.reasoning_content,
    ]) {
      if (typeof fragment === "string") fragments.push(fragment);
    }
  }

  return parseJsonCandidate<T>(fragments.join(""));
}

export function parseLlmJsonResponse<T>(rawResponse: string): T | undefined {
  let payload: ChatCompletionResponse | undefined;
  try {
    payload = JSON.parse(rawResponse) as ChatCompletionResponse;
  } catch {
    payload = undefined;
  }

  const directJson =
    !payload ||
    (isJsonObject(payload) &&
      !("choices" in payload) &&
      !("error" in payload))
      ? parseJsonCandidate<T>(rawResponse)
      : undefined;

  return (
    findResponseJson<T>(payload) ??
    parseEventStreamJson<T>(rawResponse) ??
    directJson
  );
}

export async function chatJson<T>(
  config: ProviderConfig,
  messages: ChatMessage[],
): Promise<T> {
  if (!config.model || !config.baseUrl) {
    throw new Error("LLM provider is not configured.");
  }

  const requestId = crypto.randomUUID();
  for (let attempt = 1; attempt <= MAX_EMPTY_RESPONSE_ATTEMPTS; attempt += 1) {
    const response = await fetch(
      `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.apiKey || "localproxy"}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: 0.2,
          stream: false,
          user: `radicar-json-${requestId}-${attempt}`,
        }),
      },
    );

    const rawResponse = await response.text();
    const payload = (() => {
      try {
        return JSON.parse(rawResponse) as ChatCompletionResponse;
      } catch {
        return undefined;
      }
    })();
    if (!response.ok) {
      throw new Error(
        payload?.error?.message ||
          `ارتباط با مدل با خطای ${response.status} روبه‌رو شد.`,
      );
    }

    const parsed = parseLlmJsonResponse<T>(rawResponse);
    if (parsed) return parsed;

    const choice = payload?.choices?.[0];
    const messageContent = choice?.message?.content;
    console.error("[llm-client] Unparseable model response", {
      attempt,
      contentType: response.headers.get("content-type") || "",
      rawLength: rawResponse.length,
      topLevelKeys: payload && isJsonObject(payload) ? Object.keys(payload) : [],
      choiceCount: payload?.choices?.length ?? 0,
      messageContentType: Array.isArray(messageContent)
        ? "array"
        : typeof messageContent,
      messageContentLength:
        typeof messageContent === "string" ? messageContent.length : 0,
      finishReason: choice?.finish_reason || "",
    });
  }

  throw new Error(
    "مدل پاسخی برای استخراج اطلاعات نداد. لطفاً دوباره تلاش کن.",
  );
}
