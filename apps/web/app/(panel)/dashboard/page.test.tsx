import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  notify: vi.fn(),
  runModelTask: vi.fn(),
}));

vi.mock("@/app/_components/toast", () => ({ useToast: () => mocks.notify }));
vi.mock("../_components/model-task-provider", () => ({
  useModelTasks: () => ({ runModelTask: mocks.runModelTask }),
}));
vi.mock("@/lib/api-client", () => ({ apiRequest: mocks.apiRequest }));
vi.mock("../resumes/resume-data", () => ({ hasResumeContent: () => true }));
vi.mock("@/lib/data/stores", () => ({
  resumeStore: {
    list: async () => [{ id: "resume-1", updatedAt: "2026-10-28T12:00:00.000Z", data: { fullName: "سارا احمدی" } }],
  },
  jobStore: { list: async () => [] },
  applicationStore: { list: async () => [] },
  dashboardSnapshotStore: { list: async () => [], put: async () => {} },
  knowledgeProfileStore: { list: async () => [] },
}));

import DashboardPage from "./page";

describe("DashboardPage automatic analysis", () => {
  afterEach(() => {
    mocks.apiRequest.mockReset();
    mocks.notify.mockReset();
    mocks.runModelTask.mockReset();
  });

  it("sends only one analysis request in StrictMode and keeps provider errors visible", async () => {
    mocks.runModelTask.mockImplementation(({ run }: { run: () => Promise<unknown> }) => run());
    mocks.apiRequest.mockRejectedValue(new Error("اعتبار سرویس هوش مصنوعی کافی نیست؛ لطفاً بعداً دوباره تلاش کنید."));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <DashboardPage />
        </QueryClientProvider>
      </StrictMode>,
    );

    expect(await screen.findByText("اعتبار سرویس هوش مصنوعی کافی نیست؛ لطفاً بعداً دوباره تلاش کنید.")).toBeVisible();
    await waitFor(() => expect(mocks.apiRequest).toHaveBeenCalledTimes(1));
    expect(mocks.runModelTask).toHaveBeenCalledTimes(1);
    expect(mocks.runModelTask).toHaveBeenCalledWith(expect.objectContaining({ showInSidebar: false }));
  });

  it("shares one in-flight model request for the same resume across dashboard mounts", async () => {
    mocks.runModelTask.mockImplementation(({ run }: { run: () => Promise<unknown> }) => run());
    let rejectRequest: (error: Error) => void = () => {};
    mocks.apiRequest.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectRequest = reject;
        }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
        <DashboardPage />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(mocks.runModelTask).toHaveBeenCalledTimes(2));
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1);
    rejectRequest(new Error("اعتبار سرویس هوش مصنوعی کافی نیست؛ لطفاً بعداً دوباره تلاش کنید."));
    expect(await screen.findAllByText("اعتبار سرویس هوش مصنوعی کافی نیست؛ لطفاً بعداً دوباره تلاش کنید.")).toHaveLength(
      2,
    );
  });
});
