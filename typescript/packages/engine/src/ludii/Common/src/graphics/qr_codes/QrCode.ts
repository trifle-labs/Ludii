// @java Common/src/graphics/qr_codes/QrCode.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

import { BitBuffer } from "./BitBuffer.js";
import { DataTooLongException } from "./DataTooLongException.js";
import { QrSegment } from "./QrSegment.js";
import { QrTemplate } from "./QrTemplate.js";
import { ReedSolomonGenerator } from "./ReedSolomonGenerator.js";

/**
 * A QR Code symbol, which is a type of two-dimensional barcode.
 * Invented by Denso Wave and described in the ISO/IEC 18004 standard.
 *
 * @java graphics/qr_codes/QrCode.java
 */
export class QrCode {
  /*---- Public immutable scalar parameters ----*/

  /** The version number of this QR Code, which is between 1 and 40 (inclusive). @java QrCode.version */
  public readonly version: number;

  /** The width and height of this QR Code, measured in modules. @java QrCode.size */
  public readonly size: number;

  /** The error correction level used in this QR Code. @java QrCode.errorCorrectionLevel */
  public readonly errorCorrectionLevel: Ecc;

  /** The index of the mask pattern used in this QR Code (0–7). @java QrCode.mask */
  public readonly mask: number;

  /** Private grid of modules packed into bits. @java QrCode.modules */
  private readonly modules: Int32Array;

  /*---- Constructor (low level) ----*/

  /**
   * Constructs a QR Code with the specified version number,
   * error correction level, data codeword bytes, and mask number.
   * @java QrCode(int, Ecc, byte[], int)
   */
  public constructor(ver: number, ecl: Ecc, dataCodewords: Uint8Array, msk: number) {
    if (ver < QrCode.MIN_VERSION || ver > QrCode.MAX_VERSION) {
      throw new Error("Version value out of range");
    }
    if (msk < -1 || msk > 7) {
      throw new Error("Mask value out of range");
    }
    this.version = ver;
    this.size = ver * 4 + 17;
    this.errorCorrectionLevel = ecl;

    if (dataCodewords === null || dataCodewords === undefined) throw new Error("dataCodewords is null");

    const tpl = QrTemplate.MEMOIZER.get(ver);
    this.modules = new Int32Array(tpl.template);

    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(tpl.dataOutputBitIndexes, allCodewords);
    this.mask = this.handleConstructorMasking(tpl.masks, msk);
  }

  /*---- Static factory functions (high level) ----*/

  /**
   * Returns a QR Code representing the specified Unicode text string at the specified error correction level.
   * @java QrCode.encodeText(String, Ecc)
   */
  public static encodeText(text: string, ecl: Ecc): QrCode {
    if (text === null || text === undefined) throw new Error("text is null");
    if (ecl === null || ecl === undefined) throw new Error("ecl is null");
    const segs = QrSegment.makeSegments(text);
    return QrCode.encodeSegments(segs, ecl);
  }

  /**
   * Returns a QR Code representing the specified binary data at the specified error correction level.
   * @java QrCode.encodeBinary(byte[], Ecc)
   */
  public static encodeBinary(data: Uint8Array, ecl: Ecc): QrCode {
    if (data === null || data === undefined) throw new Error("data is null");
    if (ecl === null || ecl === undefined) throw new Error("ecl is null");
    const seg = QrSegment.makeBytes(data);
    return QrCode.encodeSegments([seg], ecl);
  }

  /*---- Static factory functions (mid level) ----*/

  /**
   * Returns a QR Code representing the specified segments at the specified error correction level.
   * @java QrCode.encodeSegments(List<QrSegment>, Ecc)
   */
  public static encodeSegments(segs: readonly QrSegment[], ecl: Ecc): QrCode {
    return QrCode.encodeSegmentsFull(segs, ecl, QrCode.MIN_VERSION, QrCode.MAX_VERSION, -1, true);
  }

