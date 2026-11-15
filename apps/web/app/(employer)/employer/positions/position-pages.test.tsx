import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  push: vi.fn(),
  status: "not_started" as "not_started" | "completed",
}));

vi.mock("@/lib/api-client", () => ({ apiRequest: state.apiRequest }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push, replace: state.push }),
  useParams: () => ({ id: "position-1" }),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/employer", () => ({
  positionWorkflowBadge: () => ({ label: "در انتظار پایش", className: "bg-[#fff2dc] text-[#9a6b20]" }),
  positionScreeningBadge: {
    not_started: { label: "در انتظار پایش", className: "bg-[#fff2dc] text-[#9a6b20]" },
    processing: { label: "در حال پایش", className: "bg-[#e8f0fb] text-[#5278a5]" },
    completed: { label: "پایش کامل", className: "bg-[#e5f4ec] text-[#0f7b62]" },
    failed: { label: "پایش ناموفق", className: "bg-[#fff0ed] text-[#b2513e]" },
  },
  employerKeys: {
    profile: ["employer", "profile"],
    positions: ["employer", "positions"],
    position: (id: string) => ["employer", "positions", id],
  },
  useEmployerProfile: () => ({ data: { profile: { companyName: "شرکت نمونه" } }, isLoading: false, error: null }),
  useEmployerPositions: () => ({
    data: [
      {
        id: "position-1",
        companyName: "شرکت نمونه",
        title: "مهندس نرم‌افزار",
        description: "شرح شغل آزمایشی",
        screeningStatus: state.status,
      },
    ],
    isLoading: false,
    error: null,
  }),
  useEmployerPosition: () => ({
    data: {
      candidates: [],
      position: {
        id: "position-1",
        companyName: "شرکت نمونه",
        title: "مهندس نرم‌افزار",
        description:
          "توسعه و نگهداری سامانه با دانش جاوااسکریپت و تجربهٔ همکاری تیمی، تحلیل نیازمندی‌ها و مستندسازی دقیق فرایندها برای تیم محصول.",
        screeningStatus: state.status,
      },
    },
    isLoading: false,
    error: null,
  }),
}));

import EmployerPositionsPage from "./page";
import NewEmployerPositionPage from "./new/page";
import EditEmployerPositionPage from "./[id]/edit/page";
import { positionSchema } from "./_components/position-form";
import { positionScreeningBadge } from "@/lib/employer";

function renderPage(page: ReactNode) {
  return render(<QueryClientProvider client={new QueryClient()}>{page}</QueryClientProvider>);
}

