import assert from "node:assert/strict";
import test from "node:test";
import { prioritizeSavedJobs } from "../lib/job-order.ts";

test("saved jobs come first without mutating or reordering either group", () => {
  const jobs = [
    { id: "regular-1", saved: false },
    { id: "saved-1", saved: true },
    { id: "regular-2" },
    { id: "saved-2", saved: true },
  ];

  const prioritized = prioritizeSavedJobs(jobs);

  assert.deepEqual(
    prioritized.map((job) => job.id),
    ["saved-1", "saved-2", "regular-1", "regular-2"],
  );
  assert.deepEqual(
    jobs.map((job) => job.id),
    ["regular-1", "saved-1", "regular-2", "saved-2"],
  );
});
