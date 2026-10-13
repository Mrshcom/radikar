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
vi.mock("@/app/_components/auth", () => ({
  useAuth: () => ({ user: { fullName: "کاربر آزمایشی", phone: "۰۹۱۲۳۴۵۶۷۸۹" } }),
}));
vi.mock("@/lib/billing", () => ({
  useMembership: () => ({ data: { plan: { name: "حرفه‌ای" } }, isPending: false }),
}));
vi.mock("@/lib/radicoins", () => ({
  useRadicoinWallet: () => ({ data: { wallet: { availableCoins: 240 } }, isPending: false }),
}));

import AccountCenterPage from "./page";

describe("AccountCenterPage", () => {
  it("groups links to unchanged account, billing, security, and reward pages", () => {
    const { container } = render(<AccountCenterPage />);

    expect(screen.getByRole("heading", { level: 1, name: "مرکز حساب" })).toBeVisible();
    expect(screen.getByRole("banner").firstElementChild?.tagName).toBe("H1");
    expect(screen.getByText("حرفه‌ای")).toBeVisible();
    expect(screen.getByText("۲۴۰")).toBeVisible();
    expect(screen.getByText("کاربر آزمایشی")).toBeVisible();
    expect(container.querySelector('img[src*="radikar-mascot-account-center-v1.png"]')).not.toBeNull();

    const account = screen.getByRole("heading", { name: "حساب و امنیت" }).closest("section");
    const billing = screen.getByRole("heading", { name: "خرید و اعتبار" }).closest("section");
    const rewards = screen.getByRole("heading", { name: "دعوت و پاداش" }).closest("section");
    expect(account).not.toBeNull();
    expect(billing).not.toBeNull();
    expect(rewards).not.toBeNull();

    expect(within(account!).getByRole("link", { name: /اطلاعات حساب و مصرف/ })).toHaveAttribute("href", "/account");
    expect(within(account!).getByRole("link", { name: /تنظیمات، نشست‌ها و ورودها/ })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(within(billing!).getByRole("link", { name: /سفارش‌ها و پرداخت‌ها/ })).toHaveAttribute("href", "/orders");
    expect(within(billing!).queryByRole("link", { name: /کیف پول رادیکوین/ })).not.toBeInTheDocument();
    expect(within(billing!).getByText("۲ بخش")).toBeVisible();
    expect(screen.getByRole("link", { name: /مشاهدهٔ کیف پول/ })).toHaveAttribute("href", "/radicoins");
    expect(within(billing!).getByRole("link", { name: /مشاهده و ارتقای پلن/ })).toHaveAttribute("href", "/upgrade");
    expect(within(rewards!).getByRole("link", { name: /دعوت از دوستان/ })).toHaveAttribute("href", "/referrals");
    expect(within(rewards!).getByRole("link", { name: /تاریخچهٔ پاداش‌های رادیکوین/ })).toHaveAttribute(
      "href",
      "/radicoins",
    );

    const radicoinMark = 'path[d^="M7.5 15.8"]';
    const walletCard = screen.getByText("موجودی رادیکوین").closest("section");
    const rewardHistory = within(rewards!).getByRole("link", { name: /تاریخچهٔ پاداش‌های رادیکوین/ });
    expect(walletCard?.querySelector(radicoinMark)).not.toBeNull();
    expect(rewardHistory.querySelector(radicoinMark)).not.toBeNull();
  });
});
