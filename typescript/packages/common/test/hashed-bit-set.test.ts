import assert from "node:assert/strict";
import test from "node:test";

import { HashedBitSet, type ZobristState } from "../src/index.js";

/**
 * Minimal Zobrist state harness: tracks the running 64-bit hash via bigint
 * XORs and exposes the recorded delta history for assertions.
 */
class FakeState implements ZobristState {
  public hash = 0n;
  public deltas: bigint[] = [];
  public updateStateHash(delta: bigint): void {
    this.hash ^= delta;
    this.deltas.push(delta);
  }
}

/** Returns a deterministic sequence of distinct non-zero 64-bit hashes. */
function makeHashes(n: number): bigint[] {
  // Avoid zero so XOR deltas are unambiguous.
  const result: bigint[] = [];
  let x = 0x9e3779b97f4a7c15n;
  for (let i = 0; i < n; ++i) {
    // SplitMix64-style mix to spread the values.
    x = BigInt.asIntN(64, x + 0x9e3779b97f4a7c15n);
    let z = x;
    z = BigInt.asIntN(64, (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n);
    z = BigInt.asIntN(64, (z ^ (z >> 27n)) * 0x94d049bb133111ebn);
    z = BigInt.asIntN(64, z ^ (z >> 31n));
    result.push(z);
  }
  return result;
}

test("HashedBitSet constructor initialises empty bitset and zero hash", () => {
  const state = new FakeState();
  const hashes = makeHashes(8);
  const hbs = new HashedBitSet(state, hashes);

  assert.equal(hbs.get(0), false);
  assert.equal(hbs.get(7), false);
  assert.equal(hbs.nextSetBit(0), -1);
  assert.equal(state.hash, 0n);
});

test("HashedBitSet.set XORs the per-site hash on a flip", () => {
  const state = new FakeState();
  const hashes = makeHashes(4);
  const hbs = new HashedBitSet(state, hashes);

  hbs.set(state, 2, true);
  assert.equal(hbs.get(2), true);
  assert.equal(state.hash, hashes[2]);

  // Setting the same bit to the same value is a no-op for the hash.
  hbs.set(state, 2, true);
  assert.equal(state.hash, hashes[2]);

  // Flipping it off folds the same hash back out, returning to zero.
  hbs.set(state, 2, false);
  assert.equal(hbs.get(2), false);
  assert.equal(state.hash, 0n);
});

test("HashedBitSet.clear folds out every set bit", () => {
  const state = new FakeState();
  const hashes = makeHashes(16);
  const hbs = new HashedBitSet(state, hashes);
  hbs.set(state, 1, true);
  hbs.set(state, 7, true);
  hbs.set(state, 12, true);
  const expectedHash = hashes[1]! ^ hashes[7]! ^ hashes[12]!;
  assert.equal(state.hash, expectedHash);

  hbs.clear(state);
  assert.equal(hbs.internalState().isEmpty(), true);
  assert.equal(state.hash, 0n);
});

test("HashedBitSet.setTo applies the symmetric difference to the hash", () => {
  const hashes = makeHashes(16);
  const dstState = new FakeState();
  const srcState = new FakeState();
  const dst = new HashedBitSet(dstState, hashes);
  const src = new HashedBitSet(srcState, hashes);

  dst.set(dstState, 1, true);
  dst.set(dstState, 5, true);
  src.set(srcState, 5, true);
  src.set(srcState, 9, true);

  // After setTo, dst's hash must equal src's hash (same logical bits +
  // same per-site hashes).
  dst.setTo(dstState, src);
  assert.deepEqual([...dst.internalState()], [5, 9]);
  assert.equal(dstState.hash, srcState.hash);
});

test("HashedBitSet.clone is independent of the original", () => {
  const state = new FakeState();
  const hashes = makeHashes(8);
  const original = new HashedBitSet(state, hashes);
  original.set(state, 3, true);

  const copyState = new FakeState();
  // Cloning does NOT touch the host hash state — it just copies the bitset
  // and reuses the hash table. To test the clone behaves independently we
  // mutate it against a fresh host state.
  const copy = original.clone();
  copy.set(copyState, 4, true);

  assert.deepEqual([...original.internalState()], [3]);
  assert.deepEqual([...copy.internalState()], [3, 4]);
});

test("HashedBitSet.calculateHashAfterRemap mirrors current contents when no remap or inversion", () => {
  const state = new FakeState();
  const hashes = makeHashes(8);
  const hbs = new HashedBitSet(state, hashes);
  hbs.set(state, 2, true);
  hbs.set(state, 6, true);

  const expected = hashes[2]! ^ hashes[6]!;
  assert.equal(hbs.calculateHashAfterRemap(null, false), expected);
});

test("HashedBitSet.calculateHashAfterRemap honours invert flag", () => {
  const state = new FakeState();
  const hashes = makeHashes(4);
  const hbs = new HashedBitSet(state, hashes);
  hbs.set(state, 1, true);

  // Inverted: every bit EXCEPT site 1 is logically set → XOR of hashes[0,2,3].
  const expected = hashes[0]! ^ hashes[2]! ^ hashes[3]!;
  assert.equal(hbs.calculateHashAfterRemap(null, true), expected);
});

test("HashedBitSet.calculateHashAfterRemap remaps which slot each bit contributes", () => {
  const state = new FakeState();
  const hashes = makeHashes(4);
  const hbs = new HashedBitSet(state, hashes);
  hbs.set(state, 0, true);
  hbs.set(state, 2, true);

  // Remap: [3, 2, 1, 0] — site 0's value contributes hashes[3], site 2's
  // contributes hashes[1].
  const remap = [3, 2, 1, 0];
  const expected = hashes[3]! ^ hashes[1]!;
  assert.equal(hbs.calculateHashAfterRemap(remap, false), expected);
});

test("HashedBitSet.internalState exposes the live BitSet (matches Java reference leak)", () => {
  const state = new FakeState();
  const hashes = makeHashes(4);
  const hbs = new HashedBitSet(state, hashes);
  hbs.set(state, 1, true);

  const live = hbs.internalState();
  assert.equal(live === hbs.internalState(), true);

  // internalStateCopy is a defensive clone.
  const copy = hbs.internalStateCopy();
  assert.equal(copy === live, false);
  assert.equal(copy.equals(live), true);
});

test("HashedBitSet accepts BigInt64Array hashes", () => {
  const state = new FakeState();
  const arr = new BigInt64Array([10n, 20n, 30n, 40n]);
  const hbs = new HashedBitSet(state, arr);
  hbs.set(state, 1, true);
  assert.equal(state.hash, 20n);
});
