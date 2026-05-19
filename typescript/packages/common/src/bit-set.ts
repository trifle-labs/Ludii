/**
 * Compact bit-vector ported from `java.util.BitSet`.
 *
 * The Java original is documented at:
 * https://docs.oracle.com/javase/8/docs/api/java/util/BitSet.html
 *
 * Implementation notes:
 *
 * - Bits are packed into 32-bit words (the JavaScript bitwise operators
 *   coerce to int32, so this is the natural word size). The visible
 *   semantics still match Java exactly — only the internal word width
 *   differs from the 64-bit Java implementation.
 * - The set automatically grows the word array on demand, matching the
 *   "no-fixed-size" contract Java exposes.
 * - `length()`, `cardinality()`, `nextSetBit`, `nextClearBit` and the
 *   logical combinators all follow Java's semantics, including the
 *   "logical size is one past the highest set bit" rule.
 */

const ADDRESS_BITS_PER_WORD = 5;
const BITS_PER_WORD = 1 << ADDRESS_BITS_PER_WORD; // 32
const BIT_INDEX_MASK = BITS_PER_WORD - 1;

function wordIndex(bitIndex: number): number {
  return bitIndex >>> ADDRESS_BITS_PER_WORD;
}

function bitMask(bitIndex: number): number {
  return 1 << (bitIndex & BIT_INDEX_MASK);
}

/** popcount on a 32-bit unsigned word. */
function popcount32(value: number): number {
  let v = value >>> 0;
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  v = (v + (v >>> 4)) & 0x0f0f0f0f;
  return (Math.imul(v, 0x01010101) >>> 24) & 0xff;
}

/** Number of trailing zero bits in a non-zero 32-bit unsigned word. */
function trailingZeros32(value: number): number {
  if (value === 0) return 32;
  let v = value >>> 0;
  let n = 31;
  let y = (v << 16) >>> 0;
  if (y !== 0) {
    n -= 16;
    v = y;
  }
  y = (v << 8) >>> 0;
  if (y !== 0) {
    n -= 8;
    v = y;
  }
  y = (v << 4) >>> 0;
  if (y !== 0) {
    n -= 4;
    v = y;
  }
  y = (v << 2) >>> 0;
  if (y !== 0) {
    n -= 2;
    v = y;
  }
  return n - ((v << 1) >>> 31);
}

/** Highest set bit position in a non-zero 32-bit unsigned word. */
function highestBit32(value: number): number {
  let v = value >>> 0;
  let n = 0;
  if (v >= 0x10000) {
    v >>>= 16;
    n += 16;
  }
  if (v >= 0x100) {
    v >>>= 8;
    n += 8;
  }
  if (v >= 0x10) {
    v >>>= 4;
    n += 4;
  }
  if (v >= 0x4) {
    v >>>= 2;
    n += 2;
  }
  if (v >= 0x2) {
    n += 1;
  }
  return n;
}

function checkBitIndex(bitIndex: number): void {
  if (!Number.isInteger(bitIndex) || bitIndex < 0) {
    throw new RangeError(`bitIndex < 0: ${String(bitIndex)}`);
  }
}

function checkRange(fromIndex: number, toIndex: number): void {
  if (!Number.isInteger(fromIndex) || fromIndex < 0) {
    throw new RangeError(`fromIndex < 0: ${String(fromIndex)}`);
  }
  if (!Number.isInteger(toIndex) || toIndex < 0) {
    throw new RangeError(`toIndex < 0: ${String(toIndex)}`);
  }
  if (fromIndex > toIndex) {
    throw new RangeError(
      `fromIndex: ${String(fromIndex)} > toIndex: ${String(toIndex)}`,
    );
  }
}

export class BitSet implements Iterable<number> {
  private words: number[];
  /** Number of words actively in use (logical word length). */
  private wordsInUse: number;

  public constructor(nbits = 0) {
    if (!Number.isInteger(nbits) || nbits < 0) {
      throw new RangeError(`nbits < 0: ${String(nbits)}`);
    }
    const wordCount = nbits === 0 ? 0 : wordIndex(nbits - 1) + 1;
    this.words = new Array(wordCount).fill(0);
    this.wordsInUse = 0;
  }

  // -------------------------------------------------------------------------
  // Element-level operations
  // -------------------------------------------------------------------------

