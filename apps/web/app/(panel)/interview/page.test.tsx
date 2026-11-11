import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notify: vi.fn(),
  runModelTask: vi.fn(),
  apiRequest: vi.fn(),
  putSession: vi.fn(async () => {}),
  noSessions: false,
  completedReport: false,
  elapsedMs: 0,
  resumeSkills: "",
  sessionTitle: "تمرین مصاحبه",
  savedAnswers: [] as string[],
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/app/_components/toast", () => ({ useToast: () => mocks.notify }));
vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiRequest: mocks.apiRequest,
}));
vi.mock("../_components/model-task-provider", () => ({
  isModelTaskCanceledError: () => false,
  useModelTasks: () => ({ isRunning: () => false, runModelTask: mocks.runModelTask }),
}));
vi.mock("@/lib/data/stores", () => ({
  createRecordId: () => "new-session",
  getActiveProfileId: async () => "profile-1",
  getLatestResume: async () => ({ data: { jobTitle: "توسعه‌دهنده", skills: mocks.resumeSkills } }),
  knowledgeProfileStore: { get: async () => null },
  interviewSessionStore: {
    list: async () =>
      mocks.noSessions
        ? []
        : [
            {
              id: "session-1",
              title: mocks.sessionTitle,
              subtitle: "مصاحبه جامع",
              duration: "۱۰ دقیقه",
              mode: "مصاحبه جامع",
              agentChatToken: "signed-chat-token",
              readyAt: "2026-10-27T00:00:00.000Z",
              questions: ["سؤال اول؟", "سؤال دوم؟"],
              plannedTopics: ["محور طراحی معماری فرانت‌اند چیست؟", "محور همکاری و حل اختلاف تیمی چیست؟"],
              cards: [],
              feedbacks: [],
              elapsedMs: mocks.elapsedMs,
              report: mocks.completedReport
                ? {
                    score: 70,
                    summary: "خلاصه",
                    strengths: [],
                    improvements: [],
                    questions: [],
                    createdAt: "2026-10-27T00:00:00.000Z",
                  }
                : undefined,
              answers: mocks.savedAnswers,
              currentQuestionIndex: mocks.savedAnswers.length,
              createdAt: "2026-10-27T00:00:00.000Z",
              updatedAt: "2026-10-27T00:00:00.000Z",
            },
          ],
    put: mocks.putSession,
  },
}));

import InterviewPage from "./page";
import { ApiError } from "@/lib/api-client";

