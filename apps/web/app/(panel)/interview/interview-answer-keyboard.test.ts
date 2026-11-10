import type { KeyboardEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { submitInterviewAnswerOnEnter } from "./interview-answer-keyboard";

function keyboardEvent(overrides: Record<string, unknown> = {}) {
  const form = document.createElement("form");
  const textarea = document.createElement("textarea");
  form.append(textarea);
  const requestSubmit = vi.spyOn(form, "requestSubmit").mockImplementation(() => {});
  const preventDefault = vi.fn();
  const event = {
    key: "Enter",
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    nativeEvent: { isComposing: false, keyCode: 13 },
    currentTarget: textarea,
    preventDefault,
    ...overrides,
  } as unknown as KeyboardEvent<HTMLTextAreaElement>;
  return { event, requestSubmit, preventDefault };
}

describe("interview answer keyboard", () => {
  it("submits through the form on Enter so the existing validation and next-step handler run", () => {
    const { event, requestSubmit, preventDefault } = keyboardEvent();
    submitInterviewAnswerOnEnter(event, false);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(requestSubmit).toHaveBeenCalledOnce();
  });

  it("keeps Shift+Enter for a newline and ignores modifier and composition keys", () => {
    for (const overrides of [
      { shiftKey: true },
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { nativeEvent: { isComposing: true, keyCode: 13 } },
      { nativeEvent: { isComposing: false, keyCode: 229 } },
    ]) {
      const { event, requestSubmit, preventDefault } = keyboardEvent(overrides);
      submitInterviewAnswerOnEnter(event, false);
      expect(preventDefault).not.toHaveBeenCalled();
      expect(requestSubmit).not.toHaveBeenCalled();
    }
  });

  it("does not submit again while the answer or report is being saved", () => {
    const { event, requestSubmit, preventDefault } = keyboardEvent();
    submitInterviewAnswerOnEnter(event, true);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(requestSubmit).not.toHaveBeenCalled();
  });
});
