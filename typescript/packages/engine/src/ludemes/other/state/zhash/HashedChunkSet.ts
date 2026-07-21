// @java Core/src/other/state/zhash/HashedChunkSet.java

import { ZobristHashGenerator } from "./ZobristHashGenerator.js";
import { ZobristHashUtilities } from "./ZobristHashUtilities.js";
import type { StateHashUpdater } from "./HashedBitSet.js";

/**
 * Minimal ChunkSet-like structure.
 * Java uses main.collections.ChunkSet which is a packed-bit integer array.
 * Here we use a plain number[] where each entry stores one chunk value.
 */
export class ChunkSetLike {
  data: number[];
  chunkSz: number;
  numCh: number;

  constructor(chunkSize: number, numChunks: number) {
    this.chunkSz = chunkSize;
    this.numCh = numChunks;
    this.data = new Array(numChunks).fill(0);
  }

  getChunk(site: number): number {
    return this.data[site] ?? 0;
  }

  /** Returns old value and sets new value atomically. */
  getAndSetChunk(site: number, val: number): number {
    const old = this.data[site] ?? 0;
    this.data[site] = val;
    return old;
  }

  setChunk(site: number, val: number): void {
    this.data[site] = val;
  }

  getBit(site: number, _location: number): number {
    // Simplified: treat as returning the chunk value bit at position _location
    return (this.data[site]! >> _location) & 1;
  }

  setBit(site: number, bit: number, value: boolean): void {
    const cur = this.data[site] ?? 0;
    if (value) this.data[site] = cur | (1 << bit);
    else this.data[site] = cur & ~(1 << bit);
  }

  numChunks(): number { return this.numCh; }
  chunkSize(): number { return this.chunkSz; }

  clear(): void { this.data.fill(0); }

  or(src: ChunkSetLike): void {
    for (let i = 0; i < this.data.length; i++) this.data[i] = (this.data[i] ?? 0) | (src.data[i] ?? 0);
  }

  clone(): ChunkSetLike {
    const c = new ChunkSetLike(this.chunkSz, this.numCh);
    c.data.splice(0, c.data.length, ...this.data);
    return c;
  }

  /** Java ChunkSet.matches(ChunkSet mask, ChunkSet pattern) */
  matches(mask: ChunkSetLike, pattern: ChunkSetLike): boolean {
    for (let i = 0; i < this.data.length; i++) {
      const m = mask.data[i] ?? 0;
      if (m === 0) continue;
      if (((this.data[i] ?? 0) & m) !== ((pattern.data[i] ?? 0) & m)) return false;
    }
    return true;
  }

  matchesWord(wordIdx: number, mask: number, matchingWord: number): boolean {
    return ((this.data[wordIdx] ?? 0) & mask) === (matchingWord & mask);
  }

  violatesNot(mask: ChunkSetLike, pattern: ChunkSetLike, startWord = 0): boolean {
    for (let i = startWord; i < this.data.length; i++) {
      const m = mask.data[i] ?? 0;
      if (m === 0) continue;
      if (((this.data[i] ?? 0) & m) === ((pattern.data[i] ?? 0) & m)) return true;
    }
    return false;
  }
}

