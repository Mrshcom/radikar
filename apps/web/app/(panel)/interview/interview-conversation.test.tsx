import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InterviewConversation } from "./interview-conversation";

const baseProps = {
  questions: ["دربارهٔ تجربه‌ات بگو"],
  answers: [""],
  replies: [],
  clarifications: [],
  currentIndex: 0,
  intro: "سلام",
};

describe("InterviewConversation", () => {
  it("blocks copying the transcript while leaving the answer composer interactive", () => {
    render(
      <InterviewConversation {...baseProps}>
        <textarea aria-label="پاسخ مصاحبه" />
      </InterviewConversation>,
    );
    const messages = screen.getByRole("log");
    expect(messages).toHaveClass("select-none");
    expect(fireEvent.copy(screen.getByText("سلام"))).toBe(false);
    expect(fireEvent.contextMenu(screen.getByText("سلام"))).toBe(false);
    expect(fireEvent.copy(screen.getByRole("textbox", { name: "پاسخ مصاحبه" }))).toBe(true);
  });

  it("acknowledges readiness before asking the first question", () => {
    render(
      <InterviewConversation
        {...baseProps}
        readinessMessages={[{ text: "یس", sentAt: "2026-11-10T12:00:00.000Z" }]}
        firstQuestionSentAt="2026-11-10T12:00:00.000Z"
      >
        <form />
      </InterviewConversation>,
    );
    const messages = screen.getByRole("log");
    const acknowledgement = screen.getByText("اوکی، حالا که آماده‌ای، بگذار مصاحبه را شروع کنیم.");
    const question = screen.getByText("دربارهٔ تجربه‌ات بگو");
    expect(messages).toContainElement(acknowledgement);
    expect(acknowledgement.compareDocumentPosition(question) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows the first question shortly after acknowledging a new ready reply", () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(
        <InterviewConversation
          {...baseProps}
          ready={false}
          readinessMessages={[{ text: "نه", sentAt: "2026-11-10T12:00:00.000Z" }]}
        >
          <form />
        </InterviewConversation>,
      );
      rerender(
        <InterviewConversation
          {...baseProps}
          ready
          readinessMessages={[{ text: "یس", sentAt: "2026-11-10T12:01:00.000Z" }]}
          firstQuestionSentAt="2026-11-10T12:01:00.000Z"
        >
          <form />
        </InterviewConversation>,
      );
      expect(screen.getByText("اوکی، حالا که آماده‌ای، بگذار مصاحبه را شروع کنیم.")).toBeVisible();
      expect(screen.queryByText("دربارهٔ تجربه‌ات بگو")).toBeNull();
      act(() => vi.advanceTimersByTime(700));
      expect(screen.getByText("دربارهٔ تجربه‌ات بگو")).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the interviewer's reply and next question in one bubble on separate lines", () => {
    render(
      <InterviewConversation
        {...baseProps}
        questions={["سؤال اول؟", "سؤال دوم؟"]}
        answers={["پاسخ اول", ""]}
        answerSentAt={["2026-11-10T12:00:00.000Z"]}
        replies={["متوجه شدم."]}
        replySentAt={["2026-11-10T12:01:00.000Z"]}
        currentIndex={1}
      >
        <form />
      </InterviewConversation>,
    );
    const question = screen.getByText("متوجه شدم. سؤال دوم؟");
    const bubble = question.closest("p")!;
    expect(question.textContent).toBe("متوجه شدم.\nسؤال دوم؟");
    expect(bubble).toHaveClass("whitespace-pre-wrap");
    expect(bubble.className).not.toContain("bg-");
    expect(screen.getByText("پاسخ اول").closest("p")?.className).toContain("bg-[#e9f4ee]");
    expect(screen.getByText("پاسخ اول").closest(".group")?.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-11-10T12:00:00.000Z",
    );
    expect(question.closest(".group")?.querySelector('span[aria-label="مصاحبه‌گر"]')).not.toBeNull();
    expect(screen.getByText("پاسخ اول").closest(".group")?.querySelector('span[aria-label="کاربر"]')).not.toBeNull();
    expect(bubble.closest(".group")?.querySelector("time")).toHaveAttribute("datetime", "2026-11-10T12:01:00.000Z");
    expect(screen.getByText("پاسخ اول").closest(".group")?.querySelector("time")?.className).toContain(
      "right-[calc(100%+0.5rem)]",
    );
    expect(screen.getByText("پاسخ اول").closest(".group")?.querySelector(".transition-transform")?.className).toContain(
      "group-hover:-translate-x-9",
    );
  });

  it("reveals a new interviewer message progressively", () => {
    vi.useFakeTimers();
    try {
      render(
        <InterviewConversation {...baseProps}>
          <form />
        </InterviewConversation>,
      );
      const typing = screen.getByTestId("interviewer-typing");
      expect(typing.textContent).toBe("");
      act(() => vi.advanceTimersByTime(96));
      expect(typing.textContent?.length).toBeGreaterThan(0);
      expect(typing.textContent?.length).toBeLessThan(baseProps.questions[0].length);
      act(() => vi.advanceTimersByTime(5000));
      expect(typing.textContent).toBe(baseProps.questions[0]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the composer below the scroll area and only follows new messages near the bottom", () => {
    const { rerender } = render(
      <InterviewConversation {...baseProps}>
        <form>
          <button type="submit">ارسال پاسخ</button>
        </form>
      </InterviewConversation>,
    );
    const messages = screen.getByRole("log");
    Object.defineProperties(messages, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 300 },
    });
    expect(messages.nextElementSibling).toContainElement(screen.getByRole("button", { name: "ارسال پاسخ" }));

    messages.scrollTop = 200;
    fireEvent.scroll(messages);
    rerender(
      <InterviewConversation {...baseProps} replies={["پیام تازه"]}>
        <form>
          <button type="submit">ارسال پاسخ</button>
        </form>
      </InterviewConversation>,
    );
    expect(messages.scrollTop).toBe(200);

    messages.scrollTop = 680;
    fireEvent.scroll(messages);
    rerender(
      <InterviewConversation {...baseProps} replies={["پیام تازه‌تر"]}>
        <form>
          <button type="submit">ارسال پاسخ</button>
        </form>
      </InterviewConversation>,
    );
    expect(messages.scrollTop).toBe(1000);

    messages.scrollTop = 200;
    fireEvent.scroll(messages);
    fireEvent.submit(screen.getByRole("button", { name: "ارسال پاسخ" }).closest("form")!);
    expect(messages.scrollTop).toBe(1000);
  });

  it("keeps the thinking status above the composer while messages scroll", () => {
    render(
      <InterviewConversation {...baseProps} pending>
        <form>
          <textarea aria-label="پاسخ" />
        </form>
      </InterviewConversation>,
    );

    const status = screen.getByRole("status");
    const composer = screen.getByRole("textbox", { name: "پاسخ" });
    expect(screen.getByRole("log")).not.toContainElement(status);
    expect(status.parentElement).toContainElement(composer);
    expect(status.nextElementSibling).toContainElement(composer);
  });
});