  /**
   * Returns a QR Code representing the specified segments with the specified encoding parameters.
   * @java QrCode.encodeSegments(List<QrSegment>, Ecc, int, int, int, boolean)
   */
  public static encodeSegmentsFull(
    segs: readonly QrSegment[],
    eclIn: Ecc,
    minVersion: number,
    maxVersion: number,
    mask: number,
    boostEcl: boolean
  ): QrCode {
    let ecl = eclIn;
    if (segs === null || segs === undefined) throw new Error("segs is null");
    if (ecl === null || ecl === undefined) throw new Error("ecl is null");
    if (!(QrCode.MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= QrCode.MAX_VERSION) || mask < -1 || mask > 7) {
      throw new Error("Invalid value");
    }

    // Find the minimal version number to use
    let version: number;
    let dataUsedBits: number = -1;
    for (version = minVersion; ; version++) {
      const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
      dataUsedBits = QrSegment.getTotalBits(segs, version);
      if (dataUsedBits !== -1 && dataUsedBits <= dataCapacityBits) break;
      if (version >= maxVersion) {
        let msg = "Segment too long";
        if (dataUsedBits !== -1) {
          msg = `Data length = ${dataUsedBits} bits, Max capacity = ${dataCapacityBits} bits`;
        }
        throw new DataTooLongException(msg);
      }
    }

    // Increase the error correction level while the data still fits
    for (const newEcl of Ecc.values()) {
      if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8) {
        ecl = newEcl;
      }
    }

    // Concatenate all segments to create the data bit string
    const bb = new BitBuffer();
    for (const seg of segs) {
      bb.appendBits(seg.mode.modeBits, 4);
      bb.appendBits(seg.numChars, seg.mode.numCharCountBits(version));
      bb.appendBits(seg.data, seg.bitLength);
    }

    // Add terminator and pad up to a byte if applicable
    const dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
    bb.appendBits(0, Math.min(4, dataCapacityBits - bb.bitLength));
    bb.appendBits(0, (8 - bb.bitLength % 8) % 8);

    // Pad with alternating bytes until data capacity is reached
    for (let padByte = 0xEC; bb.bitLength < dataCapacityBits; padByte ^= 0xEC ^ 0x11) {
      bb.appendBits(padByte, 8);
    }

