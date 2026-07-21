import assert from "node:assert/strict";
import test from "node:test";

import { BitSet } from "../src/index.js";

test("BitSet default constructor is empty", () => {
  const bs = new BitSet();
  assert.equal(bs.isEmpty(), true);
  assert.equal(bs.cardinality(), 0);
  assert.equal(bs.length(), 0);
  assert.equal(bs.size(), 0);
});

test("BitSet(nbits) pre-sizes the backing word array", () => {
  const bs = new BitSet(64);
  // No bits set, but capacity exists for 64 bits (2× 32-bit words).
  assert.equal(bs.isEmpty(), true);
  assert.equal(bs.size(), 64);
});

test("BitSet set / get round-trip across word boundaries", () => {
  const bs = new BitSet();
  bs.set(0);
  bs.set(31);
  bs.set(32);
  bs.set(63);
  bs.set(127);
  assert.equal(bs.get(0), true);
  assert.equal(bs.get(31), true);
  assert.equal(bs.get(32), true);
  assert.equal(bs.get(63), true);
  assert.equal(bs.get(127), true);
  assert.equal(bs.get(1), false);
  assert.equal(bs.get(64), false);
  assert.equal(bs.length(), 128);
  assert.equal(bs.cardinality(), 5);
});

test("BitSet set(bitIndex, false) clears the bit", () => {
  const bs = new BitSet();
  bs.set(5);
  bs.set(5, false);
  assert.equal(bs.get(5), false);
  assert.equal(bs.isEmpty(), true);
});

test("BitSet set(from, to) sets a half-open range", () => {
  const bs = new BitSet();
  bs.set(3, 9);
  for (let i = 0; i < 16; ++i) {
    assert.equal(bs.get(i), i >= 3 && i < 9, `bit ${i}`);
  }
  assert.equal(bs.cardinality(), 6);
});

test("BitSet set(from, to) spans multiple words", () => {
  const bs = new BitSet();
  bs.set(30, 70);
  assert.equal(bs.cardinality(), 40);
  assert.equal(bs.get(29), false);
  assert.equal(bs.get(30), true);
  assert.equal(bs.get(69), true);
  assert.equal(bs.get(70), false);
  assert.equal(bs.length(), 70);
});

test("BitSet clear(from, to) clears a range", () => {
  const bs = new BitSet();
  bs.set(0, 100);
  bs.clear(20, 60);
  for (let i = 0; i < 100; ++i) {
    const expected = !(i >= 20 && i < 60);
    assert.equal(bs.get(i), expected, `bit ${i}`);
  }
});

test("BitSet flip toggles a bit and updates wordsInUse", () => {
  const bs = new BitSet();
  bs.flip(40);
  assert.equal(bs.get(40), true);
  bs.flip(40);
  assert.equal(bs.get(40), false);
  assert.equal(bs.length(), 0);
});

test("BitSet nextSetBit walks set bits and returns -1 when exhausted", () => {
  const bs = new BitSet();
  bs.set(2);
  bs.set(5);
  bs.set(40);
  bs.set(95);
  const seen: number[] = [];
  for (let i = bs.nextSetBit(0); i >= 0; i = bs.nextSetBit(i + 1)) {
    seen.push(i);
  }
  assert.deepEqual(seen, [2, 5, 40, 95]);
  assert.equal(bs.nextSetBit(96), -1);
});

test("BitSet nextClearBit finds the first clear bit", () => {
  const bs = new BitSet();
  bs.set(0, 10);
  assert.equal(bs.nextClearBit(0), 10);
  // Past wordsInUse it just returns fromIndex.
  assert.equal(new BitSet().nextClearBit(7), 7);
});

test("BitSet and/or/xor/andNot behave like Java BitSet", () => {
  const a = new BitSet();
  a.set(0);
  a.set(2);
  a.set(4);
  const b = new BitSet();
  b.set(2);
  b.set(3);

  const andResult = a.clone();
  andResult.and(b);
  assert.deepEqual([...andResult], [2]);

  const orResult = a.clone();
  orResult.or(b);
  assert.deepEqual([...orResult], [0, 2, 3, 4]);

  const xorResult = a.clone();
  xorResult.xor(b);
  assert.deepEqual([...xorResult], [0, 3, 4]);

  const andNotResult = a.clone();
  andNotResult.andNot(b);
  assert.deepEqual([...andNotResult], [0, 4]);
});

test("BitSet intersects returns true iff any bit overlaps", () => {
  const a = new BitSet();
  a.set(0);
  a.set(40);
  const b = new BitSet();
  b.set(1);
  assert.equal(a.intersects(b), false);
  b.set(40);
  assert.equal(a.intersects(b), true);
});

test("BitSet equals respects logical content, not capacity", () => {
  const a = new BitSet();
  const b = new BitSet(256); // pre-sized but empty
  assert.equal(a.equals(b), true);
  a.set(7);
  assert.equal(a.equals(b), false);
  b.set(7);
  assert.equal(a.equals(b), true);
});

test("BitSet clone is independent of the original", () => {
  const bs = new BitSet();
  bs.set(1);
  bs.set(50);
  const copy = bs.clone();
  copy.clear(50);
  copy.set(99);
  assert.deepEqual([...bs], [1, 50]);
  assert.deepEqual([...copy], [1, 99]);
});

test("BitSet hashCode is stable and unaffected by extra capacity", () => {
  const a = new BitSet();
  a.set(0);
  a.set(64);
  const b = new BitSet(512);
  b.set(0);
  b.set(64);
  assert.equal(a.hashCode(), b.hashCode());

  // Empty BitSet must match Java's empty-BitSet hash: 1234.
  assert.equal(new BitSet().hashCode(), 1234);
});

test("BitSet toString matches Java's {a, b, c} form", () => {
  const bs = new BitSet();
  assert.equal(bs.toString(), "{}");
  bs.set(0);
  bs.set(2);
  bs.set(7);
  assert.equal(bs.toString(), "{0, 2, 7}");
});

test("BitSet iteration via for…of yields set bits in order", () => {
  const bs = new BitSet();
  bs.set(11);
  bs.set(3);
  bs.set(64);
  bs.set(0);
  assert.deepEqual([...bs], [0, 3, 11, 64]);
});

test("BitSet rejects negative indices", () => {
  const bs = new BitSet();
  assert.throws(() => bs.get(-1), RangeError);
  assert.throws(() => bs.set(-1), RangeError);
  assert.throws(() => bs.clear(-1), RangeError);
});
