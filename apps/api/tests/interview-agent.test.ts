import assert from "node:assert/strict";
import test from "node:test";
import { InterviewAgentClient, interviewTurnPrompt } from "../src/modules/ai/interview-agent";
import { signInterviewChat, verifyInterviewChat } from "../src/modules/ai/interview-chat-token";

const uuid = "9b2f6c1e-4d7a-4b8e-a1f3-2c5d8e9f0a1b";

test("interview turn shifts topics after one follow-up and sees all prior questions", () => {
  const history = Array.from({ length: 7 }, (_, index) => ({
    question: `پرسش محور ${index + 1}؟`,
    answer: `پاسخ ${index + 1}`,
  }));
  const prompt = interviewTurnPrompt({
    mode: "مصاحبه جامع",
    nextTopic: "تجربهٔ مستقل در حل یک مسئلهٔ متفاوت چیست؟",
    topicShiftRequired: true,
    history,
  });
  assert.match(prompt, /یک سؤال اصلی و حداکثر یک سؤال پیگیر/);
  assert.match(prompt, /تغییر محور در این نوبت الزامی است/);
  assert.match(prompt, /پرسش محور 1/);
  assert.match(prompt, /پرسش محور 7/);
  assert.match(prompt, /تجربهٔ مستقل در حل یک مسئلهٔ متفاوت/);
});

function envelope(data: object | null, status = 200, message = "") {
  return new Response(JSON.stringify({ message, errors: {}, success: status < 400, data }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function client(fetcher: typeof fetch) {
  return new InterviewAgentClient({
    baseUrl: "https://agents.example.test",
    apiKey: "12.private-secret",
    interviewerAgent: "interviewer",
    resumeRankerAgent: "resume-ranker",
    timeoutMs: 5_000,
    pollIntervalMs: 0,
    fetcher,
  });
}

test("agent interview sends a server-side bearer key, polls the same chat and validates four questions", async () => {
  const calls: Array<{ url: string; method: string; authorization: string; body: string }> = [];
  const responses = [
    envelope({ uuid, status: "pending", reply: null }),
    envelope({ uuid, status: "running", reply: null }),
    envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({
        title: "جلسه",
        subtitle: "تمرین",
        duration: "۱۰ دقیقه",
        questions: ["یک؟", "دو؟", "سه؟", "چهار؟"],
        cards: [],
      }),
      usage: { input_tokens: 100, output_tokens: 40, total_tokens: 140 },
    }),
  ];
  const fetcher = (async (url: URL | RequestInfo, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method ?? "",
      authorization: new Headers(init?.headers).get("authorization") ?? "",
      body: String(init?.body ?? ""),
    });
    return responses.shift()!;
  }) as typeof fetch;
  const usage: string[] = [];
  const result = await client(fetcher).createSession(
    {
      resume: { jobTitle: "توسعه‌دهنده", email: "private@example.test", photoUrl: "private-photo" },
      knowledge: { interviewContext: "تمرین فنی", resumeData: { email: "duplicate@example.test" } },
      mode: "مصاحبه جامع",
    },
    {
      onUsage: (event) => {
        usage.push(`${event.provider}:${event.totalTokens}`);
      },
    },
  );
  assert.equal(result.questions.length, 4);
  assert.deepEqual(
    calls.map((call) => call.method),
    ["POST", "GET", "GET"],
  );
  assert.match(calls[0].url, /\/interviewer\/chat$/);
  assert.match(calls[1].url, new RegExp(`/interviewer/chat/${uuid}$`));
  assert.ok(calls.every((call) => call.authorization === "Bearer 12.private-secret"));
  assert.equal(JSON.parse(calls[0].body).webhook_url, undefined);
  assert.doesNotMatch(calls[0].body, /private@example|private-photo|duplicate@example/);
  assert.match(calls[0].body, /تمرین فنی/);
  assert.deepEqual(usage, ["abroai:140"]);
});

test("all interview turns reuse one AbroAI chat and account for cumulative usage", async () => {
  const calls: Array<{ url: string; method: string; body: Record<string, string> | null }> = [];
  const responses = [
    envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({
        title: "جلسه",
        subtitle: "تمرین",
        duration: "۸ دقیقه",
        questions: ["یک؟", "دو؟", "سه؟", "چهار؟"],
        cards: [],
      }),
      usage: { input_tokens: 60, output_tokens: 40, total_tokens: 100 },
    }),
    envelope({
      uuid,
      status: "completed",
      reply: "previous",
      usage: { input_tokens: 60, output_tokens: 40, total_tokens: 100 },
    }),
    envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({ reply: "تجربه‌ات روشن شد.", question: "جزئیات بیشتری می‌گویی؟" }),
      usage: { input_tokens: 90, output_tokens: 50, total_tokens: 140 },
    }),
  ];
  const fetcher = (async (url: URL | RequestInfo, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method ?? "",
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return responses.shift()!;
  }) as typeof fetch;
  const usage: number[] = [];
  let chatUuid = "";
  const agent = client(fetcher);
  await agent.createSession(
    { resume: {}, knowledge: {}, mode: "تمرین" },
    {
      onChatUuid: (value) => {
        chatUuid = value;
      },
    },
  );
  await agent.nextQuestion(
    {
      mode: "تمرین",
      nextTopic: "دربارهٔ همکاری تیمی توضیح بده.",
      history: [{ question: "یک؟", answer: "این تجربه را با تیم انجام دادم." }],
    },
    {
      chatUuid,
      onUsage: (event) => {
        usage.push(event.totalTokens);
      },
    },
  );
  assert.equal(chatUuid, uuid);
  assert.deepEqual(
    calls.map(({ method }) => method),
    ["POST", "GET", "POST"],
  );
  assert.equal(calls[1].url.endsWith(`/interviewer/chat/${uuid}`), true);
  assert.equal(calls[2].url.endsWith("/interviewer/chat"), true);
  assert.equal(calls[2].body?.chat_uuid, uuid);
  assert.deepEqual(usage, [40]);
});