    // Create the QR Code object
    return new QrCode(version, ecl, bb.getBytes(), mask);
  }

  /*---- Public instance methods ----*/

  /**
   * Returns the color of the module (pixel) at the specified coordinates.
   * @java QrCode.getModule(int, int)
   */
  public getModule(x: number, y: number): boolean {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      const i = y * this.size + x;
      const word = this.modules[i >>> 5];
      if (word === undefined) return false;
      return QrCode.getBit(word, i) !== 0;
    }
    return false;
  }

  /*---- Private helper methods for constructor: Drawing function modules ----*/

  /**
   * Draws two copies of the format bits based on the given mask.
   * @java QrCode.drawFormatBits(int)
   */
  private drawFormatBits(msk: number): void {
    let data = (this.errorCorrectionLevel.formatBits << 3) | msk;
    let rem = data;
    for (let i = 0; i < 10; i++) {
      rem = (rem << 1) ^ (((rem >>> 9) & 1) * 0x537);
    }
    const bits = ((data << 10) | rem) ^ 0x5412;

    // Draw first copy
    for (let i = 0; i <= 5; i++) this.setModule(8, i, QrCode.getBit(bits, i));
    this.setModule(8, 7, QrCode.getBit(bits, 6));
    this.setModule(8, 8, QrCode.getBit(bits, 7));
    this.setModule(7, 8, QrCode.getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setModule(14 - i, 8, QrCode.getBit(bits, i));

    // Draw second copy
    for (let i = 0; i < 8; i++) this.setModule(this.size - 1 - i, 8, QrCode.getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setModule(8, this.size - 15 + i, QrCode.getBit(bits, i));
    this.setModule(8, this.size - 8, 1);
  }

  /**
   * Sets the module at the given coordinates to the given color.
   * @java QrCode.setModule(int, int, int)
   */
  private setModule(x: number, y: number, dark: number): void {
    const i = y * this.size + x;
    this.modules[i >>> 5]! &= ~(1 << i);
    this.modules[i >>> 5]! |= dark << i;
  }

  /*---- Private helper methods for constructor: Codewords and masking ----*/

  /**
   * Returns a new byte string representing the given data with the appropriate error correction
   * codewords appended to it.
   * @java QrCode.addEccAndInterleave(byte[])
   */
  private addEccAndInterleave(data: Uint8Array): Uint8Array {
    if (data.length !== QrCode.getNumDataCodewords(this.version, this.errorCorrectionLevel)) {
      throw new Error("addEccAndInterleave: data length mismatch");
    }

    const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[this.errorCorrectionLevel.ordinal()]![this.version]!;
    const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[this.errorCorrectionLevel.ordinal()]![this.version]!;
    const rawCodewords = Math.floor(QrTemplate.getNumRawDataModules(this.version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockDataLen = Math.floor(rawCodewords / numBlocks) - blockEccLen;

    const result = new Uint8Array(rawCodewords);
    const rs = ReedSolomonGenerator.MEMOIZER.get(blockEccLen);
    const ecc = new Int8Array(blockEccLen);

    for (let i = 0, k = 0; i < numBlocks; i++) {
      const datLen = shortBlockDataLen + (i < numShortBlocks ? 0 : 1);
      rs.getRemainder(data, k, datLen, ecc);
      for (let j = 0, l = i; j < datLen; j++, k++, l += numBlocks) {
        if (j === shortBlockDataLen) l -= numShortBlocks;
        const dv = data[k];
        if (dv !== undefined) result[l] = dv;
      }
      for (let j = 0, l = data.length + i; j < blockEccLen; j++, l += numBlocks) {
        const ev = ecc[j];
        if (ev !== undefined) result[l] = ev & 0xFF;
      }
    }
    return result;
  }

  /**
   * Draws the given sequence of 8-bit codewords onto the entire data area of this QR Code.
   * @java QrCode.drawCodewords(int[], byte[])
   */
  private drawCodewords(dataOutputBitIndexes: readonly number[], allCodewords: Uint8Array): void {
    if (allCodewords.length * 8 !== dataOutputBitIndexes.length) {
      throw new Error("drawCodewords: length mismatch");
    }
    for (let i = 0; i < dataOutputBitIndexes.length; i++) {
      const j = dataOutputBitIndexes[i];
      if (j === undefined) throw new Error("dataOutputBitIndexes access out of range");
      const codeword = allCodewords[i >>> 3];
      if (codeword === undefined) throw new Error("allCodewords access out of range");
      const bit = QrCode.getBit(codeword, ~i & 7);
      this.modules[j >>> 5]! |= bit << j;
    }
  }

  /**
   * XORs the codeword modules in this QR Code with the given mask pattern.
   * @java QrCode.applyMask(int[])
   */
  private applyMask(msk: Int32Array): void {
    if (msk.length !== this.modules.length) throw new Error("applyMask: length mismatch");
    for (let i = 0; i < msk.length; i++) {
      const mv = msk[i];
      if (mv !== undefined) this.modules[i]! ^= mv;
    }
  }

  /**
   * Applies and returns the actual mask chosen (0–7).
   * @java QrCode.handleConstructorMasking(int[][], int)
   */
  private handleConstructorMasking(masks: Int32Array[], mskIn: number): number {
    let msk = mskIn;
    if (msk === -1) {
      let minPenalty = 2147483647;
      for (let i = 0; i < 8; i++) {
        const maskI = masks[i];
        if (!maskI) continue;
        this.applyMask(maskI);
        this.drawFormatBits(i);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          msk = i;
          minPenalty = penalty;
        }
        this.applyMask(maskI);
      }
    }
    const finalMask = masks[msk];
    if (!finalMask) throw new Error("Mask index out of range");
    this.applyMask(finalMask);
    this.drawFormatBits(msk);
    return msk;
  }

  /**
   * Calculates and returns the penalty score based on state of this QR Code's current modules.
   * @java QrCode.getPenaltyScore()
   */
  private getPenaltyScore(): number {
    let result = 0;
    let dark = 0;
    const runHistory = new Int32Array(7);
    const size = this.size;

    // Iterate over adjacent pairs of rows
    for (let index = 0, downIndex = size, end = size * size; index < end; ) {
      let runColor = 0;
      let runX = 0;
      runHistory.fill(0);
      let curRow = 0;
      let nextRow = 0;
      for (let x = 0; x < size; x++, index++, downIndex++) {
        const wordIdx = index >>> 5;
        const w = this.modules[wordIdx];
        if (w === undefined) throw new Error("modules access out of range");
        const c = QrCode.getBit(w, index);
        if (c === runColor) {
          runX++;
          if (runX === 5) result += QrCode.PENALTY_N1;
          else if (runX > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runX, runHistory);
          if (runColor === 0) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
          runColor = c;
          runX = 1;
        }
        dark += c;
        if (downIndex < end) {
          curRow = ((curRow << 1) | c) & 3;
          const dw = this.modules[downIndex >>> 5];
          if (dw !== undefined) {
            nextRow = ((nextRow << 1) | QrCode.getBit(dw, downIndex)) & 3;
          }
          if (x >= 1 && (curRow === 0 || curRow === 3) && curRow === nextRow) {
            result += QrCode.PENALTY_N2;
          }
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runX, runHistory) * QrCode.PENALTY_N3;
    }

    // Iterate over single columns
    for (let x = 0; x < size; x++) {
      let runColor = 0;
      let runY = 0;
      runHistory.fill(0);
      for (let y = 0, index = x; y < size; y++, index += size) {
        const w = this.modules[index >>> 5];
        if (w === undefined) throw new Error("modules access out of range");
        const c = QrCode.getBit(w, index);
        if (c === runColor) {
          runY++;
          if (runY === 5) result += QrCode.PENALTY_N1;
          else if (runY > 5) result++;
        } else {
          this.finderPenaltyAddHistory(runY, runHistory);
          if (runColor === 0) result += this.finderPenaltyCountPatterns(runHistory) * QrCode.PENALTY_N3;
          runColor = c;
          runY = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runY, runHistory) * QrCode.PENALTY_N3;
    }

    // Balance of dark and light modules
    const total = size * size;
    const k = Math.floor((Math.abs(dark * 20 - total * 10) + total - 1) / total) - 1;
    result += k * QrCode.PENALTY_N4;
    return result;
  }

  /*---- Private helper functions ----*/

  /**
   * Returns 0 or 1 based on the (i mod 32)'th bit of x.
   * @java QrCode.getBit(int, int)
   */
  public static getBit(x: number, i: number): number {
    return (x >>> i) & 1;
  }

  /** @java QrCode.getNumDataCodewords(int, Ecc) */
  static getNumDataCodewords(ver: number, ecl: Ecc): number {
    return Math.floor(QrTemplate.getNumRawDataModules(ver) / 8)
      - (QrCode.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal()]![ver]! ?? 0)
      * (QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal()]![ver]! ?? 0);
  }

  /** @java QrCode.finderPenaltyCountPatterns(int[]) */
  private finderPenaltyCountPatterns(runHistory: Int32Array): number {
    const n = runHistory[1] ?? 0;
    const core = n > 0
      && runHistory[2] === n
      && runHistory[3] === n * 3
      && runHistory[4] === n
      && runHistory[5] === n;
    return ((core && (runHistory[0] ?? 0) >= n * 4 && (runHistory[6] ?? 0) >= n) ? 1 : 0)
         + ((core && (runHistory[6] ?? 0) >= n * 4 && (runHistory[0] ?? 0) >= n) ? 1 : 0);
  }

  /** @java QrCode.finderPenaltyTerminateAndCount(int, int, int[]) */
  private finderPenaltyTerminateAndCount(currentRunColor: number, currRunLength: number, runHistory: Int32Array): number {
    let currentRunLength = currRunLength;
    if (currentRunColor === 1) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }

  /** @java QrCode.finderPenaltyAddHistory(int, int[]) */
  private finderPenaltyAddHistory(currRunLength: number, runHistory: Int32Array): void {
    let currentRunLength = currRunLength;
    if (runHistory[0] === 0) currentRunLength += this.size;
    // System.arraycopy(runHistory, 0, runHistory, 1, runHistory.length - 1)
    for (let i = runHistory.length - 1; i >= 1; i--) {
      runHistory[i] = runHistory[i - 1] ?? 0;
    }
    runHistory[0] = currentRunLength;
  }

  /*---- Constants and tables ----*/

  /** The minimum version number (1) supported in the QR Code Model 2 standard. @java QrCode.MIN_VERSION */
  public static readonly MIN_VERSION = 1;

  /** The maximum version number (40) supported in the QR Code Model 2 standard. @java QrCode.MAX_VERSION */
  public static readonly MAX_VERSION = 40;

  private static readonly PENALTY_N1 =  3;
  private static readonly PENALTY_N2 =  3;
  private static readonly PENALTY_N3 = 40;
  private static readonly PENALTY_N4 = 10;

  /** @java QrCode.ECC_CODEWORDS_PER_BLOCK */
  private static readonly ECC_CODEWORDS_PER_BLOCK: readonly (readonly number[])[] = [
    // Version: (index 0 is padding)
    //0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40
    [-1,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Low
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // Medium
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Quartile
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // High
  ];

  /** @java QrCode.NUM_ERROR_CORRECTION_BLOCKS */
  private static readonly NUM_ERROR_CORRECTION_BLOCKS: readonly (readonly number[])[] = [
    // Version: (index 0 is padding)
    //0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],  // Low
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],  // Medium
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],  // Quartile
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],  // High
  ];
}

