const ADDRESS_BITS_PER_WORD = 6;
const BITS_PER_WORD = 1 << ADDRESS_BITS_PER_WORD;
const WORD_MASK = (1n << 64n) - 1n;
const BIT_N_MASKS = Array.from({ length: 64 }, (_, n) =>
  n === 0 ? 0n : (1n << BigInt(n)) - 1n,
);

function wordIndex(bitIndex: number): number {
  return bitIndex >> ADDRESS_BITS_PER_WORD;
}

function toWord(value: bigint): bigint {
  return value & WORD_MASK;
}

function bitMask(bitIndex: number): bigint {
  return 1n << BigInt(bitIndex & 63);
}

function firstWordMask(fromIndex: number): bigint {
  const shift = fromIndex & 63;
  return shift === 0 ? WORD_MASK : toWord(WORD_MASK << BigInt(shift));
}

function lastWordMask(toIndex: number): bigint {
  const shift = toIndex & 63;
  return shift === 0 ? WORD_MASK : (1n << BigInt(shift)) - 1n;
}

function bitCount32(value: number): number {
  let remaining = value >>> 0;
  let count = 0;

  while (remaining !== 0) {
    remaining &= remaining - 1;
    count += 1;
  }

  return count;
}

function bitCount64(value: bigint): number {
  return (
    bitCount32(Number(value & 0xffffffffn)) +
    bitCount32(Number((value >> 32n) & 0xffffffffn))
  );
}

function numberOfLeadingZeros(value: bigint): number {
  const high = Number((value >> 32n) & 0xffffffffn) >>> 0;

  if (high !== 0) {
    return Math.clz32(high);
  }

  const low = Number(value & 0xffffffffn) >>> 0;
  return 32 + Math.clz32(low);
}

function numberOfTrailingZeros(value: bigint): number {
  const low = Number(value & 0xffffffffn) >>> 0;

  if (low !== 0) {
    return 31 - Math.clz32(low & -low);
  }

  const high = Number((value >> 32n) & 0xffffffffn) >>> 0;
  return 32 + (31 - Math.clz32(high & -high));
}

function toSignedInt32(value: bigint): number {
  const unsigned = Number(value & 0xffffffffn);
  return unsigned >= 0x80000000 ? unsigned - 0x1_0000_0000 : unsigned;
}

function asWordMask(value: bigint | number): bigint {
  return toWord(typeof value === "bigint" ? value : BigInt(value));
}

/**
 * TypeScript port of `/home/runner/work/Ludii/Ludii/Common/src/main/collections/ChunkSet.java`.
 */
export class ChunkSet {
  private words: bigint[];

  private wordsInUse = 0;

  private sizeIsSticky = false;

  private readonly chunkSizeBits: number;

  private readonly chunkMaskBits: bigint;

  public constructor();
  public constructor(chunkSize: number, numChunks: number);
  public constructor(chunkSize = 1, numChunks?: number) {
    if (numChunks === undefined) {
      this.chunkSizeBits = 1;
      this.chunkMaskBits = 1n;
      this.words = this.createWords(BITS_PER_WORD);
      this.sizeIsSticky = false;
      return;
    }

    if (!Number.isInteger(chunkSize) || chunkSize <= 0 || chunkSize > 32) {
      throw new RangeError("chunkSize must be an integer between 1 and 32.");
    }

    if ((chunkSize & (chunkSize - 1)) !== 0) {
      throw new RangeError("chunkSize must be a power of 2.");
    }

    if (!Number.isInteger(numChunks) || numChunks < 0) {
      throw new RangeError("numChunks must be a non-negative integer.");
    }

    this.chunkSizeBits = chunkSize;
    this.chunkMaskBits = (1n << BigInt(chunkSize)) - 1n;
    this.words = this.createWords(chunkSize * numChunks);
    this.sizeIsSticky = true;
  }

