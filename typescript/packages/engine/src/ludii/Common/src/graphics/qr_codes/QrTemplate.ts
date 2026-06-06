// @java Common/src/graphics/qr_codes/QrTemplate.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

import { Memoizer } from "./Memoizer.js";

// Inline MIN/MAX_VERSION to avoid circular dependency with QrCode.
const MIN_VERSION = 1;
const MAX_VERSION = 40;

/**
 * Returns 0 or 1 based on the (i mod 32)'th bit of x.
 * Mirrors QrCode.getBit(int, int) for internal use.
 */
function getBit(x: number, i: number): number {
  return (x >>> i) & 1;
}

/**
 * Stores the parts of a QR Code that depend only on the version number,
 * and does not depend on the data or error correction level or mask.
 *
 * @java graphics/qr_codes/QrTemplate.java
 */
export class QrTemplate {
  /** Use this memoizer to get instances of this class. @java QrTemplate.MEMOIZER */
  public static readonly MEMOIZER: Memoizer<number, QrTemplate>
    = new Memoizer<number, QrTemplate>((ver) => new QrTemplate(ver));

  /** @java QrTemplate.version */
  private readonly version: number;
  /** @java QrTemplate.size */
  private readonly size: number;

  /** @java QrTemplate.template */
  public readonly template: Int32Array;
  /** @java QrTemplate.masks */
  public readonly masks: Int32Array[];
  /** @java QrTemplate.dataOutputBitIndexes */
  public readonly dataOutputBitIndexes: number[];

  /**
   * Indicates function modules not subjected to masking.
   * Discarded when constructor finishes.
   * @java QrTemplate.isFunction
   */
  private isFunction: Int32Array | null;

  /** Creates a QR Code template for the given version number. @java QrTemplate(int) */
  private constructor(ver: number) {
    if (ver < MIN_VERSION || ver > MAX_VERSION) {
      throw new Error("Version out of range");
    }
    this.version = ver;
    this.size = ver * 4 + 17;
    this.template = new Int32Array(Math.floor((this.size * this.size + 31) / 32));
    this.isFunction = new Int32Array(this.template.length);

    this.drawFunctionPatterns();
    this.masks = this.generateMasks();
    this.dataOutputBitIndexes = this.generateZigzagScan();
    this.isFunction = null;
  }

  /*---- Private helpers ----*/

