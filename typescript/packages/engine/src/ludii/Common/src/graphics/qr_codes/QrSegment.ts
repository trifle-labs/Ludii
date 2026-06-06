// @java Common/src/graphics/qr_codes/QrSegment.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

import { BitBuffer } from "./BitBuffer.js";
import { Mode } from "./Mode.js";

/**
 * A segment of character/binary/control data in a QR Code symbol.
 * Instances of this class are immutable.
 *
 * @java graphics/qr_codes/QrSegment.java
 */
export class QrSegment {
  /*---- Static factory functions (mid level) ----*/

  /**
   * Returns a segment representing the specified binary data encoded in byte mode.
   * @java QrSegment.makeBytes(byte[])
   */
  public static makeBytes(data: Uint8Array): QrSegment {
    if (data.length * 8 > 2147483647) {
      throw new Error("Data too long");
    }
    const bits = new Int32Array(Math.floor((data.length + 3) / 4));
    for (let i = 0; i < data.length; i++) {
      const b = data[i];
      if (b === undefined) throw new Error("data access out of range");
      bits[i >>> 2] = (bits[i >>> 2]! | ((b & 0xFF) << (~i << 3)));
    }
    return new QrSegment(Mode.BYTE, data.length, bits, data.length * 8);
  }

  /**
   * Returns a segment representing the specified string of decimal digits encoded in numeric mode.
   * @java QrSegment.makeNumeric(String)
   */
  public static makeNumeric(digits: string): QrSegment {
    const bb = new BitBuffer();
    let accumData = 0;
    let accumCount = 0;
    for (let i = 0; i < digits.length; i++) {
      const c = digits.charCodeAt(i);
      if (c < 0x30 || c > 0x39) {  // '0'-'9'
        throw new Error("String contains non-numeric characters");
      }
      accumData = accumData * 10 + (c - 0x30);
      accumCount++;
      if (accumCount === 3) {
        bb.appendBits(accumData, 10);
        accumData = 0;
        accumCount = 0;
      }
    }
    if (accumCount > 0) {
      bb.appendBits(accumData, accumCount * 3 + 1);
    }
    return new QrSegment(Mode.NUMERIC, digits.length, bb.data, bb.bitLength);
  }

