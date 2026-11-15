import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("position=position-1&invitation=invited"),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/table-page-size", () => ({
  tablePageSizes: [20, 50, 100],
  useUrlTablePagination: () => ({ page: 1, pageSize: 20, setPage: vi.fn(), setPageSize: vi.fn(), isSaving: false }),
}));
vi.mock("@/app/_components/toast", () => ({ useToast: () => vi.fn() }));
vi.mock("@/lib/employer", () => ({
  employerKeys: { resumeBank: ["employer", "resume-bank"] },
  useEmployerResumeBank: () => ({
    data: [
      {
        id: "resume-1",
        fileName: "one.pdf",
        name: "سارا",
        specialty: "توسعه‌دهنده",
        phone: null,
        email: null,
        hasOriginalFile: false,
        extractionError: null,
        createdAt: "2026-11-01T12:00:00Z",
        canDelete: false,
        positions: [
          {
            id: "candidate-1",
            positionId: "position-1",
            positionTitle: "مدیر محصول",
            invitationStatus: "completed",
            interviewScore: 82,
            invitationDeadline: null,
            updatedAt: "2026-11-02T12:00:00Z",
          },
          {
            id: "candidate-2",
            positionId: "position-2",
            positionTitle: "مدیر فروش",
            invitationStatus: "not_invited",
            interviewScore: null,
            invitationDeadline: null,
            updatedAt: "2026-11-02T12:00:00Z",
          },
        ],
      },
      {
        id: "resume-2",
        fileName: "two.pdf",
        name: "مریم",
        specialty: null,
        phone: null,
        email: null,
        hasOriginalFile: false,
        extractionError: null,
        createdAt: "2026-11-01T12:00:00Z",
        canDelete: false,
        positions: [
          {
            id: "candidate-3",
            positionId: "position-1",
            positionTitle: "مدیر محصول",
            invitationStatus: "not_invited",
            interviewScore: null,
            invitationDeadline: null,
            updatedAt: "2026-11-02T12:00:00Z",
          },
        ],
      },
    ],
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  }),
  useEmployerPosition: () => ({
    data: {
      position: { interviewQuestions: ["تجربهٔ شما چیست؟"] },
      candidates: [
        {
          id: "candidate-1",
          interviewReport: { score: 82, summary: "گزارش مصاحبه", strengths: ["تجربه"], improvements: [] },
          interviewAnswers: ["سه سال"],
        },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

import EmployerResumeBankPage from "./page";

describe("employer resume bank interviews", () => {
  it("opens the edit dialog for a resume that cannot be deleted", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerResumeBankPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "ویرایش اطلاعات سارا" }));

    expect(screen.getByRole("dialog", { name: "ویرایش اطلاعات رزومه" })).toBeVisible();
    expect(screen.getByDisplayValue("سارا")).toBeVisible();
  });

  it("filters invited resumes for the selected position and opens that interview report", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerResumeBankPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText("۱ از ۲ رزومه")).toBeVisible();
    expect(screen.queryByRole("columnheader", { name: "ایمیل" })).not.toBeInTheDocument();
    expect(screen.queryByText("مریم")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /مشاهده جزئیات ۱ دعوت مصاحبهٔ سارا/ }));
    expect(screen.getByRole("link", { name: "مدیر محصول" })).toHaveAttribute("href", "/employer/positions/position-1");
    expect(screen.queryByRole("link", { name: "مدیر فروش" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /نمره ۸۲/ }));
    expect(screen.getByRole("dialog", { name: "گزارش مصاحبهٔ سارا" })).toBeVisible();
    expect(screen.getByText("گزارش مصاحبه")).toBeVisible();
    expect(screen.getByText("سه سال")).toBeVisible();
  });
});
