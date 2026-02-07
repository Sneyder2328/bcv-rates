import assert from "node:assert/strict";
import test from "node:test";

import { foreignToVes, vesToForeign } from "../dist/index.js";

test("vesToForeign: divides by rate", () => {
  assert.equal(vesToForeign(100, 10), 10);
});

test("foreignToVes: multiplies by rate", () => {
  assert.equal(foreignToVes(10, 10), 100);
});

test("conversion helpers: are inverse for finite positive rates", () => {
  const ves = 1234.56;
  const rate = 36.12;

  const foreign = vesToForeign(ves, rate);
  const backToVes = foreignToVes(foreign, rate);

  assert.ok(Math.abs(backToVes - ves) < 1e-10);
});
