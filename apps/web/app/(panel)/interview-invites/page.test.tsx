import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn(), notify: vi.fn() }));

vi.mock("@/lib/api-client", () => ({ apiRequest: mocks.apiRequest }));
vi.mock("@/app/_components/toast", () => ({ useToast: () => mocks.notify }));

import InterviewInvitesPage from "./page";

describe("InterviewInvitesPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows fetch failures in a transient toast and offers a retry without an inline error", async () => {
    mocks.apiRequest.mockRejectedValue(new Error("خطای داخلی سرویس رخ داد."));
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewInvitesPage />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.notify).toHaveBeenCalledWith("خطای داخلی سرویس رخ داد.", "error"));
    expect(screen.queryByText("خطای داخلی سرویس رخ داد.")).toBeNull();
    expect(screen.getByRole("button", { name: "تلاش دوباره برای دریافت مصاحبه‌ها" })).toBeVisible();
  });

  it("shows invitations with later deadlines first", async () => {
    mocks.apiRequest.mockResolvedValue([
      { id: "old", title: "قدیمی", companyName: "نمونه", status: "expired", deadline: "2026-11-09T00:00:00.000Z" },
      { id: "new", title: "جدید", companyName: "نمونه", status: "invited", deadline: "2026-11-21T00:00:00.000Z" },
      { id: "middle", title: "میانی", companyName: "نمونه", status: "completed", deadline: "2026-11-18T00:00:00.000Z" },
    ]);

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewInvitesPage />
      </QueryClientProvider>,
    );

    await screen.findByRole("link", { name: /جدید/ });
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/interview-invites/new",
      "/interview-invites/middle",
      "/interview-invites/old",
    ]);
  });

  it("shows a cancelled invitation in gray without offering entry to the old interview", async () => {
    mocks.apiRequest.mockResolvedValue([
      {
        id: "cancelled-1",
        title: "مدیر محصول",
        companyName: "شرکت نمونه",
        status: "cancelled",
        deadline: "2026-11-21T00:00:00.000Z",
        cancelledAt: "2026-11-13T10:00:00.000Z",
      },
    ]);

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InterviewInvitesPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByLabelText("مصاحبهٔ لغوشدهٔ مدیر محصول")).toBeVisible();
    expect(screen.getByText("لغوشده")).toBeVisible();
    expect(screen.queryByRole("link", { name: /مدیر محصول/ })).toBeNull();
  });
});
