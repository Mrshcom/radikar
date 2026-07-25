import type { ProviderConfig } from "./provider-config";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

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

export async function chatJson<T>(config: ProviderConfig, messages: ChatMessage[]): Promise<T> {
  if (!config.model || !config.baseUrl) {
    throw new Error("LLM provider is not configured.");
  }

  const response = await fetch(`${config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
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
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("LLM response was empty.");
  }

  return extractJson<T>(content);
}
