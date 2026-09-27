import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RangeInput } from "./range-input";

describe("RangeInput", () => {
  it("keeps both values under one label with a Persian range separator", () => {
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();
    render(<RangeInput label="بازه حقوق" minValue="10" maxValue="20" onMinChange={onMinChange} onMaxChange={onMaxChange} />);
    expect(screen.getByText("تا")).toBeVisible();
    fireEvent.change(screen.getByLabelText("بازه حقوق حداقل"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("بازه حقوق حداکثر"), { target: { value: "24" } });
    expect(onMinChange).toHaveBeenCalledWith("12");
    expect(onMaxChange).toHaveBeenCalledWith("24");
  });
});
