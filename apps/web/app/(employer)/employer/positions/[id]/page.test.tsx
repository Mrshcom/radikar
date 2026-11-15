import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  loading: false,
  extraCandidate: false,
  bankResumes: [] as Array<{
    id: string;
    fileName: string;
    hasOriginalFile: boolean;
    extractionError: string | null;
    name: string | null;
    specialty: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
    canDelete: boolean;
    positions: [];
  }>,
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
    name: null as string | null,
    phone: null as string | null,
    email: null,
    screeningStatus: "pending",
    invitationStatus: "not_invited",
    matchEvidence: null,
    interviewReport: null as {
      score: number;
      summary: string;
      strengths: string[];
      improvements: string[];
      topics?: Array<{ title: string; score: number; evidence: string }>;
    } | null,
    conversationQuestions: null as string[] | null,
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
  useEmployerResumeBank: () => ({ data: state.bankResumes, isLoading: false }),
  useEmployerPosition: () => ({
    data: state.loading
      ? undefined
      : {
          position: {
            title: "مهندس نرم‌افزار",
            companyName: "شرکت نمونه",
            description: "شرح پوزیشن",
            workflowStage: state.stage,
            reviewMethod: state.reviewMethod,
            screeningStatus: state.screeningStatus,
            screeningError: state.screeningError,
          },
          candidates: state.empty
            ? []
            : state.extraCandidate
              ? [state.candidate, { ...state.candidate, id: "candidate-2", fileName: "second-resume.pdf" }]
              : [state.candidate],
          costs: { screening: 14, interview: 84 },
        },
    isLoading: state.loading,
    error: null,
  }),
}));
vi.mock("@/lib/radicoins", () => ({
  useRadicoinWallet: () => ({ data: { wallet: { availableCoins: 0 } }, refetch: vi.fn() }),
}));
vi.mock("./resume-preview", () => ({ EmployerResumePreview: () => <div>پیش‌نمایش</div> }));
vi.mock("./resume-bank-preview", () => ({
  EmployerBankResumePreview: ({ resume }: { resume: { fileName: string } }) => <div>پیش‌نمایش {resume.fileName}</div>,
}));
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
    state.loading = false;
    state.extraCandidate = false;
    state.bankResumes = [];
    state.stage = 2;
    state.empty = false;
    state.reviewMethod = null;
    state.screeningStatus = "not_started";
    state.screeningError = null;
    state.requestedStep = "";
    state.candidate.invitationStatus = "not_invited";
    state.candidate.name = null;
    state.candidate.phone = null;
    state.candidate.interviewReport = null;
    state.candidate.conversationQuestions = null;
  });

  it("shows the dedicated workspace loading state before rendering any hiring step", () => {
    state.loading = true;

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("در حال آماده‌سازی فضای جذب");
    expect(screen.queryByRole("heading", { name: "افزودن رزومه‌ها" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "مراحل جذب برای این پوزیشن" })).toBeNull();
  });

  it("submits a position closure through the close endpoint", async () => {
    state.apiRequest.mockResolvedValue({ reward: 0 });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "بستن جذب" }));
    fireEvent.click(screen.getByRole("button", { name: "علت بستن جذب" }));
    fireEvent.click(screen.getByRole("option", { name: "نیاز سازمان تغییر کرد" }));
    fireEvent.click(screen.getByRole("button", { name: "بستن پوزیشن" }));

    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith("/api/employer/positions/position-1/close", {
        method: "POST",
        body: JSON.stringify({ reason: "changed_need", note: undefined, hiredCandidateId: undefined }),
      }),
    );
  });

  it("shows only the resume step until the employer continues", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    const fileName = screen.getByText("نام کارجو استخراج نشده است");
    const pageTitle = screen.getByRole("heading", { name: "مهندس نرم‌افزار", level: 1 });
    expect(pageTitle.parentElement?.querySelector("p")).toBeNull();
    const headerActions = screen.getByRole("link", { name: "ویرایش پوزیشن" }).parentElement;
    expect(headerActions?.firstElementChild).toHaveTextContent("در انتظار پایش");
    expect(screen.getByRole("button", { name: "بستن جذب" })).toBeVisible();
    const row = fileName.closest('[dir="rtl"]');
    expect(row).toHaveClass("grid-cols-[minmax(0,1fr)_auto]");
    expect(row?.firstElementChild).toContainElement(fileName);
    const workflow = screen.getByRole("navigation", { name: "مراحل جذب برای این پوزیشن" });
    expect(workflow).toBeVisible();
    expect(workflow.querySelector("ol > li > span[aria-hidden='true']")).toHaveClass(
      "right-[calc(50%+20px)]",
      "left-[calc(-50%+20px)]",
    );
    expect(screen.queryByText("مرحلهٔ ۲ از ۴")).toBeNull();
    expect(screen.getByRole("heading", { name: "افزودن رزومه‌ها" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "روش بررسی رزومه‌ها" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "دعوت به مصاحبه" })).toBeNull();
    expect(screen.getByRole("button", { name: /مرحلهٔ بعد/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /انتخاب و دعوت/ })).toBeDisabled();
  });

  it("uses a focused bank-resume call to action in the resume step", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /انتخاب از بانک رزومه/ }));

    expect(screen.getByRole("heading", { name: "رزومه‌های آماده در بانک" })).toBeVisible();
    expect(screen.getByText(/ظرفیت باقی‌مانده: ۹۹ رزومه/)).toBeVisible();
    expect(screen.getByRole("button", { name: /جست‌وجو و انتخاب رزومه‌ها/ })).toBeVisible();
  });

  it("keeps the bank picker compact and supports selecting all visible resumes and previewing one", () => {
    state.bankResumes = [
      {
        id: "bank-1",
        fileName: "bank-first.pdf",
        hasOriginalFile: true,
        extractionError: null,
        name: "علی اکبری",
        specialty: "Backend Developer",
        email: null,
        phone: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        canDelete: true,
        positions: [],
      },
      {
        id: "bank-2",
        fileName: "bank-second.pdf",
        hasOriginalFile: true,
        extractionError: null,
        name: "مریم رضایی",
        specialty: "Product Manager",
        email: null,
        phone: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        canDelete: true,
        positions: [],
      },
    ];

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /انتخاب از بانک رزومه/ }));
    fireEvent.click(screen.getByRole("button", { name: /جست‌وجو و انتخاب رزومه‌ها/ }));
    const picker = screen.getByRole("dialog", { name: "انتخاب از بانک رزومه" });
    expect(picker).toHaveClass("!max-w-[750px]");
    fireEvent.click(screen.getByRole("checkbox", { name: "انتخاب همه رزومه‌های نمایش‌داده‌شده" }));
    expect(picker).toHaveTextContent(/[۲2] انتخاب‌شده/);
    fireEvent.click(screen.getByRole("button", { name: "نمایش رزومه علی اکبری" }));
    expect(screen.getByText("پیش‌نمایش bank-first.pdf")).toBeVisible();
  });

  it("selects a bank resume by clicking its card, while the preview action does not change selection", () => {
    state.bankResumes = [
      {
        id: "bank-1",
        fileName: "bank-first.pdf",
        hasOriginalFile: true,
        extractionError: null,
        name: "علی اکبری",
        specialty: "Backend Developer",
        email: null,
        phone: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        canDelete: true,
        positions: [],
      },
    ];

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /انتخاب از بانک رزومه/ }));
    fireEvent.click(screen.getByRole("button", { name: /جست‌وجو و انتخاب رزومه‌ها/ }));
    fireEvent.click(screen.getByText("علی اکبری"));
    expect(screen.getByRole("checkbox", { name: "انتخاب علی اکبری" })).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "نمایش رزومه علی اکبری" }));
    expect(screen.getByText("پیش‌نمایش bank-first.pdf")).toBeVisible();
  });

  it("removes selected resumes together after confirmation", async () => {
    state.extraCandidate = true;
    state.apiRequest.mockResolvedValue({ count: 2 });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "حذف گروهی" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "انتخاب همه رزومه‌های قابل حذف" }));
    expect(screen.getByText("۲ رزومه انتخاب شده")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "حذف انتخاب‌شده‌ها" }));
    expect(screen.getByRole("dialog", { name: "تأیید حذف رزومه‌ها" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "حذف ۲ رزومه" }));

    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith("/api/employer/positions/position-1/resumes", {
        method: "DELETE",
        body: JSON.stringify({ candidateIds: ["candidate-1", "candidate-2"] }),
      }),
    );
  });

  it("labels an unsent invite accurately and saves a missing mobile through the modal", async () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.candidate.invitationStatus = "invited";
    state.apiRequest.mockImplementation(async (_path: string, request?: RequestInit) => {
      if (request?.method === "PATCH") {
        state.candidate.phone = JSON.parse(String(request.body)).phone;
        return { candidateId: state.candidate.id, phone: state.candidate.phone };
      }
      return {};
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/دعوت ارسال شد/)).toBeVisible();
    expect(screen.queryByText("دعوت شد")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "افزودن شماره همراه" }));
    const modal = screen.getByRole("dialog", { name: "افزودن شماره همراه" });
    const phoneInput = screen.getByRole("textbox", { name: "شماره همراه نامزد" });
    fireEvent.change(phoneInput, { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره شماره همراه" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("شماره همراه معتبر وارد کن.");
    expect(state.apiRequest).not.toHaveBeenCalled();
    fireEvent.change(phoneInput, { target: { value: "۰۹۱۲ ۳۴۵ ۶۷۸۹" } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره شماره همراه" }));
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/resumes/candidate-1/contact",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify({ phone: "09123456789" }) }),
      ),
    );
    await waitFor(() => expect(modal).not.toBeInTheDocument());
    expect(screen.getByText("09123456789")).toBeVisible();
    expect(screen.getByText(/دعوت ارسال شد/)).toBeVisible();
  });

  it("prefills and edits an existing candidate mobile number", async () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.candidate.invitationStatus = "expired";
    state.candidate.phone = "09158135580";
    state.apiRequest.mockImplementation(async (_path: string, request?: RequestInit) => {
      const phone = JSON.parse(String(request?.body)).phone;
      state.candidate.phone = phone;
      return { candidateId: state.candidate.id, phone };
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "ویرایش شماره همراه resume-sample.pdf" }));
    expect(screen.getByRole("dialog", { name: "ویرایش شماره همراه" })).toBeVisible();
    const phoneInput = screen.getByRole("textbox", { name: "شماره همراه نامزد" });
    expect(phoneInput).toHaveValue("09158135580");
    fireEvent.change(phoneInput, { target: { value: "۰۹۱۲ ۳۴۵ ۶۷۸۹" } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));

    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/resumes/candidate-1/contact",
        expect.objectContaining({ method: "PATCH", body: JSON.stringify({ phone: "09123456789" }) }),
      ),
    );
    await waitFor(() => expect(screen.getByText("09123456789")).toBeVisible());
  });

  it("keeps the mobile edit action available after an invitation has started", () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.candidate.invitationStatus = "started";
    state.candidate.phone = "09158135580";

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "ویرایش شماره همراه resume-sample.pdf" })).toBeVisible();
  });

  it("keeps an employer interview result collapsed until it is requested", () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.candidate.invitationStatus = "completed";
    state.candidate.phone = "09158135580";
    state.candidate.interviewReport = {
      score: 86,
      summary: "خلاصهٔ گزارش نباید به‌صورت بنر نمایش داده شود.",
      strengths: ["تحلیل داده"],
      improvements: ["مثال بیشتر"],
      topics: [{ title: "سنجش موفقیت محصول", score: 86, evidence: "نرخ فعال‌سازی" }],
    };
    state.candidate.conversationQuestions = ["موفقیت محصول را چگونه می‌سنجید؟"];

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    const resultButton = screen.getByRole("button", { name: "نمایش نتیجه" });
    expect(resultButton).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("interview-report-candidate-1")).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(resultButton);
    expect(resultButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "نتیجهٔ مصاحبه resume-sample.pdf" })).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText("نقاط قوت کارجو")).toBeVisible();
    expect(screen.getByText("سنجش موفقیت محصول")).toBeVisible();
    expect(screen.queryByText("گزارش مصاحبهٔ شغلی")).toBeNull();
  });

  it("shows only the candidate name in the manual invitation card", () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.candidate.name = "محمدرضا عباس‌زاده";
    state.candidate.phone = "09158135580";

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("محمدرضا عباس‌زاده")).toBeVisible();
    expect(screen.queryByText("resume-sample.pdf")).toBeNull();
  });

  it("does not allow selecting a candidate without a mobile number for an interview invitation", () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("checkbox", { name: "انتخاب resume-sample.pdf" })).toBeDisabled();
    expect(screen.getByText(/پیش از انتخاب و ساخت دعوت، شماره را اضافه کن/)).toBeVisible();
  });

  it("resends an expired manual invitation with a fresh deadline", async () => {
    state.stage = 4;
    state.reviewMethod = "manual";
    state.candidate.invitationStatus = "expired";
    state.candidate.phone = "09123456789";
    state.apiRequest.mockResolvedValue({
      candidateId: "candidate-1",
      name: null,
      url: "http://web.test/interview-invites/new-token",
      delivery: "sms_sent",
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <EmployerPositionPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/مهلت گذشته/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /ارسال مجدد لینک دعوت/ }));
    expect(screen.getByRole("dialog", { name: "ارسال مجدد دعوت مصاحبه" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "تاریخ مهلت تازه" }));
    fireEvent.click(screen.getByRole("button", { name: "ساعت مهلت تازه (به وقت تهران)" }));
    fireEvent.click(screen.getByRole("button", { name: "تأیید و ارسال مجدد" }));

    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/invitations/candidate-1/link",
        {
          method: "POST",
          body: JSON.stringify({ deadline: "2030-12-31T20:29:00.000Z" }),
        },
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "ارسال مجدد دعوت مصاحبه" })).not.toBeInTheDocument(),
    );
  });

  it("uploads selected resumes immediately without a second confirmation", async () => {
    let finishUpload: ((value: { count: number }) => void) | undefined;
    state.apiRequest.mockImplementation(
      () =>
        new Promise<{ count: number }>((resolve) => {
          finishUpload = resolve;
        }),
    );
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
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1/resumes",
        expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
      ),
    );
    expect(screen.getByRole("status")).toHaveTextContent("در حال افزودن رزومه‌ها...");
    expect(screen.queryByText("another.pdf")).toBeNull();
    finishUpload?.({ count: 1 });
    expect(screen.queryByRole("button", { name: "افزودن ۱ رزومه" })).not.toBeInTheDocument();
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