describe("employer position pages", () => {
  beforeEach(() => {
    state.apiRequest.mockReset();
    state.push.mockReset();
    state.status = "not_started";
  });

  it("accepts a 10-character description but rejects shorter text", () => {
    expect(positionSchema.safeParse({ title: "مدیر محصول", description: "۱۲۳۴۵۶۷۸۹۰" }).success).toBe(true);
    expect(positionSchema.safeParse({ title: "مدیر محصول", description: "۱۲۳۴۵۶۷۸۹" }).success).toBe(false);
  });

  it("uses a distinct semantic tone for every position screening status", () => {
    expect(positionScreeningBadge.not_started).toMatchObject({
      label: "در انتظار پایش",
      className: "bg-[#fff2dc] text-[#9a6b20]",
    });
    expect(positionScreeningBadge.processing).toMatchObject({
      label: "در حال پایش",
      className: "bg-[#e8f0fb] text-[#5278a5]",
    });
    expect(positionScreeningBadge.completed).toMatchObject({
      label: "پایش کامل",
      className: "bg-[#e5f4ec] text-[#0f7b62]",
    });
    expect(positionScreeningBadge.failed).toMatchObject({
      label: "پایش ناموفق",
      className: "bg-[#fff0ed] text-[#b2513e]",
    });
  });

  it("keeps the position list separate from the create and edit forms", () => {
    renderPage(<EmployerPositionsPage />);
    expect(screen.getByRole("heading", { name: "پوزیشن‌های من" })).toBeVisible();
    expect(screen.getByRole("link", { name: /افزودن پوزیشن کاری/ })).toHaveAttribute("href", "/employer/positions/new");
    expect(screen.getByRole("link", { name: /ویرایش/ })).toHaveAttribute("href", "/employer/positions/position-1/edit");
    const actions = screen.getByRole("link", { name: /ویرایش/ }).parentElement;
    expect(actions).toHaveClass("w-full", "justify-between");
    expect(actions?.firstElementChild).toHaveTextContent("ویرایش");
    expect(actions?.lastElementChild).toHaveTextContent("ادامهٔ فرایند جذب");
    expect(screen.queryByLabelText("شرح موقعیت و شرایط موردنیاز")).toBeNull();
  });

  it("opens the recruitment workflow when the position card is clicked", () => {
    renderPage(<EmployerPositionsPage />);

    fireEvent.click(screen.getByRole("heading", { name: "مهندس نرم‌افزار" }).closest("article")!);

    expect(state.push).toHaveBeenCalledWith("/employer/positions/position-1");
  });

  it("keeps the edit action independent from the position card navigation", () => {
    renderPage(<EmployerPositionsPage />);

    const editLink = screen.getByRole("link", { name: /ویرایش/ });
    editLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(editLink);

    expect(state.push).not.toHaveBeenCalled();
  });

  it("shows the complete position description in the shared hover tooltip", async () => {
    renderPage(<EmployerPositionsPage />);

    const description = screen.getByText("شرح شغل آزمایشی");
    fireEvent.mouseEnter(description.parentElement!);

    expect(await screen.findByRole("tooltip")).toHaveTextContent("شرح شغل آزمایشی");
  });

  it("hides the edit action after the position is locked", () => {
    state.status = "completed";
    renderPage(<EmployerPositionsPage />);

    expect(screen.queryByRole("link", { name: /ویرایش/ })).toBeNull();
    expect(screen.getByRole("link", { name: /ادامهٔ فرایند جذب/ })).toBeVisible();
  });

  it("creates a position from its dedicated page", async () => {
    state.apiRequest.mockResolvedValue({ id: "created-position" });
    renderPage(<NewEmployerPositionPage />);
    expect(screen.queryByText("بعد از ثبت چه اتفاقی می‌افتد؟")).toBeNull();
    const nextStep = screen.getByRole("button", { name: /مرحلهٔ بعد/ });
    expect(nextStep).toHaveAttribute("form", "employer-position-create-form");
    expect(screen.getByRole("button", { name: /مرحلهٔ قبل/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("عنوان شغلی"), { target: { value: "مدیر محصول" } });
    fireEvent.change(screen.getByLabelText("شرح موقعیت و شرایط موردنیاز"), {
      target: {
        value:
          "شرح موقعیت شغلی شامل مسئولیت‌های محصول، تحلیل داده، همکاری تیمی و شرایط ضروری برای این موقعیت در شرکت نمونه است.",
      },
    });
    fireEvent.click(nextStep);
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() => expect(state.push).toHaveBeenCalledWith("/employer/positions/created-position"));
  });

  it("updates a position on its edit page but locks it after screening", async () => {
    state.apiRequest.mockResolvedValue({ id: "position-1" });
    const page = renderPage(<EditEmployerPositionPage />);
    expect(screen.getByLabelText("عنوان شغلی")).toHaveValue("مهندس نرم‌افزار");
    fireEvent.change(screen.getByLabelText("عنوان شغلی"), { target: { value: "مهندس ارشد نرم‌افزار" } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیرهٔ تغییرات" }));
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1",
        expect.objectContaining({ method: "PATCH" }),
      ),
    );
    page.unmount();
    state.status = "completed";
    renderPage(<EditEmployerPositionPage />);
    expect(screen.getByText("ویرایش این پوزیشن قفل شده است")).toBeVisible();
    expect(screen.queryByLabelText("عنوان شغلی")).toBeNull();
  });

  it("shows the same workflow navigation while editing the first step", () => {
    renderPage(<EditEmployerPositionPage />);
    expect(screen.getByRole("navigation", { name: "مراحل جذب برای این پوزیشن" })).toBeVisible();
    expect(screen.getByRole("button", { name: /مرحلهٔ قبل/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /مرحلهٔ بعد/ }));
    expect(state.push).toHaveBeenCalledWith("/employer/positions/position-1?step=2");
  });

  it("confirms and deletes an editable position from its edit page", async () => {
    state.apiRequest.mockResolvedValue({});
    renderPage(<EditEmployerPositionPage />);
    const deleteHeader = screen.getByRole("heading", { name: "حذف پوزیشن" }).parentElement;
    expect(deleteHeader).toHaveClass("justify-between");
    expect(deleteHeader).toContainElement(screen.getByRole("button", { name: "حذف پوزیشن" }));
    fireEvent.click(screen.getByRole("button", { name: "حذف پوزیشن" }));
    expect(screen.getByText(/این پوزیشن و همهٔ رزومه/)).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "بله، حذف شود" }));
    await waitFor(() =>
      expect(state.apiRequest).toHaveBeenCalledWith(
        "/api/employer/positions/position-1",
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
    await waitFor(() => expect(state.push).toHaveBeenCalledWith("/employer/positions"));
  });
});
