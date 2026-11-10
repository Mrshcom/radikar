import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  it("shows the interviewer's reply and next question in one bubble on separate lines", () => {
    render(
      <InterviewConversation
        {...baseProps}
        questions={["سؤال اول؟", "سؤال دوم؟"]}
        answers={["پاسخ اول", ""]}
        answerSentAt={["2026-11-10T12:00:00.000Z"]}
        replies={["متوجه شدم."]}
        currentIndex={1}
      >
        <form />
      </InterviewConversation>,
    );
    const bubble = screen.getByText("سؤال دوم؟").closest("p")!;
    expect(bubble.querySelector("br")).not.toBeNull();
    expect(bubble).toContainElement(screen.getByText("متوجه شدم."));
    expect(screen.getAllByText("متوجه شدم.")).toHaveLength(1);
    expect(bubble.className).not.toContain("bg-");
    expect(screen.getByText("پاسخ اول").closest("p")?.className).toContain("bg-[#e9f4ee]");
    expect(screen.getByText("پاسخ اول").closest(".group")?.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-11-10T12:00:00.000Z",
    );
    expect(screen.getByRole("log").querySelectorAll("svg")).toHaveLength(0);
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
});
