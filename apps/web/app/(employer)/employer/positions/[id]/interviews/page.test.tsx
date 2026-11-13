import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ shareFeedback: vi.fn() }));

vi.mock("next/navigation", () => ({ useParams: () => ({ id: "position-1" }) }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/lib/employer", () => ({
  useSetEmployerInterviewFeedbackSharing: () => ({
    mutate: mocks.shareFeedback,
    isPending: false,
    error: null,
  }),
  useEmployerPosition: () => ({
    data: {
      position: { title: "مدیر محصول", interviewQuestions: ["چگونه موفقیت محصول را می‌سنجید؟"] },
      candidates: [
        {
          id: "invited",
          name: "نامزد منتظر",
          fileName: "waiting.pdf",
          invitationStatus: "invited",
          invitationDeadline: "2030-12-31T20:00:00.000Z",
          interviewReport: null,
          interviewFeedbackSharedAt: null,
          interviewAnswers: null,
        },
        {
          id: "started",
          name: "نامزد در حال مصاحبه",
          fileName: "started.pdf",
          invitationStatus: "started",
          invitationDeadline: "2030-12-31T20:00:00.000Z",
          interviewReport: null,
          interviewFeedbackSharedAt: null,
          interviewAnswers: ["پاسخ اول"],
        },
        {
          id: "completed",
          name: "نامزد تکمیل‌شده",
          fileName: "completed.pdf",
          invitationStatus: "completed",
          invitationDeadline: "2030-12-31T20:00:00.000Z",
          interviewReport: {
            score: 86,
            summary: "تحلیل مصاحبهٔ نامزد",
            strengths: ["تحلیل داده"],
            improvements: ["مثال بیشتر"],
            topics: [{ title: "سنجش موفقیت محصول", score: 86, evidence: "بررسی نرخ فعال‌سازی" }],
          },
          interviewFeedbackSharedAt: null,
          interviewAnswers: ["نرخ فعال‌سازی را بررسی می‌کنم."],
        },
      ],
    },
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import EmployerInterviewResultsPage from "./page";

beforeEach(() => {
  mocks.shareFeedback.mockReset();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

it("tracks invitations, participation and scores and opens the completed report", async () => {
  render(<EmployerInterviewResultsPage />);
  expect(screen.getByRole("heading", { name: "پیگیری مصاحبه‌ها" })).toBeVisible();
  expect(screen.getByText("دعوت ارسال‌شده").nextElementSibling).toHaveTextContent("۱");
  expect(screen.getByText("شرکت‌کرده در مصاحبه").nextElementSibling).toHaveTextContent("۲");
  expect(screen.getByText("مهلت‌گذشته").nextElementSibling).toHaveTextContent("۰");
  expect(screen.getByText("دعوت ارسال شد")).toBeVisible();
  expect(screen.getAllByText("شرکت کرده")).toHaveLength(2);
  expect(await screen.findByText("۸۶ از ۱۰۰")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "مشاهدهٔ گزارش نامزد تکمیل‌شده" }));
  expect(screen.getByRole("dialog", { name: "گزارش مصاحبهٔ نامزد تکمیل‌شده" })).toHaveTextContent(
    "سنجش موفقیت محصول",
  );
  expect(screen.getByText("تحلیل داده")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "تأیید و نمایش نتیجه" }));
  expect(mocks.shareFeedback).toHaveBeenCalledWith({ candidateId: "completed", shared: true });
  fireEvent.click(screen.getByRole("button", { name: "ارسال‌شده · ۱" }));
  expect(screen.getByText("نامزد منتظر")).toBeVisible();
  expect(screen.queryByText("نامزد در حال مصاحبه")).toBeNull();
});
