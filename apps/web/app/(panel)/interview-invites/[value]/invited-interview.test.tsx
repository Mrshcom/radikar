import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn(), push: vi.fn(), routeValue: "invite-token" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ value: mocks.routeValue }),
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/lib/api-client", () => ({ apiRequest: mocks.apiRequest }));

import InvitedInterview from "./invited-interview";

describe("invited interview conversation", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.push.mockReset();
    mocks.routeValue = "invite-token";
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    mocks.apiRequest.mockImplementation(async (url: string) => {
      if (url === "/api/employer/interviews/invite-token")
        return {
          companyName: "شرکت نمونه",
          title: "مدیر محصول",
          deadline: new Date(Date.now() + 3_600_000).toISOString(),
          status: "accepted",
          questions: ["از تجربهٔ تیمی‌ات بگو.", "چطور تصمیم می‌گیری؟"],
          answers: [],
          replies: [],
          clarifications: [],
        };
      if (url.endsWith("/clarify"))
        return {
          clarifications: [
            {
              questionIndex: 0,
              user: "یعنی کدام پروژه؟",
              reply: "یک پروژهٔ واقعی از تجربهٔ خودت را انتخاب کن.",
            },
          ],
        };
      if (url.endsWith("/turn"))
        return {
          questions: ["از تجربهٔ تیمی‌ات بگو.", "در همان تیم، اختلاف نظر را چگونه حل کردی؟"],
          answers: ["در یک تیم محصول سه نفره کار کردم."],
          replies: ["به تیم سه نفره اشاره کردی؛ نقش خودت را بهتر می‌شناسیم."],
          complete: false,
        };
      return {};
    });
  });

  it("saves a token invitation to the candidate account before the interview starts", async () => {
    const token = "a".repeat(64);
    mocks.routeValue = token;
    let claimed = false;
    mocks.apiRequest.mockImplementation(async (url: string) => {
      if (url === `/api/employer/interviews/${token}`)
        return {
          companyName: "شرکت نمونه",
          title: "مدیر محصول",
          deadline: new Date(Date.now() + 3_600_000).toISOString(),
          status: claimed ? "accepted" : "invited",
          owned: claimed,
          questions: claimed ? ["از تجربهٔ تیمی‌ات بگو."] : null,
          answers: claimed ? [] : null,
          replies: claimed ? [] : null,
          clarifications: claimed ? [] : null,
        };
      if (url === `/api/employer/invitations/${token}/accept`) {
        claimed = true;
        return { accepted: true };
      }
      return {};
    });

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(mocks.apiRequest).toHaveBeenCalledWith(`/api/employer/invitations/${token}/accept`, { method: "POST" }),
    );
    expect(await screen.findByRole("button", { name: "شروع مصاحبه" })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "پاسخ تو" })).toBeNull();
  });

  it("links to the invited interviews list from the details header", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );

    const backLink = await screen.findByRole("link", { name: "بازگشت به مصاحبه‌های دعوتی" });
    expect(backLink).toHaveAttribute("href", "/interview-invites");
    expect(backLink.closest("header")).toBeNull();
  });

  it("shows an expired invitation in the report layout without an interview score or entry action", async () => {
    mocks.apiRequest.mockResolvedValue({
      companyName: "شرکت نمونه",
      title: "مدیر محصول",
      deadline: new Date(Date.now() - 3_600_000).toISOString(),
      status: "expired",
      questions: null,
      answers: null,
      replies: null,
      clarifications: null,
      report: null,
      feedbackShared: false,
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("heading", { name: "مهلت این دعوت به پایان رسیده است" })).toBeVisible();
    expect(screen.getByLabelText("وضعیت مصاحبه: مهلت دعوت به پایان رسیده است")).toBeVisible();
    expect(screen.getByText("شرکت نمونه")).toBeVisible();
    expect(screen.queryByLabelText(/امتیاز مصاحبه/)).toBeNull();
    expect(screen.queryByRole("button", { name: /شروع|ادامه/ })).toBeNull();
    expect(screen.queryByText(/پاسخ‌ها با هوش مصنوعی تحلیل می‌شوند/)).toBeNull();
  });

  it("answers clarification in place and then continues with a contextual question", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "شروع مصاحبه" }));
    expect(screen.queryByRole("textbox", { name: "پاسخ تو" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "شرایط را می‌پذیرم و شروع می‌کنم" }));
    const input = await screen.findByRole("textbox", { name: "پاسخ تو" });
    fireEvent.change(input, { target: { value: "یعنی کدام پروژه؟" } });
    fireEvent.click(screen.getByRole("button", { name: "از مصاحبه‌گر بپرس" }));
    expect(await screen.findByText("یک پروژهٔ واقعی از تجربهٔ خودت را انتخاب کن.")).toBeVisible();
    expect(screen.getByText("از تجربهٔ تیمی‌ات بگو.")).toBeVisible();
    fireEvent.change(input, { target: { value: "در یک تیم محصول سه نفره کار کردم." } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText(/در همان تیم، اختلاف نظر را چگونه حل کردی؟/)).toBeVisible();
    expect(screen.getByText(/به تیم سه نفره اشاره کردی؛ نقش خودت را بهتر می‌شناسیم./)).toBeVisible();
  });

  it("blocks pasting and dropping text into an invited answer while allowing typing", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: "شروع مصاحبه" }));
    fireEvent.click(screen.getByRole("button", { name: "شرایط را می‌پذیرم و شروع می‌کنم" }));
    const answer = await screen.findByRole("textbox", { name: "پاسخ تو" });
    expect(fireEvent.paste(answer, { clipboardData: { getData: () => "پاسخ آماده" } })).toBe(false);
    expect(fireEvent.drop(answer, { dataTransfer: { getData: () => "پاسخ آماده" } })).toBe(false);
    expect(answer).toHaveValue("");
    fireEvent.change(answer, { target: { value: "پاسخ تایپ‌شده" } });
    expect(answer).toHaveValue("پاسخ تایپ‌شده");
  });

  it("shows a completed invited interview with the same report layout as a practice interview", async () => {
    mocks.apiRequest.mockResolvedValue({
      companyName: "شرکت نمونه",
      title: "مدیر محصول",
      deadline: new Date(Date.now() - 3_600_000).toISOString(),
      status: "completed",
      questions: ["از تجربه‌ات بگو."],
      answers: ["پاسخ ثبت‌شده"],
      replies: ["ممنون"],
      clarifications: [],
      feedbackShared: true,
      report: {
        score: 78,
        summary: "تجربهٔ مرتبط و تصمیم‌های روشن در پاسخ‌ها دیده شد.",
        strengths: ["بیان تجربهٔ واقعی"],
        improvements: ["ارائهٔ نتیجه‌های عددی"],
      },
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "گزارش مصاحبهٔ مدیر محصول" })).toBeVisible();
    expect(screen.getByRole("region", { name: "نتیجه مصاحبه" })).toBeVisible();
    expect(screen.getByText("گزارش مصاحبهٔ شغلی تو")).toBeVisible();
    expect(screen.getByText("تجربهٔ مرتبط و تصمیم‌های روشن در پاسخ‌ها دیده شد.")).toBeVisible();
    expect(screen.getByLabelText("امتیاز مصاحبه ۷۸ از ۱۰۰")).toBeVisible();
    expect(screen.getByText("بیان تجربهٔ واقعی")).toBeVisible();
    expect(screen.getByText("ارائهٔ نتیجه‌های عددی")).toBeVisible();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("never falls back to the legacy information card while a completed report is being fetched", async () => {
    mocks.apiRequest.mockResolvedValue({
      companyName: "شرکت نمونه",
      title: "مدیر محصول",
      deadline: new Date(Date.now() - 3_600_000).toISOString(),
      status: "completed",
      questions: ["از تجربه‌ات بگو."],
      answers: ["پاسخ ثبت‌شده"],
      replies: ["ممنون"],
      clarifications: [],
      feedbackShared: false,
      report: null,
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("status")).toHaveTextContent("در حال دریافت گزارش مصاحبه");
    expect(screen.getByRole("heading", { name: "مصاحبهٔ مدیر محصول" })).toBeVisible();
    expect(screen.queryByText(/پاسخ‌ها با هوش مصنوعی تحلیل می‌شوند/)).toBeNull();
    expect(document.querySelector("header")).toBeNull();
  });

  it("hides empty strengths and improvement sections from invited reports", async () => {
    mocks.apiRequest.mockResolvedValue({
      companyName: "شرکت نمونه",
      title: "مدیر محصول",
      deadline: new Date(Date.now() - 3_600_000).toISOString(),
      status: "completed",
      questions: ["از تجربه‌ات بگو."],
      answers: ["پاسخ ثبت‌شده"],
      replies: ["ممنون"],
      clarifications: [],
      feedbackShared: true,
      report: {
        score: 0,
        summary: "گزارش بر اساس پاسخ‌های ثبت‌شده آماده شد.",
        strengths: [],
        improvements: [],
      },
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("region", { name: "نتیجه مصاحبه" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "نقاط قوت تو" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "فرصت‌های بهتر شدن" })).toBeNull();
    expect(screen.queryByText(/هنوز قوت مشخصی/)).toBeNull();
    expect(screen.queryByText(/نکتهٔ بهبود مشخصی/)).toBeNull();
  });

  it("hides employer feedback until sharing is explicitly approved", async () => {
    mocks.apiRequest.mockResolvedValue({
      companyName: "شرکت نمونه",
      title: "مدیر محصول",
      deadline: new Date(Date.now() - 3_600_000).toISOString(),
      status: "completed",
      questions: ["از تجربه‌ات بگو."],
      answers: ["پاسخ ثبت‌شده"],
      replies: ["ممنون"],
      clarifications: [],
      feedbackShared: false,
      reportReady: true,
      report: null,
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "مصاحبهٔ تو تکمیل شد" })).toBeVisible();
    expect(screen.getByLabelText("وضعیت مصاحبه: تکمیل‌شده، نتیجه خصوصی است")).toBeVisible();
    expect(screen.queryByLabelText(/امتیاز مصاحبه/)).toBeNull();
    expect(screen.queryByRole("heading", { name: "نقاط قوت تو" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "فرصت‌های بهتر شدن" })).toBeNull();
    expect(screen.queryByText("بیان تجربهٔ واقعی")).toBeNull();
    expect(screen.queryByText("ارائهٔ نتیجه‌های عددی")).toBeNull();
  });

  it("shows the interviewer's closing message before submitting the report", async () => {
    mocks.apiRequest.mockImplementation(async (url: string) => {
      if (url === "/api/employer/interviews/invite-token")
        return {
          companyName: "شرکت نمونه",
          title: "مدیر محصول",
          deadline: new Date(Date.now() + 3_600_000).toISOString(),
          status: "started",
          questions: ["از تصمیم فنی‌ات بگو."],
          answers: [],
          replies: [],
          clarifications: [],
        };
      if (url.endsWith("/turn"))
        return {
          questions: ["از تصمیم فنی‌ات بگو."],
          answers: ["یک راهکار را با تیم سنجیدم و نتیجه را بررسی کردیم."],
          replies: ["ممنون از توضیح تصمیم فنی و همکاری‌ات. گفت‌وگو به پایان رسید."],
          complete: true,
        };
      return {};
    });
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /ورود به تمام‌صفحه و ادامه/ }));
    fireEvent.change(await screen.findByRole("textbox", { name: "پاسخ تو" }), {
      target: { value: "یک راهکار را با تیم سنجیدم و نتیجه را بررسی کردیم." },
    });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("ممنون از توضیح تصمیم فنی و همکاری‌ات. گفت‌وگو به پایان رسید.")).toBeVisible();
    expect(mocks.apiRequest).not.toHaveBeenCalledWith(
      "/api/employer/interviews/invite-token/complete",
      expect.anything(),
    );
    fireEvent.click(screen.getByRole("button", { name: "ثبت نتیجه و پایان" }));
    await waitFor(() =>
      expect(mocks.apiRequest).toHaveBeenCalledWith(
        "/api/employer/interviews/invite-token/complete",
        expect.anything(),
      ),
    );
  });
});
