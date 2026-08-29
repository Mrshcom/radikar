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

test("chatJson isolates proxy sessions and retries an empty tool call", async () => {
  const originalFetch = globalThis.fetch;
  const requestUsers = [];
  let callCount = 0;
  globalThis.fetch = async (_url, init) => {
    callCount += 1;
    requestUsers.push(JSON.parse(init.body).user);
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
      },
      [{ role: "user", content: "Extract the resume as JSON." }],
    );

    assert.equal(result.resumeData.fullName, "Mohammad Reza Shariatzadeh");
    assert.equal(callCount, 2);
    assert.match(requestUsers[0], /^radicar-json-/);
    assert.notEqual(requestUsers[0], requestUsers[1]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
