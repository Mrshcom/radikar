import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookies = vi.fn();
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies }));

describe("server API boundaries", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns a user only when a server session and API response are valid", async () => {
    vi.stubEnv("API_PROXY_ORIGIN", "http://api.test/");
    cookies.mockResolvedValue({
      has: (name: string) => name === "radikar_session",
      toString: () => "radikar_session=token",
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ user: { id: "u1", role: "user" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { getServerAuthUser } = await import("@/lib/server-auth");
    await expect(getServerAuthUser()).resolves.toEqual({ id: "u1", role: "user" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/auth/me",
      expect.objectContaining({ cache: "no-store" }),
    );
    cookies.mockResolvedValue({ has: () => false, toString: () => "" });
    await expect(getServerAuthUser()).resolves.toBeNull();
  });

  it("proxies body, query and safe response headers to the API", async () => {
    vi.stubEnv("API_PROXY_ORIGIN", "http://api.test/");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("ok", {
        status: 201,
        headers: { "content-type": "text/plain", "content-length": "2", "x-request-id": "r1" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { proxyApiRequest } = await import("@/lib/api-proxy");
    const request = new NextRequest("http://web.test/v1/data/jobs?cursor=2", {
      method: "POST",
      body: "payload",
      headers: { host: "web.test", cookie: "radikar_session=x" },
    });
    const response = await proxyApiRequest(request, "v1", ["data", "jobs"]);
    expect(response.status).toBe(201);
    expect(await response.text()).toBe("ok");
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("x-request-id")).toBe("r1");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/v1/data/jobs?cursor=2",
      expect.objectContaining({ method: "POST", redirect: "manual" }),
    );
  });
});