  public get(bitIndex: number): boolean {
    checkBitIndex(bitIndex);
    const wi = wordIndex(bitIndex);
    if (wi >= this.wordsInUse) {
      return false;
    }
    return ((this.words[wi] ?? 0) & bitMask(bitIndex)) !== 0;
  }

  public set(bitIndex: number): void;
  public set(bitIndex: number, value: boolean): void;
  public set(fromIndex: number, toIndex: number): void;
  public set(
    fromIndex: number,
    toIndexOrValue?: number | boolean,
    maybeValue?: boolean,
  ): void {
    // Single-index forms.
    if (typeof toIndexOrValue === "boolean" || toIndexOrValue === undefined) {
      const value = (toIndexOrValue ?? true) as boolean;
      checkBitIndex(fromIndex);
      if (!value) {
        this.clear(fromIndex);
        return;
      }
      const wi = wordIndex(fromIndex);
      this.expandTo(wi);
      this.words[wi] = (this.words[wi] ?? 0) | bitMask(fromIndex) | 0;
      return;
    }

    // Range forms.
    const toIndex = toIndexOrValue;
    const value = maybeValue ?? true;
    checkRange(fromIndex, toIndex);
    if (fromIndex === toIndex) return;
    if (!value) {
      this.clear(fromIndex, toIndex);
      return;
    }

    const startWordIndex = wordIndex(fromIndex);
    const endWordIndex = wordIndex(toIndex - 1);
    this.expandTo(endWordIndex);

    const firstWordMask = (-1 << (fromIndex & BIT_INDEX_MASK)) | 0;
    const lastWordMask = (-1 >>> -(toIndex & BIT_INDEX_MASK || 0)) | 0;

    if (startWordIndex === endWordIndex) {
      this.words[startWordIndex] =
        (this.words[startWordIndex] ?? 0) | (firstWordMask & lastWordMask) | 0;
      return;
    }
    this.words[startWordIndex] =
      (this.words[startWordIndex] ?? 0) | firstWordMask | 0;
    for (let i = startWordIndex + 1; i < endWordIndex; ++i) {
      this.words[i] = -1;
    }
    // The last partial word: bits 0..((toIndex-1) & 31), inclusive.
    const lastBits = ((toIndex - 1) & BIT_INDEX_MASK) + 1;
    const tailMask = lastBits === 32 ? -1 : ((1 << lastBits) - 1) | 0;
    this.words[endWordIndex] = (this.words[endWordIndex] ?? 0) | tailMask | 0;
  }

  public flip(bitIndex: number): void {
    checkBitIndex(bitIndex);
    const wi = wordIndex(bitIndex);
    this.expandTo(wi);
    this.words[wi] = ((this.words[wi] ?? 0) ^ bitMask(bitIndex)) | 0;
    this.recalculateWordsInUse();
  }

  public clear(): void;
  public clear(bitIndex: number): void;
  public clear(fromIndex: number, toIndex: number): void;
  public clear(fromIndex?: number, toIndex?: number): void {
    if (fromIndex === undefined) {
      for (let i = 0; i < this.wordsInUse; ++i) this.words[i] = 0;
      this.wordsInUse = 0;
      return;
    }

    if (toIndex === undefined) {
      checkBitIndex(fromIndex);
      const wi = wordIndex(fromIndex);
      if (wi >= this.wordsInUse) return;
      this.words[wi] = ((this.words[wi] ?? 0) & ~bitMask(fromIndex)) | 0;
      this.recalculateWordsInUse();
      return;
    }

    checkRange(fromIndex, toIndex);
    if (fromIndex === toIndex) return;
    const startWordIndex = wordIndex(fromIndex);
    if (startWordIndex >= this.wordsInUse) return;

    let endWordIndex = wordIndex(toIndex - 1);
    let toIndexEff = toIndex;
    if (endWordIndex >= this.wordsInUse) {
      toIndexEff = this.length();
      endWordIndex = this.wordsInUse - 1;
    }

    const firstWordMask = (-1 << (fromIndex & BIT_INDEX_MASK)) | 0;
    const lastBits = ((toIndexEff - 1) & BIT_INDEX_MASK) + 1;
    const lastWordMask = lastBits === 32 ? -1 : ((1 << lastBits) - 1) | 0;

    if (startWordIndex === endWordIndex) {
      this.words[startWordIndex] =
        ((this.words[startWordIndex] ?? 0) & ~(firstWordMask & lastWordMask)) |
        0;
    } else {
      this.words[startWordIndex] =
        ((this.words[startWordIndex] ?? 0) & ~firstWordMask) | 0;
      for (let i = startWordIndex + 1; i < endWordIndex; ++i) {
        this.words[i] = 0;
      }
      this.words[endWordIndex] =
        ((this.words[endWordIndex] ?? 0) & ~lastWordMask) | 0;
    }
    this.recalculateWordsInUse();
  }

