import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { promisify } from "node:util";
import { createDatabase } from "@radikar/database";
import postgres from "postgres";
import { buildApp } from "../src/build-app";
import { getMatchAnalyzeConfig } from "../src/modules/ai/routes";
import { InterviewAgentClient } from "../src/modules/ai/interview-agent";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  phone: "09120000000",
  fullName: "کاربر",
  role: "user" as const,
  status: "active" as const,
  tablePageSize: 20,
  onboardingState: { version: 1 as const, status: "not_started" as const, completedSteps: [] },
  createdAt: "2026-01-01T00:00:00.000Z",
  lastLoginAt: null,
};
const auth: any = {
  resolveSession: async () => ({ user, sessionId: "session" }),
  requestOtp: async () => ({}),
  verifyOtp: async () => ({}),
  revokeSession: async () => {},
  getStats: async () => ({}),
  getRecentEvents: async () => ({ items: [] }),
  listUsers: async () => ({}),
  listAllRecords: async () => ({}),
  getUserDetails: async () => ({}),
  updateUser: async () => ({}),
  updateProfile: async () => ({}),
  updatePreferences: async () => ({}),
  updateOnboarding: async () => ({}),
};
const repository: any = {
  list: async () => [],
  get: async () => null,
  put: async () => ({}),
  remove: async () => {},
  clear: async () => {},
};
const resume = {
  fullName: "سارا احمدی",
  jobTitle: "توسعه‌دهنده",
  summary: "توسعه‌دهنده React",
  experiences: [],
  projects: [],
  educations: [],
};
const execFileAsync = promisify(execFile);

function response(value: unknown, status = 200) {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(value) } }],
      usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
    }),
    { status, headers: { "content-type": "application/json" } },
  );
}

function appWithBilling(events: string[], interviewAgent?: InterviewAgentClient) {
  const billing: any = {
    refundUsage: async (_id: string, _cost: unknown, operation: string) => events.push(`refund:${operation}`),
    recordModelUsage: async (_id: string, _request: string, operation: string, event: { successful: boolean }) =>
      events.push(`usage:${operation}:${event.successful}`),
    listPlans: async () => [],
    getMembership: async () => ({}),
    listUserOrders: async () => ({}),
    createOrder: async () => ({}),
    handleCallback: async () => "",
    consumeUsage: async (_id: string, _cost: unknown, operation: string) => events.push(`consume:${operation}`),
  };
  return buildApp({
    repository,
    readinessCheck: async () => {},
    corsOrigins: [],
    logger: false,
    authService: auth,
    sessionCookieName: "radikar_session",
    secureCookies: false,
    sessionTtlDays: 30,
    billingService: billing,
    interviewAgent,
  });
}

