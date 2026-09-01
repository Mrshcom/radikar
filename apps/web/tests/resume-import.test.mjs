import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeImportedResumeData,
  normalizeResumeImportPayload,
  sanitizeImportedImageSource,
  sanitizeImportedUrl,
} from "@radicar/validators";
import { normalizeResumeDataInput } from "../lib/resume-input.ts";
import { calculateKnowledgeCompletion } from "../lib/knowledge-completion.ts";
import {
  getResumeEducations,
  getResumeExperiences,
} from "../app/(panel)/resumes/resume-data.ts";

test("normalizes array and non-string fields returned by resume extraction", () => {
  const result = normalizeResumeImportPayload({
    resumeData: { fullName: ["سارا", "احمدی"], phone: 9123456789 },
    projects: [
      {
        name: "سامانه فروش",
        technologies: ["React", "TypeScript", { name: "PostgreSQL" }],
        isCurrent: "اکنون",
      },
    ],
    experiences: [{ technologies: ["Node.js", "Fastify"] }],
    languageItems: [{ languageName: "انگلیسی", proficiency: "حرفه‌ای" }],
  });

  assert.equal(result.resumeData.fullName, "سارا، احمدی");
  assert.equal(result.resumeData.phone, "9123456789");
  assert.equal(result.projects[0].technologies, "React، TypeScript، PostgreSQL");
  assert.equal(result.projects[0].isCurrent, true);
  assert.equal(result.experiences[0].technologies, "Node.js، Fastify");
  assert.equal(result.languageItems[0].name, "انگلیسی");
});

test("promotes structured collections nested inside resumeData", () => {
  const result = normalizeResumeImportPayload({
    resumeData: {
      projects: [{ name: "پروژه داخلی", technologies: ["Next.js"] }],
    },
  });

  assert.equal(result.projects[0].name, "پروژه داخلی");
  assert.equal(result.projects[0].technologies, "Next.js");
});

test("coerces wrapped, singular and JSON-encoded model fields", () => {
  const result = normalizeResumeImportPayload(
    JSON.stringify({
      data: {
        resume: {
          name: { value: "سارا احمدی" },
          title: ["Senior", "Engineer"],
          workExperience: {
            position: "توسعه‌دهنده",
            employer: "شرکت نمونه",
            stack: ["React", { name: "TypeScript" }],
          },
        },
        qualifications: "کارشناسی مهندسی نرم‌افزار",
        projects: {
          items: {
            projectName: "سامانه داخلی",
            link: "example.com/project",
            technologies: { value: "Next.js" },
          },
        },
        languageItems: "فارسی",
      },
    }),
  );

  assert.equal(result.resumeData.fullName, "سارا احمدی");
  assert.equal(result.resumeData.jobTitle, "Senior، Engineer");
  assert.equal(result.experiences.length, 1);
  assert.equal(result.experiences[0].jobTitle, "توسعه‌دهنده");
  assert.equal(result.experiences[0].technologies, "React، TypeScript");
  assert.equal(result.qualifications[0].credential, "کارشناسی مهندسی نرم‌افزار");
  assert.equal(result.projects[0].name, "سامانه داخلی");
  assert.equal(result.projects[0].url, "https://example.com/project");
  assert.equal(result.languageItems[0].name, "فارسی");
});

test("canonicalizes every resume field to its render-time type", () => {
  const resume = normalizeResumeDataInput({
    fullName: 123,
    summary: { text: "خلاصه حرفه‌ای" },
    website: ["example.com"],
    workExperience: JSON.stringify({
      role: "برنامه‌نویس",
      skills: ["React", "Node.js"],
    }),
    project: true,
    educationHistory: { university: "دانشگاه نمونه", degree: "کارشناسی" },
  });

  assert.equal(resume.fullName, "123");
  assert.equal(resume.summary, "خلاصه حرفه‌ای");
  assert.equal(resume.website, "https://example.com/");
  assert.equal(resume.experiences[0].jobTitle, "برنامه‌نویس");
  assert.equal(resume.experiences[0].technologies, "React، Node.js");
  assert.equal(resume.projects[0].name, "true");
  assert.equal(resume.educations[0].institution, "دانشگاه نمونه");
  assert.ok(Object.values(resume).every((value) => value !== undefined));
});

