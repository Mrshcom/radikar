import { render, screen, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/employer", () => ({
  useEmployerProfile: () => ({
    data: { profile: { companyName: "شرکت نمونه" } },
    isLoading: false,
    error: null,
  }),
  useEmployerPositions: () => ({
    data: [
      {
        id: "position-1",
        companyName: "شرکت نمونه",
        title: "مهندس نرم‌افزار",
        description: "شرح موقعیت",
        screeningStatus: "not_started",
        createdAt: "2026-10-30T08:00:00.000Z",
      },
      {
        id: "position-2",
        companyName: "شرکت نمونه",
        title: "مدیر محصول",
        description: "شرح موقعیت",
        screeningStatus: "completed",
        createdAt: "2026-10-29T08:00:00.000Z",
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

import EmployerDashboard from "./employer-dashboard";

describe("EmployerDashboardPage", () => {
  it("uses the candidate dashboard visual hierarchy with employer actions and live position states", () => {
    render(<EmployerDashboard />);

    expect(screen.getByRole("heading", { level: 1, name: "داشبورد شرکت نمونه" })).toBeVisible();
    expect(screen.getByRole("banner").querySelector("div")?.firstElementChild?.tagName).toBe("H1");
    expect(screen.queryByRole("link", { name: /افزودن پوزیشن/ })).toBeNull();
    expect(document.querySelector('a[href="/employer/positions/new"]')).toBeNull();
    expect(screen.getByText("۲ پوزیشن در مسیر جذب داری")).toBeVisible();
    expect(screen.getByRole("link", { name: /ادامه فرایند جذب/ })).toHaveAttribute(
      "href",
      "/employer/positions/position-1",
    );

    const stats = screen.getByRole("region", { name: "آمار پوزیشن‌ها" });
    const totalCard = within(stats).getByText("کل پوزیشن‌ها").closest("article");
    const completedCard = within(stats).getByText("پایش تکمیل").closest("article");
    expect(within(totalCard!).getByText("۲")).toBeVisible();
    expect(within(completedCard!).getByText("۱")).toBeVisible();
    expect(screen.getByRole("heading", { name: "آخرین پوزیشن‌ها" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "مسیر جذب در رادیکار" })).toBeVisible();
    expect(screen.getByRole("link", { name: "خرید رادیکوین" })).toHaveAttribute("href", "/radicoins/buy");
  });
});