  // -------------------------------------------------------------------------
  // Logical operations
  // -------------------------------------------------------------------------

  public and(other: BitSet): void {
    if (this === other) return;
    while (this.wordsInUse > other.wordsInUse) {
      this.words[--this.wordsInUse] = 0;
    }
    for (let i = 0; i < this.wordsInUse; ++i) {
      this.words[i] = ((this.words[i] ?? 0) & (other.words[i] ?? 0)) | 0;
    }
    this.recalculateWordsInUse();
  }

  public or(other: BitSet): void {
    if (this === other) return;
    const wordsInCommon = Math.min(this.wordsInUse, other.wordsInUse);
    if (this.wordsInUse < other.wordsInUse) {
      this.ensureCapacity(other.wordsInUse);
      this.wordsInUse = other.wordsInUse;
    }
    for (let i = 0; i < wordsInCommon; ++i) {
      this.words[i] = (this.words[i] ?? 0) | (other.words[i] ?? 0) | 0;
    }
    if (wordsInCommon < other.wordsInUse) {
      for (let i = wordsInCommon; i < other.wordsInUse; ++i) {
        this.words[i] = (other.words[i] ?? 0) | 0;
      }
    }
  }

  public xor(other: BitSet): void {
    const wordsInCommon = Math.min(this.wordsInUse, other.wordsInUse);
    if (this.wordsInUse < other.wordsInUse) {
      this.ensureCapacity(other.wordsInUse);
      this.wordsInUse = other.wordsInUse;
    }
    for (let i = 0; i < wordsInCommon; ++i) {
      this.words[i] = ((this.words[i] ?? 0) ^ (other.words[i] ?? 0)) | 0;
    }
    if (wordsInCommon < other.wordsInUse) {
      for (let i = wordsInCommon; i < other.wordsInUse; ++i) {
        this.words[i] = (other.words[i] ?? 0) | 0;
      }
    }
    this.recalculateWordsInUse();
  }

  public andNot(other: BitSet): void {
    for (let i = Math.min(this.wordsInUse, other.wordsInUse) - 1; i >= 0; --i) {
      this.words[i] = ((this.words[i] ?? 0) & ~(other.words[i] ?? 0)) | 0;
    }
    this.recalculateWordsInUse();
  }

  // -------------------------------------------------------------------------
  // Search / cardinality / shape
  // -------------------------------------------------------------------------

  public nextSetBit(fromIndex: number): number {
    checkBitIndex(fromIndex);
    let u = wordIndex(fromIndex);
    if (u >= this.wordsInUse) return -1;
    let word =
      ((this.words[u] ?? 0) & (-1 << (fromIndex & BIT_INDEX_MASK))) | 0;
    while (true) {
      if (word !== 0) {
        return (u << ADDRESS_BITS_PER_WORD) + trailingZeros32(word >>> 0);
      }
      if (++u === this.wordsInUse) return -1;
      word = this.words[u] ?? 0;
    }
  }

  public nextClearBit(fromIndex: number): number {
    checkBitIndex(fromIndex);
    let u = wordIndex(fromIndex);
    if (u >= this.wordsInUse) return fromIndex;
    let word =
      (~(this.words[u] ?? 0) & (-1 << (fromIndex & BIT_INDEX_MASK))) | 0;
    while (true) {
      if (word !== 0) {
        return (u << ADDRESS_BITS_PER_WORD) + trailingZeros32(word >>> 0);
      }
      if (++u === this.wordsInUse) {
        return this.wordsInUse << ADDRESS_BITS_PER_WORD;
      }
      word = ~(this.words[u] ?? 0) | 0;
    }
  }

  public cardinality(): number {
    let sum = 0;
    for (let i = 0; i < this.wordsInUse; ++i) {
      sum += popcount32((this.words[i] ?? 0) >>> 0);
    }
    return sum;
  }

  /** Returns one plus the index of the highest set bit, or 0 if empty. */
  public length(): number {
    if (this.wordsInUse === 0) return 0;
    const last = (this.words[this.wordsInUse - 1] ?? 0) >>> 0;
    return BITS_PER_WORD * (this.wordsInUse - 1) + (highestBit32(last) + 1);
  }