describe("InterviewPage answer focus", () => {
  afterEach(() => {
    window.history.replaceState({}, "", "/interview");
    mocks.noSessions = false;
    mocks.completedReport = false;
    mocks.elapsedMs = 0;
    mocks.resumeSkills = "";
    mocks.sessionTitle = "تمرین مصاحبه";
    mocks.savedAnswers = [];
    mocks.runModelTask.mockReset();
    mocks.apiRequest.mockReset();
    mocks.putSession.mockClear();
  });

  it("enters browser fullscreen when the interview opens and leaves it after closing", async () => {
    let fullscreenElement: Element | null = null;
    const requestFullscreen = vi.fn(async () => {
      fullscreenElement = document.documentElement;
    });
    const exitFullscreen = vi.fn(async () => {
      fullscreenElement = null;
    });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: () => fullscreenElement });
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
    try {
      render(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <InterviewPage />
        </QueryClientProvider>,
      );
      fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole("button", { name: "خروج از مصاحبه" }));
      fireEvent.click(screen.getByRole("button", { name: "ذخیره و خروج" }));
      await waitFor(() => expect(exitFullscreen).toHaveBeenCalledTimes(1));
    } finally {
      Reflect.deleteProperty(document, "fullscreenElement");
      Reflect.deleteProperty(document.documentElement, "requestFullscreen");
      Reflect.deleteProperty(document, "exitFullscreen");
    }
  });

  it("keeps the depth chooser outside browser fullscreen", async () => {
    mocks.noSessions = true;
    const requestFullscreen = vi.fn(async () => {});
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
    try {
      render(
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <InterviewPage />
        </QueryClientProvider>,
      );
      fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
      expect(screen.getByRole("heading", { name: "چه نوع مصاحبه‌ای می‌خواهی؟" })).toBeVisible();
      expect(requestFullscreen).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(document.documentElement, "requestFullscreen");
    }
  });

  it("keeps the answer field focused after Enter advances to the next question", async () => {
    mocks.apiRequest.mockImplementation(async (url: string) =>
      url === "/api/interview/next-question"
        ? {
            reply: "اشاره کردی که با تیم همکاری داشتی؛ خوب است دربارهٔ نقش خودت بیشتر بگویی.",
            question: "گفتی در تیم کار کردی؛ یک چالش مشخص را چگونه حل کردی؟",
          }
        : [],
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const requestSubmit = vi.spyOn(HTMLFormElement.prototype, "requestSubmit").mockImplementation(function (
      this: HTMLFormElement,
    ) {
      fireEvent.submit(this);
    });
    try {
      render(
        <QueryClientProvider client={queryClient}>
          <InterviewPage />
        </QueryClientProvider>,
      );
      fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
      const answer = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
      expect(answer).toHaveAttribute("rows", "1");
      expect(answer).toHaveStyle({ height: "40px" });
      expect(screen.getByRole("button", { name: "ارسال پاسخ" })).toBeDisabled();
      await waitFor(() => expect(answer).toHaveFocus());
      fireEvent.change(answer, { target: { value: "توضیح پاسخ اول" } });
      expect(screen.getByRole("button", { name: "ارسال پاسخ" })).toBeEnabled();
      fireEvent.keyDown(answer, { key: "Enter", code: "Enter", keyCode: 13 });
      await waitFor(() =>
        expect(screen.getByText("گفتی در تیم کار کردی؛ یک چالش مشخص را چگونه حل کردی؟")).toBeVisible(),
      );
      expect(
        screen.getByText("اشاره کردی که با تیم همکاری داشتی؛ خوب است دربارهٔ نقش خودت بیشتر بگویی."),
      ).toBeVisible();
      expect(mocks.apiRequest).toHaveBeenCalledWith(
        "/api/interview/next-question",
        expect.objectContaining({ method: "POST" }),
      );
      const turnRequest = mocks.apiRequest.mock.calls.find(([url]) => url === "/api/interview/next-question");
      expect(JSON.parse(turnRequest?.[1]?.body ?? "{}").chatToken).toBe("signed-chat-token");
      expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).toHaveFocus();
      expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).toHaveValue("");
      fireEvent.change(screen.getByRole("textbox", { name: "پاسخ مصاحبه" }), {
        target: { value: "یک نمونهٔ دیگر از همکاری" },
      });
      fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
      await waitFor(() =>
        expect(mocks.apiRequest.mock.calls.filter(([url]) => url === "/api/interview/next-question")).toHaveLength(2),
      );
      const secondTurn = mocks.apiRequest.mock.calls.filter(([url]) => url === "/api/interview/next-question")[1];
      expect(JSON.parse(secondTurn?.[1]?.body ?? "{}").history).toEqual([
        { question: "گفتی در تیم کار کردی؛ یک چالش مشخص را چگونه حل کردی؟", answer: "یک نمونهٔ دیگر از همکاری" },
      ]);
    } finally {
      requestSubmit.mockRestore();
    }
  });

  it("shows preparation on its own page without the invited-interview list", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("heading", { name: "آمادگی برای مصاحبه" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "مصاحبه‌های دعوتی" })).toBeNull();
    expect(screen.getByText(/زمان پاسخ‌گویی انتخابی: ۱۵ دقیقه/)).toBeVisible();
    expect(screen.queryByText(/زمان فکرکردن و پاسخ‌گویی مصاحبه‌گر از زمان تو کم نمی‌شود/)).toBeNull();
    expect(screen.getByText("گزارش عملکرد پس از پایان")).toBeVisible();
    expect(screen.getByRole("button", { name: "ادامه مصاحبه جامع" })).toBeVisible();
    expect(screen.queryByText(/۰ بازخورد ذخیره‌شده/)).toBeNull();
    expect(screen.getByRole("button", { name: "شروع دوباره" })).toBeVisible();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/employer/interviews");
  });

  it("shows three specialized practices before any comprehensive session exists", async () => {
    mocks.noSessions = true;
    mocks.resumeSkills = "React, TypeScript, Node.js";
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("React")).toBeVisible();
    expect(screen.getByRole("button", { name: "شروع مصاحبه جامع" })).toBeVisible();
    expect(screen.getByText("TypeScript")).toBeVisible();
    expect(screen.getByText("Node.js")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "تمرین تخصصی این موضوع" })).toHaveLength(3);
    fireEvent.click(screen.getAllByRole("button", { name: "تمرین تخصصی این موضوع" })[0]);
    expect(screen.getByRole("heading", { name: "چه نوع مصاحبه‌ای می‌خواهی؟" })).toBeVisible();
  });

  it("restarts a completed interview as a new session and keeps its previous report", async () => {
    mocks.completedReport = true;
    mocks.apiRequest.mockResolvedValue({
      title: "مصاحبهٔ تازه",
      subtitle: "آغاز",
      duration: "۱۵ دقیقه",
      questions: ["سؤال تازه؟"],
      cards: [],
    });
    mocks.runModelTask.mockImplementation(async ({ run }: { run: () => Promise<unknown> }) => run());
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "شروع دوباره" }));
    expect(screen.getByRole("dialog", { name: "مصاحبه را از نو شروع کنی؟" })).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(/گزارش قبلی‌ات حفظ خواهد شد/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "تأیید و شروع دوباره" }));
    await waitFor(() => expect(mocks.putSession).toHaveBeenCalledWith(expect.objectContaining({ id: "new-session" })));
  });

  it("starts a fresh preparation interview only after confirmation and replaces the old draft on success", async () => {
    mocks.savedAnswers = ["پاسخ ذخیره‌شده"];
    mocks.apiRequest.mockImplementation(async (url: string) =>
      url === "/api/interview/session"
        ? {
            title: "مصاحبهٔ تازه",
            subtitle: "شروع از ابتدا",
            duration: "۱۰ دقیقه",
            questions: ["سؤال تازه؟"],
            cards: [],
            chatToken: "new-chat-token",
          }
        : [],
    );
    mocks.runModelTask.mockImplementation(async ({ run }: { run: () => Promise<unknown> }) => run());
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "شروع دوباره" }));
    expect(screen.getByRole("dialog", { name: "مصاحبه را از نو شروع کنی؟" })).toBeVisible();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/interview/session", expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "انصراف" }));
    expect(screen.queryByRole("dialog", { name: "مصاحبه را از نو شروع کنی؟" })).toBeNull();
    expect(screen.queryByRole("button", { name: "تأیید و شروع دوباره" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "شروع دوباره" }));
    fireEvent.click(screen.getByRole("button", { name: "تأیید و شروع دوباره" }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    expect(screen.queryByText("سؤال تازه؟")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "بله" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("سؤال تازه؟")).toBeVisible();
    expect(mocks.putSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "session-1",
        agentChatToken: "new-chat-token",
        answers: [],
        replies: [],
        clarifications: [],
        currentQuestionIndex: 0,
      }),
    );
    expect(screen.queryByText("پاسخ ذخیره‌شده")).toBeNull();
  });

  it("creates a new session when restarting from a completed report", async () => {
    mocks.completedReport = true;
    mocks.apiRequest.mockResolvedValue({
      title: "مصاحبهٔ تازه",
      subtitle: "شروع از ابتدا",
      duration: "۱۰ دقیقه",
      questions: ["سؤال تازه؟"],
      cards: [],
      chatToken: "fresh-chat-token",
    });
    mocks.runModelTask.mockImplementation(async ({ run }: { run: () => Promise<unknown> }) => run());
    window.history.replaceState({}, "", "/interview?restart=session-1");
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(mocks.putSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "new-session",
          agentChatToken: "fresh-chat-token",
          answers: [],
          replies: [],
        }),
      ),
    );
    const freshSession = (mocks.putSession.mock.calls as unknown[][]).at(-1)?.[0];
    expect(freshSession).not.toHaveProperty("readinessMessages");
    expect(freshSession).not.toHaveProperty("readyAt");
    expect(await screen.findByRole("textbox", { name: "پاسخ مصاحبه" })).toBeVisible();
    expect(screen.queryByText("سؤال تازه؟")).not.toBeInTheDocument();
  });

  it("keeps the specialized interview type when restarting from its report", async () => {
    mocks.completedReport = true;
    mocks.sessionTitle = "تمرین تخصصی: HTML";
    mocks.apiRequest.mockResolvedValue({
      title: "مصاحبهٔ تازه",
      subtitle: "شروع از ابتدا",
      duration: "۱۰ دقیقه",
      questions: ["سؤال تازه؟"],
      cards: [],
    });
    mocks.runModelTask.mockImplementation(async ({ run }: { run: () => Promise<unknown> }) => run());
    window.history.replaceState({}, "", "/interview?restart=session-1");
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(mocks.apiRequest).toHaveBeenCalledWith(
        "/api/interview/session",
        expect.objectContaining({
          body: expect.stringContaining('"mode":"تمرین تخصصی: HTML"'),
        }),
      ),
    );
  });

  it("waits for an affirmative reply before showing the first question", async () => {
    mocks.noSessions = true;
    mocks.apiRequest.mockResolvedValue({
      title: "مصاحبه تازه",
      subtitle: "آغاز",
      duration: "۱۵ دقیقه",
      questions: ["سؤال اول؟"],
      cards: [],
    });
    mocks.runModelTask.mockImplementation(async ({ run }: { run: () => Promise<unknown> }) => run());
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    fireEvent.click(screen.getByRole("button", { name: /انتخاب استاندارد/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    expect(screen.queryByText("سؤال اول؟")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "نه" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText(/هر وقت آماده بودی/)).toBeVisible();
    expect(input).toHaveValue("");
    expect(screen.queryByText("سؤال اول؟")).not.toBeInTheDocument();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/interview/next-question", expect.anything());
    fireEvent.change(input, { target: { value: "باشه" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(screen.queryByText("سؤال اول؟")).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "الان اکیم" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("سؤال اول؟")).toBeVisible();
    expect(screen.queryByText(/هر وقت آماده بودی/)).not.toBeInTheDocument();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/interview/next-question", expect.anything());
  });

  it.each(["پس", "yes", "YES", "یس", "یس یس", "یس، یس", "بریم"])("starts after the affirmative readiness reply %s", async (reply) => {
    mocks.noSessions = true;
    mocks.apiRequest.mockResolvedValue({
      title: "مصاحبه تازه",
      subtitle: "آغاز",
      duration: "۱۵ دقیقه",
      questions: ["سؤال اول؟"],
      cards: [],
    });
    mocks.runModelTask.mockImplementation(async ({ run }: { run: () => Promise<unknown> }) => run());
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    fireEvent.click(screen.getByRole("button", { name: /انتخاب استاندارد/ }));
    fireEvent.change(await screen.findByRole("textbox", { name: "پاسخ مصاحبه" }), { target: { value: reply } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("سؤال اول؟")).toBeVisible();
  });

  it("pauses the user's time while the interviewer prepares the next turn", async () => {
    let resolveTurn!: (value: { reply: string; question: string }) => void;
    mocks.apiRequest.mockImplementation((url: string) =>
      url === "/api/interview/next-question"
        ? new Promise((resolve) => {
            resolveTurn = resolve;
          })
        : Promise.resolve([]),
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    fireEvent.change(await screen.findByRole("textbox", { name: "پاسخ مصاحبه" }), {
      target: { value: "تجربهٔ خودم را توضیح می‌دهم." },
    });
    const sendButton = screen.getByRole("button", { name: "ارسال پاسخ" });
    sendButton.focus();
    fireEvent.click(sendButton);
    expect(await screen.findByText(/مکث؛ زمان پاسخ مصاحبه‌گر حساب نمی‌شود/)).toBeVisible();
    expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).toHaveValue("");
    const waitingButton = screen.getByRole("button", { name: "در حال دریافت پاسخ مصاحبه‌گر" });
    expect(waitingButton).toBeDisabled();
    expect(waitingButton.querySelector(".animate-spin")).not.toBeNull();
    expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).not.toHaveAttribute("readonly");
    fireEvent.change(screen.getByRole("textbox", { name: "پاسخ مصاحبه" }), {
      target: { value: "پاسخ بعدی را می‌نویسم" },
    });
    expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).toHaveValue("پاسخ بعدی را می‌نویسم");
    expect(screen.getByText(/باقی‌مانده/).className).toContain("animate-pulse");
    resolveTurn({ reply: "متوجه شدم.", question: "سؤال بعد؟" });
    expect(await screen.findByText("سؤال بعد؟")).toBeVisible();
    await waitFor(() => expect(screen.queryByText(/مکث؛ زمان پاسخ مصاحبه‌گر حساب نمی‌شود/)).toBeNull());
    expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).not.toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "پاسخ مصاحبه" })).toHaveValue("پاسخ بعدی را می‌نویسم");
    expect(screen.getByRole("button", { name: "ارسال پاسخ" })).toBeEnabled();
  });

  it("keeps a sent answer out of the composer and retries only the missing interviewer turn", async () => {
    mocks.elapsedMs = 15 * 60_000;
    let turnRequests = 0;
    mocks.apiRequest.mockImplementation(async (url: string) => {
      if (url !== "/api/interview/next-question") return [];
      turnRequests += 1;
      if (turnRequests === 1) throw new Error("پاسخ مدل کامل نشد");
      return { reply: "گفت‌وگو به پایان رسید.", question: "", complete: true };
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    const answer = "اعتبارسنجی سمت سرور را پیاده کردم.";
    fireEvent.change(input, { target: { value: answer } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    const retry = await screen.findByRole("button", { name: "تلاش دوباره" });
    expect(input).toHaveValue("");
    expect(screen.getAllByText(answer)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "ارسال پاسخ" })).toBeDisabled();
    fireEvent.click(retry);
    expect(await screen.findByText(/مصاحبه تمام شد/)).toBeVisible();
    expect(screen.getAllByText(answer)).toHaveLength(1);
    expect(turnRequests).toBe(2);
  });

  it("keeps the elapsed-time message steady while the interviewer responds", async () => {
    mocks.elapsedMs = 15 * 60_000;
    let resolveTurn!: (value: { reply: string; question: string }) => void;
    mocks.apiRequest.mockImplementation((url: string) =>
      url === "/api/interview/next-question"
        ? new Promise((resolve) => {
            resolveTurn = resolve;
          })
        : Promise.resolve([]),
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    fireEvent.change(await screen.findByRole("textbox", { name: "پاسخ مصاحبه" }), {
      target: { value: "نمونهٔ تجربهٔ کاری" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText(/مصاحبه‌گر در حال بررسی پاسخ/)).toBeVisible();
    expect(screen.queryByText(/مکث؛ زمان پاسخ مصاحبه‌گر حساب نمی‌شود/)).toBeNull();
    expect(screen.getByText(/زمان انتخابی تمام شد/).className).not.toContain("animate-pulse");
    resolveTurn({ reply: "ممنون.", question: "سؤال بعدی؟" });
    expect(await screen.findByText("سؤال بعدی؟")).toBeVisible();
  });

  it("routes a question through the send action without moving to the next question", async () => {
    mocks.apiRequest.mockImplementation(async (url: string) =>
      url === "/api/interview/clarify" ? { reply: "منظورم تجربهٔ خودت در یک پروژهٔ واقعی است." } : [],
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    fireEvent.change(input, { target: { value: "منظورت از پروژهٔ دشوار چیست؟" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("منظورم تجربهٔ خودت در یک پروژهٔ واقعی است.")).toBeVisible();
    const clarificationRequest = mocks.apiRequest.mock.calls.find(([url]) => url === "/api/interview/clarify");
    expect(JSON.parse(clarificationRequest?.[1]?.body ?? "{}").chatToken).toBe("signed-chat-token");
    expect(screen.getByText("سؤال اول؟")).toBeVisible();
    expect(screen.queryByText("سؤال دوم؟")).not.toBeInTheDocument();
  });

  it("continues the conversation after the initial topic list ends", async () => {
    let turns = 0;
    mocks.apiRequest.mockImplementation(async (url: string) =>
      url === "/api/interview/next-question"
        ? { reply: "بیشتر دربارهٔ همان تجربه بگو.", question: `پرسش پیگیر ${++turns} دربارهٔ تجربه‌ات چیست؟` }
        : [],
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    fireEvent.change(input, { target: { value: "تجربهٔ اول را در تیم محصول توضیح می‌دهم." } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    await screen.findByText("پرسش پیگیر 1 دربارهٔ تجربه‌ات چیست؟");
    fireEvent.change(input, { target: { value: "در همان پروژه مشکل پیچیده‌ای را حل کردم." } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("پرسش پیگیر 2 دربارهٔ تجربه‌ات چیست؟")).toBeVisible();
    expect(turns).toBe(2);
    const turnRequests = mocks.apiRequest.mock.calls.filter(([url]) => url === "/api/interview/next-question");
    expect(JSON.parse(turnRequests[0]?.[1]?.body ?? "{}")).toMatchObject({
      nextTopic: "محور همکاری و حل اختلاف تیمی چیست؟",
      topicShiftRequired: false,
    });
    expect(JSON.parse(turnRequests[1]?.[1]?.body ?? "{}")).toMatchObject({
      nextTopic: "محور همکاری و حل اختلاف تیمی چیست؟",
      topicShiftRequired: true,
    });
    expect(screen.queryByText(/از ۲ موضوع/)).toBeNull();
  });

  it("shows the interviewer's closing message before offering the report", async () => {
    mocks.elapsedMs = 15 * 60_000;
    mocks.apiRequest.mockImplementation(async (url: string) =>
      url === "/api/interview/next-question"
        ? {
            reply: "از توضیح تجربهٔ فنی و همکاری‌ات ممنونم. گفت‌وگو به پایان رسید.",
            question: "",
            complete: true,
          }
        : [],
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    fireEvent.change(await screen.findByRole("textbox", { name: "پاسخ مصاحبه" }), {
      target: { value: "در یک پروژهٔ فنی با تیم راهکارها را سنجیدم و نتیجه را بررسی کردم." },
    });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText(/از توضیح تجربهٔ فنی و همکاری‌ات ممنونم\. گفت‌وگو به پایان رسید/)).toBeVisible();
    expect(screen.getByText(/مصاحبه تمام شد\. ممنون از اینکه در جلسهٔ مصاحبهٔ رادیکار شرکت کردی\. این یک مصاحبهٔ آزمایشی بود/)).toBeVisible();
    expect(screen.queryByText(/جمع‌بندی مصاحبه‌گر را در بالا می‌بینی/)).toBeNull();
    expect(screen.getByRole("button", { name: "دریافت نتیجهٔ مصاحبه" })).toBeVisible();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/interview/report", expect.anything());
  });

  it("treats a short question sent in the chat as clarification", async () => {
    mocks.apiRequest.mockImplementation(async (url: string) =>
      url === "/api/interview/clarify" ? { reply: "منظورم یک نمونه از تجربهٔ خودت است." } : [],
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    fireEvent.change(input, { target: { value: "منظورت چیه؟" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("منظورم یک نمونه از تجربهٔ خودت است.")).toBeVisible();
    expect(mocks.apiRequest).toHaveBeenCalledWith("/api/interview/clarify", expect.anything());
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/interview/next-question", expect.anything());
  });

  it("shows a sent clarification while the interviewer is still thinking", async () => {
    let resolveClarification!: (value: { reply: string }) => void;
    mocks.apiRequest.mockImplementation((url: string) =>
      url === "/api/interview/clarify"
        ? new Promise((resolve) => {
            resolveClarification = resolve;
          })
        : Promise.resolve([]),
    );
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    fireEvent.change(input, { target: { value: "منظورت از این سؤال چیه؟" } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("منظورت از این سؤال چیه؟")).toBeVisible();
    expect(input).toHaveValue("");
    expect(screen.getByText(/مصاحبه‌گر در حال بررسی پاسخ شماست/)).toBeVisible();
    expect(screen.queryByText("منظورم نمونه‌ای از تجربهٔ توست.")).toBeNull();
    resolveClarification({ reply: "منظورم نمونه‌ای از تجربهٔ توست." });
    expect(await screen.findByText("منظورم نمونه‌ای از تجربهٔ توست.")).toBeVisible();
    expect(screen.getAllByText("منظورت از این سؤال چیه؟")).toHaveLength(1);
  });

  it("refuses unrelated product and identity questions without advancing the interview", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ مصاحبه" });
    const messages = ["رادیکار چیه؟ معرفی‌ش کن", "رادیکار رو معرفی کن", "آیا تو ربات هستی؟"];
    for (const [index, message] of messages.entries()) {
      fireEvent.change(input, { target: { value: message } });
      fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
      await waitFor(() =>
        expect(screen.getAllByText("این سؤال مربوط به این جلسهٔ مصاحبه نیست؛ لطفاً نپرس.")).toHaveLength(index + 1),
      );
    }
    expect(screen.getByText("سؤال اول؟")).toBeVisible();
    expect(screen.queryByText("سؤال دوم؟")).toBeNull();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/interview/next-question", expect.anything());
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/interview/clarify", expect.anything());
  });

  it("shows a direct upgrade link inside the quota error banner", async () => {
    mocks.noSessions = true;
    mocks.runModelTask.mockRejectedValue(
      new ApiError(402, "سهمیه مصاحبه این پلن تمام شده است؛ برای ادامه پلن را ارتقا دهید."),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <InterviewPage />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /شروع مصاحبه جامع|ادامه مصاحبه جامع/ }));
    fireEvent.click(screen.getByRole("button", { name: /انتخاب سریع/ }));
    expect(await screen.findByText(/سهمیه مصاحبه این پلن تمام شده است/)).toBeVisible();
    expect(mocks.runModelTask).toHaveBeenCalledWith(expect.objectContaining({ key: "interview-session" }));
    expect(screen.getByRole("link", { name: /مشاهده و ارتقای پلن/ })).toHaveAttribute("href", "/upgrade");
  });
});
