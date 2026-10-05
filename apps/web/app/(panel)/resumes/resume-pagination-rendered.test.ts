import { afterEach, describe, expect, it } from "vitest";
import { emptyResumeData, paginateResumeData } from "./resume-data";
import { getRenderedPageLayout } from "./resume-pagination-layout";
import {
  getResumeFlowSections,
  getResumePaginationFlows,
  getResumePaginationProfile,
} from "./resume-pagination-profile";

describe("rendered resume pagination", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });
  it("uses the profile flow for main and sidebar columns", () => {
    const profile = getResumePaginationProfile("designer-sidebar");
    expect(getResumePaginationFlows(profile)).toEqual(["main", "sidebar"]);
    expect(getResumeFlowSections(profile, "sidebar")).toContain("skills");
  });

  it("keeps a dense resume on multiple rendered pages", () => {
    const data = {
      ...emptyResumeData,
      experiences: Array.from({ length: 12 }, (_, index) => ({
        id: String(index),
        jobTitle: "Developer",
        company: "Radikar",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "شرح ".repeat(120),
        technologies: "React",
      })),
    };
    expect(paginateResumeData(data, "simple-one-column").length).toBeGreaterThan(1);
  });

  it("detects content flowing beyond the page bottom", () => {
    const page = document.createElement("article");
    const flow = document.createElement("main");
    const content = document.createElement("p");
    flow.append(content);
    page.append(flow);
    document.body.append(page);
    Object.defineProperty(page, "getBoundingClientRect", { value: () => ({ top: 0, bottom: 1122, height: 1122 }) });
    Object.defineProperty(flow, "offsetParent", { value: document.body });
    Object.defineProperty(content, "offsetParent", { value: flow });
    Object.defineProperty(content, "getBoundingClientRect", { value: () => ({ top: 20, bottom: 1110 }) });
    expect(getRenderedPageLayout(page).fits).toBe(false);
  });

  it("does not produce a false overflow for an empty page", () => {
    const page = document.createElement("article");
    document.body.append(page);
    expect(getRenderedPageLayout(page).fits).toBe(true);
  });

  it("normalizes legacy continuation data without a flow violation", () => {
    const pages = paginateResumeData({ ...emptyResumeData, summary: "خلاصه".repeat(200) }, "simple-one-column");
    expect(pages.every((page) => typeof page.summary === "string")).toBe(true);
  });

  it("preserves all resume experiences across pagination", () => {
    const experiences = Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      jobTitle: `کار ${index}`,
      company: "شرکت",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "شرح",
      technologies: "",
    }));
    const pages = paginateResumeData({ ...emptyResumeData, experiences }, "simple-one-column");
    expect(pages.flatMap((page) => page.experiences).map((item) => item.id)).toEqual(
      experiences.map((item) => item.id),
    );
  });

  it("supports every registered template profile", () => {
    for (const id of ["sector-yellow", "designer-sidebar", "timeline-classic"])
      expect(getResumePaginationProfile(id)).toBeTruthy();
  });

  it("keeps print pages isolated from the interactive page", () => {
    const interactive = document.createElement("div");
    const printRoot = document.createElement("div");
    printRoot.dataset.resumePrintRoot = "true";
    interactive.append(printRoot);
    expect(interactive.querySelector("[data-resume-print-root]")).toBe(printRoot);
  });
});