test("a signed interview chat belongs to its candidate account", () => {
  const token = signInterviewChat(uuid, "candidate-a", "private-secret");
  assert.equal(verifyInterviewChat(token, "candidate-a", "private-secret"), uuid);
  assert.equal(verifyInterviewChat(token, "candidate-b", "private-secret"), null);
  assert.equal(verifyInterviewChat(`${token}a`, "candidate-a", "private-secret"), null);
});

test("agent interview accepts nullable usage fields returned by pending and completed chats", async () => {
  const responses = [
    envelope({
      uuid,
      status: "pending",
      reply: null,
      usage: { input_tokens: null, output_tokens: null, total_tokens: null },
    }),
    envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({
        title: "جلسه",
        subtitle: "تمرین",
        duration: "۱۰ دقیقه",
        questions: ["یک؟", "دو؟", "سه؟", "چهار؟"],
        cards: [],
      }),
      usage: { input_tokens: null, output_tokens: null, total_tokens: null },
    }),
  ];
  const fetcher = (async () => responses.shift()!) as typeof fetch;
  const usageSources: string[] = [];
  const result = await client(fetcher).createSession(
    { resume: {}, knowledge: {}, mode: "جامع" },
    {
      onUsage: (event) => {
        usageSources.push(event.tokenSource);
      },
    },
  );
  assert.equal(result.questions.length, 4);
  assert.deepEqual(usageSources, ["estimated"]);
});

test("agent interviewer responds to the last answer and asks a contextual follow-up", async () => {
  let prompt = "";
  const fetcher = (async (_url: URL | RequestInfo, init?: RequestInit) => {
    prompt = JSON.parse(String(init?.body)).message;
    return envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({
        reply: "گفتی تحویل پروژه دیر شد؛ توضیح دادی چطور اولویت‌ها را عوض کردی.",
        question: "در همان پروژه، با ذی‌نفعان دربارهٔ تأخیر چگونه صحبت کردی؟",
      }),
    });
  }) as typeof fetch;
  const turn = await client(fetcher).nextQuestion({
    mode: "مصاحبهٔ شغلی",
    nextTopic: "چطور با اعضای تیم اختلاف نظر را حل می‌کنی؟",
    history: [{ question: "در یک پروژهٔ دشوار چه کردی؟", answer: "تحویل پروژه دیر شد و اولویت‌ها را عوض کردم." }],
  });
  assert.match(turn.reply, /تحویل پروژه/);
  assert.match(turn.question, /ذی‌نفعان/);
  assert.match(prompt, /اگر جواب مبهم بود/);
  assert.match(prompt, /مهارت فنی/);
  assert.match(prompt, /مهارت نرم/);
  assert.match(prompt, /تحویل پروژه دیر شد/);
});

test("interviewer can close after enough evidence without generating another question", async () => {
  const fetcher = (async () =>
    envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({
        reply: "از توضیح تجربهٔ فنی و همکاری‌ات ممنونم. گفت‌وگوی ما اینجا به پایان رسید.",
        question: "",
        complete: true,
      }),
    })) as typeof fetch;
  const turn = await client(fetcher).nextQuestion({
    mode: "مصاحبهٔ شغلی",
    nextTopic: "موضوع پیشنهادی دیگر",
    history: [{ question: "از تجربه‌ات بگو.", answer: "در تیم دربارهٔ انتخاب راهکار فنی تصمیم گرفتیم و نتیجه را سنجیدیم." }],
  });
  assert.equal(turn.complete, true);
  assert.equal(turn.question, "");
  assert.match(turn.reply, /پایان رسید/);
});

test("candidate can ask for clarification without advancing the interview", async () => {
  let prompt = "";
  const fetcher = (async (_url: URL | RequestInfo, init?: RequestInit) => {
    prompt = JSON.parse(String(init?.body)).message;
    return envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({
        reply: "منظورم یک نمونه از همکاری واقعی تو در یک پروژه است؛ هر مثالی که راحتی توضیح بده.",
      }),
    });
  }) as typeof fetch;
  const response = await client(fetcher).clarify({
    mode: "تمرین مصاحبه",
    question: "در یک پروژهٔ دشوار چه کردی؟",
    userMessage: "می‌شود منظورت را روشن‌تر بگویی؟",
    history: [],
  });
  assert.match(response.reply, /منظورم/);
  assert.match(prompt, /سؤال تازه مطرح نکن/);
  assert.match(prompt, /می‌شود منظورت/);
});

