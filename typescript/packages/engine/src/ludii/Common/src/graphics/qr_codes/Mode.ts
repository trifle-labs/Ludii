// @java Common/src/graphics/qr_codes/Mode.java

/*
 * Fast QR Code generator library
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/fast-qr-code-generator-library
 */

// QrCode.MIN_VERSION and MAX_VERSION are 1 and 40 respectively.
// We replicate the constants here to avoid circular imports with QrCode.ts.
const _MIN_VERSION = 1;
const _MAX_VERSION = 40;

/**
 * Describes how a segment's data bits are interpreted.
 *
 * @java graphics/qr_codes/Mode.java (enum)
 */
export class Mode {
  /*-- Constants --*/

  /** @java Mode.NUMERIC */
  public static readonly NUMERIC: Mode      = new Mode(0x1, [10, 12, 14]);
  /** @java Mode.ALPHANUMERIC */
  public static readonly ALPHANUMERIC: Mode = new Mode(0x2, [ 9, 11, 13]);
  /** @java Mode.BYTE */
  public static readonly BYTE: Mode         = new Mode(0x4, [ 8, 16, 16]);
  /** @java Mode.KANJI */
  public static readonly KANJI: Mode        = new Mode(0x8, [ 8, 10, 12]);
  /** @java Mode.ECI */
  public static readonly ECI: Mode          = new Mode(0x7, [ 0,  0,  0]);

  /*-- Fields --*/

  /** The mode indicator bits, which is a uint4 value (range 0 to 15). @java Mode.modeBits */
  public readonly modeBits: number;

  /** Number of character count bits for three different version ranges. @java Mode.numBitsCharCount */
  private readonly numBitsCharCount: readonly number[];

  /*-- Constructor --*/

  /** @java Mode(int, int...) */
  private constructor(mode: number, ccbits: readonly number[]) {
    this.modeBits = mode;
    this.numBitsCharCount = ccbits;
  }

  /*-- Method --*/

  /**
   * Returns the bit width of the character count field for a segment in this mode
   * in a QR Code at the given version number. The result is in the range [0, 16].
   *
   * @java Mode.numCharCountBits(int)
   */
  public numCharCountBits(ver: number): number {
    if (!(ver >= _MIN_VERSION && ver <= _MAX_VERSION)) {
      throw new Error(`Version ${ver} out of range`);
    }
    const idx = Math.floor((ver + 7) / 17);
    const result = this.numBitsCharCount[idx];
    if (result === undefined) throw new Error("numBitsCharCount index out of range");
    return result;
  }

  /**
   * Returns all Mode values in declaration order (mirrors Java enum.values()).
   * @java Mode.values()
   */
  public static values(): readonly Mode[] {
    return [Mode.NUMERIC, Mode.ALPHANUMERIC, Mode.BYTE, Mode.KANJI, Mode.ECI];
  }

  /**
   * Returns the ordinal (0-based index) of this Mode (mirrors Java enum.ordinal()).
   * @java Mode.ordinal()
   */
  public ordinal(): number {
    return Mode.values().indexOf(this);
  }
}
