import assert from "node:assert/strict";
import test from "node:test";

import { ChunkSet } from "../src/index.js";

test("ChunkSet supports point and range bit operations", () => {
  const set = new ChunkSet();

  set.set(1);
  set.set(5, 8);
  set.flip(6);

  assert.equal(set.get(1), true);
  assert.equal(set.get(6), false);
  assert.equal(set.get(7), true);
  assert.equal(set.nextSetBit(0), 1);
  assert.equal(set.nextSetBit(2), 5);
  assert.equal(set.nextClearBit(5), 6);
  assert.equal(set.cardinality(), 3);
  assert.equal(set.toString(), "{1, 5, 7}");

  set.clear(5, 8);
  assert.equal(set.toString(), "{1}");
  assert.equal(set.length(), 2);
});

test("ChunkSet grows and combines with logical operations", () => {
  const a = new ChunkSet();
  const b = new ChunkSet();

  a.set(1);
  a.set(64);
  b.set(64);
  b.set(65);

  const orResult = a.clone();
  orResult.or(b);
  assert.equal(orResult.toString(), "{1, 64, 65}");
  assert.equal(orResult.intersects(b), true);

  const andResult = orResult.clone();
  andResult.and(b);
  assert.equal(andResult.toString(), "{64, 65}");

  const xorResult = a.clone();
  xorResult.xor(b);
  assert.equal(xorResult.toString(), "{1, 65}");

  xorResult.andNot(b);
  assert.equal(xorResult.toString(), "{1}");
});

test("ChunkSet chunk helpers preserve packed chunk semantics", () => {
  const set = new ChunkSet(4, 4);

  set.setChunk(0, 3);
  set.setChunk(1, 12);
  assert.equal(set.getChunk(0), 3);
  assert.equal(set.getChunk(1), 12);
  assert.deepEqual(set.getNonzeroChunks(), [0, 1]);
  assert.equal(set.numNonZeroChunks(), 2);

  assert.equal(set.getAndSetChunk(0, 5), 3);
  assert.equal(set.getChunk(0), 5);

  set.clearChunk(1);
  assert.equal(set.getChunk(1), 0);
  assert.equal(set.toChunkString(), "{chunk 0 = 5}");
});

test("ChunkSet bit-within-chunk helpers match Java-style resolution helpers", () => {
  const set = new ChunkSet(4, 2);

  set.setBit(0, 1, true);
  set.setBit(0, 3, true);
  assert.equal(set.getBit(0, 1), 1);
  assert.equal(set.numBitsOn(0), 2);
  assert.equal(set.isResolved(0), false);
  assert.equal(set.resolvedTo(0), 0);

  set.resolveToBit(0, 2);
  assert.equal(set.getChunk(0), 4);
  assert.equal(set.isResolved(0), true);
  assert.equal(set.resolvedTo(0), 2);

  set.toggleBit(0, 0);
  assert.equal(set.getChunk(0), 5);

  set.setNBits(1, 3, true);
  assert.equal(set.getChunk(1), 7);
});

test("ChunkSet shifting and resize helpers preserve word layout", () => {
  const set = new ChunkSet();
  set.set(1);
  set.set(63);

  set.shiftL(1, true);
  assert.equal(set.get(2), true);
  assert.equal(set.get(64), true);

  set.shiftR(2);
  assert.equal(set.get(0), true);
  assert.equal(set.get(62), true);

  const sticky = new ChunkSet(4, 16);
  sticky.setChunk(0, 15);
  sticky.shiftL(4, false);
  assert.equal(sticky.getChunk(1), 15);
  sticky.clearNoResize();
  assert.equal(sticky.isEmpty(), true);
  assert.equal(sticky.size(), 64);
});

test("ChunkSet masking helpers expose match and violation checks", () => {
  const state = new ChunkSet(4, 4);
  const mask = new ChunkSet(4, 4);
  const pattern = new ChunkSet(4, 4);

  state.setChunk(0, 3);
  state.setChunk(1, 9);
  mask.setChunk(0, 15);
  pattern.setChunk(0, 3);

  assert.equal(state.matches(mask, pattern), true);
  assert.equal(state.violatesNot(mask, pattern), true);
  assert.equal(state.matchesWord(0, 0xfn, 0x3n), true);

  const extra = new ChunkSet();
  extra.addMask(0, 0b1010n);
  assert.equal(extra.get(1), true);
  assert.equal(extra.get(3), true);
});

test("ChunkSet clone, equality, and hash code depend on logical contents", () => {
  const set = new ChunkSet();
  set.set(2);
  set.set(10);

  const copy = set.clone();
  assert.equal(copy.equals(set), true);
  assert.equal(copy.hashCode(), set.hashCode());

  set.set(11);
  assert.equal(copy.equals(set), false);

  copy.trimToSize();
  assert.equal(copy.size(), 64);
});

test("ChunkSet validates chunk assignments", () => {
  const set = new ChunkSet(4, 1);

  assert.throws(() => {
    set.setChunk(0, 16);
  }, /out of range/);
});
