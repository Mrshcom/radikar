import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ value: "invite-token" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/api-client", () => ({ apiRequest: mocks.apiRequest }));

import InvitedInterview from "./invited-interview";

describe("invited interview conversation", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
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

  it("answers clarification in place and then continues with a contextual question", async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InvitedInterview />
      </QueryClientProvider>,
    );
    fireEvent.click(await screen.findByRole("button", { name: /ورود به تمام‌صفحه و ادامه/ }));
    const input = await screen.findByRole("textbox", { name: "پاسخ تو" });
    fireEvent.change(input, { target: { value: "یعنی کدام پروژه؟" } });
    fireEvent.click(screen.getByRole("button", { name: "از مصاحبه‌گر بپرس" }));
    expect(await screen.findByText("یک پروژهٔ واقعی از تجربهٔ خودت را انتخاب کن.")).toBeVisible();
    expect(screen.getByText("از تجربهٔ تیمی‌ات بگو.")).toBeVisible();
    fireEvent.change(input, { target: { value: "در یک تیم محصول سه نفره کار کردم." } });
    fireEvent.click(screen.getByRole("button", { name: "ارسال پاسخ" }));
    expect(await screen.findByText("در همان تیم، اختلاف نظر را چگونه حل کردی؟")).toBeVisible();
    expect(screen.getByText("به تیم سه نفره اشاره کردی؛ نقش خودت را بهتر می‌شناسیم.")).toBeVisible();
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
    expect(mocks.apiRequest).not.toHaveBeenCalledWith("/api/employer/interviews/invite-token/complete", expect.anything());
    fireEvent.click(screen.getByRole("button", { name: "ثبت نتیجه و پایان" }));
    await waitFor(() =>
      expect(mocks.apiRequest).toHaveBeenCalledWith("/api/employer/interviews/invite-token/complete", expect.anything()),
    );
  });
});
