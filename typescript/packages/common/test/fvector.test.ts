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

function assertVectorAlmostEqual(actual: FVector, expected: readonly number[]): void {
  assert.equal(actual.dim(), expected.length);

  expected.forEach((value, index) => {
    assertAlmostEqual(actual.get(index), value);
  });
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

test("FVector supports in-place arithmetic and scalar transforms", () => {
  const vector = new FVector([1, -2, 3]);

  vector.abs();
  vector.add(2);
  vector.add(new Float32Array([1, 1, 1]));
  vector.addScaled(new FVector([2, 4, 6]), 0.5);
  vector.subtract(new FVector([1, 2, 3]));
  vector.mult(2);
  vector.div(4);
  vector.raiseToPower(2);
  vector.sqrt();
  vector.sign();

  assert.deepEqual(vector.toArray(), [1, 1, 1]);
});

test("FVector supports point updates and vector products", () => {
  const vector = new FVector([1, 2, 3]);

  vector.addToEntry(1, 5);
  assert.equal(vector.get(1), 7);

  vector.hadamardProduct(new FVector([2, 3, 4]));
  assert.deepEqual(vector.toArray(), [2, 21, 12]);

  vector.elementwiseDivision(new FVector([2, 3, 4]));
  assert.deepEqual(vector.toArray(), [1, 7, 3]);
  assert.equal(vector.dot(new FVector([1, 0, 1])), 4);
  assert.equal(vector.dotSparse([0, 2]), 4);
  assert.equal(vector.dotSparse([0, 1], 1), 10);
});

test("FVector reports extrema, aggregate values, and NaN presence", () => {
  const vector = new FVector([-5, 3, 3, 0]);

  assert.equal(vector.argMax(), 1);
  assert.equal(vector.argMaxRand(), 1);
  assert.equal(vector.argMin(), 0);
  assert.equal(vector.argMinRand(), 0);
  assert.equal(vector.max(), 3);
  assert.equal(vector.min(), -5);
  assert.equal(vector.sum(), 1);
  assertAlmostEqual(vector.mean(), 0.25);
  assertAlmostEqual(vector.norm(), Math.sqrt(43));
  assert.equal(vector.containsNaN(), false);

  const withNaN = new FVector([1, Number.NaN]);
  assert.equal(withNaN.containsNaN(), true);
});

test("FVector normalise() and softmax() preserve probability semantics", () => {
  const zeroVector = new FVector(4);
  zeroVector.normalise();
  assertVectorAlmostEqual(zeroVector, [0.25, 0.25, 0.25, 0.25]);

  const softmax = new FVector([1, 2, 3]);
  softmax.softmax();
  assertAlmostEqual(softmax.sum(), 1);
  assert.equal(softmax.argMax(), 2);

  softmax.updateSoftmaxInvalidate(2);
  assertAlmostEqual(softmax.get(2), 0);
  assertAlmostEqual(softmax.sum(), 1);

  const tempered = new FVector([1, 2, 3]);
  tempered.softmax(0.5);
  assertAlmostEqual(tempered.sum(), 1);
  assert.equal(tempered.argMax(), 2);
});

test("FVector supports deterministic sampling invariants", () => {
  const degenerateDistribution = new FVector([0, 0, 1]);
  assert.equal(degenerateDistribution.sampleFromDistribution(), 2);
  assert.equal(degenerateDistribution.sampleProportionally(), 2);

  const zeroDistribution = new FVector(1);
  assert.equal(zeroDistribution.sampleProportionally(), 0);
});

test("FVector exposes range and structural editing helpers", () => {
  const vector = new FVector([1, 2, 3, 4]);

  assert.deepEqual(vector.range(1, 3).toArray(), [2, 3]);
  assert.deepEqual(vector.append(5).toArray(), [1, 2, 3, 4, 5]);
  assert.deepEqual(vector.cut(1).toArray(), [1, 3, 4]);
  assert.deepEqual(vector.cut(1, 3).toArray(), [1, 4]);
  assert.deepEqual(vector.insert(2, 9).toArray(), [1, 2, 9, 3, 4]);
  assert.deepEqual(vector.insert(1, [7, 8]).toArray(), [1, 7, 8, 2, 3, 4]);
});

test("FVector.copyFrom() and copy() preserve independence", () => {
  const source = new FVector([1, 2, 3, 4]);
  const destination = new FVector([0, 0, 0, 0]);

  destination.copyFrom(source, 1, 0, 3);
  assert.deepEqual(destination.toArray(), [2, 3, 4, 0]);

  const copy = source.copy();
  source.set(0, 99);
  assert.equal(copy.get(0), 1);
});

test("FVector static helpers compute cross-vector values", () => {
  const a = new FVector([1, 2]);
  const b = new FVector([3, 4]);

  assert.deepEqual(FVector.concat(a, b).toArray(), [1, 2, 3, 4]);
  assert.deepEqual(FVector.elementwiseMax(a, b).toArray(), [3, 4]);
  assert.deepEqual(FVector.mean([a, b]).toArray(), [2, 3]);

  const trueDist = new FVector([0.25, 0.75]);
  const estDist = new FVector([0.5, 0.5]);
  assertAlmostEqual(
    FVector.crossEntropy(trueDist, estDist),
    -0.25 * Math.log(0.5) - 0.75 * Math.log(0.5),
  );
  assertAlmostEqual(
    FVector.klDivergence(trueDist, estDist),
    -0.25 * Math.log(0.5 / 0.25) - 0.75 * Math.log(0.5 / 0.75),
  );
});

test("FVector string helpers match the Java-style textual format", () => {
  const vector = new FVector([1, 2, 3]);

  assert.equal(vector.toLine(), "1,2,3");
  assert.equal(vector.toString(), "[1,2,3]");
  assert.equal(vector.equals(new FVector([1, 2, 3])), true);
  assert.equal(vector.equals(new FVector([1, 2, 4])), false);
  assertAlmostEqual(new FVector([0.5, 0.5]).normalisedEntropy(), 1);
});
