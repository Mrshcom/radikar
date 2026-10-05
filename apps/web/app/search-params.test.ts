import { describe, expect, it } from "vitest";
import { jobFilterParsers } from "@/lib/job-filter-search-params";
import { tablePaginationParsers } from "@/lib/table-pagination-search-params";
import {
  createTableFilterParser,
  modelUsageDaysParser,
  tableOptionalFilterParser,
  tableSearchParser,
} from "@/lib/table-search-params";

describe("URL search parameter parsers", () => {
  it("round-trips valid table pagination and rejects malformed bounds", () => {
    expect(tablePaginationParsers.page.parse("7")).toBe(7);
    expect(tablePaginationParsers.page.serialize(7)).toBe("7");
    for (const invalid of ["0", "-1", "1.2", "x", ""]) expect(tablePaginationParsers.page.parse(invalid)).toBeNull();
    expect(tablePaginationParsers.pageSize.parse("50")).toBe(50);
    expect(tablePaginationParsers.pageSize.parse("25")).toBeNull();
  });

  it("normalizes search/filter strings and rejects unsupported options", () => {
    expect(tableSearchParser.parse("  React  ")).toBe("React");
    expect(tableOptionalFilterParser.parse("x".repeat(101))).toBeNull();
    const parser = createTableFilterParser(["paid", "pending"] as const);
    expect(parser.parse("paid")).toBe("paid");
    expect(parser.parse("unknown")).toBeNull();
    expect(modelUsageDaysParser.parse("90")).toBe(90);
    expect(modelUsageDaysParser.parse("8")).toBeNull();
  });

  it("accepts only safe job filters, dates and match bounds", () => {
    expect(jobFilterParsers.query.parse("React")).toBe("React");
    expect(jobFilterParsers.scope.parse("remote")).toBe("remote");
    expect(jobFilterParsers.scope.parse("evil")).toBeNull();
    expect(jobFilterParsers.minMatch.parse("95")).toBe(95);
    for (const invalid of ["-1", "96", "1.5", "x"]) expect(jobFilterParsers.minMatch.parse(invalid)).toBeNull();
    expect(jobFilterParsers.fromDate.parse("2026-02-28")).toBe("2026-02-28");
    for (const invalid of ["2026-02-30", "2026/02/28", "2026-2-28"])
      expect(jobFilterParsers.fromDate.parse(invalid)).toBeNull();
  });
});
