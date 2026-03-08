import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMixedCurrencyTotals,
  fromVesAmount,
  toVesAmount,
} from "../dist/index.js";

const rates = {
  usd: 40,
  eur: 50,
};

test("toVesAmount: converts supported currencies to bolivars", () => {
  assert.equal(toVesAmount(100, "VES", rates), 100);
  assert.equal(toVesAmount(2, "USD", rates), 80);
  assert.equal(toVesAmount(3, "EUR", rates), 150);
});

test("fromVesAmount: converts bolivars to supported currencies", () => {
  assert.equal(fromVesAmount(100, "VES", rates), 100);
  assert.equal(fromVesAmount(80, "USD", rates), 2);
  assert.equal(fromVesAmount(150, "EUR", rates), 3);
});

test("calculateMixedCurrencyTotals: sums mixed currencies using VES as base", () => {
  const totals = calculateMixedCurrencyTotals(
    [
      { amount: 10000, currency: "VES", operation: "add" },
      { amount: 20, currency: "USD", operation: "add" },
      { amount: 10, currency: "EUR", operation: "add" },
    ],
    rates,
  );

  assert.equal(totals.totalVes, 11300);
  assert.equal(totals.totalUsd, 282.5);
  assert.equal(totals.totalEur, 226);
});

test("calculateMixedCurrencyTotals: supports subtraction and negative totals", () => {
  const totals = calculateMixedCurrencyTotals(
    [
      { amount: 10, currency: "USD", operation: "add" },
      { amount: 30, currency: "EUR", operation: "subtract" },
    ],
    rates,
  );

  assert.equal(totals.totalVes, -1100);
  assert.equal(totals.totalUsd, -27.5);
  assert.equal(totals.totalEur, -22);
});
