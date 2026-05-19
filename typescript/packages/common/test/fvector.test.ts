import assert from "node:assert/strict";
import test from "node:test";

import { FVector } from "../src/index.js";

const FLOAT_TOLERANCE = 0.0001;

function assertAlmostEqual(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) <= FLOAT_TOLERANCE,
    `${actual} != ${expected}`,
  );
}

test("FVector.linspace() matches the inclusive Java contract", () => {
  const linspace = FVector.linspace(0, 1, 4, true);

  assert.equal(linspace.dim(), 4);
  assertAlmostEqual(linspace.get(0), 0 / 3);
  assertAlmostEqual(linspace.get(1), 1 / 3);
  assertAlmostEqual(linspace.get(2), 2 / 3);
  assertAlmostEqual(linspace.get(3), 3 / 3);
});

test("FVector.linspace() matches the exclusive Java contract", () => {
  const linspace = FVector.linspace(0, 1, 4, false);

  assert.equal(linspace.dim(), 4);
  assertAlmostEqual(linspace.get(0), 0 / 4);
  assertAlmostEqual(linspace.get(1), 1 / 4);
  assertAlmostEqual(linspace.get(2), 2 / 4);
  assertAlmostEqual(linspace.get(3), 3 / 4);
});

test("FVector.wrap() reuses a Float32Array backing store", () => {
  const raw = new Float32Array([1, 2, 3]);
  const wrapped = FVector.wrap(raw);

  raw[1] = 5;

  assert.equal(wrapped.get(1), 5);
});
