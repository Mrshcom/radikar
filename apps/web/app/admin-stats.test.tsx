import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiRequest }));
import { adminAiSettingsQueryKey, adminBillingStatsQueryKey, adminEventsQueryKey, adminModelUsageQueryKey, adminStatsQueryKey, useAdminAiSettings, useAdminBillingStats, useAdminEvents, useAdminModelUsage, useAdminStats, useUpdateAdminAiSettings } from "@/lib/admin-stats";
function client() { return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); }
function wrap(queryClient: QueryClient) { return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>; }
describe("admin stats hooks", () => {
  it("keeps disabled queries silent and uses stable routes/parameter keys", async () => {
    const qc = client(); const disabled = renderHook(() => [useAdminStats(false), useAdminBillingStats(false), useAdminEvents(false), useAdminAiSettings(false), useAdminModelUsage(false, 7, 2, 50, "gapgpt")], { wrapper: wrap(qc) });
    await new Promise((resolve) => setTimeout(resolve, 0)); expect(apiRequest).not.toHaveBeenCalled();
    expect([adminStatsQueryKey, adminBillingStatsQueryKey, adminEventsQueryKey, adminAiSettingsQueryKey, [...adminModelUsageQueryKey, 7, 2, 50, "gapgpt"]]).toEqual([["admin", "stats"], ["admin", "billing-stats"], ["admin", "events"], ["admin", "ai-settings"], ["admin", "model-usage", 7, 2, 50, "gapgpt"]]); disabled.unmount();
  });
  it("fetches all enabled reports, surfaces errors and updates AI settings cache", async () => {
    apiRequest.mockResolvedValueOnce({ users: {} }).mockResolvedValueOnce({ totalOrders: 1 }).mockResolvedValueOnce({ items: [] }).mockResolvedValueOnce({ current: {}, providers: [] }).mockResolvedValueOnce({ recentRequests: { items: [] } });
    const qc = client(); const hooks = renderHook(() => ({ stats: useAdminStats(true), billing: useAdminBillingStats(true), events: useAdminEvents(true), settings: useAdminAiSettings(true), usage: useAdminModelUsage(true, 30, 2, 10, "gapgpt"), update: useUpdateAdminAiSettings() }), { wrapper: wrap(qc) });
    await waitFor(() => expect(hooks.result.current.stats.isSuccess && hooks.result.current.usage.isSuccess).toBe(true));
    expect(apiRequest).toHaveBeenCalledWith("/api/admin/model-usage?days=30&page=2&pageSize=10&provider=gapgpt");
    qc.setQueryData(adminAiSettingsQueryKey, { current: { provider: "gapgpt", model: "old" }, providers: [] }); apiRequest.mockResolvedValueOnce({ provider: "gapgpt", model: "new" });
    await hooks.result.current.update.mutateAsync({ provider: "gapgpt", model: "new" }); expect((qc.getQueryData(adminAiSettingsQueryKey) as any).current.model).toBe("new");
  });

  it("exposes query errors, refetches explicitly and keeps prior model-usage data while parameters change", async () => {
    const qc = client();
    apiRequest.mockRejectedValueOnce(new Error("قطع ارتباط"));
    const failed = renderHook(() => useAdminStats(true), { wrapper: wrap(qc) });
    await waitFor(() => expect(failed.result.current.isError).toBe(true));
    expect(failed.result.current.error?.message).toBe("قطع ارتباط");
    apiRequest.mockClear(); apiRequest.mockResolvedValueOnce({ users: { total: 2 } });
    await act(async () => { await failed.result.current.refetch(); });
    await waitFor(() => expect(failed.result.current.data).toEqual({ users: { total: 2 } }));
    qc.setQueryData([...adminModelUsageQueryKey, 30, 1, 20, "", "", ""], { periodDays: 30, recentRequests: { items: [{ id: "old" }] } });
    apiRequest.mockImplementationOnce(() => new Promise(() => {}));
    const usage = renderHook(({ page }) => useAdminModelUsage(true, 30, page, 20), { initialProps: { page: 1 }, wrapper: wrap(qc) });
    usage.rerender({ page: 2 });
    await waitFor(() => expect(usage.result.current.isFetching).toBe(true));
    expect(usage.result.current.data?.recentRequests.items).toEqual([{ id: "old" }]);
  });

  it("does not create a cache entry when AI settings update succeeds before its query exists", async () => {
    const qc = client(); apiRequest.mockResolvedValueOnce({ provider: "gapgpt", model: "gapgpt-model" });
    const mutation = renderHook(() => useUpdateAdminAiSettings(), { wrapper: wrap(qc) });
    await mutation.result.current.mutateAsync({ provider: "gapgpt", model: "gapgpt-model" });
    expect(qc.getQueryData(adminAiSettingsQueryKey)).toBeUndefined();
  });
});
