import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { apiRequest, replace } = vi.hoisted(() => ({ apiRequest: vi.fn(), replace: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiRequest, ApiError: class ApiError extends Error { status = 401; } }));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ replace }) }));

import { AuthGate, authQueryKey, useAuth, useLogout } from "@/app/_components/auth";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

describe("auth hooks", () => {
  it("reads the current user and clears cached data after logout", async () => {
    apiRequest.mockResolvedValueOnce({ user: { id: "u", phone: "0912", fullName: null, role: "user", status: "active", createdAt: "x", lastLoginAt: null, tablePageSize: 20, onboardingState: { version: 1, status: "not_started", completedSteps: [] } } }).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.id).toBe("u"));
    expect(result.current.data?.user.tablePageSize).toBe(20);
    const logout = renderHook(() => useLogout(), { wrapper });
    await logout.result.current();
    expect(apiRequest).toHaveBeenLastCalledWith("/api/auth/logout", { method: "POST" });
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("keeps the protected page behind its loader until auth is known", () => {
    apiRequest.mockReturnValue(new Promise(() => undefined));
    const { getByText } = render(<QueryClientProvider client={new QueryClient()}><AuthGate><span>خصوصی</span></AuthGate></QueryClientProvider>);
    expect(getByText("در حال بارگذاری")).toBeTruthy();
    expect(authQueryKey).toEqual(["auth", "me"]);
  });
});
