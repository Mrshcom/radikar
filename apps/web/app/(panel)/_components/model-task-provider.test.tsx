import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ModelTaskProvider, useModelTasks } from "./model-task-provider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function renderProvider(child: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ModelTaskProvider>{child}</ModelTaskProvider>
    </QueryClientProvider>,
  );
}

function Harness({ run }: { run: (signal: AbortSignal) => Promise<string> }) {
  const { tasks, runModelTask, cancelTask, dismissTask } = useModelTasks();
  const [result, setResult] = useState("");
  const task = tasks[0];
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          void runModelTask({
            key: "test",
            title: "تست",
            pendingLabel: "در حال اجرا",
            completedLabel: "تمام شد",
            href: "/dashboard",
            run,
          })
            .then(setResult)
            .catch(() => undefined)
        }
      >
        شروع
      </button>
      <button type="button" disabled={!task} onClick={() => task && cancelTask(task.id)}>
        لغو
      </button>
      <button type="button" disabled={!task} onClick={() => task && dismissTask(task.id)}>
        حذف
      </button>
      <span data-testid="status">{task?.status ?? "empty"}</span>
      <span data-testid="result">{result}</span>
    </div>
  );
}

describe("ModelTaskProvider", () => {
  it("کار موفق را از running به completed منتقل می‌کند", async () => {
    renderProvider(<Harness run={async () => "ok"} />);
    fireEvent.click(screen.getByRole("button", { name: "شروع" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("completed"));
    expect(screen.getByTestId("result")).toHaveTextContent("ok");
  });

  it("لغو، AbortSignal را فعال و وضعیت را canceled می‌کند", async () => {
    let receivedSignal: AbortSignal | undefined;
    renderProvider(
      <Harness
        run={(signal) => {
          receivedSignal = signal;
          return new Promise((_, reject) =>
            signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))),
          );
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "شروع" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("running"));
    fireEvent.click(screen.getByRole("button", { name: "لغو" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("canceled"));
    expect(receivedSignal?.aborted).toBe(true);
  });

  it("task پایان‌یافته را می‌توان از فهرست حذف کرد", async () => {
    renderProvider(<Harness run={async () => "ok"} />);
    fireEvent.click(screen.getByRole("button", { name: "شروع" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("completed"));
    fireEvent.click(screen.getByRole("button", { name: "حذف" }));
    expect(screen.getByTestId("status")).toHaveTextContent("empty");
  });
});
