import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingContext, Skeleton, SkeletonLines } from "./primitives";

describe("skeleton primitives", () => {
  it("renders semantic loading context and requested skeleton lines", () => {
    render(
      <>
        <LoadingContext>در حال بارگذاری</LoadingContext>
        <SkeletonLines count={2} />
        <Skeleton as="div" />
      </>,
    );

    expect(screen.getByText("در حال بارگذاری")).toBeInTheDocument();
    expect(document.querySelectorAll("[aria-hidden=true]")).toHaveLength(5);
  });
});
