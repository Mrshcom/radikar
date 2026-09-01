import assert from "node:assert/strict";
import test from "node:test";
import { chatJson, parseLlmJsonResponse } from "../src/client.ts";

const extractedResume = {
  resumeData: {
    fullName: "Mohammad Reza Shariatzadeh",
    jobTitle: "Frontend Chapter Lead @ Dotin",
    email: "mrshcom@gmail.com",
  },
  experiences: [
    {
      jobTitle: "Frontend Chapter Lead",
      company: "Dotin",
      isCurrent: true,
    },
  ],
  qualifications: [
    {
      institution: "Bojnourd University",
      credential: "Bachelor's degree, Computer Software Engineering",
    },
  ],
  skills: "ReactJS, NextJS, JavaScript, TypeScript, Node.js",
  languages: "Persian, English",
};

test("parses the direct JSON returned for the attached resume", () => {
  const parsed = parseLlmJsonResponse(JSON.stringify(extractedResume));

  assert.equal(parsed.resumeData.fullName, "Mohammad Reza Shariatzadeh");
  assert.equal(parsed.experiences[0].company, "Dotin");
  assert.equal(parsed.qualifications[0].institution, "Bojnourd University");
  assert.equal(parsed.languages, "Persian, English");
});

test("parses OpenAI-compatible text, content-part, and encoded JSON wrappers", () => {
  const textResponse = JSON.stringify({
    choices: [{ message: { content: JSON.stringify(extractedResume) } }],
  });
  const partResponse = JSON.stringify({
    choices: [
      {
        message: {
          content: [{ type: "text", text: JSON.stringify(extractedResume) }],
        },
      },
    ],
  });
  const encodedResponse = JSON.stringify({
    choices: [
      { message: { content: JSON.stringify(JSON.stringify(extractedResume)) } },
    ],
  });

  for (const response of [textResponse, partResponse, encodedResponse]) {
    assert.equal(
      parseLlmJsonResponse(response).resumeData.fullName,
      "Mohammad Reza Shariatzadeh",
    );
  }
});

test("parses JSON that the local proxy misclassifies as a tool call", () => {
  const response = JSON.stringify({
    choices: [
      {
        message: {
          content: null,
          tool_calls: [
            {
              type: "function",
              function: {
                name: "resumeData",
                arguments: JSON.stringify(extractedResume),
              },
            },
          ],
        },
        finish_reason: "tool_calls",
      },
    ],
  });

  const parsed = parseLlmJsonResponse(response);
  assert.equal(parsed.resumeData.fullName, "Mohammad Reza Shariatzadeh");
  assert.equal(parsed.experiences[0].company, "Dotin");
});

test("reassembles JSON from an SSE response even when stream=false is ignored", () => {
  const content = JSON.stringify(extractedResume);
  const middle = Math.floor(content.length / 2);
  const response = [
    `data: ${JSON.stringify({ choices: [{ delta: { content: content.slice(0, middle) } }] })}`,
    `data: ${JSON.stringify({ choices: [{ delta: { content: content.slice(middle) } }] })}`,
    "data: [DONE]",
  ].join("\n\n");

  assert.equal(
    parseLlmJsonResponse(response).resumeData.fullName,
    "Mohammad Reza Shariatzadeh",
  );
});

test("does not mistake an empty provider envelope for extracted resume data", () => {
  assert.equal(
    parseLlmJsonResponse(JSON.stringify({ choices: [{ message: { content: "" } }] })),
    undefined,
  );
  assert.equal(parseLlmJsonResponse(""), undefined);
});

test("chatJson isolates proxy sessions and switches models after an empty response", async () => {
  const originalFetch = globalThis.fetch;
  const requestUsers = [];
  const requestBodies = [];
  const usageEvents = [];
  let callCount = 0;
  globalThis.fetch = async (_url, init) => {
    callCount += 1;
    const requestBody = JSON.parse(init.body);
    requestBodies.push(requestBody);
    requestUsers.push(requestBody.user);
    const payload =
      callCount === 1
        ? {
            choices: [
              {
                message: {
                  content: null,
                  tool_calls: [
                    { function: { name: "English", arguments: "{}" } },
                  ],
                },
                finish_reason: "tool_calls",
              },
            ],
          }
        : {
            choices: [
              { message: { content: JSON.stringify(extractedResume) } },
            ],
          };
    payload.usage = {
      prompt_tokens: callCount === 1 ? 100 : 120,
      completion_tokens: callCount === 1 ? 10 : 20,
      total_tokens: callCount === 1 ? 110 : 140,
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const result = await chatJson(
      {
        provider: "freeDeepseekAPI",
        model: "deepseek-chat",
        apiKey: "localproxy",
        baseUrl: "http://localhost:9655/v1",
        inputPricePerMillionUsd: 1,
        outputPricePerMillionUsd: 2,
      },
      [{ role: "user", content: "Extract the resume as JSON." }],
      {
        maxOutputTokens: 8192,
        emptyResponseFallbackModels: ["deepseek-reasoner"],
        onUsage: (usage) => usageEvents.push(usage),
      },
    );

    assert.equal(result.resumeData.fullName, "Mohammad Reza Shariatzadeh");
    assert.equal(callCount, 2);
    assert.match(requestUsers[0], /^radicar-json-/);
    assert.notEqual(requestUsers[0], requestUsers[1]);
    assert.deepEqual(
      requestBodies.map((body) => body.model),
      ["deepseek-chat", "deepseek-reasoner"],
    );
    assert.equal(requestBodies[0].max_tokens, 8192);
    assert.equal(usageEvents.length, 2);
    assert.equal(usageEvents[0].successful, false);
    assert.equal(usageEvents[1].successful, true);
    assert.equal(usageEvents[1].model, "deepseek-reasoner");
    assert.equal(usageEvents[1].tokenSource, "provider");
    assert.equal(usageEvents[1].totalTokens, 140);
    assert.equal(usageEvents[1].estimatedCostMicros, 160);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("chatJson bounds retries and attaches a request timeout", async () => {
  const originalFetch = globalThis.fetch;
  const signals = [];
  let callCount = 0;
  globalThis.fetch = async (_url, init) => {
    callCount += 1;
    signals.push(init.signal);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: "" } }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  try {
    await assert.rejects(
      chatJson(
        {
          provider: "freeDeepseekAPI",
          model: "deepseek-chat",
          apiKey: "localproxy",
          baseUrl: "http://localhost:9655/v1",
          inputPricePerMillionUsd: 0,
          outputPricePerMillionUsd: 0,
        },
        [{ role: "user", content: "Return JSON." }],
        { maxAttempts: 2, timeoutMs: 1_000 },
      ),
      /مدل پاسخی برای استخراج اطلاعات نداد/,
    );
    assert.equal(callCount, 2);
    assert.equal(signals.length, 2);
    assert.ok(signals.every((signal) => signal instanceof AbortSignal));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("chatJson forwards caller cancellation to the provider request", async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  globalThis.fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener(
        "abort",
        () => reject(init.signal.reason),
        { once: true },
      );
    });

  try {
    const request = chatJson(
      {
        provider: "freeDeepseekAPI",
        model: "deepseek-chat",
        apiKey: "localproxy",
        baseUrl: "http://localhost:9655/v1",
        inputPricePerMillionUsd: 0,
        outputPricePerMillionUsd: 0,
      },
      [{ role: "user", content: "Return JSON." }],
      { signal: controller.signal, timeoutMs: 10_000 },
    );
    controller.abort();
    await assert.rejects(request, (error) => error?.name === "AbortError");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
