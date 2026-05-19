/**
 * TypeScript port of `Core/src/other/state/zhash/HashedBitSet.java`.
 *
 * The Java original is a {@link java.util.BitSet} wrapper that maintains an
 * incremental Zobrist hash via an owning {@code State}. Every mutating method
 * is paired with a `state.updateStateHash(delta)` call so the host state hash
 * always reflects the bitset's contents.
 *
 * Porting decisions:
 *
 * - We don't drag the full `State` / `ZobristHashGenerator` graph into this
 *   leaf package. Instead, callers supply two things at construction time:
 *     1. A {@link ZobristState} adapter — anything with an
 *        `updateStateHash(delta: bigint): void` method.
 *     2. A pre-computed sequence of per-site `bigint` Zobrist hashes.
 *   Java's `long` is 64-bit signed; we model it as `bigint` so XORs stay
 *   exact. Callers can produce the sequence with whatever generator they
 *   want (the eventual `ZobristHashUtilities` port, or hard-coded test
 *   fixtures).
 *
 * - The internal storage is the {@link BitSet} ported alongside it. Java's
 *   `BitSet.clone()` is mirrored by `BitSet.clone()` here, so the copy
 *   constructor used by `clone()` keeps the same semantics.
 *
 * - `internalState()` returns the live bitset (matching Java's reference
 *   leak); `internalStateCopy()` returns a defensive clone.
 */

import { BitSet } from "./bit-set.js";

/**
 * Minimal adapter for the `other.state.State` collaborator used by
 * `HashedBitSet`. Only the `updateStateHash` callback is needed.
 */
export interface ZobristState {
  /** XOR the supplied delta into the owning state's running Zobrist hash. */
  updateStateHash(delta: bigint): void;
}

/** Coerce a hash array argument into a flat `readonly bigint[]`. */
function coerceHashes(
  hashes: readonly bigint[] | BigInt64Array,
): readonly bigint[] {
  if (hashes instanceof BigInt64Array) {
    return Array.from(hashes);
  }
  return hashes;
}

export class HashedBitSet {
  private readonly internalStateBs: BitSet;
  private readonly hashes: readonly bigint[];

  /**
   * Construct a new {@link HashedBitSet} backed by an empty {@link BitSet}
   * sized for `hashes.length` sites.
   *
   * @param state  State adapter to receive `updateStateHash` callbacks.
   * @param hashes Per-site Zobrist hashes (one `bigint` per bit index).
   */
  public constructor(
    state: ZobristState,
    hashes: readonly bigint[] | BigInt64Array,
  );

  /**
   * Copy constructor (used by {@link clone}). The bitset is cloned; the
   * hash table is shared by reference, which is safe because hashes are
   * immutable per Java's `ZobristHashUtilities` contract.
   */
  public constructor(other: HashedBitSet);

  public constructor(
    stateOrOther: ZobristState | HashedBitSet,
    hashes?: readonly bigint[] | BigInt64Array,
  ) {
    if (stateOrOther instanceof HashedBitSet) {
      this.internalStateBs = stateOrOther.internalStateBs.clone();
      this.hashes = stateOrOther.hashes;
      return;
    }
    if (hashes === undefined) {
      throw new TypeError(
        "HashedBitSet(state, hashes): hashes argument is required",
      );
    }
    this.hashes = coerceHashes(hashes);
    this.internalStateBs = new BitSet(this.hashes.length);
  }

  // -------------------------------------------------------------------------
  // Mutating methods — these maintain the running Zobrist hash via the state.
  // -------------------------------------------------------------------------

  /**
   * Clears every set bit and folds the corresponding hashes out of the
   * running state hash.
   *
   * Performance warning (carried over from Java): iterates each set site.
   */
  public clear(trialState: ZobristState): void {
    let hashDelta = 0n;
    for (
      let site = this.internalStateBs.nextSetBit(0);
      site >= 0;
      site = this.internalStateBs.nextSetBit(site + 1)
    ) {
      hashDelta ^= this.hashes[site] ?? 0n;
    }
    this.internalStateBs.clear();
    trialState.updateStateHash(hashDelta);
  }

  /**
   * Replaces this bitset's contents with `src`'s contents, updating the
   * Zobrist hash for every bit that flips.
   */
  public setTo(trialState: ZobristState, src: HashedBitSet): void {
    let hashDelta = 0n;
    for (let site = 0; site < this.hashes.length; ++site) {
      if (this.internalStateBs.get(site) !== src.internalStateBs.get(site)) {
        hashDelta ^= this.hashes[site] ?? 0n;
      }
    }
    this.internalStateBs.clear();
    this.internalStateBs.or(src.internalStateBs);
    trialState.updateStateHash(hashDelta);
  }

  /** Sets the bit at `bitIndex` to `on`, folding the hash delta if it flips. */
  public set(trialState: ZobristState, bitIndex: number, on: boolean): void {
    if (on !== this.internalStateBs.get(bitIndex)) {
      trialState.updateStateHash(this.hashes[bitIndex] ?? 0n);
    }
    this.internalStateBs.set(bitIndex, on);
  }

  /**
   * Recomputes the Zobrist hash that this bitset would contribute after a
   * site remap and/or value inversion. Used for canonical-hash computation.
   *
   * Performance warning (carried over from Java): linear in `hashes.length`.
   *
   * @param siteRemap May be `null`; if non-null, bit at site `i` contributes
   *                  `hashes[siteRemap[i]]` instead of `hashes[i]`.
   * @param invert    If true, every site's value is logically inverted
   *                  before computing the hash.
   */
  public calculateHashAfterRemap(
    siteRemap: readonly number[] | null,
    invert: boolean,
  ): bigint {
    let hashDelta = 0n;
    if (siteRemap === null) {
      for (let site = 0; site < this.hashes.length; ++site) {
        const siteValue = this.internalStateBs.get(site);
        const newValue = invert ? !siteValue : siteValue;
        if (newValue) hashDelta ^= this.hashes[site] ?? 0n;
      }
      return hashDelta;
    }
    for (let site = 0; site < this.hashes.length; ++site) {
      const newSite = siteRemap[site] ?? site;
      const siteValue = this.internalStateBs.get(site);
      const newValue = invert ? !siteValue : siteValue;
      if (newValue) hashDelta ^= this.hashes[newSite] ?? 0n;
    }
    return hashDelta;
  }

  // -------------------------------------------------------------------------
  // Read-only methods — no hash management required.
  // -------------------------------------------------------------------------

  /** @return a deep clone of this hashed bitset (the bitset is cloned). */
  public clone(): HashedBitSet {
    return new HashedBitSet(this);
  }

  /** @return a defensive copy of the internal bitset. */
  public internalStateCopy(): BitSet {
    return this.internalStateBs.clone();
  }

  /** @return the live internal bitset (no defensive copy, matches Java). */
  public internalState(): BitSet {
    return this.internalStateBs;
  }

  /** @return the bit value at `bitIndex`. */
  public get(bitIndex: number): boolean {
    return this.internalStateBs.get(bitIndex);
  }

  /**
   * @return the index of the first set bit at or after `fromIndex`, or `-1`
   *         if none exists.
   */
  public nextSetBit(fromIndex: number): number {
    return this.internalStateBs.nextSetBit(fromIndex);
  }
}
