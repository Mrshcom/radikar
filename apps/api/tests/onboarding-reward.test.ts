import assert from "node:assert/strict";
import test from "node:test";
import { getOnboardingCompletedSteps, onboardingRewardSteps } from "../src/modules/radicoin/onboarding-reward";

const record = (collection: string, fields: Record<string, unknown> = {}) => ({
  collection,
  payload: { id: collection, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", ...fields },
});
const completedRecords = [
  record("knowledgeProfiles", { skills: "React" }),
  record("resumes", { data: { fullName: "کاربر" } }),
  record("matchAnalyses"),
  record("applications"),
  record("interviewSessions", { report: { questions: [{ score: 70 }] }, feedbacks: [] }),
];

test("onboarding accepts the new final interview report and requires a confirmed referral", () => {
  assert.deepEqual(getOnboardingCompletedSteps(completedRecords, true, "profile-default"), onboardingRewardSteps);
  assert.deepEqual(
    getOnboardingCompletedSteps(completedRecords, false, "profile-default"),
    onboardingRewardSteps.filter((step) => step !== "referral"),
  );
});

test("onboarding ignores empty interview sessions and preserves old feedback compatibility", () => {
  assert.deepEqual(
    getOnboardingCompletedSteps(
      [record("interviewSessions", { feedbacks: [], report: { questions: [] } })],
      false,
      "profile-default",
    ),
    [],
  );
  assert.deepEqual(
    getOnboardingCompletedSteps(
      [record("interviewSessions", { feedbacks: [{ text: "بازخورد" }] })],
      false,
      "profile-default",
    ),
    ["interview"],
  );
});

test("onboarding checks the active workspace and does not trust completion flags", () => {
  assert.deepEqual(getOnboardingCompletedSteps(completedRecords, false, "other-profile"), []);
  assert.deepEqual(
    getOnboardingCompletedSteps(
      [record("workspaceState", { status: "completed", completedSteps: onboardingRewardSteps })],
      false,
      "profile-default",
    ),
    [],
  );
});
