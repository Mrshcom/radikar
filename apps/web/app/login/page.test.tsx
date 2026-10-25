import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest, notify, prefetch, replace } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  notify: vi.fn(),
  prefetch: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ apiRequest }));
vi.mock("@/app/_components/toast", () => ({ useToast: () => notify }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ prefetch, replace }) }));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation((path: string) => {
      if (path === "/api/auth/providers") return Promise.resolve({ google: false });
      if (path === "/api/auth/request-otp")
        return Promise.resolve({ challengeId: "challenge-1", expiresInSeconds: 120, deliveryMode: "console" });
      if (path === "/api/auth/verify-otp") return Promise.resolve({ user: { id: "user-1", role: "user" } });
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });
  });

  it("shows a non-interactive panel transition immediately after OTP succeeds", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LoginPage />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("09123456789"), { target: { value: "09123456789" } });
    fireEvent.click(screen.getByRole("button", { name: "دریافت کد ورود" }));
    await screen.findByRole("button", { name: "تأیید و ورود" });
    expect(screen.getByText("کد ۶ رقمی ورود برای ۰۹۱۲۳۴۵۶۷۸۹ را وارد کن.")).toBeInTheDocument();
    expect(notify).toHaveBeenCalledWith("کد ورود آماده است.");
    expect(prefetch).toHaveBeenCalledWith("/dashboard");

    "123456".split("").forEach((digit, index) => {
      fireEvent.change(screen.getByRole("textbox", { name: `رقم ${index + 1} کد یک‌بارمصرف` }), {
        target: { value: digit },
      });
    });

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.getByRole("status")).toHaveTextContent("در حال ورود به پنل");
    expect(screen.queryByRole("button", { name: "تأیید و ورود" })).not.toBeInTheDocument();
  });

  it("shows the provider error without offering a log fallback", async () => {
    const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    apiRequest.mockImplementation((path: string, _init: unknown, onResponse?: (response: Response) => void) => {
      if (path === "/api/auth/providers") return Promise.resolve({ google: false });
      if (path === "/api/auth/request-otp") {
        onResponse?.(new Response(null, { status: 502, headers: { "x-radikar-otp-reversed": "654321" } }));
        return Promise.reject(new Error("ارسال پیامک ورود ناموفق بود: IP سرویس مبدا با تنظیمات مطابقت ندارد"));
      }
      return Promise.reject(new Error(`Unexpected request: ${path}`));
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <LoginPage />
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByPlaceholderText("09123456789"), { target: { value: "09123456789" } });
    fireEvent.click(screen.getByRole("button", { name: "دریافت کد ورود" }));

    expect(
      await screen.findByText("ارسال پیامک ورود ناموفق بود: IP سرویس مبدا با تنظیمات مطابقت ندارد"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "تأیید و ورود" })).not.toBeInTheDocument();
    expect(notify).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("[radikar:otp-reversed] 654321");
    consoleSpy.mockRestore();
  });
});
