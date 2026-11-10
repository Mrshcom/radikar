import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InterviewDepthChooser, interviewDepthLabel } from "./interview-depth-chooser";

describe("InterviewDepthChooser", () => {
  it("offers three named interview types without exposing question counts", () => {
    const onSelect = vi.fn();
    render(<InterviewDepthChooser onSelect={onSelect} />);

    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(screen.queryByText(/سؤال/)).toBeNull();
    expect(screen.queryByText(/حدود/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /انتخاب استاندارد/ }));
    expect(onSelect).toHaveBeenCalledWith("standard");
    expect(interviewDepthLabel("deep")).toBe("عمیق");
  });
});
