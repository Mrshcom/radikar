import assert from "node:assert/strict";
import test from "node:test";
import {
  parseResumeSkills,
  serializeResumeSkills,
} from "../lib/resume-skills.ts";

test("separates whitespace-delimited technical skills extracted from a PDF", () => {
  assert.deepEqual(
    parseResumeSkills("ReactJS NextJS JavaScript TypeScript Node.js"),
    ["ReactJS", "NextJS", "JavaScript", "TypeScript", "Node.js"],
  );
});

test("preserves multi-word skills and accepts the preferred array response", () => {
  assert.deepEqual(parseResumeSkills("Project Management, React.js"), [
    "Project Management",
    "React.js",
  ]);
  assert.equal(
    serializeResumeSkills(["ReactJS", "NextJS", "JavaScript"]),
    "ReactJS, NextJS, JavaScript",
  );
});
