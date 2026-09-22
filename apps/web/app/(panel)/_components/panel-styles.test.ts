import { describe, expect, it } from "vitest";
import { scoreWidthClass } from "./panel-styles";

describe("scoreWidthClass", () => {
  it.each([
    [0, "w-1/5"],
    [19, "w-1/5"],
    [20, "w-2/5"],
    [59, "w-3/5"],
    [79, "w-4/5"],
    [80, "w-full"],
  ])("maps score %i to %s", (score, expectedClass) => {
    expect(scoreWidthClass(score)).toBe(expectedClass);
  });
});
