import assert from "node:assert/strict";
import test from "node:test";
import { inferJobCategories, matchesJobCategory } from "../lib/job-category.ts";

test("infers job categories from the ad text and location", () => {
  assert.equal(
    matchesJobCategory(
      { place: "", description: "این موقعیت به‌صورت دورکاری ارائه می‌شود." },
      "remote",
    ),
    true,
  );
  assert.equal(
    matchesJobCategory(
      { place: "", description: "محل کار: تهران، ایران" },
      "domestic",
    ),
    true,
  );
  assert.equal(
    matchesJobCategory(
      { place: "", description: "Join our engineering team in South Africa." },
      "international",
    ),
    true,
  );
  assert.equal(
    matchesJobCategory(
      { place: "Berlin, Germany", description: "Frontend Engineer" },
      "international",
    ),
    true,
  );
});

test("does not treat every English job description as international", () => {
  assert.deepEqual(
    [...inferJobCategories({ place: "", description: "Senior React Developer" })],
    [],
  );
});

test("a worldwide remote job can belong to both relevant filters", () => {
  assert.deepEqual(
    [
      ...inferJobCategories({
        description: "This is a fully remote role open worldwide.",
      }),
    ].sort(),
    ["international", "remote"],
  );
});
