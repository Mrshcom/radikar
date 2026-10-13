import { describe, expect, it } from "vitest";
import type { ProductTimelineEntry } from "@radikar/shared-types";
import { isStoryFresh } from "../lib/product-timeline";

const entry: ProductTimelineEntry = {
  id: "entry-1",
  kind: "feature",
  phaseId: "phase-1",
  title: "قابلیت تازه",
  summary: "شرح قابلیت",
  status: "completed",
  sortOrder: 0,
  storySlides: [{ title: "اسلاید", body: "متن استوری" }],
  publishedAt: "2026-10-01T12:00:00.000Z",
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
};

describe("isStoryFresh", () => {
  it("keeps a published story in fresh stories for seven days", () => {
    expect(isStoryFresh(entry, new Date("2026-10-08T11:59:59.999Z"))).toBe(true);
    expect(isStoryFresh(entry, new Date("2026-10-08T12:00:00.000Z"))).toBe(false);
  });

  it("never marks drafts, phases or future posts as fresh", () => {
    expect(isStoryFresh({ ...entry, publishedAt: null }, new Date("2026-10-02T12:00:00.000Z"))).toBe(false);
    expect(isStoryFresh({ ...entry, kind: "phase" }, new Date("2026-10-02T12:00:00.000Z"))).toBe(false);
    expect(isStoryFresh(entry, new Date("2026-09-30T12:00:00.000Z"))).toBe(false);
  });
});
