import assert from "node:assert/strict";
import test from "node:test";
import {
  getHashGenerator,
  getNext,
  getSequence,
  INITIAL_VALUE,
  UNKNOWN,
  ZobristHashGenerator,
} from "../src/index.js";

test("INITIAL_VALUE is 0n and UNKNOWN is -1n (matching Java long -1L)", () => {
  assert.equal(INITIAL_VALUE, 0n);
  assert.equal(UNKNOWN, -1n);
});

test("getHashGenerator returns a fresh deterministic generator", () => {
  const g1 = getHashGenerator();
  const g2 = getHashGenerator();
  assert.equal(g1.next(), g2.next());
});

test("getNext advances the generator by one", () => {
  const gen = new ZobristHashGenerator();
  const direct = gen.next();
  const gen2 = new ZobristHashGenerator();
  const via = getNext(gen2);
  assert.equal(direct, via);
});

test("getSequence(gen, dim) draws dim values and advances the generator", () => {
  const gen = new ZobristHashGenerator();
  const arr = getSequence(gen, 5);
  assert.equal(arr.length, 5);
  assert.equal(gen.getSequencePosition(), 5);

  // Each value in the array should match what a fresh generator produces
  const verify = new ZobristHashGenerator();
  for (let i = 0; i < 5; i += 1) {
    assert.equal(arr[i], verify.next());
  }
});

test("getSequence(gen, dim1, dim2) produces dim1 rows of dim2 columns", () => {
  const gen = new ZobristHashGenerator();
  const matrix = getSequence(gen, 3, 4);
  assert.equal(matrix.length, 3);
  for (const row of matrix) {
    assert.equal(row.length, 4);
  }
  assert.equal(gen.getSequencePosition(), 12);
});

test("getSequence(gen, dim1, dim2, dim3) fills a 3-D array correctly", () => {
  const gen = new ZobristHashGenerator();
  const cube = getSequence(gen, 2, 3, 4);
  assert.equal(cube.length, 2);
  for (const mat of cube) {
    assert.equal(mat.length, 3);
    for (const row of mat) {
      assert.equal(row.length, 4);
    }
  }
  assert.equal(gen.getSequencePosition(), 24);
});

test("two getSequence calls on the same generator produce consecutive slices", () => {
  const gen = new ZobristHashGenerator();
  const first = getSequence(gen, 3);
  const second = getSequence(gen, 3);

  // Values should be different (non-overlapping slices)
  let allSame = true;
  for (let i = 0; i < 3; i += 1) {
    if (first[i] !== second[i]) {
      allSame = false;
      break;
    }
  }
  assert.equal(allSame, false);

  // A single call for 6 values should equal first + second concatenated
  const combined = new ZobristHashGenerator();
  const all6 = getSequence(combined, 6);
  for (let i = 0; i < 3; i += 1) {
    assert.equal(all6[i], first[i]);
    assert.equal(all6[i + 3], second[i]);
  }
});
