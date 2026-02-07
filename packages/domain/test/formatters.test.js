import assert from "node:assert/strict";
import test from "node:test";

import { formatAmount, formatRate, parseAmount } from "../dist/index.js";

test("parseAmount: returns null for empty/invalid inputs", () => {
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("   "), null);
  assert.equal(parseAmount("abc"), null);
  assert.equal(parseAmount("1,2,3"), null);
});

test("parseAmount: parses European/Latin formatting", () => {
  assert.equal(parseAmount("1.234,56"), 1234.56);
  assert.equal(parseAmount("  1.234,56  "), 1234.56);
  assert.equal(parseAmount("1 234,56"), 1234.56);
  assert.equal(parseAmount(",5"), 0.5);
});

test("parseAmount: parses US formatting", () => {
  assert.equal(parseAmount("1,234.56"), 1234.56);
  assert.equal(parseAmount("1234.56"), 1234.56);
  assert.equal(parseAmount(".5"), 0.5);
});

test("formatAmount: formats to es-VE style and round-trips via parseAmount", () => {
  const formatted = formatAmount(1234.56);
  const parsed = parseAmount(formatted);
  assert.ok(parsed !== null);
  assert.ok(Math.abs(parsed - 1234.56) < 1e-9);
});

test("formatRate: keeps at least 2 decimals and round-trips via parseAmount", () => {
  const formattedInt = formatRate(12);
  assert.ok(formattedInt.includes(","));
  assert.ok(formattedInt.endsWith("00"));

  const formatted = formatRate(12.3456789);
  const parsed = parseAmount(formatted);
  assert.ok(parsed !== null);
  assert.ok(Math.abs(parsed - 12.3456789) < 1e-9);
});
