import assert from "node:assert/strict";
import test from "node:test";
import {
  getPersianDateParts,
  getPersianMonthDays,
  shiftPersianMonth,
  toLocalIsoDate,
} from "../lib/jalali-date.ts";

test("maps Gregorian ISO dates to the Persian calendar", () => {
  const nowruz = new Date(2026, 2, 21, 12);
  assert.deepEqual(getPersianDateParts(nowruz), { year: 1405, month: 1, day: 1 });
  assert.equal(toLocalIsoDate(nowruz), "2026-03-21");
});

test("builds and navigates Persian calendar months", () => {
  const farvardin = getPersianMonthDays(new Date(2026, 2, 25, 12));
  assert.equal(farvardin.length, 31);
  assert.equal(toLocalIsoDate(farvardin[0]), "2026-03-21");
  assert.deepEqual(getPersianDateParts(shiftPersianMonth(farvardin[0], -1)), {
    year: 1404,
    month: 12,
    day: 29,
  });
});
