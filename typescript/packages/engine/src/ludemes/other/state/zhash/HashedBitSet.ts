// @java Core/src/other/state/zhash/HashedBitSet.java

import { ZobristHashGenerator } from "./ZobristHashGenerator.js";
import { ZobristHashUtilities } from "./ZobristHashUtilities.js";

/** Minimal interface representing the State's hash-update hook used by HashedBitSet. */
export interface StateHashUpdater {
  updateStateHash(delta: number): void;
}

/**
 * Wrapper around a bit-set that keeps a Zobrist hash in sync.
 * Faithful 1:1 port of HashedBitSet.java.
 *
 * Java uses java.util.BitSet; here we use a boolean[] for simplicity.
 *
 * @author mrraow (Java), ported to TS
 */
export class HashedBitSet {
  /** Java: private final BitSet internalState */
  bits: boolean[];
  /** Java: private final long[] hashes */
  hashes: number[];

  /**
   * @param generator hash generator
   * @param numSites number of bits
   */
  constructor(generator: ZobristHashGenerator, numSites: number) {
    this.bits = new Array(numSites).fill(false);
    this.hashes = ZobristHashUtilities.getSequence(generator, numSites) as number[];
  }

  /** Internal copy factory — avoids calling the hash generator. */
  private static fromOther(other: HashedBitSet): HashedBitSet {
    // Bypass the main constructor by using Object.create + direct assignment
    const h = Object.create(HashedBitSet.prototype) as HashedBitSet;
    h.bits = [...other.bits];
    h.hashes = other.hashes; // Safe to share (Java: this.hashes = that.hashes)
    return h;
  }

  // ---------------------------------------------------------------------------
  // Mutating methods — manage the state hash

  /**
   * Clears all bits. Performance warning: iterates all set bits.
   * Java: public void clear(final State trialState)
   */
  clear(trialState: StateHashUpdater): void {
    let hashDelta = 0;
    for (let site = 0; site < this.bits.length; site++) {
      if (this.bits[site]) hashDelta ^= this.hashes[site]!;
    }
    this.bits.fill(false);
    trialState.updateStateHash(hashDelta);
  }

  /**
   * Makes this a copy of src.
   * Java: public void setTo(final State trialState, final HashedBitSet src)
   */
  setTo(trialState: StateHashUpdater, src: HashedBitSet): void {
    let hashDelta = 0;
    const srcBits = src.bits;
    for (let site = 0; site < this.hashes.length; site++) {
      if (this.bits[site] !== srcBits[site]) hashDelta ^= this.hashes[site]!;
    }
    for (let i = 0; i < this.bits.length; i++) this.bits[i] = srcBits[i]!;
    trialState.updateStateHash(hashDelta);
  }

  /**
   * Sets a bit.
   * Java: public void set(final State trialState, final int bitIndex, final boolean on)
   */
  set(trialState: StateHashUpdater, bitIndex: number, on: boolean): void {
    if (on !== this.bits[bitIndex]) trialState.updateStateHash(this.hashes[bitIndex]!);
    this.bits[bitIndex] = on;
  }

  // ---------------------------------------------------------------------------
  // Read-only methods

  /** Java: public HashedBitSet clone() */
  clone(): HashedBitSet {
    return HashedBitSet.fromOther(this);
  }

  /** Java: public BitSet internalStateCopy() — returns a copy of the boolean array */
  internalStateCopy(): boolean[] {
    return [...this.bits];
  }

  /** Java: public BitSet internalState() — returns the mutable internal array */
  internalStateArr(): boolean[] {
    return this.bits;
  }

  /** Java: public boolean get(final int bitIndex) */
  get(bitIndex: number): boolean {
    return this.bits[bitIndex] === true;
  }

  /**
   * Java: public int nextSetBit(final int fromIndex)
   * @returns index of first set bit >= fromIndex, or -1
   */
  nextSetBit(fromIndex: number): number {
    for (let i = fromIndex; i < this.bits.length; i++) {
      if (this.bits[i]) return i;
    }
    return -1;
  }

  /**
   * Calculates the hash of this object after the specified remapping.
   * Java: public long calculateHashAfterRemap(final int[] siteRemap, final boolean invert)
   */
  calculateHashAfterRemap(siteRemap: number[] | null, invert: boolean): number {
    let hashDelta = 0;
    if (siteRemap === null) {
      for (let site = 0; site < this.hashes.length; site++) {
        const siteValue = this.bits[site] === true;
        const newValue = invert ? !siteValue : siteValue;
        if (newValue) hashDelta ^= this.hashes[site]!;
      }
      return hashDelta;
    }
    for (let site = 0; site < this.hashes.length; site++) {
      const newSite = siteRemap[site]!;
      const siteValue = this.bits[site] === true;
      const newValue = invert ? !siteValue : siteValue;
      if (newValue) hashDelta ^= this.hashes[newSite]!;
    }
    return hashDelta;
  }
}
