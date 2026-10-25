import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

type MotionDivProps = ComponentPropsWithoutRef<"div"> & {
  animate?: unknown;
  exit?: unknown;
  initial?: unknown;
  transition?: unknown;
};

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: MotionDivProps) => {
      for (const animationProp of ["animate", "exit", "initial", "transition"] as const) delete props[animationProp];
      return <div {...props}>{children}</div>;
    },
  },
  useReducedMotion: () => true,
}));
import { ApiError, PLAN_UPGRADE_REQUIRED_EVENT } from "@/lib/api-client";
import { ToastProvider, useToast } from "@/app/_components/toast";

function Trigger() {
  const notify = useToast();
  return <button onClick={() => notify("انجام شد")}>اعلان</button>;
}

function LongMessageTrigger() {
  const notify = useToast();
  return <button onClick={() => notify("اطلاعات ذخیره شد و برای استفاده از ابزارهای رادیکار آماده است.")}>اعلان بلند</button>;
}

describe("ToastProvider", () => {
  it("reserves space for the icon and allows long messages to widen before wrapping", () => {
    render(
      <ToastProvider>
        <LongMessageTrigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "اعلان بلند" }));
    const toast = screen.getByRole("status");
    expect(toast.className).toContain("max-w-[min(640px,calc(100vw-32px))]");
    expect(toast.className).toContain("gap-3");
    expect(toast.querySelector("svg")).toHaveClass("shrink-0");
    expect(toast.querySelector("span")).toHaveClass("[overflow-wrap:anywhere]");
  });

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
    expect(screen.getByRole("alert")).toBeInTheDocument();
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
