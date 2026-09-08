import assert from "node:assert/strict";
import test from "node:test";
import { hasJobActivityInDateRange } from "../lib/job-application-filter.ts";

const job = { role: "Frontend Engineer", company: "Example Co" };
const applications = [
  {
    role: " frontend   engineer ",
    company: "EXAMPLE CO",
    appliedAt: "2026-08-20T12:00:00.000Z",
  },
];

test("application date filtering is inclusive and matches normalized job identity", () => {
  assert.equal(hasJobActivityInDateRange(job, applications, "", ""), true);
  assert.equal(
    hasJobActivityInDateRange(job, applications, "2026-08-20", "2026-08-20"),
    true,
  );
  assert.equal(
    hasJobActivityInDateRange(job, applications, "2026-08-21", ""),
    false,
  );
  assert.equal(
    hasJobActivityInDateRange(
      { ...job, company: "Different Co" },
      applications,
      "2026-08-01",
      "2026-08-31",
    ),
    false,
  );
});

test("uses the date shown on a job card when no linked application exists", () => {
  const datedJob = {
    id: "job-1",
    role: "Frontend Engineer",
    company: "Example Co",
    createdAt: "2026-08-31T10:00:00.000Z",
  };

  assert.equal(
    hasJobActivityInDateRange(datedJob, [], "2026-08-31", "2026-08-31"),
    true,
  );
  assert.equal(
    hasJobActivityInDateRange(datedJob, [], "2026-09-01", "2026-09-10"),
    false,
  );
});

test("matches linked applications by stable job id", () => {
  const datedJob = {
    id: "job-1",
    role: "Frontend Engineer",
    company: "Example Co",
    createdAt: "2026-08-20T10:00:00.000Z",
  };
  const linkedApplications = [
    {
      jobId: "job-1",
      role: "Renamed role",
      company: "Renamed company",
      appliedAt: "2026-08-31T10:00:00.000Z",
    },
  ];

  assert.equal(
    hasJobActivityInDateRange(
      datedJob,
      linkedApplications,
      "2026-08-31",
      "2026-08-31",
    ),
    true,
  );
});