test("normalizes legacy stored resume data before rendering", () => {
  const result = normalizeImportedResumeData({
    summary: ["توسعه‌دهنده", "محصول"],
    projects: [{ name: "نمونه", technologies: ["React", "Zod"] }],
  });

  assert.equal(result.summary, "توسعه‌دهنده، محصول");
  assert.equal(result.projects?.[0].technologies, "React، Zod");
});

test("rejects unsafe links and strips hidden control characters", () => {
  const result = normalizeResumeImportPayload({
    resumeData: {
      fullName: "\u202Eنام امن\u0000",
      website: "javascript:alert(1)",
    },
    projects: [{ url: "data:text/html,<script>alert(1)</script>" }],
  });

  assert.equal(result.resumeData.fullName, "نام امن");
  assert.equal(result.resumeData.website, undefined);
  assert.equal(result.projects[0].url, undefined);
  assert.equal(sanitizeImportedUrl("example.com/profile"), "https://example.com/profile");
  assert.equal(sanitizeImportedUrl("LinkedIn Profile"), "");
  assert.equal(sanitizeImportedUrl("https://linkedinprofile/"), "");
  assert.equal(
    sanitizeImportedUrl("https://www.linkedin.com/in/mampel88/"),
    "https://www.linkedin.com/in/mampel88/",
  );
  assert.equal(sanitizeImportedUrl("https://www.linkedin.com/in/m…"), "");
  assert.equal(
    sanitizeImportedUrl("https://www.linkedin.com/in/m%E2%80%A6"),
    "",
  );
});

test("keeps sanitized optional resume fields render-safe", () => {
  const result = normalizeResumeDataInput({
    fullName: "کاربر آزمایشی",
    website: "",
    photoUrl: "//attacker.example/avatar.png",
    email: "invalid-email",
  });

  assert.equal(result.fullName, "کاربر آزمایشی");
  assert.equal(result.website, "");
  assert.equal(result.photoUrl, "");
  assert.equal(result.email, "");
});

test("preserves safe local template avatars and rejects protocol-relative images", () => {
  assert.equal(
    sanitizeImportedImageSource("/images/default-resume-profile.png"),
    "/images/default-resume-profile.png",
  );
  assert.equal(sanitizeImportedImageSource("//attacker.example/avatar.png"), "");
  assert.equal(
    normalizeResumeDataInput({
      photoUrl: "/images/default-resume-profile.png",
      skills: ["React", "TypeScript"],
      experiences: [{ technologies: ["Next.js", "Zod"] }],
    }).photoUrl,
    "/images/default-resume-profile.png",
  );
});

test("does not count untouched seeded projects as knowledge completion", () => {
  const completion = calculateKnowledgeCompletion({
    resumeData: {},
    experiences: [],
    qualifications: [],
    projects: [
      {
        id: "project-sample-example",
        name: "Example project",
        role: "Developer",
        url: "example.com",
        startDate: "2025",
        isCurrent: true,
        description: "Example description",
        technologies: "React",
      },
    ],
    languageItems: [],
  });

  assert.equal(completion, 0);
});

test("does not expose empty structured sections to resume templates", () => {
  const resume = normalizeResumeDataInput({
    experiences: [{}],
    educations: [{}],
  });

  assert.deepEqual(getResumeExperiences(resume), []);
  assert.deepEqual(getResumeEducations(resume), []);
});

test("bounds imported collections and creates a complete render-safe resume", () => {
  const result = normalizeResumeImportPayload({
    projects: Array.from({ length: 140 }, (_, index) => ({
      name: `پروژه ${index}`,
      technologies: index === 0 ? ["React", "Next.js"] : "TypeScript",
    })),
  });
  const resume = normalizeResumeDataInput({ projects: result.projects });

  assert.equal(result.projects.length, 100);
  assert.equal(resume.projects[0].technologies, "React، Next.js");
  assert.equal(typeof resume.projects[0].id, "string");
  assert.equal(resume.fullName, "");
});
