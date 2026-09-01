import assert from "node:assert/strict";
import test from "node:test";
import {
  getMatchAnalyzeConfig,
  mergeTailoredResume,
} from "../src/modules/ai/routes";

test("match analysis avoids reasoning models for bounded JSON output", () => {
  const previousProvider = process.env.LLM_PROVIDER;
  const previousModel = process.env.LLM_MODEL;
  try {
    process.env.LLM_PROVIDER = "freeDeepseekAPI";
    process.env.LLM_MODEL = "deepseek-reasoner";
    assert.equal(getMatchAnalyzeConfig().model, "deepseek-chat");
  } finally {
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = previousProvider;
    if (previousModel === undefined) delete process.env.LLM_MODEL;
    else process.env.LLM_MODEL = previousModel;
  }
});

test("tailored resume patches rewrite content without replacing factual fields", () => {
  const base = {
    fullName: "Ali Mohammadi",
    jobTitle: "Frontend Developer",
    email: "ali@example.com",
    phone: "09121234567",
    website: "https://linkedin.com/in/ali",
    summary: "Original summary",
    skills: "React, TypeScript",
    experiences: [
      {
        id: "experience-1",
        jobTitle: "Frontend Developer",
        company: "Example Co",
        startDate: "2022",
        endDate: "2024",
        description: "Original experience",
      },
    ],
    projects: [
      {
        id: "project-1",
        name: "Dashboard",
        url: "https://example.com",
        description: "Original project",
      },
    ],
    educations: [{ id: "education-1", institution: "University" }],
  };

  const result = mergeTailoredResume(base, {
    summary: "Tailored summary",
    skills: ["React", "Product analytics"],
    experiences: [
      {
        id: "experience-1",
        company: "Invented Company",
        description: "Tailored experience",
      },
    ],
    projects: [
      { id: "project-1", name: "Invented name", description: "Tailored project" },
    ],
    jobTitle: "Invented job title",
  });

  assert.equal(result.summary, "Tailored summary");
  assert.equal(result.skills, "React, Product analytics");
  assert.equal(result.jobTitle, "Frontend Developer");
  assert.equal(result.email, "ali@example.com");
  assert.equal(result.experiences[0].company, "Example Co");
  assert.equal(result.experiences[0].description, "Tailored experience");
  assert.equal(result.projects[0].name, "Dashboard");
  assert.equal(result.projects[0].description, "Tailored project");
  assert.equal(result.educations[0].institution, "University");
});

test("tailored resume rejects empty model patches", () => {
  assert.throws(
    () => mergeTailoredResume({ summary: "Existing" }, {}),
    /محتوای قابل استفاده‌ای/,
  );
});
