import { describe, expect, it } from "vitest";
import { addCalendarDays, getPersianMonthDays, parseLocalIsoDate, shiftPersianMonth, toLocalIsoDate } from "@/lib/jalali-date";
import { inferJobCategories, matchesJobCategory } from "@/lib/job-category";
import { createSavedApplicationForJob, moveApplicationToStage, synchronizeJobsWithApplicationBoard } from "@/lib/application-board";
import { calculateKnowledgeCompletion } from "@/lib/knowledge-completion";
import { buildQueryString } from "@/lib/build-query-string";
import { getLinkedInJobId, resolveJobUrls } from "@/lib/job-url";
import { parseResumeSkills, serializeResumeSkills } from "@/lib/resume-skills";
import { emptyResumeData, getDefaultResumeColor, getResumeExperiences, paginateResumeData, supportsResumeColors } from "@/app/(panel)/resumes/resume-data";
import { enforceResumeSectionFlow, hasResumeSectionFlowViolation } from "@/app/(panel)/resumes/resume-section-flow";
import { syncRenderedResumeSectionHeadings } from "@/app/(panel)/resumes/resume-section-heading-visibility";

describe("critical shared utilities", () => {
  it("handles Jalali calendar boundaries and safe ISO dates", () => {
    const date = parseLocalIsoDate("2026-03-21")!;
    expect(toLocalIsoDate(addCalendarDays(date, 1))).toBe("2026-03-22");
    expect(parseLocalIsoDate("bad")).toBeUndefined();
    expect(getPersianMonthDays(date).length).toBeGreaterThanOrEqual(29);
    expect(shiftPersianMonth(date, 1)).toBeInstanceOf(Date);
  });
  it("classifies jobs, preserves application state and completes knowledge", () => {
    expect([...inferJobCategories({ place: "Tehran", description: "remote" })]).toEqual(expect.arrayContaining(["domestic", "remote"]));
    expect(matchesJobCategory({ place: "Berlin" }, "international")).toBe(true);
    const job: any = { id: "j", role: "Dev", company: "R", createdAt: "x", updatedAt: "x", saved: true };
    const saved = createSavedApplicationForJob(job); expect(saved.stage).toBe("saved");
    expect(moveApplicationToStage(saved, "interview", "y").stage).toBe("interview");
    expect(synchronizeJobsWithApplicationBoard([job], []).applications).toHaveLength(1);
    expect(calculateKnowledgeCompletion({ resumeData: { fullName: "A", jobTitle: "Dev" }, skills: ["React"], experiences: [], projects: [], qualifications: [], languageItems: [] } as any)).toBeGreaterThan(0);
  });
  it("builds safe URLs and normalizes resume skills", () => {
    expect(buildQueryString({ search: "a b", page: 2, none: "" })).toBe("search=a+b&page=2");
    const linkedIn = new URL("https://www.linkedin.com/jobs/view/123456/");
    expect(getLinkedInJobId(linkedIn)).toBe("123456");
    expect(resolveJobUrls(linkedIn).sourceUrl.toString()).toContain("123456");
    expect(parseResumeSkills("React, TypeScript، React")).toEqual(["React", "TypeScript", "React"]);
    expect(serializeResumeSkills(["React", "Next.js"])).toBe("React, Next.js");
  });
});

describe("resume data and continuation logic", () => {
  it("supports templates, legacy data and multi-page section flow", () => {
    expect(getDefaultResumeColor("timeline-classic")).toBeTruthy(); expect(supportsResumeColors("timeline-classic")).toBe(true);
    const legacy = { ...emptyResumeData, experienceTitle: "Dev", company: "Radikar", experienceDate: "2020 تا اکنون", experience: "ساخت محصول" };
    expect(getResumeExperiences(legacy)[0].isCurrent).toBe(true);
    const dense = { ...emptyResumeData, fullName: "A", experiences: Array.from({ length: 12 }, (_, index) => ({ id: String(index), jobTitle: "Dev", company: "R", location: "", startDate: "", endDate: "", isCurrent: false, description: "x".repeat(400), technologies: "React" })), educations: [{ id: "e", institution: "U", credential: "CS", startDate: "", endDate: "", isCurrent: false }] };
    const pages = paginateResumeData(dense, "simple-one-column"); expect(pages.length).toBeGreaterThan(1); expect(hasResumeSectionFlowViolation(pages)).toBe(false);
    const broken = [{ ...dense, experiences: [dense.experiences[0]], educations: dense.educations }, { ...dense, experiences: [dense.experiences[1]], educations: [] }];
    expect(hasResumeSectionFlowViolation(broken)).toBe(true); expect(hasResumeSectionFlowViolation(enforceResumeSectionFlow(broken))).toBe(false);
  });
  it("hides repeated headings on rendered continuation pages", () => {
    const first = document.createElement("section"); first.innerHTML = '<div data-resume-section-heading><h2>Skills</h2></div>';
    const second = document.createElement("section"); second.innerHTML = '<div data-resume-section-heading><h2>Skills</h2></div>';
    syncRenderedResumeSectionHeadings([first, second], [{ ...emptyResumeData, skills: "React" }, { ...emptyResumeData, skills: "TypeScript" }]);
    expect((second.querySelector("[data-resume-section-heading]") as HTMLElement).hidden).toBe(true);
  });
});
