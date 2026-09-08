import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  createTableFilterParser,
  modelUsageDaysParser,
  tableSearchParser,
} from "../lib/table-search-params.ts";
import { tablePaginationParsers } from "../lib/table-pagination-search-params.ts";

test("table URL parsers validate pagination and page size", () => {
  assert.equal(tablePaginationParsers.page.parse("4"), 4);
  assert.equal(tablePaginationParsers.page.parse("0"), null);
  assert.equal(tablePaginationParsers.page.parse("2.5"), null);
  assert.equal(tablePaginationParsers.pageSize.parse("50"), 50);
  assert.equal(tablePaginationParsers.pageSize.parse("30"), null);
});

test("table URL parsers validate search, filters and report periods", () => {
  const statusParser = createTableFilterParser(["active", "suspended"]);
  assert.equal(tableSearchParser.parse("  علی  "), "علی");
  assert.equal(tableSearchParser.parse("x".repeat(101)), null);
  assert.equal(statusParser.parse("active"), "active");
  assert.equal(statusParser.parse("unknown"), null);
  assert.equal(modelUsageDaysParser.parse("90"), 90);
  assert.equal(modelUsageDaysParser.parse("60"), null);
});

test("every paginated table stores pagination and filters in URL state", () => {
  const tablePages = [
    "../app/(panel)/orders/page.tsx",
    "../app/(panel)/admin/orders/page.tsx",
    "../app/(panel)/admin/payments/page.tsx",
    "../app/(panel)/admin/records/page.tsx",
    "../app/(panel)/admin/users/page.tsx",
    "../app/(panel)/admin/memberships/page.tsx",
    "../app/(panel)/admin/model-usage/page.tsx",
  ];

  for (const path of tablePages) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /useUrlTablePagination\(\)/, path);
    assert.match(source, /useQueryStates\(/, path);
    assert.doesNotMatch(source, /useTablePageSize\(\)/, path);
    assert.doesNotMatch(source, /\[page,\s*setPage\]\s*=\s*useState/, path);
  }
});
