import assert from "node:assert/strict";
import test from "node:test";

import { ZobristHashGenerator } from "../src/index.js";

test("ZobristHashGenerator produces a deterministic sequence from the default seed", () => {
  const gen1 = new ZobristHashGenerator();
  const gen2 = new ZobristHashGenerator();

  const N = 20;
  const seq1: bigint[] = [];
  const seq2: bigint[] = [];

  for (let i = 0; i < N; i += 1) {
    seq1.push(gen1.next());
    seq2.push(gen2.next());
  }

  assert.deepEqual(seq1, seq2);
});

test("ZobristHashGenerator counter tracks call count", () => {
  const gen = new ZobristHashGenerator();
  assert.equal(gen.getSequencePosition(), 0);
  gen.next();
  gen.next();
  assert.equal(gen.getSequencePosition(), 2);
});

test("ZobristHashGenerator(pos) fast-forwards to position pos", () => {
  const N = 5;
  const genSlow = new ZobristHashGenerator();

  for (let i = 0; i < N; i += 1) {
    genSlow.next();
  }

  const genFast = new ZobristHashGenerator(N);
  assert.equal(genFast.getSequencePosition(), N);
  assert.equal(genFast.next(), genSlow.next());
});

test("ZobristHashGenerator produces 64-bit values (fits in signed 64-bit range)", () => {
  const MIN = -(1n << 63n);
  const MAX = (1n << 63n) - 1n;
  const gen = new ZobristHashGenerator();

  for (let i = 0; i < 100; i += 1) {
    const v = gen.next();
    assert.ok(v >= MIN && v <= MAX, `value ${v} out of signed 64-bit range`);
  }
});

test("ZobristHashGenerator values are unique (collision unlikely for small N)", () => {
  const gen = new ZobristHashGenerator();
  const N = 1000;
  const seen = new Set<bigint>();

  for (let i = 0; i < N; i += 1) {
    seen.add(gen.next());
  }

  assert.equal(seen.size, N);
});
