import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InterviewProgress } from "./interview-progress";

describe("InterviewProgress", () => {
  it("uses consecutive slices of one gradient across all question segments", () => {
    render(<InterviewProgress total={4} currentIndex={2} />);

    const progress = screen.getByRole("progressbar", { name: "پیشرفت مصاحبه" });
    const fills = progress.querySelectorAll<HTMLElement>("span > span");
    expect(progress).toHaveAttribute("aria-valuenow", "3");
    expect(fills).toHaveLength(4);
    expect(Array.from(fills, (fill) => fill.style.backgroundSize)).toEqual(Array(4).fill("400% 100%"));
    expect(Array.from(fills, (fill) => Math.round(parseFloat(fill.style.backgroundPosition)))).toEqual([
      100, 67, 33, 0,
    ]);
  });
});