  public size(): number {
    return this.words.length * BITS_PER_WORD;
  }

  public isEmpty(): boolean {
    return this.wordsInUse === 0;
  }

  public intersects(other: BitSet): boolean {
    const lim = Math.min(this.wordsInUse, other.wordsInUse);
    for (let i = 0; i < lim; ++i) {
      if (((this.words[i] ?? 0) & (other.words[i] ?? 0)) !== 0) return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Value semantics
  // -------------------------------------------------------------------------

  public equals(other: unknown): boolean {
    if (other === this) return true;
    if (!(other instanceof BitSet)) return false;
    const that = other as BitSet;
    if (this.wordsInUse !== that.wordsInUse) return false;
    for (let i = 0; i < this.wordsInUse; ++i) {
      if ((this.words[i] ?? 0) !== (that.words[i] ?? 0)) return false;
    }
    return true;
  }

  /**
   * Bit-by-bit equivalent of `java.util.BitSet.hashCode()`:
   *
   * ```
   * long h = 1234L;
   * for (int i = words.length; --i >= 0; )
   *     h ^= words[i] * (i + 1);
   * return (int) ((h >> 32) ^ h);
   * ```
   *
   * The Java reference assumes 64-bit words; this port stores 32-bit words
   * but folds them up via bigint to keep the visible hash identical for any
   * BitSet whose logical content is the same.
   */
  public hashCode(): number {
    let h = 1234n;
    for (let i = this.wordsInUse - 1; i >= 0; --i) {
      // Re-pack two 32-bit words into one 64-bit Java word so the hash
      // matches the Java BitSet hash for the same logical bit content.
      const javaWordIndex = i >> 1;
      const lo = (this.words[javaWordIndex * 2] ?? 0) >>> 0;
      const hi = (this.words[javaWordIndex * 2 + 1] ?? 0) >>> 0;
      // Only fold each 64-bit Java word once (when we encounter its low
      // half), to mirror the Java loop semantics.
      if (i % 2 !== 0) continue;
      const javaWord = (BigInt(hi) << 32n) | BigInt(lo);
      // Java's `h ^= words[i] * (i + 1)` uses unsigned-friendly 64-bit math.
      const product = BigInt.asIntN(64, javaWord * BigInt(javaWordIndex + 1));
      h ^= product;
    }
    h = BigInt.asIntN(64, h);
    const folded = BigInt.asIntN(64, (h >> 32n) ^ h);
    return Number(BigInt.asIntN(32, folded));
  }

  public clone(): BitSet {
    const copy = new BitSet();
    copy.words = this.words.slice(0, this.wordsInUse);
    copy.wordsInUse = this.wordsInUse;
    return copy;
  }

  public toString(): string {
    const parts: string[] = [];
    for (let i = this.nextSetBit(0); i >= 0; i = this.nextSetBit(i + 1)) {
      parts.push(String(i));
    }
    return `{${parts.join(", ")}}`;
  }

  // -------------------------------------------------------------------------
  // Iteration
  // -------------------------------------------------------------------------

  /** Iterates set-bit indices in ascending order. */
  public [Symbol.iterator](): Iterator<number> {
    let cursor = this.nextSetBit(0);
    const self = this;
    return {
      next(): IteratorResult<number> {
        if (cursor === -1) {
          return { value: 0, done: true };
        }
        const value = cursor;
        cursor = self.nextSetBit(cursor + 1);
        return { value, done: false };
      },
    };
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private ensureCapacity(wordsRequired: number): void {
    if (this.words.length < wordsRequired) {
      const newSize = Math.max(2 * this.words.length, wordsRequired);
      const extended = new Array<number>(newSize).fill(0);
      for (let i = 0; i < this.words.length; ++i) {
        extended[i] = this.words[i] ?? 0;
      }
      this.words = extended;
    }
  }

  private expandTo(wordIdx: number): void {
    const required = wordIdx + 1;
    if (this.wordsInUse < required) {
      this.ensureCapacity(required);
      this.wordsInUse = required;
    }
  }

  private recalculateWordsInUse(): void {
    let i = this.wordsInUse - 1;
    while (i >= 0 && (this.words[i] ?? 0) === 0) --i;
    this.wordsInUse = i + 1;
  }
}
