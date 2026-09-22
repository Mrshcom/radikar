import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiRequest }));
import { billingKeys, useAdminMembership, useMembership, useOrders, usePlans } from "@/lib/billing";

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>;
}

describe("billing queries", () => {
  it("uses shared query keys and does not request an absent admin membership", async () => {
    const absent = renderHook(() => useAdminMembership(), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(apiRequest).not.toHaveBeenCalled();
    expect(billingKeys.adminMembership("u1")).toEqual(["admin", "membership-details", "u1"]);
    absent.unmount();
  });

  it("fetches plans, membership and filtered orders through stable API routes", async () => {
    apiRequest.mockResolvedValueOnce([]).mockResolvedValueOnce({ id: "m" }).mockResolvedValueOnce({ items: [], total: 0, page: 2, pageSize: 10 });
    const plans = renderHook(() => usePlans(), { wrapper });
    const membership = renderHook(() => useMembership(), { wrapper });
    const orders = renderHook(() => useOrders(2, 10, "RK", "paid"), { wrapper });
    await waitFor(() => expect(plans.result.current.isSuccess && membership.result.current.isSuccess && orders.result.current.isSuccess).toBe(true));
    expect(apiRequest).toHaveBeenCalledWith("/api/billing/plans");
    expect(apiRequest).toHaveBeenCalledWith("/api/billing/membership");
    expect(apiRequest).toHaveBeenCalledWith("/api/billing/orders?page=2&pageSize=10&search=RK&status=paid");
  });
});
