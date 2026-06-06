// @java Common/src/graphics/qr_codes/BitBuffer.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

/**
 * An appendable sequence of bits (0s and 1s), mainly used by QrSegment.
 *
 * @java graphics/qr_codes/BitBuffer.java
 */
export class BitBuffer {
  /*---- Fields ----*/

  /** In each 32-bit word, bits are filled from top down. @java BitBuffer.data */
  public data: Int32Array;

  /** Always non-negative. @java BitBuffer.bitLength */
  public bitLength: number;

  /*---- Constructor ----*/

  /** Creates an empty bit buffer. @java BitBuffer() */
  public constructor() {
    this.data = new Int32Array(64);
    this.bitLength = 0;
  }

  /*---- Methods ----*/

  /**
   * Returns the bit at the given index, yielding 0 or 1.
   * @java BitBuffer.getBit(int)
   */
  public getBit(index: number): number {
    if (index < 0 || index >= this.bitLength) {
      throw new RangeError("Index out of bounds");
    }
    const word = this.data[index >>> 5];
    if (word === undefined) throw new RangeError("data array access out of range");
    return (word >>> ~index) & 1;
  }

  /**
   * Returns a new array representing this buffer's bits packed into
   * bytes in big endian. The current bit length must be a multiple of 8.
   * @java BitBuffer.getBytes()
   */
  public getBytes(): Uint8Array {
    if (this.bitLength % 8 !== 0) {
      throw new Error("Data is not a whole number of bytes");
    }
    const result = new Uint8Array(this.bitLength / 8);
    for (let i = 0; i < result.length; i++) {
      const word = this.data[i >>> 2];
      if (word === undefined) throw new Error("data array access out of range");
      result[i] = (word >>> (~i << 3)) & 0xFF;
    }
    return result;
  }

  /**
   * Appends the given number of low-order bits of the given value
   * to this buffer. Requires 0 <= len <= 31 and 0 <= val < 2^len.
   * @java BitBuffer.appendBits(int, int)
   */
  public appendBits(value: number, length: number): void;

  /**
   * Appends to this buffer the sequence of bits represented by the given
   * word array and given bit length. Requires 0 <= len <= 32 * vals.length.
   * @java BitBuffer.appendBits(int[], int)
   */
  public appendBits(vals: Int32Array, len: number): void;

  public appendBits(valueOrVals: number | Int32Array, length: number): void {
    if (typeof valueOrVals === "number") {
      this._appendBitsScalar(valueOrVals, length);
    } else {
      this._appendBitsArray(valueOrVals, length);
    }
  }

  private _appendBitsScalar(value: number, length: number): void {
    let val = value;
    let len = length;
    if (len < 0 || len > 31 || val >>> len !== 0) {
      throw new Error("Value out of range");
    }
    if (len > (2147483647 - this.bitLength)) {
      throw new Error("Maximum length reached");
    }

    if (this.bitLength + len + 1 > this.data.length << 5) {
      const newData = new Int32Array(this.data.length * 2);
      newData.set(this.data);
      this.data = newData;
    }

    let remain = 32 - (this.bitLength & 0x1F);
    if (remain < len) {
      const idx0 = this.bitLength >>> 5;
      if (idx0 < this.data.length) {
        this.data[idx0] = (this.data[idx0]! | (val >>> (len - remain))) | 0;
      }
      this.bitLength += remain;
      len -= remain;
      val &= (1 << len) - 1;
      remain = 32;
    }
    const idx = this.bitLength >>> 5;
    if (idx < this.data.length) {
      this.data[idx] = (this.data[idx]! | (val << (remain - len))) | 0;
    }
    this.bitLength += len;
  }

  private _appendBitsArray(vals: Int32Array, len: number): void {
    if (len === 0) return;
    if (len < 0 || len > vals.length * 32) {
      throw new Error("Value out of range");
    }
    const wholeWords = Math.floor(len / 32);
    const tailBits = len % 32;
    if (tailBits > 0) {
      const lastWord = vals[wholeWords];
      if (lastWord === undefined) throw new Error("vals array access out of range");
      if ((lastWord << tailBits) !== 0) {
        throw new Error("Last word must have low bits clear");
      }
    }
    if (len > 2147483647 - this.bitLength) {
      throw new Error("Maximum length reached");
    }

    while (this.bitLength + len > this.data.length * 32) {
      const newData = new Int32Array(this.data.length * 2);
      newData.set(this.data);
      this.data = newData;
    }

    const shift = this.bitLength % 32;
    if (shift === 0) {
      const count = Math.ceil(len / 32);
      for (let k = 0; k < count; k++) {
        const idx = this.bitLength / 32 + k;
        if (idx < this.data.length) {
          (this.data as Int32Array)[idx] = vals[k] ?? 0;
        }
      }
      this.bitLength += len;
    } else {
      for (let i = 0; i < wholeWords; i++) {
        const word = vals[i] ?? 0;
        const idx = this.bitLength >>> 5;
        if (idx < this.data.length) {
          this.data[idx] = (this.data[idx]! | (word >>> shift)) | 0;
        }
        this.bitLength += 32;
        const idx2 = this.bitLength >>> 5;
        if (idx2 < this.data.length) {
          (this.data as Int32Array)[idx2] = word << (32 - shift);
        }
      }
      if (tailBits > 0) {
        const tailWord = vals[wholeWords] ?? 0;
        this._appendBitsScalar(tailWord >>> (32 - tailBits), tailBits);
      }
    }
  }
}
