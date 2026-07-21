import assert from "node:assert/strict";
import test from "node:test";

import { TokenRange } from "../src/index.js";

test("TokenRange exposes from/to as accessor methods (Java parity)", () => {
  const r = new TokenRange(3, 7);
  assert.equal(r.from(), 3);
  assert.equal(r.to(), 7);
});

test("TokenRange preserves the (inclusive, exclusive) contract", () => {
  // The Java javadoc declares `from` as inclusive and `to` as exclusive.
  // The class itself doesn't enforce length, but the half-open range
  // length is `to - from`.
  const r = new TokenRange(10, 14);
  assert.equal(r.to() - r.from(), 4);
});

test("TokenRange permits an empty range (from === to)", () => {
  const r = new TokenRange(5, 5);
  assert.equal(r.from(), 5);
  assert.equal(r.to(), 5);
});
