import { describe, expect, it } from "vitest";
import { emptyResumeData, getDefaultResumeColor, getResumeEducations, getResumeProjects, resumeColorOptions, resumeTemplates, supportsResumeColors } from "@/app/(panel)/resumes/resume-data";
import { getResumeFlowSections, getResumePaginationFlows, getResumePaginationProfile, getResumeSectionFlow } from "@/app/(panel)/resumes/resume-pagination-profile";
import { getRenderedPageLayout } from "@/app/(panel)/resumes/resume-pagination-layout";

describe("resume template and pagination edge cases", () => {
  it("resolves every template and its color capability deterministically", () => {
    for (const template of resumeTemplates) {
      expect(getDefaultResumeColor(template.id)).toBeTruthy();
      if (supportsResumeColors(template.id)) expect(resumeColorOptions.map((color) => color.id)).toContain(getDefaultResumeColor(template.id));
    }
  });
  it("converts legacy education and filters empty projects", () => {
    expect(getResumeEducations({ ...emptyResumeData, education: "کارشناسی نرم‌افزار\nکارشناسی ارشد" })).toHaveLength(2);
    expect(getResumeProjects({ ...emptyResumeData, projects: [{ id: "x", name: "", role: "", url: "", startDate: "", endDate: "", isCurrent: false, description: "", technologies: "" }] })).toEqual([]);
  });
  it("maps profiles to flows and measures overflowing rendered columns", () => {
    const profile = getResumePaginationProfile("designer-sidebar");
    expect(getResumePaginationFlows(profile)).toEqual(["main", "sidebar"]); expect(getResumeFlowSections(profile, "sidebar")).toContain("skills"); expect(getResumeSectionFlow(profile, "skills")).toBe("sidebar");
    const page = document.createElement("article"); const flow = document.createElement("main"); const content = document.createElement("p"); flow.append(content); page.append(flow); document.body.append(page);
    Object.defineProperty(page, "getBoundingClientRect", { value: () => ({ top: 0, bottom: 1122, height: 1122 }) }); Object.defineProperty(flow, "offsetParent", { value: document.body }); Object.defineProperty(content, "offsetParent", { value: flow }); Object.defineProperty(content, "getBoundingClientRect", { value: () => ({ top: 20, bottom: 1110 }) });
    expect(getRenderedPageLayout(page).fits).toBe(false); page.remove();
  });
});
