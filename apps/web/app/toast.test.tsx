import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
import { ApiError, PLAN_UPGRADE_REQUIRED_EVENT } from "@/lib/api-client";
import { ToastProvider, useToast } from "@/app/_components/toast";

function Trigger() {
  const notify = useToast();
  return <button onClick={() => notify("انجام شد")}>اعلان</button>;
}

describe("ToastProvider", () => {
  it("shows notifications then clears them on its timer and browser errors", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("اعلان"));
    expect(screen.getByRole("status")).toHaveTextContent("انجام شد");
    act(() => vi.advanceTimersByTime(3600));
    expect(screen.queryByRole("status")).toBeNull();
    act(() => window.dispatchEvent(new Event("error")));
    expect(screen.getByRole("alert")).toHaveTextContent("خطای پیش‌بینی‌نشده");
    vi.useRealTimers();
  });
  it("handles rejections and the upgrade modal close/navigation flows", () => {
    render(
      <ToastProvider>
        <span />
      </ToastProvider>,
    );
    act(() =>
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", { promise: Promise.resolve(), reason: new Error("x") }),
      ),
    );
    expect(screen.getByRole("alert")).toBeVisible();
    act(() =>
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          promise: Promise.resolve(),
          reason: new ApiError(402, "ارتقا"),
        }),
      ),
    );
    act(() =>
      window.dispatchEvent(new CustomEvent(PLAN_UPGRADE_REQUIRED_EVENT, { detail: { message: "اعتبار تمام شد" } })),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("اعتبار تمام شد");
    fireEvent.click(screen.getByRole("button", { name: "فعلاً نه" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => window.dispatchEvent(new CustomEvent(PLAN_UPGRADE_REQUIRED_EVENT, { detail: { message: "ارتقا" } })));
    fireEvent.click(screen.getByRole("button", { name: /مشاهده و ارتقای پلن/ }));
    expect(push).toHaveBeenCalledWith("/upgrade");
  });
});