test("the interviewer agent handles sessions and reports while retaining response shapes", async () => {
  const events: string[] = [];
  const paths: string[] = [];
  const bodies: Array<Record<string, string>> = [];
  const uuid = "9b2f6c1e-4d7a-4b8e-a1f3-2c5d8e9f0a1b";
  const agent = new InterviewAgentClient({
    baseUrl: "https://agents.example.test",
    apiKey: "12.private-secret",
    interviewerAgent: "interviewer",
    resumeRankerAgent: "ranker",
    timeoutMs: 5_000,
    pollIntervalMs: 0,
    fetcher: (async (url: URL | RequestInfo, init?: RequestInit) => {
      paths.push(String(url));
      if (init?.method === "GET")
        return new Response(JSON.stringify({ success: true, data: { uuid, status: "completed", reply: "previous" } }));
      bodies.push(JSON.parse(String(init?.body)));
      const prompt = JSON.parse(String(init?.body)).message as string;
      const requestedCount = Number(prompt.match(/دقیقاً (\d+) موضوع آغازین/)?.[1] ?? 4);
      const output = prompt.includes('"reply":string,"question":string,"complete":boolean')
        ? { reply: "دربارهٔ همکاری تیمی توضیح دادی.", question: "در همان تجربه چه تصمیمی گرفتی؟" }
        : !prompt.includes('"responses"')
          ? {
              title: "جلسه",
              subtitle: "تمرین",
              duration: "۱۰ دقیقه",
              questions: Array.from({ length: requestedCount }, (_, index) => `سؤال ${index + 1}؟`),
              cards: [],
            }
          : {
              summary: "خلاصه",
              strengths: [],
              improvements: [],
              questions: [
                { questionIndex: 0, score: 80, feedback: "خوب", strengths: [], issues: [], suggestedAnswer: "نمونه" },
              ],
            };
      return new Response(
        JSON.stringify({
          success: true,
          message: "",
          errors: {},
          data: { uuid, status: "completed", reply: JSON.stringify(output) },
        }),
      );
    }) as typeof fetch,
  });
  const app = appWithBilling(events, agent);
  try {
    const cookie = { radikar_session: "token" };
    const session = await app.inject({
      method: "POST",
      url: "/api/interview/session",
      cookies: cookie,
      payload: { resume },
    });
    const report = await app.inject({
      method: "POST",
      url: "/api/interview/report",
      cookies: cookie,
      payload: { mode: "جامع", responses: [{ question: "یک؟", answer: "پاسخ" }] },
    });
    assert.equal(session.statusCode, 200);
    assert.equal(session.json().questions.length, 4);
    assert.ok(session.json().chatToken);
    const turn = await app.inject({
      method: "POST",
      url: "/api/interview/next-question",
      cookies: cookie,
      payload: {
        mode: "جامع",
        chatToken: session.json().chatToken,
        nextTopic: "دربارهٔ همکاری تیمی توضیح بده.",
        history: [{ question: "یک؟", answer: "در یک تیم محصول همکاری کردم." }],
      },
    });
    assert.equal(turn.statusCode, 200);
    assert.equal(turn.json().chatToken, session.json().chatToken);
    assert.ok(bodies.some((body) => body.chat_uuid === uuid));
    const reportAfterChat = await app.inject({
      method: "POST",
      url: "/api/interview/report",
      cookies: cookie,
      payload: {
        mode: "جامع",
        chatToken: session.json().chatToken,
        responses: [{ question: "یک؟", answer: "پاسخ" }],
      },
    });
    assert.equal(reportAfterChat.statusCode, 200);
    assert.equal(bodies.at(-1)?.chat_uuid, undefined);
    for (const depth of ["quick", "standard", "deep"] as const) {
      const selected = await app.inject({
        method: "POST",
        url: "/api/interview/session",
        cookies: cookie,
        payload: { resume, depth },
      });
      assert.equal(selected.statusCode, 200);
      assert.equal(selected.json().questions.length, 4);
    }
    assert.equal(report.statusCode, 200);
    assert.equal(report.json().score, 80);
    assert.ok(paths.some((path) => path.includes("/interviewer/chat/")));
    assert.ok(events.includes("consume:interview_session"));
    assert.ok(events.includes("usage:interview_report:true"));
  } finally {
    await app.close();
  }
});

test("interview agent failure refunds session credits without falling back to the legacy model", async () => {
  const events: string[] = [];
  const agent = new InterviewAgentClient({
    baseUrl: "https://agents.example.test",
    apiKey: "12.private-secret",
    interviewerAgent: "interviewer",
    resumeRankerAgent: "ranker",
    timeoutMs: 5_000,
    fetcher: (async () =>
      new Response(
        JSON.stringify({
          success: true,
          message: "",
          errors: {},
          data: { uuid: "9b2f6c1e-4d7a-4b8e-a1f3-2c5d8e9f0a1b", status: "failed", error: "ایجنت آماده نیست" },
        }),
      )) as typeof fetch,
  });
  const app = appWithBilling(events, agent);
  try {
    const result = await app.inject({
      method: "POST",
      url: "/api/interview/session",
      cookies: { radikar_session: "token" },
      payload: { resume },
    });
    assert.equal(result.statusCode, 502);
    assert.match(result.json().error, /ایجنت آماده نیست/);
    assert.deepEqual(
      events.filter((event) => event.includes("interview_session")),
      ["consume:interview_session", "refund:interview_session"],
    );
  } finally {
    await app.close();
  }
});

