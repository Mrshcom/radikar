import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
const { apiRequest, setUrl } = vi.hoisted(() => ({ apiRequest: vi.fn(), setUrl: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiRequest }));
vi.mock("@/app/_components/auth", () => ({
  authQueryKey: ["auth", "me"],
  useAuth: () => ({ user: { tablePageSize: 20 } }),
}));
vi.mock("nuqs", () => ({ useQueryStates: () => [{ page: 4, pageSize: null }, setUrl] }));
import { useTablePageSize, useUrlTablePagination } from "@/lib/table-page-size";

function createClient() {
  return new QueryClient({ defaultOptions: { mutations: { retry: false } } });
}
function wrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
describe("table page-size hooks", () => {
  it("optimistically updates, rolls back errors and commits success cache", async () => {
    const client = createClient();
    client.setQueryData(["auth", "me"], { user: { tablePageSize: 20, id: "u1" } });
    let resolveRequest!: (value: unknown) => void;
    apiRequest.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { result } = renderHook(() => useTablePageSize(), { wrapper: wrapper(client) });
    act(() => result.current.setPageSize(50));
    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith("/api/account/preferences", {
        method: "PATCH",
        body: JSON.stringify({ tablePageSize: 50 }),
      }),
    );
    expect((client.getQueryData(["auth", "me"]) as any).user.tablePageSize).toBe(50);
    expect(result.current.isSaving).toBe(true);
    resolveRequest({ user: { tablePageSize: 50, id: "u1", persisted: true } });
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect((client.getQueryData(["auth", "me"]) as any).user.persisted).toBe(true);
    let rejectRequest!: (reason?: unknown) => void;
    apiRequest.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    act(() => result.current.setPageSize(100));
    await waitFor(() => expect((client.getQueryData(["auth", "me"]) as any).user.tablePageSize).toBe(100));
    rejectRequest(new Error("fail"));
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect((client.getQueryData(["auth", "me"]) as any).user.tablePageSize).toBe(50);
  });
  it("resets page and stores selected page size in URL state", () => {
    const { result } = renderHook(() => useUrlTablePagination(), { wrapper: wrapper(createClient()) });
    act(() => result.current.setPageSize(50));
    expect(setUrl).toHaveBeenCalledWith({ page: 1, pageSize: 50 });
    act(() => result.current.setPage(3));
    expect(setUrl).toHaveBeenCalledWith({ page: 3 });
  });
});
