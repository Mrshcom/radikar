import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InterviewSkeleton } from "./page-skeletons";

describe("InterviewSkeleton", () => {
  it("distinguishes restoring a saved session from creating new interview questions", () => {
    const { rerender } = render(<InterviewSkeleton />);
    expect(screen.getByRole("status")).toHaveTextContent("در حال بازیابی جلسهٔ مصاحبه");

    rerender(<InterviewSkeleton isCreatingSession />);
    expect(screen.getByRole("status")).toHaveTextContent("در حال ساخت سؤال‌های مصاحبهٔ تو");
  });
});
