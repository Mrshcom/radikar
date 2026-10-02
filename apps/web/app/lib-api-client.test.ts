import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  PLAN_UPGRADE_REQUIRED_EVENT,
  apiRequest,
  clearPendingPlanUpgradeMessage,
  getPendingPlanUpgradeMessage,
} from "@/lib/api-client";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearPendingPlanUpgradeMessage();
  });

  it("sends JSON requests with credentials and parses responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      apiRequest<{ ok: boolean }>("/api/example", { method: "POST", body: JSON.stringify({ value: 1 }) }),
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/example"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({ "content-type": "application/json" }),
      }),
    );
  });

  it("returns undefined for 204 and preserves form-data content type handling", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.append("file", "content");
    await expect(apiRequest("/api/upload", { method: "POST", body: form })).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("headers.content-type");
  });

  it("emits the upgrade event and stores a 402 message", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "سقف استفاده تمام شده" }), { status: 402 }));
    vi.stubGlobal("fetch", fetchMock);
    const event = vi.fn();
    window.addEventListener(PLAN_UPGRADE_REQUIRED_EVENT, event);
    await expect(apiRequest("/api/usage")).rejects.toMatchObject({ status: 402, message: "سقف استفاده تمام شده" });
    expect(event).toHaveBeenCalledTimes(1);
    expect(getPendingPlanUpgradeMessage()).toBe("سقف استفاده تمام شده");
  });

  it("maps malformed, network and abort failures correctly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not-json", { status: 200 })));
    await expect(apiRequest("/api/bad-json")).rejects.toBeInstanceOf(ApiError);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(apiRequest("/api/offline")).rejects.toMatchObject({ status: 0 });
    const abort = new Error("aborted");
    abort.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    await expect(apiRequest("/api/abort")).rejects.toBe(abort);
  });
});
