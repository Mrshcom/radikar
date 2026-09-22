import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmActionModal, Modal } from "./ui";

describe("dialog primitives", () => {
  it("closes on Escape and backdrop but not an interaction inside the dialog", () => {
    const close = vi.fn();
    render(<Modal title="عنوان تست" onClose={close}><button type="button">داخل</button></Modal>);
    fireEvent.mouseDown(screen.getByText("داخل"));
    expect(close).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(close).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(screen.getByRole("presentation"));
    expect(close).toHaveBeenCalledTimes(2);
  });

  it("disables confirmation actions while pending", () => {
    const cancel = vi.fn(); const confirm = vi.fn();
    render(<ConfirmActionModal title="تأیید" description="متن" confirmLabel="انجام" pending onCancel={cancel} onConfirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "انجام" }));
    fireEvent.click(screen.getByRole("button", { name: "انصراف" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(confirm).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });
});
