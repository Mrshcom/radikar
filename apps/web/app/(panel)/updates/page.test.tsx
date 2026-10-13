import { fireEvent, render, screen } from "@testing-library/react";
import type { ProductTimelineEntry } from "@radikar/shared-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  items: [] as ProductTimelineEntry[],
}));

vi.mock("next/image", () => ({
  default: () => null,
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/product-timeline", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/product-timeline")>()),
  useProductTimeline: () => ({ data: { items: state.items }, isPending: false, isError: false, refetch: vi.fn() }),
}));

import ProductUpdatesPage from "./page";

const phase: ProductTimelineEntry = {
  id: "phase-1",
  kind: "phase",
  phaseId: null,
  title: "فاز نخست",
  summary: "بهبود تجربهٔ کارجو در پنل",
  status: "building",
  sortOrder: 1,
  storySlides: [],
  publishedAt: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};
const feature: ProductTimelineEntry = {
  ...phase,
  id: "feature-1",
  kind: "feature",
  phaseId: phase.id,
  title: "پیش‌نمایش رزومه",
  summary: "رزومه را پیش از انتخاب ببین.",
  status: "completed",
  storySlides: [
    { title: "انتخاب آسان‌تر", body: "پیش‌نمایش واقعی هر رزومه را ببین." },
    { title: "شروع کن", body: "رزومهٔ مناسب را برای آگهی انتخاب کن.", ctaLabel: "دیدن رزومه‌ها", ctaHref: "/resumes" },
  ],
};

describe("product updates timeline", () => {
  beforeEach(() => {
    state.items = [phase, feature];
  });

  it("keeps an older story available beside its timeline item", () => {
    render(<ProductUpdatesPage />);
    expect(screen.getByRole("heading", { name: "خط زمان تغییرات" })).toBeVisible();
    expect(screen.getByText("فاز ۱")).toBeVisible();
    expect(screen.getByText("فاز نخست")).toBeVisible();
    expect(screen.getByText("پیش‌نمایش رزومه")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "دیدن دوبارهٔ استوری" }));
    expect(screen.getByRole("dialog", { name: "پیش‌نمایش رزومه" })).toBeVisible();
    expect(screen.getByText("انتخاب آسان‌تر")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /بعدی/ }));
    expect(screen.getByText("شروع کن")).toBeVisible();
  });

  it("shows an honest empty state before admin publication", () => {
    state.items = [];
    render(<ProductUpdatesPage />);
    expect(screen.getByText("هنوز موردی منتشر نشده است")).toBeVisible();
  });
});
