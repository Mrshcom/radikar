import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageEditorModal } from "./image-editor-modal";

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

describe("image editor modal", () => {
  afterEach(() => vi.restoreAllMocks());
  it("cancels broken images and closes from the explicit controls", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
    const onCancel = vi.fn();
    const ImageMock = class {
      set src(_value: string) {
        this.onerror?.(new Event("error"));
      }
      onload: any;
      onerror: any;
      naturalWidth = 100;
      naturalHeight = 100;
    };
    vi.stubGlobal("Image", ImageMock);
    render(
      <ImageEditorModal
        file={new File(["x"], "bad.png", { type: "image/png" })}
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );
    await waitFor(() => expect(onCancel).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByLabelText("بستن"));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("loads, zooms, drags and exports a canvas crop", async () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn() });
    const ImageMock = class {
      onload: any;
      onerror: any;
      naturalWidth = 800;
      naturalHeight = 600;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    };
    vi.stubGlobal("Image", ImageMock);
    const context = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as any);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,crop");
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { configurable: true, value: vi.fn() });
    const confirm = vi.fn();
    render(
      <ImageEditorModal
        file={new File(["x"], "good.png", { type: "image/png" })}
        onCancel={vi.fn()}
        onConfirm={confirm}
      />,
    );
    await waitFor(() => expect(screen.getByAltText("پیش‌نمایش تصویر پروفایل")).toBeVisible());
    fireEvent.change(screen.getByLabelText("بزرگ‌نمایی تصویر"), { target: { value: "2" } });
    const viewport = screen.getByAltText("پیش‌نمایش تصویر پروفایل").parentElement!;
    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 60, clientY: 40 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    fireEvent.click(screen.getByText("استفاده از تصویر"));
    expect(context.drawImage).toHaveBeenCalledOnce();
    expect(confirm).toHaveBeenCalledWith("data:image/jpeg;base64,crop");
  });
});