  private createWords(nbits: number): bigint[] {
    const count = nbits <= 0 ? 0 : wordIndex(nbits - 1) + 1;
    return Array.from({ length: count }, () => 0n);
  }

  private checkInvariants(): void {
    if (this.wordsInUse < 0 || this.wordsInUse > this.words.length) {
      throw new Error("ChunkSet invariant violated: invalid wordsInUse.");
    }

    if (this.wordsInUse > 0 && this.wordAt(this.wordsInUse - 1) === 0n) {
      throw new Error(
        "ChunkSet invariant violated: trailing used word is zero.",
      );
    }

    if (
      this.wordsInUse < this.words.length &&
      this.wordAt(this.wordsInUse) !== 0n
    ) {
      throw new Error("ChunkSet invariant violated: unused word is non-zero.");
    }
  }

  private wordAt(index: number): bigint {
    return this.words[index] ?? 0n;
  }

  private setWord(index: number, value: bigint): void {
    this.words[index] = toWord(value);
  }

  private recalculateWordsInUse(): void {
    let index = this.wordsInUse - 1;

    while (index >= 0 && this.wordAt(index) === 0n) {
      index -= 1;
    }

    this.wordsInUse = index + 1;
  }

  private ensureCapacity(wordsRequired: number): void {
    if (this.words.length >= wordsRequired) {
      return;
    }

    const request = Math.max(2 * this.words.length, wordsRequired);
    this.words.length = request;

    for (let index = 0; index < request; index += 1) {
      this.words[index] ??= 0n;
    }

    this.sizeIsSticky = false;
  }

  private expandTo(targetWordIndex: number): void {
    const wordsRequired = targetWordIndex + 1;

    if (this.wordsInUse >= wordsRequired) {
      return;
    }

    this.ensureCapacity(wordsRequired);
    this.wordsInUse = wordsRequired;
  }

  private static checkRange(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0) {
      throw new RangeError(`fromIndex < 0: ${fromIndex}`);
    }

    if (toIndex < 0) {
      throw new RangeError(`toIndex < 0: ${toIndex}`);
    }