test("malformed interview planning reply shows a useful error and refunds credits", async () => {
  const events: string[] = [];
  const agent = new InterviewAgentClient({
    baseUrl: "https://agents.example.test",
    apiKey: "12.private-secret",
    interviewerAgent: "interviewer",
    resumeRankerAgent: "ranker",
    timeoutMs: 5_000,
    fetcher: (async () =>
      new Response(
        JSON.stringify({
          success: true,
          data: { uuid: "9b2f6c1e-4d7a-4b8e-a1f3-2c5d8e9f0a1b", status: "completed", reply: "پاسخ ناقص" },
        }),
      )) as typeof fetch,
  });
  const app = appWithBilling(events, agent);
  try {
    const result = await app.inject({
      method: "POST",
      url: "/api/interview/session",
      cookies: { radikar_session: "token" },
      payload: { resume },
    });
    assert.equal(result.statusCode, 502);
    assert.match(result.json().error, /مصاحبه‌گر نتوانست پرسش‌های جلسه را آماده کند/);
    assert.doesNotMatch(result.json().error, /JSON/);
    assert.deepEqual(
      events.filter((event) => event.includes("interview_session")),
      ["consume:interview_session", "refund:interview_session"],
    );
  } finally {
    await app.close();
  }
});

test("all six AI routes accept successful provider JSON and record model usage", async () => {
  const previous = globalThis.fetch;
  const outputs = [
    {
      isJobPosting: true,
      jobTitle: "React Developer",
      company: "شرکت",
      breakdown: [{ value: 80 }, { value: 80 }, { value: 80 }, { value: 80 }],
      strengths: ["React"],
      gaps: [],
    },
    { summary: "خلاصه اختصاصی", skills: ["React"] },
    { summary: "رزومه تولیدشده" },
    { subtitle: "خلاصه", profileScore: 80, heroTitle: "عنوان", heroText: "متن", aiTitle: "هوش", aiText: "راهنما" },
    {
      title: "جلسه",
      subtitle: "تمرین",
      duration: "۱۰ دقیقه",
      questions: ["سؤال؟"],
      cards: [{ title: "نکته", text: "متن", tone: "mint" }],
    },
    { title: "بازخورد", text: "پاسخ خوب بود" },
  ];
  const events: string[] = [];
  try {
    globalThis.fetch = async () => response(outputs.shift());
    const app = appWithBilling(events);
    const cookie = { radikar_session: "token" };
    const requests = [
      app.inject({
        method: "POST",
        url: "/api/match/analyze",
        cookies: cookie,
        payload: {
          resume,
          jobDescription:
            "شرکت برای موقعیت توسعه‌دهنده React با سابقه TypeScript و طراحی رابط کاربری نیرو استخدام می‌کند و مسئولیت توسعه محصول را بر عهده دارد.",
        },
      }),
      app.inject({
        method: "POST",
        url: "/api/match/tailor",
        cookies: cookie,
        payload: {
          resume,
          jobDescription:
            "شرکت برای موقعیت توسعه‌دهنده React با سابقه TypeScript و طراحی رابط کاربری نیرو استخدام می‌کند و مسئولیت توسعه محصول را بر عهده دارد.",
        },
      }),
      app.inject({ method: "POST", url: "/api/resume/generate", cookies: cookie, payload: { resume, knowledge: {} } }),
      app.inject({ method: "POST", url: "/api/panel/dashboard", cookies: cookie, payload: { resume, knowledge: {} } }),
      app.inject({
        method: "POST",
        url: "/api/interview/session",
        cookies: cookie,
        payload: { resume, knowledge: {} },
      }),
      app.inject({
        method: "POST",
        url: "/api/interview/feedback",
        cookies: cookie,
        payload: { question: "سؤال", answer: "پاسخ کامل" },
      }),
    ];
    const results = await Promise.all(requests);
    assert.deepEqual(
      results.map((item) => item.statusCode),
      [200, 200, 200, 200, 200, 200],
    );
    assert.ok(events.includes("consume:match_analyze") && events.includes("consume:interview_session"));
    assert.equal(events.filter((event) => event.startsWith("usage:")).length, 6);
    await app.close();
  } finally {
    globalThis.fetch = previous;
  }
});

