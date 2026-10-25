import { describe, expect, it } from "vitest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("public search routes", () => {
  it("keeps the interview landing crawlable while blocking the private interview routes", () => {
    const rules = robots().rules;
    const publicRule = Array.isArray(rules) ? rules[0] : rules;
    const disallowed = [publicRule.disallow].flat().filter((path): path is string => typeof path === "string");
    const isBlocked = (path: string) =>
      disallowed.some((rule) =>
        rule.endsWith("$") ? path === rule.slice(0, -1) : path.startsWith(rule),
      );

    expect(isBlocked("/interview-practice")).toBe(false);
    expect(isBlocked("/interview")).toBe(true);
    expect(isBlocked("/interview?session=example")).toBe(true);
    expect(isBlocked("/interview/results/example")).toBe(true);
  });

  it("lists only public canonical URLs without an invented last-modified date", () => {
    const entries = sitemap();
    expect(entries.map((entry) => entry.url)).toContain("https://radikar.ir/interview-practice");
    expect(entries.map((entry) => entry.url)).not.toContain("https://radikar.ir/interview");
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
  });
});