    if (fromIndex > toIndex) {
      throw new RangeError(`fromIndex: ${fromIndex} > toIndex: ${toIndex}`);
    }
  }

  private requireChunkValue(value: number): void {
    const upperBound = 2 ** this.chunkSizeBits;

    if (!Number.isInteger(value) || value < 0 || value >= upperBound) {
      throw new RangeError(
        `Chunk value ${value} is out of range for size = ${this.chunkSizeBits}`,
      );
    }
  }

  public flip(bitIndex: number): void;
  public flip(fromIndex: number, toIndex: number): void;
  public flip(fromIndex: number, toIndex?: number): void {
    if (toIndex === undefined) {
      if (fromIndex < 0) {
        throw new RangeError(`bitIndex < 0: ${fromIndex}`);
      }

      const targetWordIndex = wordIndex(fromIndex);
      this.expandTo(targetWordIndex);
      this.setWord(
        targetWordIndex,
        this.wordAt(targetWordIndex) ^ bitMask(fromIndex),
      );
      this.recalculateWordsInUse();
      this.checkInvariants();
      return;
    }

    ChunkSet.checkRange(fromIndex, toIndex);

    if (fromIndex === toIndex) {
      return;
    }

    const startWordIndex = wordIndex(fromIndex);
    const endWordIndex = wordIndex(toIndex - 1);
    this.expandTo(endWordIndex);

    const firstMask = firstWordMask(fromIndex);
    const lastMask = lastWordMask(toIndex);

    if (startWordIndex === endWordIndex) {
      this.setWord(
        startWordIndex,
        this.wordAt(startWordIndex) ^ (firstMask & lastMask),
      );
    } else {
      this.setWord(startWordIndex, this.wordAt(startWordIndex) ^ firstMask);

      for (let index = startWordIndex + 1; index < endWordIndex; index += 1) {
        this.setWord(index, this.wordAt(index) ^ WORD_MASK);
      }

      this.setWord(endWordIndex, this.wordAt(endWordIndex) ^ lastMask);
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public set(bitIndex: number, value?: boolean): void;
  public set(fromIndex: number, toIndex: number, value?: boolean): void;
  public set(
    fromIndex: number,
    toIndexOrValue?: boolean | number,
    value = true,
  ): void {
    if (typeof toIndexOrValue === "boolean") {
      if (toIndexOrValue) {
        this.set(fromIndex);
      } else {
        this.clear(fromIndex);
      }

      return;
    }

    if (typeof toIndexOrValue === "number") {
      const toIndex = toIndexOrValue;
      ChunkSet.checkRange(fromIndex, toIndex);

      if (fromIndex === toIndex) {
        return;
      }

      if (!value) {
        this.clear(fromIndex, toIndex);
        return;
      }

      const startWordIndex = wordIndex(fromIndex);
      const endWordIndex = wordIndex(toIndex - 1);
      this.expandTo(endWordIndex);

      const firstMask = firstWordMask(fromIndex);
      const lastMask = lastWordMask(toIndex);

      if (startWordIndex === endWordIndex) {
        this.setWord(
          startWordIndex,
          this.wordAt(startWordIndex) | (firstMask & lastMask),
        );
      } else {
        this.setWord(startWordIndex, this.wordAt(startWordIndex) | firstMask);

        for (let index = startWordIndex + 1; index < endWordIndex; index += 1) {
          this.setWord(index, WORD_MASK);
        }

        this.setWord(endWordIndex, this.wordAt(endWordIndex) | lastMask);
      }

      this.checkInvariants();
      return;
    }

    if (fromIndex < 0) {
      throw new RangeError(`bitIndex < 0: ${fromIndex}`);
    }

    const targetWordIndex = wordIndex(fromIndex);
    this.expandTo(targetWordIndex);
    this.setWord(
      targetWordIndex,
      this.wordAt(targetWordIndex) | bitMask(fromIndex),
    );
    this.checkInvariants();
  }

  public clear(): void;
  public clear(bitIndex: number): void;
  public clear(fromIndex: number, toIndex: number): void;
  public clear(fromIndex?: number, toIndex?: number): void {
    if (fromIndex === undefined) {
      while (this.wordsInUse > 0) {
        this.words[--this.wordsInUse] = 0n;
      }

      return;
    }

    if (toIndex === undefined) {
      if (fromIndex < 0) {
        throw new RangeError(`bitIndex < 0: ${fromIndex}`);
      }

      const targetWordIndex = wordIndex(fromIndex);

      if (targetWordIndex >= this.wordsInUse) {
        return;
      }

      this.setWord(
        targetWordIndex,
        this.wordAt(targetWordIndex) & ~bitMask(fromIndex),
      );
      this.recalculateWordsInUse();
      this.checkInvariants();
      return;
    }

    ChunkSet.checkRange(fromIndex, toIndex);

    if (fromIndex === toIndex) {
      return;
    }

    const startWordIndex = wordIndex(fromIndex);

    if (startWordIndex >= this.wordsInUse) {
      return;
    }

    let effectiveTo = toIndex;
    let endWordIndex = wordIndex(effectiveTo - 1);

    if (endWordIndex >= this.wordsInUse) {
      effectiveTo = this.length();
      endWordIndex = this.wordsInUse - 1;
    }

    const firstMask = firstWordMask(fromIndex);
    const lastMask = lastWordMask(effectiveTo);

    if (startWordIndex === endWordIndex) {
      this.setWord(
        startWordIndex,
        this.wordAt(startWordIndex) & ~(firstMask & lastMask),
      );
    } else {
      this.setWord(startWordIndex, this.wordAt(startWordIndex) & ~firstMask);

      for (let index = startWordIndex + 1; index < endWordIndex; index += 1) {
        this.words[index] = 0n;
      }

      this.setWord(endWordIndex, this.wordAt(endWordIndex) & ~lastMask);
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public get(bitIndex: number): boolean {
    if (bitIndex < 0) {
      throw new RangeError(`bitIndex < 0: ${bitIndex}`);
    }

    this.checkInvariants();
    const targetWordIndex = wordIndex(bitIndex);
    return (
      targetWordIndex < this.wordsInUse &&
      (this.wordAt(targetWordIndex) & bitMask(bitIndex)) !== 0n
    );
  }

  public nextSetBit(fromIndex: number): number {
    if (fromIndex < 0) {
      throw new RangeError(`fromIndex < 0: ${fromIndex}`);
    }

    this.checkInvariants();
    let wordIdx = wordIndex(fromIndex);

    if (wordIdx >= this.wordsInUse) {
      return -1;
    }

    let word = this.wordAt(wordIdx) & firstWordMask(fromIndex);

    while (true) {
      if (word !== 0n) {
        return wordIdx * BITS_PER_WORD + numberOfTrailingZeros(word);
      }

      wordIdx += 1;

      if (wordIdx === this.wordsInUse) {
        return -1;
      }

      word = this.wordAt(wordIdx);
    }
  }

  public nextClearBit(fromIndex: number): number {
    if (fromIndex < 0) {
      throw new RangeError(`fromIndex < 0: ${fromIndex}`);
    }

    this.checkInvariants();
    let wordIdx = wordIndex(fromIndex);

    if (wordIdx >= this.wordsInUse) {
      return fromIndex;
    }

    let word = toWord(~this.wordAt(wordIdx)) & firstWordMask(fromIndex);

    while (true) {
      if (word !== 0n) {
        return wordIdx * BITS_PER_WORD + numberOfTrailingZeros(word);
      }

      wordIdx += 1;

      if (wordIdx === this.wordsInUse) {
        return this.wordsInUse * BITS_PER_WORD;
      }

      word = toWord(~this.wordAt(wordIdx));
    }
  }

  public length(): number {
    if (this.wordsInUse === 0) {
      return 0;
    }

    return (
      BITS_PER_WORD * (this.wordsInUse - 1) +
      (BITS_PER_WORD - numberOfLeadingZeros(this.wordAt(this.wordsInUse - 1)))
    );
  }

  public isEmpty(): boolean {
    return this.wordsInUse === 0;
  }

  public intersects(other: ChunkSet): boolean {
    for (
      let index = Math.min(this.wordsInUse, other.wordsInUse) - 1;
      index >= 0;
      index -= 1
    ) {
      if ((this.wordAt(index) & other.wordAt(index)) !== 0n) {
        return true;
      }
    }

    return false;
  }

  public cardinality(): number {
    let sum = 0;

    for (let index = 0; index < this.wordsInUse; index += 1) {
      sum += bitCount64(this.wordAt(index));
    }

    return sum;
  }

  public and(other: ChunkSet): void {
    if (this === other) {
      return;
    }

    while (this.wordsInUse > other.wordsInUse) {
      this.words[--this.wordsInUse] = 0n;
    }

    for (let index = 0; index < this.wordsInUse; index += 1) {
      this.setWord(index, this.wordAt(index) & other.wordAt(index));
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public or(other: ChunkSet): void {
    if (this === other) {
      return;
    }

    const wordsInCommon = Math.min(this.wordsInUse, other.wordsInUse);

    if (this.wordsInUse < other.wordsInUse) {
      this.ensureCapacity(other.wordsInUse);
      this.wordsInUse = other.wordsInUse;
    }

    for (let index = 0; index < wordsInCommon; index += 1) {
      this.setWord(index, this.wordAt(index) | other.wordAt(index));
    }

    for (let index = wordsInCommon; index < other.wordsInUse; index += 1) {
      this.setWord(index, other.wordAt(index));
    }

    this.checkInvariants();
  }

  public xor(other: ChunkSet): void {
    const wordsInCommon = Math.min(this.wordsInUse, other.wordsInUse);

    if (this.wordsInUse < other.wordsInUse) {
      this.ensureCapacity(other.wordsInUse);
      this.wordsInUse = other.wordsInUse;
    }

    for (let index = 0; index < wordsInCommon; index += 1) {
      this.setWord(index, this.wordAt(index) ^ other.wordAt(index));
    }

    for (let index = wordsInCommon; index < other.wordsInUse; index += 1) {
      this.setWord(index, other.wordAt(index));
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public andNot(other: ChunkSet): void {
    for (
      let index = Math.min(this.wordsInUse, other.wordsInUse) - 1;
      index >= 0;
      index -= 1
    ) {
      this.setWord(index, this.wordAt(index) & ~other.wordAt(index));
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public hashCode(): number {
    let hash = 1234n;

    for (let index = this.wordsInUse - 1; index >= 0; index -= 1) {
      hash ^= this.wordAt(index) * BigInt(index + 1);
    }

    return toSignedInt32((hash >> 32n) ^ hash);
  }

  public size(): number {
    return this.words.length * BITS_PER_WORD;
  }

  public equals(other: unknown): boolean {
    if (!(other instanceof ChunkSet)) {
      return false;
    }

    if (this === other) {
      return true;
    }

    this.checkInvariants();
    other.checkInvariants();

    if (this.wordsInUse !== other.wordsInUse) {
      return false;
    }

    for (let index = 0; index < this.wordsInUse; index += 1) {
      if (this.wordAt(index) !== other.wordAt(index)) {
        return false;
      }
    }

    return true;
  }

  public clone(): ChunkSet {
    const result = new ChunkSet(this.chunkSizeBits, 0);
    result.words = [...this.words];
    result.wordsInUse = this.wordsInUse;
    result.sizeIsSticky = this.sizeIsSticky;
    result.checkInvariants();
    return result;
  }

  public trimToSize(): void {
    if (this.wordsInUse !== this.words.length) {
      this.words = this.words.slice(0, this.wordsInUse);
      this.checkInvariants();
    }
  }

  public toString(): string {
    this.checkInvariants();
    const bits: number[] = [];

    for (
      let index = this.nextSetBit(0);
      index >= 0;
      index = this.nextSetBit(index + 1)
    ) {
      const endOfRun = this.nextClearBit(index);

      do {
        bits.push(index);
        index += 1;
      } while (index < endOfRun);

      index -= 1;
    }

    return `{${bits.join(", ")}}`;
  }

  public numChunks(): number {
    return this.chunkSizeBits === 0 ? 0 : this.size() / this.chunkSizeBits;
  }

  public numNonZeroChunks(): number {
    let count = 0;

    for (let chunk = 0; chunk < this.numChunks(); chunk += 1) {
      if (this.getChunk(chunk) !== 0) {
        count += 1;
      }
    }

    return count;
  }

  public getChunk(chunk: number): number {
    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;

    if (targetWordIndex >= this.words.length) {
      return 0;
    }

    const down = bitIndex & 63;
    return Number(
      (this.wordAt(targetWordIndex) >> BigInt(down)) & this.chunkMaskBits,
    );
  }

  public getNonzeroChunks(): number[] {
    const indices: number[] = [];
    const chunksPerWord = BITS_PER_WORD / this.chunkSizeBits;

    for (let wordIdx = 0; wordIdx < this.words.length; wordIdx += 1) {
      const word = this.wordAt(wordIdx);

      if (word === 0n) {
        continue;
      }

      for (let chunkWord = 0; chunkWord < chunksPerWord; chunkWord += 1) {
        const shiftedMask =
          this.chunkMaskBits << BigInt(chunkWord * this.chunkSizeBits);

        if ((word & shiftedMask) !== 0n) {
          indices.push(wordIdx * chunksPerWord + chunkWord);
        }
      }
    }

    return indices;
  }

  public setChunk(chunk: number, value: number): void {
    this.requireChunkValue(value);

    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;
    const shift = bitIndex & 63;
    const shiftedMask = this.chunkMaskBits << BigInt(shift);
    this.expandTo(targetWordIndex);
    this.setWord(targetWordIndex, this.wordAt(targetWordIndex) & ~shiftedMask);
    this.setWord(
      targetWordIndex,
      this.wordAt(targetWordIndex) | (BigInt(value) << BigInt(shift)),
    );
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public getAndSetChunk(chunk: number, value: number): number {
    this.requireChunkValue(value);

    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;
    const shift = bitIndex & 63;
    const shiftedMask = this.chunkMaskBits << BigInt(shift);
    this.expandTo(targetWordIndex);
    const oldValue = Number(
      (this.wordAt(targetWordIndex) >> BigInt(shift)) & this.chunkMaskBits,
    );
    this.setWord(targetWordIndex, this.wordAt(targetWordIndex) & ~shiftedMask);
    this.setWord(
      targetWordIndex,
      this.wordAt(targetWordIndex) | (BigInt(value) << BigInt(shift)),
    );
    this.recalculateWordsInUse();
    this.checkInvariants();
    return oldValue;
  }

  public clearChunk(chunk: number): void {
    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;

    if (targetWordIndex >= this.wordsInUse) {
      return;
    }

    const shift = bitIndex & 63;
    const shiftedMask = this.chunkMaskBits << BigInt(shift);
    this.setWord(targetWordIndex, this.wordAt(targetWordIndex) & ~shiftedMask);
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public clearNoResize(): void {
    for (let index = 0; index < this.wordsInUse; index += 1) {
      this.words[index] = 0n;
    }

    this.wordsInUse = 0;
    this.checkInvariants();
  }

  public getBit(chunk: number, bit: number): number {
    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;
    const shift = bitIndex & 63;

    return Number((this.wordAt(targetWordIndex) >> BigInt(shift + bit)) & 1n);
  }

  public setBit(chunk: number, bit: number, value: boolean): void {
    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;
    const shift = bitIndex & 63;
    const mask = 1n << BigInt(shift + bit);
    this.expandTo(targetWordIndex);

    if (value) {
      this.setWord(targetWordIndex, this.wordAt(targetWordIndex) | mask);
    } else {
      this.setWord(targetWordIndex, this.wordAt(targetWordIndex) & ~mask);
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public toggleBit(chunk: number, bit: number): void {
    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;
    const shift = bitIndex & 63;
    const mask = 1n << BigInt(shift + bit);
    this.expandTo(targetWordIndex);
    this.setWord(targetWordIndex, this.wordAt(targetWordIndex) ^ mask);
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public setNBits(chunk: number, numBits: number, value: boolean): void {
    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;
    const shift = bitIndex & 63;
    const bitsMask = (BIT_N_MASKS[numBits] ?? 0n) << BigInt(shift);
    this.expandTo(targetWordIndex);

    if (value) {
      this.setWord(targetWordIndex, this.wordAt(targetWordIndex) | bitsMask);
    } else {
      this.setWord(targetWordIndex, this.wordAt(targetWordIndex) & ~bitsMask);
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public resolveToBit(chunk: number, bit: number): void {
    const bitIndex = chunk * this.chunkSizeBits;
    const targetWordIndex = bitIndex >> 6;
    const shift = bitIndex & 63;
    const shiftedMask = this.chunkMaskBits << BigInt(shift);
    const bitMaskValue = 1n << BigInt(shift + bit);
    this.expandTo(targetWordIndex);
    this.setWord(targetWordIndex, this.wordAt(targetWordIndex) & ~shiftedMask);
    this.setWord(targetWordIndex, this.wordAt(targetWordIndex) | bitMaskValue);
    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public numBitsOn(chunk: number): number {
    return bitCount32(this.getChunk(chunk));
  }

  public isResolved(chunk: number): boolean {
    return this.numBitsOn(chunk) === 1;
  }

  public resolvedTo(chunk: number): number {
    const value = this.getChunk(chunk);
    let result = -1;
    let numBits = 0;

    for (let bit = 0; bit < this.chunkSizeBits; bit += 1) {
      if ((value & (1 << bit)) !== 0) {
        result = bit;
        numBits += 1;
      }
    }

    return numBits === 1 ? result : 0;
  }

  public shiftL(numBits: number, expand: boolean): void {
    if (numBits === 0) {
      return;
    }

    const originalSize = this.size();

    if (expand) {
      this.expandTo(wordIndex(this.length() + numBits));
    }

    const remnant = 64 - numBits;
    let carry = 0n;

    for (let index = 0; index < this.wordsInUse; index += 1) {
      const current = this.wordAt(index);
      const temp = current >> BigInt(remnant);
      this.setWord(index, (current << BigInt(numBits)) | carry);
      carry = temp;
    }

    if (!expand && (originalSize & 63) > 0 && this.wordsInUse > 0) {
      const mask = (1n << BigInt(originalSize & 63)) - 1n;
      this.setWord(
        this.wordsInUse - 1,
        this.wordAt(this.wordsInUse - 1) & mask,
      );
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public shiftR(numBits: number): void {
    if (numBits === 0) {
      return;
    }

    const remnant = 64 - numBits;
    let carry = 0n;

    for (let index = this.wordsInUse - 1; index >= 0; index -= 1) {
      const current = this.wordAt(index);
      const temp = toWord(current << BigInt(remnant));
      this.setWord(index, (current >> BigInt(numBits)) | carry);
      carry = temp;
    }

    this.recalculateWordsInUse();
    this.checkInvariants();
  }

  public matches(mask: ChunkSet, pattern: ChunkSet): boolean {
    if (this.wordsInUse < mask.wordsInUse) {
      return false;
    }

    for (let index = 0; index < mask.wordsInUse; index += 1) {
      if ((this.wordAt(index) & mask.wordAt(index)) !== pattern.wordAt(index)) {
        return false;
      }
    }

    return true;
  }

  public matchesWord(
    wordIdx: number,
    mask: bigint | number,
    matchingWord: bigint | number,
  ): boolean {
    if (this.words.length <= wordIdx) {
      return false;
    }

    return (
      (this.wordAt(wordIdx) & asWordMask(mask)) === asWordMask(matchingWord)
    );
  }

  public addMask(wordIdx: number, mask: bigint | number): void {
    this.expandTo(wordIdx);
    this.setWord(wordIdx, this.wordAt(wordIdx) | asWordMask(mask));
    this.checkInvariants();
  }

  public violatesNot(
    mask: ChunkSet,
    pattern: ChunkSet,
    startWord = 0,
  ): boolean {
    const wordsToCheck = Math.min(this.wordsInUse, mask.wordsInUse);
    const chunksPerWord = BITS_PER_WORD / this.chunkSizeBits;
    const startChunk = startWord * chunksPerWord;
    const endChunk = wordsToCheck * chunksPerWord;

    for (let chunk = startChunk; chunk < endChunk; chunk += 1) {
      const maskChunk = mask.getChunk(chunk);

      if (
        maskChunk !== 0 &&
        (this.getChunk(chunk) & maskChunk) === pattern.getChunk(chunk)
      ) {
        return true;
      }
    }

    return false;
  }

  public toChunkString(): string {
    this.checkInvariants();
    const parts: string[] = [];

    for (let chunk = 0; chunk < this.numChunks(); chunk += 1) {
      const value = this.getChunk(chunk);

      if (value !== 0) {
        parts.push(`chunk ${chunk} = ${value}`);
      }
    }

    return `{${parts.join(", ")}}`;
  }

  public chunkSize(): number {
    return this.chunkSizeBits;
  }
}