test("dashboard reports provider quota failures without exposing provider balance details", async () => {
  const previous = globalThis.fetch;
  const events: string[] = [];
  const app = appWithBilling(events);
  let requestedMaxTokens: number | undefined;
  try {
    globalThis.fetch = async (_url, init) => {
      requestedMaxTokens = JSON.parse(String(init?.body)).max_tokens;
      return new Response(
        JSON.stringify({ error: { message: "pre-consume quota failed, remaining user quota: $0.008" } }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      );
    };
    const result = await app.inject({
      method: "POST",
      url: "/api/panel/dashboard",
      cookies: { radikar_session: "token" },
      payload: { resume, knowledge: {} },
    });

    assert.equal(result.statusCode, 502);
    assert.equal(result.json().error, "اعتبار سرویس هوش مصنوعی کافی نیست؛ لطفاً بعداً دوباره تلاش کنید.");
    assert.equal(requestedMaxTokens, 1_024);
    assert.ok(events.includes("usage:dashboard:false"));
  } finally {
    globalThis.fetch = previous;
    await app.close();
  }
});

test("interview session scopes comprehensive and focused questions separately", async () => {
  const previous = globalThis.fetch;
  const prompts: string[] = [];
  const app = appWithBilling([]);
  try {
    globalThis.fetch = async (_url, options) => {
      const request = JSON.parse(String(options?.body));
      const messages = request.messages ?? request.input;
      const prompt = String(messages.find((message: { role: string }) => message.role === "user").content);
      prompts.push(prompt);
      const requestedCount = Number(prompt.match(/دقیقاً (\d+) موضوع آغازین/)?.[1] ?? 4);
      return response({
        title: "جلسه",
        subtitle: "تمرین",
        duration: "۱۰ دقیقه",
        questions: Array.from({ length: requestedCount }, (_, index) => `سؤال ${index + 1}؟`),
        cards: [],
      });
    };
    const cookies = { radikar_session: "token" };
    const comprehensive = await app.inject({
      method: "POST",
      url: "/api/interview/session",
      cookies,
      payload: { resume, type: "comprehensive", mode: "مصاحبه جامع" },
    });
    const focused = await app.inject({
      method: "POST",
      url: "/api/interview/session",
      cookies,
      payload: { resume, type: "focused", focusArea: "معماری و مقیاس‌پذیری", mode: "تمرین تخصصی" },
    });
    assert.equal(comprehensive.statusCode, 200);
    assert.equal(focused.statusCode, 200);
    assert.match(prompts[0], /مصاحبه جامع.*مهارت‌های اصلی.*تجربه‌های واقعی/);
    assert.match(prompts[1], /مصاحبه تخصصی فقط درباره «معماری و مقیاس‌پذیری»/);
    assert.match(prompts[1], /به حوزه‌های دیگر نرو/);
    const deep = await app.inject({
      method: "POST",
      url: "/api/interview/session",
      cookies,
      payload: { resume, type: "focused", focusArea: "معماری", mode: "تمرین تخصصی", depth: "deep" },
    });
    assert.equal(deep.statusCode, 200);
    assert.equal(deep.json().questions.length, 4);
    assert.match(prompts[2], /۲۵ دقیقه|25 دقیقه/);
    const invalid = await app.inject({
      method: "POST",
      url: "/api/interview/session",
      cookies,
      payload: { resume, type: "focused", mode: "تمرین تخصصی" },
    });
    assert.equal(invalid.statusCode, 422);
    assert.equal(prompts.length, 3);
  } finally {
    globalThis.fetch = previous;
    await app.close();
  }
});

test("interview report evaluates all answers in one model request and rejects incomplete reports", async () => {
  const previous = globalThis.fetch;
  const events: string[] = [];
  const app = appWithBilling(events);
  let calls = 0;
  let output: unknown = {
    summary: "جمع‌بندی",
    strengths: ["وضوح"],
    improvements: ["مثال عملی بیشتر"],
    questions: [
      {
        questionIndex: 0,
        score: 80,
        feedback: "پاسخ درست",
        strengths: ["تعریف درست"],
        issues: [],
        suggestedAnswer: "پاسخ بهتر اول",
      },
      {
        questionIndex: 1,
        score: 60,
        feedback: "جزئیات کم",
        strengths: [],
        issues: ["مثال کم است"],
        suggestedAnswer: "پاسخ بهتر دوم",
      },
    ],
  };
  try {
    globalThis.fetch = async () => {
      calls += 1;
      return response(output);
    };
    const payload = {
      mode: "فنی",
      responses: [
        { question: "سؤال اول", answer: "پاسخ اول" },
        { question: "سؤال دوم", answer: "پاسخ دوم" },
      ],
    };
    const result = await app.inject({
      method: "POST",
      url: "/api/interview/report",
      cookies: { radikar_session: "token" },
      payload,
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.json().score, 70);
    assert.equal(result.json().questions.length, 2);
    assert.equal(calls, 1);
    assert.ok(events.includes("usage:interview_report:true"));
    output = { summary: "ناقص", strengths: [], improvements: [], questions: [] };
    const invalid = await app.inject({
      method: "POST",
      url: "/api/interview/report",
      cookies: { radikar_session: "token" },
      payload,
    });
    assert.equal(invalid.statusCode, 502);
  } finally {
    globalThis.fetch = previous;
    await app.close();
  }
});

test("AI routes refund consumed credits after provider, invalid JSON, timeout and abort errors", async () => {
  const previous = globalThis.fetch;
  const events: string[] = [];
  try {
    const app = appWithBilling(events);
    const cookie = { radikar_session: "token" };
    for (const failure of [
      async () => new Response("{broken", { status: 200 }),
      async () => new Response(JSON.stringify({ error: { message: "provider down" } }), { status: 503 }),
      async () => {
        throw new DOMException("timeout", "TimeoutError");
      },
      async () => {
        throw new DOMException("aborted", "AbortError");
      },
    ]) {
      globalThis.fetch = failure;
      const result = await app.inject({
        method: "POST",
        url: "/api/match/tailor",
        cookies: cookie,
        payload: {
          resume,
          jobDescription:
            "شرکت برای موقعیت توسعه‌دهنده React با سابقه TypeScript و طراحی رابط کاربری نیرو استخدام می‌کند و مسئولیت توسعه محصول را بر عهده دارد.",
        },
      });
      assert.equal(result.statusCode, 502);
    }
    assert.equal(events.filter((event) => event === "consume:match_tailor").length, 4);
    assert.equal(events.filter((event) => event === "refund:match_tailor").length, 4);
    assert.ok(events.some((event) => event === "usage:match_tailor:false"));
    await app.close();
  } finally {
    globalThis.fetch = previous;
  }
});

test(
  "AI settings persist in real PostgreSQL and normalize a reasoner fallback for match analysis",
  { timeout: 60_000 },
  async () => {
    const name = `radikar_ai_test_${randomUUID().replaceAll("-", "")}`;
    const url = `postgresql://radikar:radikar@localhost:5433/${name}`;
    const admin = postgres("postgresql://radikar:radikar@localhost:5433/postgres", { max: 1 });
    let connection: ReturnType<typeof createDatabase> | undefined;
    let sql: postgres.Sql | undefined;
    try {
      await admin.unsafe(`CREATE DATABASE ${name}`);
      await execFileAsync("node", ["--import", "tsx", "packages/database/src/migrate.ts"], {
        cwd: new URL("../../../", import.meta.url).pathname,
        env: { ...process.env, DATABASE_URL: url },
      });
      connection = createDatabase(url, 1);
      sql = postgres(url, { max: 1 });
      const superadminAuth = {
        ...auth,
        resolveSession: async () => ({ user: { ...user, role: "superadmin" as const }, sessionId: "session" }),
      };
      const app = buildApp({
        repository,
        readinessCheck: async () => {},
        corsOrigins: [],
        logger: false,
        authService: superadminAuth,
        sessionCookieName: "radikar_session",
        secureCookies: false,
        sessionTtlDays: 30,
        database: connection.db,
      });
      const saved = await app.inject({
        method: "PATCH",
        url: "/api/admin/ai-settings",
        cookies: { radikar_session: "token" },
        payload: { provider: "freeDeepseekAPI", model: "deepseek-reasoner", dollarRateRials: 123 },
      });
      assert.equal(saved.statusCode, 200);
      const read = await app.inject({
        method: "GET",
        url: "/api/admin/ai-settings",
        cookies: { radikar_session: "token" },
      });
      assert.deepEqual(read.json().current, {
        provider: "freeDeepseekAPI",
        model: "deepseek-chat",
        configured: true,
        dollarRateRials: 123,
      });
      assert.equal(
        (await sql`select model from ai_settings where id = 'analysis-provider'`)[0].model,
        "deepseek-reasoner",
      );
      assert.equal(getMatchAnalyzeConfig().model, "deepseek-chat");
      await app.close();
    } finally {
      await connection?.close();
      await sql?.end({ timeout: 5 });
      await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
      await admin.end({ timeout: 5 });
    }
  },
);
