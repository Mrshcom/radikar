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
      if (path === "/api/auth/request-otp") return Promise.resolve({ challengeId: "challenge-1", expiresInSeconds: 120 });
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
});