  /** @java QrTemplate.drawFunctionPatterns() */
  private drawFunctionPatterns(): void {
    const size = this.size;
    for (let i = 0; i < size; i++) {
      this.darkenFunctionModule(6, i, ~i & 1);
      this.darkenFunctionModule(i, 6, ~i & 1);
    }

    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(size - 4, 3);
    this.drawFinderPattern(3, size - 4);

    const alignPatPos = this.getAlignmentPatternPositions();
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if (!(i === 0 && j === 0 || i === 0 && j === numAlign - 1 || i === numAlign - 1 && j === 0)) {
          const pi = alignPatPos[i];
          const pj = alignPatPos[j];
          if (pi !== undefined && pj !== undefined) {
            this.drawAlignmentPattern(pi, pj);
          }
        }
      }
    }

    this.drawDummyFormatBits();
    this.drawVersion();
  }

  /** @java QrTemplate.drawDummyFormatBits() */
  private drawDummyFormatBits(): void {
    const size = this.size;
    for (let i = 0; i <= 5; i++) this.darkenFunctionModule(8, i, 0);
    this.darkenFunctionModule(8, 7, 0);
    this.darkenFunctionModule(8, 8, 0);
    this.darkenFunctionModule(7, 8, 0);
    for (let i = 9; i < 15; i++) this.darkenFunctionModule(14 - i, 8, 0);

    for (let i = 0; i < 8; i++) this.darkenFunctionModule(size - 1 - i, 8, 0);
    for (let i = 8; i < 15; i++) this.darkenFunctionModule(8, size - 15 + i, 0);
    this.darkenFunctionModule(8, size - 8, 1);
  }

  /** @java QrTemplate.drawVersion() */
  private drawVersion(): void {
    if (this.version < 7) return;

    let rem = this.version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ (((rem >>> 11) & 1) * 0x1F25);
    }
    const bits = (this.version << 12) | rem;

    const size = this.size;
    for (let i = 0; i < 18; i++) {
      const bit = getBit(bits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.darkenFunctionModule(a, b, bit);
      this.darkenFunctionModule(b, a, bit);
    }
  }

  /** @java QrTemplate.drawFinderPattern(int, int) */
  private drawFinderPattern(x: number, y: number): void {
    const size = this.size;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) {
          this.darkenFunctionModule(xx, yy, (dist !== 2 && dist !== 4) ? 1 : 0);
        }
      }
    }
  }

  /** @java QrTemplate.drawAlignmentPattern(int, int) */
  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.darkenFunctionModule(x + dx, y + dy,
          Math.abs(Math.max(Math.abs(dx), Math.abs(dy)) - 1));
      }
    }
  }

  /** @java QrTemplate.generateMasks() */
  private generateMasks(): Int32Array[] {
    const result: Int32Array[] = [];
    for (let mask = 0; mask < 8; mask++) {
      const maskModules = new Int32Array(this.template.length);
      result.push(maskModules);
      for (let y = 0, i = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++, i++) {
          let invert: boolean;
          switch (mask) {
            case 0: invert = (x + y) % 2 === 0; break;
            case 1: invert = y % 2 === 0; break;
            case 2: invert = x % 3 === 0; break;
            case 3: invert = (x + y) % 3 === 0; break;
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: invert = (x * y % 2 + x * y % 3) === 0; break;
            case 6: invert = (x * y % 2 + x * y % 3) % 2 === 0; break;
            case 7: invert = ((x + y) % 2 + x * y % 3) % 2 === 0; break;
            default: throw new Error("Unexpected mask value");
          }
          const bit = (invert ? 1 : 0) & ~this.getModuleInternal(x, y);
          maskModules[i >>> 5]! |= bit << i;
        }
      }
    }
    return result;
  }

  /** @java QrTemplate.generateZigzagScan() */
  private generateZigzagScan(): number[] {
    const result: number[] = new Array(Math.floor(QrTemplate.getNumRawDataModules(this.version) / 8) * 8);
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (this.getModuleInternal(x, y) === 0 && i < result.length) {
            result[i] = y * this.size + x;
            i++;
          }
        }
      }
    }
    return result;
  }

  /** Returns the value of the bit at the given coordinates in the isFunction grid. @java QrTemplate.getModule(int[], int, int) */
  private getModuleInternal(x: number, y: number): number {
    const isFunction = this.isFunction;
    if (!isFunction) throw new Error("isFunction is null");
    const i = y * this.size + x;
    const word = isFunction[i >>> 5];
    if (word === undefined) throw new Error("isFunction access out of range");
    return getBit(word, i);
  }

  /** @java QrTemplate.darkenFunctionModule(int, int, int) */
  private darkenFunctionModule(x: number, y: number, enable: number): void {
    const isFunction = this.isFunction;
    if (!isFunction) throw new Error("isFunction is null");
    const i = y * this.size + x;
    this.template[i >>> 5]! |= enable << i;
    isFunction[i >>> 5]! |= 1 << i;
  }

  /** @java QrTemplate.getAlignmentPatternPositions() */
  private getAlignmentPatternPositions(): number[] {
    if (this.version === 1) return [];

    const numAlign = Math.floor(this.version / 7) + 2;
    const step = (this.version === 32) ? 26 :
      Math.floor((this.version * 4 + numAlign * 2 + 1) / (numAlign * 2 - 2)) * 2;
    const result: number[] = new Array(numAlign);
    result[0] = 6;
    for (let i = result.length - 1, pos = this.size - 7; i >= 1; i--, pos -= step) {
      result[i] = pos;
    }
    return result;
  }

  /**
   * Returns the number of data bits that can be stored in a QR Code of the given version number,
   * after all function modules are excluded.
   * @java QrTemplate.getNumRawDataModules(int)
   */
  public static getNumRawDataModules(ver: number): number {
    if (ver < MIN_VERSION || ver > MAX_VERSION) {
      throw new Error("Version number out of range");
    }
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }
}