/*---- Public helper enumeration ----*/

/**
 * The error correction level in a QR Code symbol.
 * Must be declared in ascending order of error protection so that ordinal() works.
 *
 * @java QrCode.Ecc (inner enum)
 */
export class Ecc {
  /** The QR Code can tolerate about  7% erroneous codewords. @java Ecc.LOW */
  public static readonly LOW:      Ecc = new Ecc(1);
  /** The QR Code can tolerate about 15% erroneous codewords. @java Ecc.MEDIUM */
  public static readonly MEDIUM:   Ecc = new Ecc(0);
  /** The QR Code can tolerate about 25% erroneous codewords. @java Ecc.QUARTILE */
  public static readonly QUARTILE: Ecc = new Ecc(3);
  /** The QR Code can tolerate about 30% erroneous codewords. @java Ecc.HIGH */
  public static readonly HIGH:     Ecc = new Ecc(2);

  /** In the range 0 to 3 (unsigned 2-bit integer). @java Ecc.formatBits */
  public readonly formatBits: number;

  /** @java Ecc(int) */
  private constructor(fb: number) {
    this.formatBits = fb;
  }

  /** Returns all Ecc values in declaration order. @java Ecc.values() */
  public static values(): readonly Ecc[] {
    return [Ecc.LOW, Ecc.MEDIUM, Ecc.QUARTILE, Ecc.HIGH];
  }

  /** Returns the ordinal (0-based index) of this Ecc. @java Ecc.ordinal() */
  public ordinal(): number {
    return Ecc.values().indexOf(this);
  }
}
