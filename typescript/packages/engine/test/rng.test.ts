import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SeededRng } from "../src/index.js";

describe("SeededRng", () => {
  it("two RNGs with the same seed produce the same stream", () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    for (let i = 0; i < 16; i += 1) {
      assert.equal(a.nextUInt32(), b.nextUInt32());
    }
  });

  it("nextInt(bound) stays within [0, bound)", () => {
    const rng = new SeededRng(123);
    for (let i = 0; i < 100; i += 1) {
      const v = rng.nextInt(10);
      assert.ok(v >= 0 && v < 10);
    }
  });

  it("nextFloat stays within [0, 1)", () => {
    const rng = new SeededRng(123);
    for (let i = 0; i < 100; i += 1) {
      const v = rng.nextFloat();
      assert.ok(v >= 0 && v < 1);
    }
  });

  it("snapshot + restore round-trips the stream", () => {
    const rng = new SeededRng(0xdeadbeef);
    rng.nextUInt32();
    rng.nextUInt32();
    const snap = rng.snapshot();
    const a = rng.nextUInt32();
    rng.restore(snap);
    const b = rng.nextUInt32();
    assert.equal(a, b);
  });

  it("clone forks a generator without sharing state", () => {
    const rng = new SeededRng(7);
    rng.nextUInt32();
    const cloned = rng.clone();
    const a = rng.nextUInt32();
    const b = cloned.nextUInt32();
    assert.equal(a, b);
    // Advance only one; the other should still match the snapshot.
    rng.nextUInt32();
    assert.notEqual(rng.snapshot(), cloned.snapshot());
  });

  it("rejects a zero or non-integer seed", () => {
    assert.throws(() => new SeededRng(0));
    assert.throws(() => new SeededRng(1.5));
  });

  it("rejects non-positive bounds in nextInt", () => {
    const rng = new SeededRng(1);
    assert.throws(() => rng.nextInt(0));
    assert.throws(() => rng.nextInt(-1));
  });
});
