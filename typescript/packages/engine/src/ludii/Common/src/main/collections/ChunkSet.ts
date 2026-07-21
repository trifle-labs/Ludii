// @java Common/src/main/collections/ChunkSet.java

import { BitTwiddling } from "../math/BitTwiddling.js";

/**
 * This class implements a vector of bits that grows as needed (based on Sun's
 * BitSet), extended with chunk-level read/write operations.
 *
 * Java parity: long[] words → bigint[]; Java long arithmetic → BigInt.
 *
 * @java main/collections/ChunkSet.java
 * @author Arthur van Hoff, Michael McCloskey, Martin Buchholz (BitSet base),
 *         extended by Stephen Tavener / Eric.Piette (Ludii)
 */
export class ChunkSet {

  /** @java ChunkSet.ADDRESS_BITS_PER_WORD */
  private static readonly ADDRESS_BITS_PER_WORD = 6;

  /** @java ChunkSet.BITS_PER_WORD */
  private static readonly BITS_PER_WORD = 1 << ChunkSet.ADDRESS_BITS_PER_WORD; // 64

  /** @java ChunkSet.WORD_MASK — 0xFFFFFFFFFFFFFFFFL as a BigInt */
  private static readonly WORD_MASK = 0xffffffffffffffffn;

  // @java ChunkSet.MASK_NOT_1 — 0xaaaa...aaaa (alternating 0101 pattern)
  static readonly MASK_NOT_1  = BigInt("0xaaaaaaaaaaaaaaaa");
  // @java ChunkSet.MASK_NOT_2 — 0xcccc...cccc
  static readonly MASK_NOT_2  = BigInt("0xcccccccccccccccc");
  // @java ChunkSet.MASK_NOT_4 — 0xf0f0...f0f0
  static readonly MASK_NOT_4  = BigInt("0xf0f0f0f0f0f0f0f0");
  // @java ChunkSet.MASK_NOT_8 — 0xff00ff00...
  static readonly MASK_NOT_8  = BigInt("0xff00ff00ff00ff00");
  // @java ChunkSet.MASK_NOT_16 — 0xffff0000ffff0000
  static readonly MASK_NOT_16 = BigInt("0xffff0000ffff0000");
  // @java ChunkSet.MASK_NOT_32 — 0xffffffff00000000
  static readonly MASK_NOT_32 = BigInt("0xffffffff00000000");

  private static readonly _MASK_NOT_1  = ChunkSet.MASK_NOT_1;
  private static readonly _MASK_NOT_2  = ChunkSet.MASK_NOT_2;
  private static readonly _MASK_NOT_4  = ChunkSet.MASK_NOT_4;
  private static readonly _MASK_NOT_8  = ChunkSet.MASK_NOT_8;
  private static readonly _MASK_NOT_16 = ChunkSet.MASK_NOT_16;
  private static readonly _MASK_NOT_32 = ChunkSet.MASK_NOT_32;

  /** Precomputed bitNMasks[n] = (1n << BigInt(n)) - 1n for n in [0,63] */
  private static readonly bitNMasks: bigint[] = (() => {
    const arr: bigint[] = new Array(64);
    for (let n = 0; n < 64; n++) {
      arr[n] = (1n << BigInt(n)) - 1n;
    }
    return arr;
  })();

  //-------------------------------------------------------------------------

  /** @java ChunkSet#words */
  private words!: bigint[];

  /** @java ChunkSet#wordsInUse */
  private wordsInUse = 0;

  /** @java ChunkSet#sizeIsSticky */
  private sizeIsSticky = false;

  /** @java ChunkSet#chunkSize */
  public readonly chunkSize: number;

  /** @java ChunkSet#chunkMask */
  public readonly chunkMask: bigint;

  //-------------------------------------------------------------------------

  /**
   * Creates a new bit set with chunkSize=1.
   * @java ChunkSet()
   */
  public constructor();

  /**
   * Creates a bit set with given chunkSize and numChunks.
   * @param chunkSize
   * @param numChunks
   * @java ChunkSet(int, int)
   */
  public constructor(chunkSize: number, numChunks: number);

  public constructor(chunkSize?: number, numChunks?: number) {
    if (chunkSize === undefined) {
      // Default constructor
      this.chunkSize = 1;
      this.chunkMask = (1n << 1n) - 1n;
      this._initWords(ChunkSet.BITS_PER_WORD);
      this.sizeIsSticky = false;
    } else {
      this.chunkSize = chunkSize;
      this.chunkMask = (1n << BigInt(chunkSize)) - 1n;
      // assert BitTwiddling.isPowerOf2(chunkSize)
      const nbits = chunkSize * numChunks!;
      this._initWords(nbits);
      this.sizeIsSticky = true;
    }
  }

