import assert from "node:assert/strict";
import test from "node:test";
import { jobFilterParsers } from "../lib/job-filter-search-params.ts";

test("job URL filter parsers reject invalid values", () => {
  assert.equal(jobFilterParsers.minMatch.parse("43"), 43);
  assert.equal(jobFilterParsers.minMatch.parse("96"), null);
  assert.equal(jobFilterParsers.minMatch.parse("12.5"), null);
  assert.equal(jobFilterParsers.scope.parse("remote"), "remote");
  assert.equal(jobFilterParsers.scope.parse("unknown"), null);
  assert.equal(jobFilterParsers.fromDate.parse("2026-08-31"), "2026-08-31");
  assert.equal(jobFilterParsers.fromDate.parse("2026-02-31"), null);
  assert.equal(jobFilterParsers.fromDate.parse("not-a-date"), null);
});
