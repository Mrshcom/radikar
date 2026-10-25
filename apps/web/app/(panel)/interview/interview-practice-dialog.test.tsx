import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InterviewPracticeDialog } from "./interview-practice-dialog";

describe("InterviewPracticeDialog", () => {
  it("covers the interview and announces analysis instead of showing a result skeleton", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <InterviewPracticeDialog title="مصاحبه آزمایشی" onClose={onClose}>
        <div>سؤال مصاحبه</div>
      </InterviewPracticeDialog>,
    );

    rerender(
      <InterviewPracticeDialog title="مصاحبه آزمایشی" onClose={onClose} closeDisabled analysisPending>
        <div>سؤال مصاحبه</div>
      </InterviewPracticeDialog>,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-busy", "true");
    const background = document.querySelector<HTMLImageElement>('img[src*="radikar-interview-room-v2"]');
    expect(background).not.toBeNull();
    expect(background).toHaveClass("object-contain", "opacity-[0.12]");
    expect(background?.className).not.toContain("mask-image");
    expect(background?.closest('[role="dialog"]')).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("در حال تحلیل مصاحبهٔ تو هستیم");
    expect(screen.getByText("سؤال مصاحبه").parentElement).toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "خروج از مصاحبه" })).toBeDisabled();
  });

  it("shows an exit tooltip and asks for confirmation before saving and closing", () => {
    const onClose = vi.fn();
    render(
      <InterviewPracticeDialog title="مصاحبه آزمایشی" onClose={onClose}>
        <div>سؤال مصاحبه</div>
      </InterviewPracticeDialog>,
    );

    const exitButton = screen.getByRole("button", { name: "خروج از مصاحبه" });
    fireEvent.mouseEnter(exitButton.parentElement!);
    expect(screen.getByRole("tooltip")).toHaveTextContent("خروج از مصاحبه");
    fireEvent.click(exitButton);
    expect(screen.getByRole("alertdialog", { name: "از مصاحبه خارج می‌شوی؟" })).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "ادامهٔ مصاحبه" }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    const restoredButton = screen.getByRole("button", { name: "خروج از مصاحبه" });
    fireEvent.focus(restoredButton);
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.mouseEnter(restoredButton.parentElement!);
    expect(screen.getByRole("tooltip")).toHaveTextContent("خروج از مصاحبه");
    fireEvent.click(restoredButton);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "خروج از مصاحبه" }));
    fireEvent.click(screen.getByRole("button", { name: "ذخیره و خروج" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("allows the session-creation state to use its own cancellation copy", () => {
    render(
      <InterviewPracticeDialog
        title="در حال ساخت جلسهٔ تازه"
        exitDescription="ساخت این جلسه لغو می‌شود."
        exitConfirmLabel="لغو ساخت و خروج"
        onClose={vi.fn()}
      >
        <div>در حال ساخت</div>
      </InterviewPracticeDialog>,
    );

    fireEvent.click(screen.getByRole("button", { name: "خروج از مصاحبه" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("ساخت این جلسه لغو می‌شود.");
    expect(screen.getByRole("button", { name: "لغو ساخت و خروج" })).toBeEnabled();
  });
});