  //-------------------------------------------------------------------------

  /** @java ChunkSet.wordIndex(int) */
  private static wordIndex(bitIndex: number): number {
    return bitIndex >> ChunkSet.ADDRESS_BITS_PER_WORD;
  }

  /** @java ChunkSet.checkInvariants() */
  private checkInvariants(): void {
    // assertions only — skip in prod
  }

  /** @java ChunkSet.recalculateWordsInUse() */
  private recalculateWordsInUse(): void {
    let i: number;
    for (i = this.wordsInUse - 1; i >= 0; i--) {
      if (this.words[i]! !== 0n) break;
    }
    this.wordsInUse = i + 1;
  }

  /** @java ChunkSet.initWords(int) */
  private _initWords(nbits: number): void {
    const len = nbits > 0 ? ChunkSet.wordIndex(nbits - 1) + 1 : 1;
    this.words = new Array(len).fill(0n);
  }

  /** @java ChunkSet.ensureCapacity(int) */
  private ensureCapacity(wordsRequired: number): void {
    if (this.words.length < wordsRequired) {
      const request = Math.max(2 * this.words.length, wordsRequired);
      const newWords = new Array(request).fill(0n);
      for (let i = 0; i < this.words.length; i++) newWords[i] = this.words[i]!;
      this.words = newWords;
      this.sizeIsSticky = false;
    }
  }

  /** @java ChunkSet.expandTo(int) */
  private expandTo(wordIndex: number): void {
    const wordsRequired = wordIndex + 1;
    if (this.wordsInUse < wordsRequired) {
      this.ensureCapacity(wordsRequired);
      this.wordsInUse = wordsRequired;
    }
  }

