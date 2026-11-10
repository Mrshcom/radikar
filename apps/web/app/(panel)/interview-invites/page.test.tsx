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
});
