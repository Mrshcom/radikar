import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { PanelLink } from "./panel-link";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("PanelLink", () => {
  it("renders one external-link icon and opens external URLs in a new tab", () => {
    render(<PanelLink href="https://example.test/job">مشاهده منبع آگهی</PanelLink>);

    const link = screen.getByRole("link", { name: "مشاهده منبع آگهی" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(link.querySelectorAll("svg")).toHaveLength(1);
  });
});
