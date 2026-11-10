import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  stage: 2,
  empty: false,
  reviewMethod: null as "manual" | "smart" | null,
  screeningStatus: "not_started",
  screeningError: null as string | null,
  requestedStep: "",
  candidate: {
    id: "candidate-1",
    resumeBankId: null,
    fileName: "resume-sample.pdf",
    hasOriginalFile: true,
    name: null,
    phone: null,
    email: null,
    screeningStatus: "pending",
    invitationStatus: "not_invited",
    matchEvidence: null,
  },
}));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiRequest: state.apiRequest,
}));
vi.mock("@/lib/employer", () => ({
  positionWorkflowBadge: () => ({ label: "در انتظار پایش", className: "bg-[#fff2dc] text-[#9a6b20]" }),
  positionScreeningBadge: {
    not_started: { label: "در انتظار پایش", className: "bg-[#fff2dc] text-[#9a6b20]" },
    processing: { label: "در حال پایش", className: "bg-[#e8f0fb] text-[#5278a5]" },
    completed: { label: "پایش کامل", className: "bg-[#e5f4ec] text-[#0f7b62]" },
    failed: { label: "پایش ناموفق", className: "bg-[#fff0ed] text-[#b2513e]" },
  },
  employerKeys: { position: (id: string) => ["employer", "positions", id], resumeBank: ["employer", "resume-bank"] },
  useEmployerResumeBank: () => ({ data: [], isLoading: false }),
  useEmployerPosition: () => ({
    data: {
      position: {
        title: "مهندس نرم‌افزار",
        companyName: "شرکت نمونه",
        description: "شرح پوزیشن",
        workflowStage: state.stage,
        reviewMethod: state.reviewMethod,
        screeningStatus: state.screeningStatus,
        screeningError: state.screeningError,
      },
      candidates: state.empty ? [] : [state.candidate],
      costs: { screening: 5, interview: 5 },
    },
    isLoading: false,
    error: null,
  }),
}));
vi.mock("@/lib/radicoins", () => ({
  useRadicoinWallet: () => ({ data: { wallet: { availableCoins: 0 } }, refetch: vi.fn() }),
}));
vi.mock("./resume-preview", () => ({ EmployerResumePreview: () => <div>پیش‌نمایش</div> }));
vi.mock("@/app/(panel)/_components/jalali-date-picker", () => ({
  JalaliDatePicker: ({ onChange, ariaLabel }: { onChange: (value: string) => void; ariaLabel: string }) => (
    <button type="button" aria-label={ariaLabel} onClick={() => onChange("2030-12-31")}>
      انتخاب تاریخ شمسی
    </button>
  ),
}));
vi.mock("@/app/(panel)/_components/time-picker", () => ({
  TimePicker: ({ onChange, ariaLabel }: { onChange: (value: string) => void; ariaLabel: string }) => (
    <button type="button" aria-label={ariaLabel} onClick={() => onChange("23:59")}>
      انتخاب ساعت
    </button>
  ),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "position-1" }),
  useSearchParams: () => new URLSearchParams(state.requestedStep),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import EmployerPositionPage from "./page";

describe("employer position detail", () => {
  beforeEach(() => {
    state.apiRequest.mockReset();
    state.stage = 2;
    state.empty = false;
    state.reviewMethod = null;
    state.screeningStatus = "not_started";
    state.screeningError = null;
    state.requestedStep = "";
    state.candidate.invitationStatus = "not_invited";
  });

  it("shows only the resume step until the employer continues", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    const fileName = screen.getAllByText("resume-sample.pdf")[0];
    const pageTitle = screen.getByRole("heading", { name: "مهندس نرم‌افزار", level: 1 });
    expect(pageTitle.parentElement?.querySelector("p")).toBeNull();
    const headerActions = screen.getByRole("link", { name: "ویرایش پوزیشن" }).parentElement;
    expect(headerActions?.firstElementChild).toHaveTextContent("در انتظار پایش");
    expect(headerActions?.lastElementChild).toHaveTextContent("ویرایش پوزیشن");
    const row = fileName.closest('[dir="rtl"]');
    expect(row).toHaveClass("grid-cols-[minmax(0,1fr)_auto]");
    expect(row?.firstElementChild).toContainElement(fileName);
    expect(screen.getByRole("navigation", { name: "مراحل جذب برای این پوزیشن" })).toBeVisible();
    expect(screen.queryByText("مرحلهٔ ۲ از ۴")).toBeNull();
    expect(screen.getByRole("heading", { name: "افزودن رزومه‌ها" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "روش بررسی رزومه‌ها" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "دعوت به مصاحبه" })).toBeNull();
    expect(screen.getByRole("button", { name: /مرحلهٔ بعد/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /انتخاب و دعوت/ })).toBeDisabled();
  });

  it("uploads only after explicit confirmation", async () => {
    state.apiRequest.mockResolvedValue({ count: 2 });
    const view = render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    const input = view.container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["resume"], "another.pdf", { type: "application/pdf" });
    const files = Object.create(FileList.prototype) as FileList;
    Object.defineProperty(files, "0", { value: file });
    Object.defineProperty(files, "length", { value: 1 });
    Object.defineProperty(files, Symbol.iterator, {
      value: function* () {
        yield file;
      },
    });
    fireEvent.change(input, { target: { files } });
    expect(state.apiRequest).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "افزودن ۱ رزومه" }));
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/resumes",
        expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
      ),
    );
  });

  it("keeps later steps locked until at least one resume exists", () => {
    state.stage = 3;
    state.empty = true;
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: /مرحلهٔ بعد/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /روش بررسی/ })).toBeDisabled();
    expect(screen.getByText(/دست‌کم یک رزومه اضافه کن/)).toBeVisible();
  });

  it("uses the Jalali picker and sends the selected Tehran deadline as ISO", async () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.apiRequest.mockResolvedValue({ invitations: [] });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "انتخاب resume-sample.pdf" }));
    fireEvent.click(screen.getByRole("button", { name: "تاریخ مهلت شرکت در مصاحبه" }));
    fireEvent.click(screen.getByLabelText("ساعت مهلت (به وقت تهران)"));
    fireEvent.click(screen.getByRole("button", { name: "تأیید و ساخت لینک دعوت" }));
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/invitations",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ candidateIds: ["candidate-1"], deadline: "2030-12-31T20:29:00.000Z" }),
        }),
      ),
    );
  });

  it("opens the same resume preview while selecting candidates manually", () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    const candidateCheckbox = screen.getByRole("checkbox", { name: "انتخاب resume-sample.pdf" });
    expect(candidateCheckbox).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "پیش‌نمایش رزومه resume-sample.pdf" }));
    expect(screen.getByText("پیش‌نمایش")).toBeVisible();
    expect(candidateCheckbox).not.toBeChecked();
  });

  it("offers a real review-method choice before showing candidates", async () => {
    state.stage = 3;
    state.apiRequest.mockResolvedValue({ reviewMethod: "manual", workflowStage: 4 });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "روش بررسی رزومه‌ها" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "دعوت به مصاحبه" })).toBeNull();
    expect(screen.queryByRole("button", { name: /شروع پایش/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /بررسی دستی · رایگان/ }));
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/review-method",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ method: "manual" }) }),
      ),
    );
  });

  it("keeps an old screening failure hidden when opening the step", () => {
    state.stage = 3;
    state.reviewMethod = "smart";
    state.screeningStatus = "failed";
    state.screeningError = "پایش برخی رزومه‌ها ناموفق بود؛ هزینه‌ای کسر نشد.";
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: /پایش هوشمند/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("پایش کامل نشد")).toBeNull();
    expect(screen.getByRole("button", { name: "تلاش دوباره برای پایش" })).toBeEnabled();
  });

  it("allows switching from failed smart screening to manual review", async () => {
    state.stage = 3;
    state.reviewMethod = "smart";
    state.screeningStatus = "failed";
    state.screeningError = "پایش برخی رزومه‌ها ناموفق بود؛ هزینه‌ای کسر نشد.";
    state.apiRequest
      .mockRejectedValueOnce(new Error("خطای پایش تازه"))
      .mockResolvedValue({ reviewMethod: "manual", workflowStage: 4 });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره برای پایش" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("خطای پایش تازه"));
    const manualButton = screen.getByRole("button", { name: /بررسی دستی · رایگان/ });
    expect(manualButton).toBeEnabled();
    fireEvent.click(manualButton);
    expect(screen.queryByText("پایش کامل نشد")).toBeNull();
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/review-method",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ method: "manual" }) }),
      ),
    );
  });

  it("clears a screening error when changing steps and shows only a new failure after retry", async () => {
    state.stage = 3;
    state.reviewMethod = "smart";
    state.screeningStatus = "failed";
    state.screeningError = "خطای پایش قبلی";
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(screen.queryByText("خطای پایش قبلی")).toBeNull();
    state.apiRequest.mockRejectedValueOnce(new Error("خطای پایش قبلی"));
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره برای پایش" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("خطای پایش قبلی"));
    fireEvent.click(screen.getByRole("button", { name: /مرحلهٔ قبل/ }));
    fireEvent.click(screen.getByRole("button", { name: /مرحلهٔ بعد/ }));
    expect(screen.queryByText("پایش کامل نشد")).toBeNull();
    expect(screen.getByRole("button", { name: "تلاش دوباره برای پایش" })).toBeEnabled();
    state.apiRequest.mockRejectedValueOnce(new Error("خطای پایش تازه"));
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره برای پایش" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("خطای پایش تازه"));
  });

  it("allows switching between completed steps without resetting the saved stage", () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "دعوت به مصاحبه" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /مرحلهٔ قبل/ }));
    expect(screen.getByRole("heading", { name: "روش بررسی رزومه‌ها" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "دعوت به مصاحبه" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /مرحلهٔ بعد/ }));
    expect(screen.getByRole("heading", { name: "دعوت به مصاحبه" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /تعریف پوزیشن/ }));
    expect(screen.getByRole("heading", { name: "اطلاعات پوزیشن" })).toBeVisible();
    expect(state.apiRequest).not.toHaveBeenCalled();
  });

  it("allows changing manual review to smart screening after an invitation was created", async () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.candidate.invitationStatus = "invited";
    state.apiRequest.mockResolvedValue({ reviewMethod: "smart" });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /مرحلهٔ قبل/ }));
    const smartOption = screen.getByRole("button", { name: /انتخاب پایش هوشمند/ });
    expect(smartOption).toBeEnabled();
    fireEvent.click(smartOption);
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/review-method",
        expect.objectContaining({ method: "POST", body: JSON.stringify({ method: "smart" }) }),
      ),
    );
    expect(screen.getByRole("heading", { name: "روش بررسی رزومه‌ها" })).toBeVisible();
  });

  it("opens the requested wizard step from the edit page", () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.requestedStep = "step=2";
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "افزودن رزومه‌ها" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "دعوت به مصاحبه" })).toBeNull();
  });
});