test("agent interview requests and validates the selected standard and deep session sizes", async () => {
  for (const questionCount of [10, 15]) {
    let prompt = "";
    const fetcher = (async (_url: URL | RequestInfo, init?: RequestInit) => {
      prompt = JSON.parse(String(init?.body)).message;
      return envelope({
        uuid,
        status: "completed",
        reply: JSON.stringify({
          title: "جلسه",
          subtitle: "تمرین",
          duration: "۳۰ دقیقه",
          questions: Array.from({ length: questionCount }, (_, index) => `سؤال ${index + 1}؟`),
          cards: [],
        }),
      });
    }) as typeof fetch;
    const result = await client(fetcher).createSession({ resume: {}, knowledge: {}, mode: "جامع", questionCount });
    assert.equal(result.questions.length, questionCount);
    assert.match(prompt, new RegExp(`دقیقاً ${questionCount} موضوع آغازین`));
  }
});

test("agent interview keeps deep reports within the provider message limit", async () => {
  let prompt = "";
  const fetcher = (async (_url: URL | RequestInfo, init?: RequestInit) => {
    prompt = JSON.parse(String(init?.body)).message;
    return envelope({ uuid, status: "completed", reply: JSON.stringify({ summary: "خلاصه" }) });
  }) as typeof fetch;
  await client(fetcher).createReport({
    mode: "جامع",
    responses: Array.from({ length: 15 }, (_, index) => ({ question: `سؤال ${index}`, answer: "پاسخ ".repeat(2_000) })),
  });
  assert.ok(prompt.length <= 20_000);
});

test("resume ranking uses its own agent and validates comparable evidence", async () => {
  let path = "";
  const fetcher = (async (url: URL | RequestInfo) => {
    path = String(url);
    return envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({
        name: "نامزد نمونه",
        score: 84,
        matched: ["Java"],
        missing: ["Spring Boot"],
        unknown: ["سابقهٔ تیمی"],
        summary: "تجربهٔ جاوا مرتبط است.",
      }),
    });
  }) as typeof fetch;
  const result = await client(fetcher).rankResume({
    title: "توسعه‌دهنده جاوا",
    description: "تسلط بر جاوا و اسپرینگ بوت",
    resumeText: "چهار سال تجربه جاوا",
  });
  assert.match(path, /\/resume-ranker\/chat$/);
  assert.equal(result.score, 84);
  assert.deepEqual(result.missing, ["Spring Boot"]);
  const invalid = client((async () =>
    envelope({ uuid, status: "completed", reply: JSON.stringify({ score: 120 }) })) as typeof fetch);
  await assert.rejects(invalid.rankResume({ title: "جاوا", description: "جاوا", resumeText: "جاوا" }));
});

test("agent interview rejects failed, malformed and incomplete replies", async () => {
  const failed = client((async () => envelope({ uuid, status: "failed", error: "مدل در دسترس نیست" })) as typeof fetch);
  await assert.rejects(failed.createSession({ resume: {}, knowledge: {}, mode: "جامع" }), /مدل در دسترس نیست/);
  const malformed = client((async () => envelope({ uuid, status: "completed", reply: "not JSON" })) as typeof fetch);
  await assert.rejects(malformed.createSession({ resume: {}, knowledge: {}, mode: "جامع" }), /JSON معتبر نیست/);
  const incomplete = client((async () =>
    envelope({
      uuid,
      status: "completed",
      reply: JSON.stringify({ title: "جلسه", subtitle: "تمرین", duration: "۱۰ دقیقه", questions: ["یک؟"], cards: [] }),
    })) as typeof fetch);
  await assert.rejects(incomplete.createSession({ resume: {}, knowledge: {}, mode: "جامع" }));
});

test("agent interview reports provider HTTP errors and bounds long answers", async () => {
  const calls: string[] = [];
  const fetcher = (async (_url: URL | RequestInfo, init?: RequestInit) => {
    calls.push(String(init?.body ?? ""));
    return envelope({ uuid, status: "completed", reply: JSON.stringify({ summary: "خلاصه" }) });
  }) as typeof fetch;
  await client(fetcher).createReport({ mode: "جامع", responses: [{ question: "سؤال", answer: "الف".repeat(8_000) }] });
  assert.ok(JSON.parse(calls[0]).message.length <= 20_000);
  assert.ok(JSON.parse(calls[0]).message.length < 8_000);
  const unauthorized = client((async () => envelope(null, 401, "Client Secret نامعتبر است.")) as typeof fetch);
  await assert.rejects(
    unauthorized.createReport({ mode: "جامع", responses: [{ question: "سؤال", answer: "پاسخ" }] }),
    /Client Secret نامعتبر است/,
  );
});
