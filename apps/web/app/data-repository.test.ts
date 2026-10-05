import { afterEach, describe, expect, it, vi } from "vitest";

const apiRequest = vi.fn();
const queryClient = {
  fetchQuery: vi.fn(async ({ queryFn }) => queryFn()),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn(),
};
vi.mock("@/lib/api-client", () => ({ apiRequest }));
vi.mock("@/lib/query-client", () => ({ getBrowserQueryClient: () => queryClient }));

describe("HTTP data repository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses encoded data URLs and keeps cache coherent after mutations", async () => {
    const { getDataRepository } = await import("@/lib/data/repository");
    apiRequest
      .mockResolvedValueOnce([{ id: "one" }])
      .mockResolvedValueOnce({ id: "a/b" })
      .mockResolvedValueOnce({ id: "a/b" })
      .mockResolvedValue(undefined);
    const data = getDataRepository();
    await data.list("jobs");
    await data.get("jobs", "a/b");
    await data.put("jobs", { id: "a/b", createdAt: "x", updatedAt: "x" });
    await data.remove("jobs", "a/b");
    await data.clear("jobs");
    expect(apiRequest).toHaveBeenCalledWith("/v1/data/jobs");
    expect(apiRequest).toHaveBeenCalledWith("/v1/data/jobs/a%2Fb");
    expect(queryClient.setQueryData).toHaveBeenCalledWith(["data", "jobs", "a/b"], { id: "a/b" });
    expect(queryClient.removeQueries).toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["data", "jobs"] });
  });
});
