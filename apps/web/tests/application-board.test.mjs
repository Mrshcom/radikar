import assert from "node:assert/strict";
import test from "node:test";
import {
  moveApplicationToStage,
  synchronizeJobsWithApplicationBoard,
} from "../lib/application-board.ts";

const now = "2026-09-01T12:00:00.000Z";

function job(overrides = {}) {
  return {
    id: "job-1",
    company: "Acme",
    role: "Frontend Engineer",
    match: 82,
    place: "Remote",
    age: "امروز",
    tone: "green",
    letter: "A",
    description: "Build products",
    saved: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test("new job opportunities start in the saved application column", () => {
  const result = synchronizeJobsWithApplicationBoard([job()], []);

  assert.equal(result.additions.length, 1);
  assert.deepEqual(result.applications[0], {
    id: "application-job-1",
    jobId: "job-1",
    role: "Frontend Engineer",
    company: "Acme",
    stage: "saved",
    match: 82,
    createdAt: now,
    updatedAt: now,
  });
});

test("board synchronization neither duplicates linked jobs nor restores dismissed ones", () => {
  const existing = {
    ...synchronizeJobsWithApplicationBoard([job()], []).applications[0],
    stage: "applied",
    appliedAt: now,
  };
  const linked = synchronizeJobsWithApplicationBoard([job()], [existing]);
  const dismissed = synchronizeJobsWithApplicationBoard(
    [job({ applicationBoardDismissedAt: now })],
    [{ ...existing, stage: "saved" }],
  );

  assert.equal(linked.additions.length, 0);
  assert.equal(linked.applications.length, 1);
  assert.equal(dismissed.additions.length, 0);
  assert.equal(dismissed.applications.length, 0);
});

test("applications can move forward, backward, and reset to saved", () => {
  const saved = synchronizeJobsWithApplicationBoard([job()], []).applications[0];
  const appliedAt = "2026-09-02T09:00:00.000Z";
  const reviewedAt = "2026-09-03T09:00:00.000Z";

  const applied = moveApplicationToStage(saved, "applied", appliedAt);
  const reviewed = moveApplicationToStage(applied, "review", reviewedAt);
  const reset = moveApplicationToStage(reviewed, "saved", reviewedAt);

  assert.equal(applied.appliedAt, appliedAt);
  assert.equal(reviewed.appliedAt, appliedAt);
  assert.equal(reset.stage, "saved");
  assert.equal(reset.appliedAt, undefined);
});
