import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ModelTask } from "./model-task-provider";

const tasks = vi.hoisted(() => [] as ModelTask[]);

vi.mock("./model-task-provider", () => ({
  useModelTasks: () => ({ tasks, openTask: vi.fn(), cancelTask: vi.fn() }),
}));

import { ModelTaskStack } from "./model-task-stack";

const failedSession: ModelTask = {
  id: "interview-1",
  key: "interview-session",
  title: "ساخت جلسه مصاحبه",
  pendingLabel: "در حال ساخت",
  completedLabel: "آماده شد",
  status: "error",
  href: "/interview",
  error: "سهمیه مصاحبه این پلن تمام شده است؛ برای ادامه پلن را ارتقا دهید.",
  createdAt: 1,
};

describe("ModelTaskStack", () => {
  afterEach(() => tasks.splice(0));

  it("hides earlier failed interview attempts instead of listing sessions that do not exist", () => {
    tasks.push(failedSession, { ...failedSession, id: "interview-2", error: "ساخت جلسه ناموفق بود." });

    render(<ModelTaskStack />);

    expect(screen.queryByRole("region", { name: "فعالیت‌های هوشمند" })).toBeNull();
  });

  it("hides failed dashboard analyses and canceled tasks instead of counting them as activities", () => {
    tasks.push(
      {
        ...failedSession,
        id: "dashboard-1",
        key: "dashboard-analysis",
        title: "تحلیل هوشمند داشبورد",
        error: "ارتباط با سرویس ناموفق بود.",
      },
      {
        ...failedSession,
        id: "dashboard-2",
        key: "dashboard-analysis",
        title: "تحلیل هوشمند داشبورد",
        status: "canceled",
        error: undefined,
      },
    );

    render(<ModelTaskStack />);

    expect(screen.queryByRole("region", { name: "فعالیت‌های هوشمند" })).toBeNull();
  });

  it("keeps automatic dashboard analysis out of the sidebar before and after completion", () => {
    tasks.push(
      {
        ...failedSession,
        id: "dashboard-running",
        key: "dashboard-analysis",
        status: "running",
        showInSidebar: false,
        error: undefined,
      },
      {
        ...failedSession,
        id: "dashboard-complete",
        key: "dashboard-analysis",
        status: "completed",
        showInSidebar: false,
        error: undefined,
      },
    );

    render(<ModelTaskStack />);

    expect(screen.queryByRole("region", { name: "فعالیت‌های هوشمند" })).toBeNull();
  });

  it("hides quota errors while retaining a successfully completed activity", () => {
    tasks.push(
      { ...failedSession, key: "match", title: "تحلیل تطابق" },
      { ...failedSession, id: "interview-complete", status: "completed", error: undefined },
    );

    render(<ModelTaskStack />);

    const stack = screen.getByRole("region", { name: "فعالیت‌های هوشمند" });
    expect(stack).toHaveClass("min-w-0", "max-w-full");
    expect(within(stack).getByRole("button", { name: /ساخت جلسه مصاحبه/ })).toBeVisible();
    expect(within(stack).queryByText(/سهمیه مصاحبه/)).toBeNull();
    expect(within(stack).queryByRole("link", { name: /ارتقای پلن/ })).toBeNull();
  });
});