  /**
   * Returns a segment representing the specified text string encoded in alphanumeric mode.
   * @java QrSegment.makeAlphanumeric(String)
   */
  public static makeAlphanumeric(text: string): QrSegment {
    const bb = new BitBuffer();
    let accumData = 0;
    let accumCount = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c >= QrSegment.ALPHANUMERIC_MAP.length) {
        throw new Error("String contains unencodable characters in alphanumeric mode");
      }
      const val = QrSegment.ALPHANUMERIC_MAP[c];
      if (val === undefined || val === -1) {
        throw new Error("String contains unencodable characters in alphanumeric mode");
      }
      accumData = accumData * 45 + val;
      accumCount++;
      if (accumCount === 2) {
        bb.appendBits(accumData, 11);
        accumData = 0;
        accumCount = 0;
      }
    }
    if (accumCount > 0) {
      bb.appendBits(accumData, 6);
    }
    return new QrSegment(Mode.ALPHANUMERIC, text.length, bb.data, bb.bitLength);
  }

  /**
   * Returns a list of zero or more segments to represent the specified Unicode text string.
   * @java QrSegment.makeSegments(String)
   */
  public static makeSegments(text: string): QrSegment[] {
    const result: QrSegment[] = [];
    if (text === "") return result;
    if (QrSegment.isNumeric(text)) {
      result.push(QrSegment.makeNumeric(text));
    } else if (QrSegment.isAlphanumeric(text)) {
      result.push(QrSegment.makeAlphanumeric(text));
    } else {
      const encoded = new TextEncoder().encode(text);
      result.push(QrSegment.makeBytes(encoded));
    }
    return result;
  }

  /**
   * Returns a segment representing an Extended Channel Interpretation (ECI) designator.
   * @java QrSegment.makeEci(int)
   */
  public static makeEci(assignVal: number): QrSegment {
    const bb = new BitBuffer();
    if (assignVal < 0) {
      throw new Error("ECI assignment value out of range");
    } else if (assignVal < (1 << 7)) {
      bb.appendBits(assignVal, 8);
    } else if (assignVal < (1 << 14)) {
      bb.appendBits(2, 2);
      bb.appendBits(assignVal, 14);
    } else if (assignVal < 1000000) {
      bb.appendBits(6, 3);
      bb.appendBits(assignVal, 21);
    } else {
      throw new Error("ECI assignment value out of range");
    }
    return new QrSegment(Mode.ECI, 0, bb.data, bb.bitLength);
  }

  /**
   * Tests whether the specified string can be encoded as a segment in numeric mode.
   * @java QrSegment.isNumeric(String)
   */
  public static isNumeric(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c < 0x30 || c > 0x39) return false;
    }
    return true;
  }

  /**
   * Tests whether the specified string can be encoded as a segment in alphanumeric mode.
   * @java QrSegment.isAlphanumeric(String)
   */
  public static isAlphanumeric(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c >= QrSegment.ALPHANUMERIC_MAP.length) return false;
      const v = QrSegment.ALPHANUMERIC_MAP[c];
      if (v === undefined || v === -1) return false;
    }
    return true;
  }

  /*---- Instance fields ----*/

  /** The mode indicator of this segment. @java QrSegment.mode */
  public readonly mode: Mode;

  /**
   * The length of this segment's unencoded data.
   * @java QrSegment.numChars
   */
  public readonly numChars: number;

  /** The data bits of this segment. @java QrSegment.data */
  public readonly data: Int32Array;

  /** Requires 0 <= bitLength <= data.length * 32. @java QrSegment.bitLength */
  public readonly bitLength: number;

  /*---- Constructor (low level) ----*/

  /**
   * Constructs a QR Code segment with the specified attributes and data.
   * @java QrSegment(Mode, int, int[], int)
   */
  public constructor(md: Mode, numCh: number, data: Int32Array, bitLen: number) {
    if (md === null || md === undefined) throw new Error("Mode is null");
    if (data === null || data === undefined) throw new Error("Data is null");
    if (numCh < 0 || bitLen < 0 || bitLen > data.length * 32) {
      throw new Error("Invalid value");
    }
    this.mode = md;
    this.data = data;
    this.numChars = numCh;
    this.bitLength = bitLen;
  }

  /*---- Package-private helpers ----*/

  /**
   * Calculates the number of bits needed to encode the given segments at the given version.
   * Returns a non-negative number if successful, or -1 if too long.
   * @java QrSegment.getTotalBits(List<QrSegment>, int)
   */
  public static getTotalBits(segs: readonly QrSegment[], version: number): number {
    let result = 0;
    for (const seg of segs) {
      const ccbits = seg.mode.numCharCountBits(version);
      if (seg.numChars >= (1 << ccbits)) return -1;
      result += 4 + ccbits + seg.bitLength;
      if (result > 2147483647) return -1;
    }
    return result;
  }

  /*---- Constants ----*/

  /** @java QrSegment.ALPHANUMERIC_MAP */
  public static readonly ALPHANUMERIC_MAP: readonly number[] = (() => {
    const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
    let maxCh = -1;
    for (let i = 0; i < ALPHANUMERIC_CHARSET.length; i++) {
      const code = ALPHANUMERIC_CHARSET.charCodeAt(i);
      if (code > maxCh) maxCh = code;
    }
    const map = new Array<number>(maxCh + 1).fill(-1);
    for (let i = 0; i < ALPHANUMERIC_CHARSET.length; i++) {
      map[ALPHANUMERIC_CHARSET.charCodeAt(i)] = i;
    }
    return map;
  })();
}
