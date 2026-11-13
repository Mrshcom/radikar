import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { apiRequest, replace, route } = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  replace: vi.fn(),
  route: { pathname: "/dashboard" },
}));
vi.mock("@/lib/api-client", () => ({
  apiRequest,
  ApiError: class ApiError extends Error {
    status = 401;
  },
}));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useRouter: () => ({ replace }) }));

import { AuthGate, authQueryKey, useAuth, useLogout } from "@/app/_components/auth";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  );
}

describe("auth hooks", () => {
  it("reads the current user and clears cached data after logout", async () => {
    apiRequest
      .mockResolvedValueOnce({
        user: {
          id: "u",
          phone: "0912",
          fullName: null,
          role: "user",
          accountType: "candidate",
          status: "active",
          createdAt: "x",
          lastLoginAt: null,
          tablePageSize: 20,
          onboardingState: { version: 1, status: "not_started", completedSteps: [] },
        },
      })
      .mockResolvedValueOnce(undefined);
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
    const { getByRole, getByText } = render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthGate>
          <span>خصوصی</span>
        </AuthGate>
      </QueryClientProvider>,
    );
    expect(getByText("در حال بارگذاری")).toBeTruthy();
    expect(getByRole("progressbar", { name: "در حال بارگذاری" }).firstElementChild).toHaveClass(
      "absolute",
      "will-change-[left,right]",
    );
    expect(authQueryKey).toEqual(["auth", "me"]);
  });

  it("blocks cross-account panel routes in both directions", async () => {
    for (const [accountType, pathname, destination] of [
      ["employer", "/dashboard", "/employer"],
      ["candidate", "/employer", "/dashboard"],
    ] as const) {
      replace.mockClear();
      route.pathname = pathname;
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      client.setQueryData(authQueryKey, { user: { id: "u", role: "user", accountType } });
      const page = render(
        <QueryClientProvider client={client}>
          <AuthGate>
            <span>صفحهٔ خصوصی</span>
          </AuthGate>
        </QueryClientProvider>,
      );
      await waitFor(() => expect(replace).toHaveBeenCalledWith(destination));
      expect(page.queryByText("صفحهٔ خصوصی")).toBeNull();
      page.unmount();
    }
    route.pathname = "/dashboard";
  });
});