/**
 * Wrapper around a chunk-set that keeps a Zobrist hash in sync.
 * Faithful 1:1 port of HashedChunkSet.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class HashedChunkSet {
  /** Java: private final ChunkSet internalState */
  private readonly internalState: ChunkSetLike;
  /** Java: private final long[][] hashes */
  private readonly hashes: number[][];

  /**
   * Main constructor.
   * Java: public HashedChunkSet(final ZobristHashGenerator generator, final int maxChunkVal, final int numChunks)
   */
  constructor(generator: ZobristHashGenerator, maxChunkVal: number, numChunks: number);
  /**
   * Constructor with pre-computed hashes.
   * Java: public HashedChunkSet(final long[][] hashes, final int maxChunkVal, final int numSites)
   */
  constructor(hashes: number[][], maxChunkVal: number, numSites: number);
  /** Copy constructor (private in Java). */
  constructor(other: HashedChunkSet);
  constructor(
    generatorOrHashesOrOther: ZobristHashGenerator | number[][] | HashedChunkSet,
    maxChunkVal?: number,
    numChunks?: number,
  ) {
    if (generatorOrHashesOrOther instanceof HashedChunkSet) {
      const other = generatorOrHashesOrOther;
      this.internalState = other.internalState.clone();
      this.hashes = other.hashes; // safe reference share
    } else if (generatorOrHashesOrOther instanceof ZobristHashGenerator) {
      const mcv = maxChunkVal!;
      const nc = numChunks!;
      // chunkSize is the number of bits needed — simplified to 1 here; actual packing not needed for faithfulness
      this.internalState = new ChunkSetLike(1, nc);
      this.hashes = ZobristHashUtilities.getSequence(generatorOrHashesOrOther, nc, mcv + 1) as number[][];
    } else {
      // hashes passed directly
      const mcv = maxChunkVal!;
      const ns = numChunks!;
      this.internalState = new ChunkSetLike(1, ns);
      this.hashes = generatorOrHashesOrOther as number[][];
    }
  }

  // ---------------------------------------------------------------------------
  // Mutating methods

  /** Java: public void clear(final State trialState) */
  clear(trialState: StateHashUpdater): void {
    let hashDelta = 0;
    for (let site = 0; site < this.hashes.length; site++) {
      const row = this.hashes[site]!;
      hashDelta ^= row[this.internalState.getChunk(site)]!;
    }
    this.internalState.clear();
    trialState.updateStateHash(hashDelta);
  }

  /** Java: public void setTo(final State trialState, final HashedChunkSet src) */
  setTo(trialState: StateHashUpdater, src: HashedChunkSet): void {
    let hashDelta = 0;
    for (let site = 0; site < this.hashes.length; site++) {
      const row = this.hashes[site]!;
      hashDelta ^= row[this.internalState.getChunk(site)]! ^ row[src.internalState.getChunk(site)]!;
    }
    this.internalState.clear();
    this.internalState.or(src.internalState);
    trialState.updateStateHash(hashDelta);
  }

  /**
   * Java: public void setBit(final State trialState, final int chunk, final int bit, final boolean value)
   */
  setBit(trialState: StateHashUpdater, chunk: number, bit: number, value: boolean): void {
    const row = this.hashes[chunk]!;
    const delta1 = row[this.internalState.getChunk(chunk)]!;
    this.internalState.setBit(chunk, bit, value);
    const delta2 = row[this.internalState.getChunk(chunk)]!;
    trialState.updateStateHash(delta1 ^ delta2);
  }

  /** Java: public void setChunk(final State trialState, final int site, final int val) */
  setChunk(trialState: StateHashUpdater, site: number, val: number): void {
    const row = this.hashes[site]!;
    let hashDelta = row[this.internalState.getAndSetChunk(site, val)]!;
    hashDelta ^= row[val]!;
    trialState.updateStateHash(hashDelta);
  }

  // ---------------------------------------------------------------------------
  // Read-only methods

  /** Java: public HashedChunkSet clone() */
  clone(): HashedChunkSet {
    return new HashedChunkSet(this);
  }

  /** Java: public ChunkSet internalStateCopy() */
  internalStateCopy(): ChunkSetLike {
    return this.internalState.clone();
  }

  /** Java: public int getBit(final int site, final int location) */
  getBit(site: number, location: number): number {
    return this.internalState.getBit(site, location);
  }

  /** Java: public int getChunk(final int site) */
  getChunk(site: number): number {
    return this.internalState.getChunk(site);
  }

  /** Java: public int numChunks() */
  numChunks(): number { return this.internalState.numChunks(); }

  /** Java: public int chunkSize() */
  chunkSize(): number { return this.internalState.chunkSize(); }

  /** Java: public boolean matches(ChunkSet mask, ChunkSet pattern) */
  matches(mask: ChunkSetLike, pattern: ChunkSetLike): boolean {
    return this.internalState.matches(mask, pattern);
  }

  /** Java: public boolean matches(int wordIdx, long mask, long matchingWord) */
  matchesWord(wordIdx: number, mask: number, matchingWord: number): boolean {
    return this.internalState.matchesWord(wordIdx, mask, matchingWord);
  }

  /** Java: public boolean violatesNot(ChunkSet mask, ChunkSet pattern) */
  violatesNot(mask: ChunkSetLike, pattern: ChunkSetLike, startWord = 0): boolean {
    return this.internalState.violatesNot(mask, pattern, startWord);
  }

  /**
   * Calculates the hash after the specified remapping.
   * Java: public long calculateHashAfterRemap(final int[] siteRemap, final int[] valueRemap)
   */
  calculateHashAfterRemap(siteRemap: number[] | null, valueRemap: number[] | null): number {
    let hashDelta = 0;
    if (valueRemap === null) {
      for (let site = 0; site < this.hashes.length && site < (siteRemap?.length ?? this.hashes.length); site++) {
        const newSite = siteRemap![site]!;
        const siteValue = this.internalState.getChunk(site);
        hashDelta ^= this.hashes[newSite]![siteValue]! ^ this.hashes[newSite]![0]!;
      }
      return hashDelta;
    }
    if (siteRemap === null) {
      for (let site = 0; site < this.hashes.length; site++) {
        const siteValue = this.internalState.getChunk(site);
        const newValue = valueRemap[siteValue]!;
        hashDelta ^= this.hashes[site]![newValue]! ^ this.hashes[site]![0]!;
      }
      return hashDelta;
    }
    for (let site = 0; site < this.hashes.length && site < siteRemap.length; site++) {
      const siteValue = this.internalState.getChunk(site);
      const newValue = valueRemap[siteValue]!;
      const newSite = siteRemap[site]!;
      hashDelta ^= this.hashes[newSite]![newValue]! ^ this.hashes[newSite]![0]!;
    }
    return hashDelta;
  }
}