  /** @java ChunkSet.checkRange(int, int) */
  private static checkRange(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0) throw new RangeError("fromIndex < 0: " + fromIndex);
    if (toIndex < 0) throw new RangeError("toIndex < 0: " + toIndex);
    if (fromIndex > toIndex) throw new RangeError("fromIndex: " + fromIndex + " > toIndex: " + toIndex);
  }

  //-------------------------------------------------------------------------

  /**
   * Sets the bit at the specified index to the complement of its current value.
   * @param bitIndex
   * @java ChunkSet.flip(int)
   */
  public flip(bitIndex: number): void {
    if (bitIndex < 0) throw new RangeError("bitIndex < 0: " + bitIndex);
    const wordIndex = ChunkSet.wordIndex(bitIndex);
    this.expandTo(wordIndex);
    this.words[wordIndex]! ^= (1n << BigInt(bitIndex));
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Sets each bit from fromIndex (inclusive) to toIndex (exclusive) to its complement.
   * @param fromIndex
   * @param toIndex
   * @java ChunkSet.flip(int, int)
   */
  public flipRange(fromIndex: number, toIndex: number): void {
    ChunkSet.checkRange(fromIndex, toIndex);
    if (fromIndex === toIndex) return;

    const startWordIndex = ChunkSet.wordIndex(fromIndex);
    const endWordIndex   = ChunkSet.wordIndex(toIndex - 1);
    this.expandTo(endWordIndex);

    const firstWordMask = ChunkSet.WORD_MASK << BigInt(fromIndex);
    // Java: WORD_MASK >>> -toIndex  (64-bit unsigned right shift by (-toIndex & 63))
    const lastWordMask  = ChunkSet.WORD_MASK >> BigInt((-toIndex) & 63);

    if (startWordIndex === endWordIndex) {
      this.words[startWordIndex]! ^= (firstWordMask & lastWordMask);
    } else {
      this.words[startWordIndex]! ^= firstWordMask;
      for (let i = startWordIndex + 1; i < endWordIndex; i++) this.words[i]! ^= ChunkSet.WORD_MASK;
      this.words[endWordIndex]! ^= lastWordMask;
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Sets the bit at the specified index to true.
   * @param bitIndex
   * @java ChunkSet.set(int)
   */
  public set(bitIndex: number): void {
    if (bitIndex < 0) throw new RangeError("bitIndex < 0: " + bitIndex);
    const wordIndex = ChunkSet.wordIndex(bitIndex);
    this.expandTo(wordIndex);
    this.words[wordIndex]! |= (1n << BigInt(bitIndex));
    this.checkInvariants();
  }

  /**
   * Sets the bit at the specified index to the specified value.
   * @param bitIndex
   * @param value
   * @java ChunkSet.set(int, boolean)
   */
  public setBit(bitIndex: number, value: boolean): void {
    if (value) this.set(bitIndex);
    else this.clearBit(bitIndex);
  }

  /**
   * Sets the bits from fromIndex (inclusive) to toIndex (exclusive) to true.
   * @param fromIndex
   * @param toIndex
   * @java ChunkSet.set(int, int)
   */
  public setRange(fromIndex: number, toIndex: number): void {
    ChunkSet.checkRange(fromIndex, toIndex);
    if (fromIndex === toIndex) return;

    const startWordIndex = ChunkSet.wordIndex(fromIndex);
    const endWordIndex   = ChunkSet.wordIndex(toIndex - 1);
    this.expandTo(endWordIndex);

    const firstWordMask = ChunkSet.WORD_MASK << BigInt(fromIndex);
    const lastWordMask  = ChunkSet.WORD_MASK >> BigInt((-toIndex) & 63);

    if (startWordIndex === endWordIndex) {
      this.words[startWordIndex]! |= (firstWordMask & lastWordMask);
    } else {
      this.words[startWordIndex]! |= firstWordMask;
      for (let i = startWordIndex + 1; i < endWordIndex; i++) this.words[i] = ChunkSet.WORD_MASK;
      this.words[endWordIndex]! |= lastWordMask;
    }

    this.checkInvariants();
  }

  /**
   * Sets the bits from fromIndex (inclusive) to toIndex (exclusive) to the specified value.
   * @java ChunkSet.set(int, int, boolean)
   */
  public setRangeBool(fromIndex: number, toIndex: number, value: boolean): void {
    if (value) this.setRange(fromIndex, toIndex);
    else this.clearRange(fromIndex, toIndex);
  }

  /**
   * Sets the bit specified by the index to false.
   * @param bitIndex
   * @java ChunkSet.clear(int)
   */
  public clearBit(bitIndex: number): void {
    if (bitIndex < 0) throw new RangeError("bitIndex < 0: " + bitIndex);
    const wordIndex = ChunkSet.wordIndex(bitIndex);
    if (wordIndex >= this.wordsInUse) return;
    this.words[wordIndex]! &= ~(1n << BigInt(bitIndex));
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Sets the bits from fromIndex (inclusive) to toIndex (exclusive) to false.
   * @java ChunkSet.clear(int, int)
   */
  public clearRange(fromIndex: number, toIndex: number): void {
    ChunkSet.checkRange(fromIndex, toIndex);
    if (fromIndex === toIndex) return;

    const startWordIndex = ChunkSet.wordIndex(fromIndex);
    if (startWordIndex >= this.wordsInUse) return;

    let to = toIndex;
    let endWordIndex = ChunkSet.wordIndex(to - 1);
    if (endWordIndex >= this.wordsInUse) {
      to = this.length();
      endWordIndex = this.wordsInUse - 1;
    }

    const firstWordMask = ChunkSet.WORD_MASK << BigInt(fromIndex);
    const lastWordMask  = ChunkSet.WORD_MASK >> BigInt((-to) & 63);

    if (startWordIndex === endWordIndex) {
      this.words[startWordIndex]! &= ~(firstWordMask & lastWordMask);
    } else {
      this.words[startWordIndex]! &= ~firstWordMask;
      for (let i = startWordIndex + 1; i < endWordIndex; i++) this.words[i] = 0n;
      this.words[endWordIndex]! &= ~lastWordMask;
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Sets all of the bits in this BitSet to false.
   * @java ChunkSet.clear()
   */
  public clear(): void {
    while (this.wordsInUse > 0) this.words[--this.wordsInUse] = 0n;
  }

  /**
   * Returns the value of the bit with the specified index.
   * @param bitIndex
   * @java ChunkSet.get(int)
   */
  public get(bitIndex: number): boolean {
    if (bitIndex < 0) throw new RangeError("bitIndex < 0: " + bitIndex);
    this.checkInvariants();
    const wordIndex = ChunkSet.wordIndex(bitIndex);
    return (wordIndex < this.wordsInUse) && ((this.words[wordIndex]! & (1n << BigInt(bitIndex))) !== 0n);
  }

  /**
   * Returns the index of the first bit that is set to true at or after fromIndex.
   * @param fromIndex
   * @java ChunkSet.nextSetBit(int)
   */
  public nextSetBit(fromIndex: number): number {
    if (fromIndex < 0) throw new RangeError("fromIndex < 0: " + fromIndex);
    this.checkInvariants();

    let u = ChunkSet.wordIndex(fromIndex);
    if (u >= this.wordsInUse) return -1;

    let word = this.words[u]! & (ChunkSet.WORD_MASK << BigInt(fromIndex));

    while (true) {
      if (word !== 0n) {
        return (u * ChunkSet.BITS_PER_WORD) + ChunkSet._numberOfTrailingZeros(word);
      }
      if (++u === this.wordsInUse) return -1;
      word = this.words[u]!;
    }
  }

  /**
   * Returns the index of the first bit that is set to false at or after fromIndex.
   * @param fromIndex
   * @java ChunkSet.nextClearBit(int)
   */
  public nextClearBit(fromIndex: number): number {
    if (fromIndex < 0) throw new RangeError("fromIndex < 0: " + fromIndex);
    this.checkInvariants();

    let u = ChunkSet.wordIndex(fromIndex);
    if (u >= this.wordsInUse) return fromIndex;

    let word = ~this.words[u]! & (ChunkSet.WORD_MASK << BigInt(fromIndex));
    // mask to 64-bit unsigned
    word = word & ChunkSet.WORD_MASK;

    while (true) {
      if (word !== 0n) {
        return (u * ChunkSet.BITS_PER_WORD) + ChunkSet._numberOfTrailingZeros(word);
      }
      if (++u === this.wordsInUse) return this.wordsInUse * ChunkSet.BITS_PER_WORD;
      word = (~this.words[u]!) & ChunkSet.WORD_MASK;
    }
  }

  /**
   * Returns the "logical size" of this BitSet.
   * @java ChunkSet.length()
   */
  public length(): number {
    if (this.wordsInUse === 0) return 0;
    return ChunkSet.BITS_PER_WORD * (this.wordsInUse - 1) +
      (ChunkSet.BITS_PER_WORD - ChunkSet._numberOfLeadingZeros(this.words[this.wordsInUse - 1]!));
  }

  /**
   * Returns true if this BitSet contains no bits that are set to true.
   * @java ChunkSet.isEmpty()
   */
  public isEmpty(): boolean {
    return this.wordsInUse === 0;
  }

  /**
   * Returns true if the specified BitSet has any bits set to true that are also set here.
   * @param set
   * @java ChunkSet.intersects(ChunkSet)
   */
  public intersects(set: ChunkSet): boolean {
    for (let i = Math.min(this.wordsInUse, set.wordsInUse) - 1; i >= 0; i--) {
      if ((this.words[i]! & set.words[i]!) !== 0n) return true;
    }
    return false;
  }

  /**
   * Returns the number of bits set to true.
   * @java ChunkSet.cardinality()
   */
  public cardinality(): number {
    let sum = 0;
    for (let i = 0; i < this.wordsInUse; i++) {
      sum += ChunkSet._bitCount(this.words[i]!);
    }
    return sum;
  }

  /**
   * Performs a logical AND of this target bit set with the argument bit set.
   * @param set
   * @java ChunkSet.and(ChunkSet)
   */
  public and(set: ChunkSet): void {
    if (this === set) return;
    while (this.wordsInUse > set.wordsInUse) this.words[--this.wordsInUse] = 0n;
    for (let i = 0; i < this.wordsInUse; i++) this.words[i]! &= set.words[i]!;
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Performs a logical OR of this bit set with the bit set argument.
   * @param set
   * @java ChunkSet.or(ChunkSet)
   */
  public or(set: ChunkSet): void {
    if (this === set) return;
    const wordsInCommon = Math.min(this.wordsInUse, set.wordsInUse);
    if (this.wordsInUse < set.wordsInUse) {
      this.ensureCapacity(set.wordsInUse);
      this.wordsInUse = set.wordsInUse;
    }
    for (let i = 0; i < wordsInCommon; i++) this.words[i]! |= set.words[i]!;
    if (wordsInCommon < set.wordsInUse) {
      for (let i = wordsInCommon; i < this.wordsInUse; i++) {
        this.words[i] = set.words[i]!;
      }
    }
    this.checkInvariants();
  }

  /**
   * Performs a logical XOR of this bit set with the bit set argument.
   * @param set
   * @java ChunkSet.xor(ChunkSet)
   */
  public xor(set: ChunkSet): void {
    const wordsInCommon = Math.min(this.wordsInUse, set.wordsInUse);
    if (this.wordsInUse < set.wordsInUse) {
      this.ensureCapacity(set.wordsInUse);
      this.wordsInUse = set.wordsInUse;
    }
    for (let i = 0; i < wordsInCommon; i++) this.words[i]! ^= set.words[i]!;
    if (wordsInCommon < set.wordsInUse) {
      for (let i = wordsInCommon; i < set.wordsInUse; i++) {
        this.words[i] = set.words[i]!;
      }
    }
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Clears all of the bits in this BitSet whose corresponding bit is set in the specified BitSet.
   * @param set
   * @java ChunkSet.andNot(ChunkSet)
   */
  public andNot(set: ChunkSet): void {
    for (let i = Math.min(this.wordsInUse, set.wordsInUse) - 1; i >= 0; i--)
      this.words[i]! &= ~set.words[i]!;
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Returns a hash code value for this bit set.
   * @java ChunkSet.hashCode()
   */
  public hashCode(): number {
    let h = 1234n;
    for (let i = this.wordsInUse; --i >= 0;)
      h ^= this.words[i]! * BigInt(i + 1);
    // (int)((h >> 32) ^ h)
    return Number((h >> 32n) ^ h) | 0;
  }

  /**
   * Returns the number of bits of space actually in use.
   * @java ChunkSet.size()
   */
  public size(): number {
    return this.words.length * ChunkSet.BITS_PER_WORD;
  }

  /**
   * Compares this object against the specified object.
   * @param obj
   * @java ChunkSet.equals(Object)
   */
  public equals(obj: unknown): boolean {
    if (!(obj instanceof ChunkSet)) return false;
    if (this === obj) return true;
    const set = obj as ChunkSet;
    this.checkInvariants();
    set.checkInvariants();
    if (this.wordsInUse !== set.wordsInUse) return false;
    for (let i = 0; i < this.wordsInUse; i++)
      if (this.words[i]! !== set.words[i]!) return false;
    return true;
  }

  /**
   * Cloning this BitSet produces a new BitSet equal to it.
   * @java ChunkSet.clone()
   */
  public clone(): ChunkSet {
    if (!this.sizeIsSticky) this.trimToSize();
    const result = new ChunkSet(this.chunkSize, 0);
    // Override the auto-allocated words with a copy
    result.words = this.words.slice();
    result.wordsInUse = this.wordsInUse;
    result.sizeIsSticky = this.sizeIsSticky;
    result.checkInvariants();
    return result;
  }

  /**
   * Attempts to reduce internal storage used for the bits.
   * @java ChunkSet.trimToSize()
   */
  public trimToSize(): void {
    if (this.wordsInUse !== this.words.length) {
      this.words = this.words.slice(0, this.wordsInUse);
      this.checkInvariants();
    }
  }

  /**
   * Returns a string representation of this bit set.
   * @java ChunkSet.toString()
   */
  public toString(): string {
    this.checkInvariants();
    let b = "{";
    let i = this.nextSetBit(0);
    if (i !== -1) {
      b += i;
      for (i = this.nextSetBit(i + 1); i >= 0; i = this.nextSetBit(i + 1)) {
        const endOfRun = this.nextClearBit(i);
        let j = i;
        do {
          b += ", " + j;
        } while (++j < endOfRun);
        i = j - 1;
      }
    }
    b += "}";
    return b;
  }

  // =========================================================================
  // NEW ADDITIONS FOR CHUNKING
  // =========================================================================

  /**
   * @return Number of bits per chunk.
   * @java ChunkSet.chunkSize()
   */
  public getChunkSize(): number {
    return this.chunkSize;
  }

  /**
   * @return Number of complete chunks.
   * @java ChunkSet.numChunks()
   */
  public numChunks(): number {
    return (this.chunkSize === 0) ? 0 : Math.trunc(this.size() / this.chunkSize);
  }

  /**
   * @return Number of chunks that have at least one set bit.
   * @java ChunkSet.numNonZeroChunks()
   */
  public numNonZeroChunks(): number {
    let count = 0;
    const numChunks = this.numChunks();
    for (let i = 0; i < numChunks; ++i) {
      if (this.getChunk(i) !== 0) ++count;
    }
    return count;
  }

  /**
   * If chunk is out of range, returns 0.
   * @param chunk Chunk to get.
   * @return Integer defined by the specified bits.
   * @java ChunkSet.getChunk(int)
   */
  public getChunk(chunk: number): number {
    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;

    if (wordIndex >= this.words.length) return 0;

    const down = bitIndex & 63;
    return Number((this.words[wordIndex]! >> BigInt(down)) & this.chunkMask);
  }

  /**
   * @return A list of indices of all the non-zero chunks.
   * @java ChunkSet.getNonzeroChunks()
   */
  public getNonzeroChunks(): number[] {
    const indices: number[] = [];
    const chunksPerWord = Math.trunc(64 / this.chunkSize);

    for (let wordIdx = 0; wordIdx < this.words.length; ++wordIdx) {
      const word = this.words[wordIdx]!;
      if (word !== 0n) {
        for (let chunkWord = 0; chunkWord < chunksPerWord; ++chunkWord) {
          if ((word & (this.chunkMask << BigInt(chunkWord * this.chunkSize))) !== 0n)
            indices.push(wordIdx * chunksPerWord + chunkWord);
        }
      }
    }
    return indices;
  }

  /**
   * Encode integer value in the specified chunk.
   * @param chunk Chunk to set.
   * @param value Value to encode.
   * @java ChunkSet.setChunk(int, int)
   */
  public setChunk(chunk: number, value: number): void {
    if (value < 0 || value >= (1 << this.chunkSize))
      throw new RangeError("Chunk value " + value + " is out of range for size = " + this.chunkSize);
    if (this.chunkSize === 0) return;

    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    this.expandTo(wordIndex);

    const up = bitIndex & 63;
    this.words[wordIndex]! &= ~(this.chunkMask << BigInt(up));
    this.words[wordIndex]! |= (BigInt(value) << BigInt(up));

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Sets the value for the given chunk, and returns the value the chunk had prior.
   * @param chunk
   * @param value
   * @return Integer defined by the specified bits (prior to setting new value).
   * @java ChunkSet.getAndSetChunk(int, int)
   */
  public getAndSetChunk(chunk: number, value: number): number {
    if (value < 0 || value >= (1 << this.chunkSize))
      throw new RangeError("Chunk value " + value + " is out of range for size = " + this.chunkSize);
    if (this.chunkSize === 0) return 0;

    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    this.expandTo(wordIndex);

    const down   = bitIndex & 63;
    const oldVal = Number((this.words[wordIndex]! >> BigInt(down)) & this.chunkMask);

    this.words[wordIndex]! &= ~(this.chunkMask << BigInt(down));
    this.words[wordIndex]! |= (BigInt(value) << BigInt(down));

    this.recalculateWordsInUse();
    this.checkInvariants();

    return oldVal;
  }

  /**
   * Clear the specified chunk.
   * @param chunk Chunk to clear.
   * @java ChunkSet.clearChunk(int)
   */
  public clearChunk(chunk: number): void {
    if (this.chunkSize === 0) return;

    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    if (wordIndex > this.wordsInUse) return;

    const up = bitIndex & 63;
    this.words[wordIndex]! &= ~(this.chunkMask << BigInt(up));

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Sets all of the bits in this BitSet to false without resizing.
   * @java ChunkSet.clearNoResize()
   */
  public clearNoResize(): void {
    for (let w = 0; w < this.wordsInUse; w++) this.words[w] = 0n;
    this.wordsInUse = 0;
    this.checkInvariants();
  }

  //-------------------------------------------------------------------------
  // Bit routines for CSP puzzle states

  /** @java ChunkSet.getBit(int, int) */
  public getBit(chunk: number, bit: number): number {
    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    const down = bitIndex & 63;
    return Number((this.words[wordIndex]! >> BigInt(down + bit)) & 1n);
  }

  /** @java ChunkSet.setBit(int, int, boolean) */
  public setChunkBit(chunk: number, bit: number, value: boolean): void {
    if (this.chunkSize === 0) return;

    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    this.expandTo(wordIndex);

    const up = bitIndex & 63;
    const bitMask = 1n << BigInt(up + bit);

    if (value) this.words[wordIndex]! |= bitMask;
    else        this.words[wordIndex]! &= ~bitMask;

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /** @java ChunkSet.toggleBit(int, int) */
  public toggleBit(chunk: number, bit: number): void {
    if (this.chunkSize === 0) return;

    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    this.expandTo(wordIndex);

    const up = bitIndex & 63;
    const bitMask = 1n << BigInt(up + bit);
    this.words[wordIndex]! ^= bitMask;

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /** @java ChunkSet.setNBits(int, int, boolean) */
  public setNBits(chunk: number, numBits: number, value: boolean): void {
    if (this.chunkSize === 0) return;

    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    this.expandTo(wordIndex);

    const up = bitIndex & 63;
    const bitsNMask = ChunkSet.bitNMasks[numBits]! << BigInt(up);

    if (value) this.words[wordIndex]! |= bitsNMask;
    else        this.words[wordIndex]! &= ~bitsNMask;

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /** @java ChunkSet.resolveToBit(int, int) */
  public resolveToBit(chunk: number, bit: number): void {
    if (this.chunkSize === 0) return;

    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    this.expandTo(wordIndex);

    const up = bitIndex & 63;
    const bitMask = 1n << BigInt(up + bit);
    this.words[wordIndex]! &= ~(this.chunkMask << BigInt(up));
    this.words[wordIndex]! |= bitMask;

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /** @java ChunkSet.numBitsOn(int) */
  public numBitsOn(chunk: number): number {
    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    const down  = bitIndex & 63;
    const value = Number((this.words[wordIndex]! >> BigInt(down)) & this.chunkMask);

    let numBits = 0;
    for (let b = 0; b < this.chunkSize; b++) {
      if (((1 << b) & value) !== 0) numBits++;
    }
    return numBits;
  }

  /** @java ChunkSet.isResolved(int) */
  public isResolved(chunk: number): boolean {
    return this.numBitsOn(chunk) === 1;
  }

  /**
   * @param chunk
   * @return Resolved value, else 0 if not resolved yet.
   * @java ChunkSet.resolvedTo(int)
   */
  public resolvedTo(chunk: number): number {
    const bitIndex  = chunk * this.chunkSize;
    const wordIndex = bitIndex >> 6;
    const down  = bitIndex & 63;
    const value = Number((this.words[wordIndex]! >> BigInt(down)) & this.chunkMask);

    let result = -1;
    let numBits = 0;
    for (let b = 0; b < this.chunkSize; b++) {
      if (((1 << b) & value) !== 0) {
        result = b;
        numBits++;
      }
    }
    return (numBits === 1) ? result : 0;
  }

  //-------------------------------------------------------------------------

  /**
   * Equivalent to: this <<= numBits;
   * @param numBits Number of bits to shift (< 64).
   * @param expand  Whether to expand the bitset if necessary.
   * @java ChunkSet.shiftL(int, boolean)
   */
  public shiftL(numBits: number, expand: boolean): void {
    if (numBits === 0) return;

    if (expand) {
      const maxIndex = ChunkSet.wordIndex(this.length() + numBits);
      this.expandTo(maxIndex);
    }

    const remnant = 64 - numBits;
    let carry = 0n;
    const numBitsBig = BigInt(numBits);
    const remnantBig = BigInt(remnant);

    for (let idx = 0; idx < this.wordsInUse; idx++) {
      const temp = this.words[idx]! >> remnantBig;
      this.words[idx] = ((this.words[idx]! << numBitsBig) | carry) & ChunkSet.WORD_MASK;
      carry = temp;
    }

    if (!expand) {
      const sz = this.size();
      if ((sz & 63) > 0) {
        const mask = (1n << BigInt(sz & 63)) - 1n;
        this.words[this.wordsInUse - 1]! &= mask;
      }
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  /**
   * Equivalent to: this >>>= numBits;
   * @param numBits Number of bits to shift (< 64).
   * @java ChunkSet.shiftR(int)
   */
  public shiftR(numBits: number): void {
    if (numBits === 0) return;

    const remnant = 64 - numBits;
    let carry = 0n;
    const numBitsBig = BigInt(numBits);
    const remnantBig = BigInt(remnant);

    for (let idx = this.wordsInUse - 1; idx >= 0; idx--) {
      const temp = this.words[idx]! << remnantBig;
      this.words[idx] = (this.words[idx]! >> numBitsBig) | carry;
      carry = temp & ChunkSet.WORD_MASK;
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  //-------------------------------------------------------------------------

  /**
   * We say that this ChunkSet matches the specified pattern if and only
   * if all the bits covered by the given mask in this ChunkSet are equal
   * to the corresponding bits in the given pattern.
   * @java ChunkSet.matches(ChunkSet, ChunkSet)
   */
  public matches(mask: ChunkSet, pattern: ChunkSet): boolean {
    const maskWordsInUse = mask.wordsInUse;
    if (this.wordsInUse < maskWordsInUse) return false;
    for (let n = 0; n < maskWordsInUse; n++) {
      if ((this.words[n]! & mask.words[n]!) !== pattern.words[n]!) return false;
    }
    return true;
  }

  /**
   * @param wordIdx
   * @param mask
   * @param matchingWord
   * @return True if the word at wordIdx, after masking by mask, matches the given word.
   * @java ChunkSet.matchesWord(int, long, long)
   */
  public matchesWord(wordIdx: number, mask: bigint, matchingWord: bigint): boolean {
    if (this.words.length <= wordIdx) return false;
    return ((this.words[wordIdx]! & mask) === matchingWord);
  }

  /**
   * Adds given mask to given word.
   * @param wordIdx
   * @param mask
   * @java ChunkSet.addMask(int, long)
   */
  public addMask(wordIdx: number, mask: bigint): void {
    this.expandTo(wordIdx);
    this.words[wordIdx]! |= mask;
    this.checkInvariants();
  }

  //-------------------------------------------------------------------------

  /**
   * We say that this ChunkSet violates the specified not-pattern if and only
   * if there exists at least one chunk in this ChunkSet which is covered by
   * the given mask and which is equal to the corresponding chunk in the given pattern.
   * @java ChunkSet.violatesNot(ChunkSet, ChunkSet)
   */
  public violatesNot(mask: ChunkSet, pattern: ChunkSet): boolean {
    return this.violatesNotFrom(mask, pattern, 0);
  }

  /**
   * @java ChunkSet.violatesNot(ChunkSet, ChunkSet, int)
   */
  public violatesNotFrom(mask: ChunkSet, pattern: ChunkSet, startWord: number): boolean {
    const wordsToCheck = Math.min(this.wordsInUse, mask.wordsInUse);
    for (let n = startWord; n < wordsToCheck; n++) {
      let temp = ~(this.words[n]! ^ pattern.words[n]!) & mask.words[n]!;
      // mask to 64-bit
      temp = temp & ChunkSet.WORD_MASK;

      if (this.chunkSize > 1) {
        temp = ((temp & ChunkSet._MASK_NOT_1) >> 1n) & temp;
        if (this.chunkSize > 2) {
          temp = ((temp & ChunkSet._MASK_NOT_2) >> 2n) & temp;
          if (this.chunkSize > 4) {
            temp = ((temp & ChunkSet._MASK_NOT_4) >> 4n) & temp;
            if (this.chunkSize > 8) {
              temp = ((temp & ChunkSet._MASK_NOT_8) >> 8n) & temp;
              if (this.chunkSize > 16) {
                temp = ((temp & ChunkSet._MASK_NOT_16) >> 16n) & temp;
                if (this.chunkSize > 32) {
                  temp = ((temp & ChunkSet._MASK_NOT_32) >> 32n) & temp;
                }
              }
            }
          }
        }
      }
      if (temp !== 0n) return true; // violation
    }
    return false; // no violation
  }

  //-------------------------------------------------------------------------

  /**
   * @return A string-representation that conveniently shows the values of non-zero chunks.
   * @java ChunkSet.toChunkString()
   */
  public toChunkString(): string {
    this.checkInvariants();
    let b = "{";
    for (let i = 0; i < this.numChunks(); ++i) {
      const value = this.getChunk(i);
      if (value !== 0) {
        if (b.length > 1) b += ", ";
        b += "chunk " + i + " = " + value;
      }
    }
    b += "}";
    return b;
  }

  //-------------------------------------------------------------------------
  // Private helpers for BigInt bit operations

  /** Equivalent to Java Long.numberOfTrailingZeros for BigInt */
  private static _numberOfTrailingZeros(word: bigint): number {
    if (word === 0n) return 64;
    let count = 0;
    while ((word & 1n) === 0n) {
      word >>= 1n;
      count++;
    }
    return count;
  }

  /** Equivalent to Java Long.numberOfLeadingZeros for BigInt (64-bit) */
  private static _numberOfLeadingZeros(word: bigint): number {
    if (word === 0n) return 64;
    let count = 0;
    while ((word & (1n << 63n)) === 0n) {
      word <<= 1n;
      count++;
    }
    return count;
  }

  /** Equivalent to Java Long.bitCount for BigInt */
  private static _bitCount(word: bigint): number {
    let count = 0;
    while (word !== 0n) {
      count += Number(word & 1n);
      word >>= 1n;
    }
    return count;
  }

  //-------------------------------------------------------------------------
}

// Suppress unused import warning — BitTwiddling is referenced in the Java source
void BitTwiddling;
