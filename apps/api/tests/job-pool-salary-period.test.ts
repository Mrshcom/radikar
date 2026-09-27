import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectSalaryPeriod } from "../src/modules/job-pool/service";

describe("job pool salary period detection", () => {
  it("prioritizes an explicit monthly compensation range", () => {
    assert.equal(detectSalaryPeriod("3,217 EUR/month - 4,077 EUR/month", "annual benefits are included"), "monthly");
  });

  it("recognizes K amounts above the annual threshold as yearly", () => {
    assert.equal(detectSalaryPeriod("Compensation Range: €94K - €142K"), "yearly");
  });

  it("uses an explicit annual period when the amount is smaller", () => {
    assert.equal(detectSalaryPeriod("€4,000 per year"), "yearly");
  });

  it("does not mistake unrelated year mentions in a job description for annual pay", () => {
    assert.equal(detectSalaryPeriod(["$3217.00", "$4077.00"], null, null, null, "From year 4 onwards, tasks are transferred."), "monthly");
  });
});
