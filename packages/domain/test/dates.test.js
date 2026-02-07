import assert from "node:assert/strict";
import test from "node:test";

import {
  formatChartDate,
  parseIsoCalendarDateToLocalDate,
} from "../dist/index.js";

test("parseIsoCalendarDateToLocalDate: maps ISO calendar date to local Date", () => {
  const d = parseIsoCalendarDateToLocalDate("2026-01-22T00:00:00.000Z");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 0); // Jan = 0
  assert.equal(d.getDate(), 22);
});

test("parseIsoCalendarDateToLocalDate: does not throw on unexpected inputs", () => {
  assert.doesNotThrow(() => parseIsoCalendarDateToLocalDate("2026-01-22"));
  assert.doesNotThrow(() => parseIsoCalendarDateToLocalDate("not-a-date"));
});

test("formatChartDate: returns both short and full strings", () => {
  const d = new Date(2026, 1, 7); // Feb 7, 2026 (local)
  const res = formatChartDate(d);
  assert.equal(typeof res.short, "string");
  assert.equal(typeof res.full, "string");
  assert.ok(res.short.length > 0);
  assert.ok(res.full.length > 0);
});
