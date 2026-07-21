// @java Common/src/main/math/BitTwiddling.java

/**
 * Static class with bit twiddling routines.
 * Many taken from the fantastic:
 * https://graphics.stanford.edu/~seander/bithacks.html
 *
 * @java main/math/BitTwiddling.java
 * @author Stephen Tavener
 */
export class BitTwiddling {

  /**
   * Private constructor — static utility class.
   * @java BitTwiddling()
   */
  private constructor() {
    // Go away
  }

  //-------------------------------------------------------------------------

  /**
   * @param a
   * @param b
   * @return true if a and b have opposite signs (int overload)
   * @java BitTwiddling.oppositeSigns(int, int)
   */
  public static oppositeSignsInt(a: number, b: number): boolean {
    return ((a ^ b) < 0);
  }

  /**
   * @param a
   * @param b
   * @return true if a and b have opposite signs (long overload)
   * @java BitTwiddling.oppositeSigns(long, long)
   */
  public static oppositeSignsLong(a: bigint, b: bigint): boolean {
    return ((a ^ b) < 0n);
  }

  /**
   * @param a
   * @return true if a is a power of two (exactly one bit set) — int overload
   * @java BitTwiddling.exactlyOneBitSet(int)
   */
  public static exactlyOneBitSetInt(a: number): boolean {
    if (a === 0) return false;
    return (a & (a - 1)) === 0;
  }

  /**
   * @param a
   * @return true if a is a power of two (exactly one bit set) — long overload
   * @java BitTwiddling.exactlyOneBitSet(long)
   */
  public static exactlyOneBitSetLong(a: bigint): boolean {
    if (a === 0n) return false;
    return (a & (a - 1n)) === 0n;
  }

  /**
   * @param a
   * @return true if a is a power of two (exactly one bit set) or zero — int overload
   * @java BitTwiddling.leOneBitSet(int)
   */
  public static leOneBitSetInt(a: number): boolean {
    return (a & (a - 1)) === 0;
  }

  /**
   * @param a
   * @return true if a is a power of two (exactly one bit set) or zero — long overload
   * @java BitTwiddling.leOneBitSet(long)
   */
  public static leOneBitSetLong(a: bigint): boolean {
    return (a & (a - 1n)) === 0n;
  }

  /**
   * @param a Number to test
   * @return position of top bit set in this int
   * @java BitTwiddling.topBitPos(int)
   */
  public static topBitPosInt(a: number): number {
    return 31 - Math.clz32(a);
  }

  /**
   * @param a Number to test
   * @return position of top bit set in this long
   * @java BitTwiddling.topBitPos(long)
   */
  public static topBitPosLong(a: bigint): number {
    if (a === 0n) return -1;
    let pos = 0;
    let v = a;
    while (v > 1n) {
      v >>= 1n;
      pos++;
    }
    return pos;
  }

  /**
   * @param v
   * @return index of lowest bit, 0 if no bit set (int overload)
   * @java BitTwiddling.lowBitPos(int)
   */
  public static lowBitPosInt(v: number): number {
    if (v === 0) return 32; // Java: numberOfTrailingZeros(0) = 32
    let count = 0;
    let val = v >>> 0;
    while ((val & 1) === 0) {
      val >>>= 1;
      count++;
    }
    return count;
  }

  /**
   * @param v
   * @return index of lowest bit, 0 if no bit set (long overload)
   * @java BitTwiddling.lowBitPos(long)
   */
  public static lowBitPosLong(v: bigint): number {
    if (v === 0n) return 64;
    let count = 0;
    let val = v;
    while ((val & 1n) === 0n) {
      val >>= 1n;
      count++;
    }
    return count;
  }

  /**
   * @param a Number to test
   * @return bottom bit (int overload)
   * @java BitTwiddling.bottomBit(int)
   */
  public static bottomBitInt(a: number): number {
    return a & (-a);
  }

  /**
   * @param a Number to test
   * @return bottom bit (long overload)
   * @java BitTwiddling.bottomBit(long)
   */
  public static bottomBitLong(a: bigint): bigint {
    return a & (-a);
  }

  /**
   * @param v
   * @return number of bits set (int overload)
   * @java BitTwiddling.countBits(int)
   */
  public static countBitsInt(v: number): number {
    // Hamming weight for 32-bit int
    let n = v >>> 0;
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    n = (n + (n >>> 4)) & 0x0f0f0f0f;
    return ((n * 0x01010101) >>> 24);
  }

  /**
   * @param v
   * @return number of bits set (long overload)
   * @java BitTwiddling.countBits(long)
   */
  public static countBitsLong(v: bigint): number {
    let n = BigInt.asUintN(64, v);
    n = n - ((n >> 1n) & 0x5555555555555555n);
    n = (n & 0x3333333333333333n) + ((n >> 2n) & 0x3333333333333333n);
    n = (n + (n >> 4n)) & 0x0f0f0f0f0f0f0f0fn;
    return Number((n * 0x0101010101010101n) >> 56n);
  }

  /**
   * @param v
   * @return next permutation in sequence (int overload)
   * @java BitTwiddling.nextPermutation(int)
   */
  public static nextPermutationInt(v: number): number {
    const t = ((v | (v - 1)) + 1) | 0;
    return (t | (((((t & -t) / (v & -v)) >>> 1) - 1) | 0)) | 0;
  }

  /**
   * @param v
   * @return next permutation in sequence (long overload)
   * @java BitTwiddling.nextPermutation(long)
   */
  public static nextPermutationLong(v: bigint): bigint {
    const t = (v | (v - 1n)) + 1n;
    return t | ((((t & -t) / (v & -v)) >> 1n) - 1n);
  }

  /**
   * @param n
   * @return 1 if value is non-zero, 0 if it is zero (int overload)
   * @java BitTwiddling.oneIfNonZero(int)
   */
  public static oneIfNonZeroInt(n: number): number {
    return ((n | (~n + 1)) >>> 31);
  }

  /**
   * @param n
   * @return 1 if value is zero, 0 if it is non-zero (int overload)
   * @java BitTwiddling.oneIfZero(int)
   */
  public static oneIfZeroInt(n: number): number {
    return BitTwiddling.oneIfNonZeroInt(n) ^ 1;
  }

  /**
   * @param n
   * @return 1 if value is non-zero, 0 if it is zero (long overload)
   * @java BitTwiddling.oneIfNonZero(long)
   */
  public static oneIfNonZeroLong(n: bigint): bigint {
    return ((n | (~n + 1n)) >> 63n) & 1n;
  }

  /**
   * @param n
   * @return 1 if value is zero, 0 if it is non-zero (long overload)
   * @java BitTwiddling.oneIfZero(long)
   */
  public static oneIfZeroLong(n: bigint): bigint {
    return BitTwiddling.oneIfNonZeroLong(n) ^ 1n;
  }

  /**
   * Reverses one byte of data.
   * @param value
   * @return 8 bits, order reversed
   * @java BitTwiddling.reverseByte(int)
   */
  public static reverseByte(value: number): number {
    return Number(((BigInt(value) * 0x80200802n) & 0x0884422110n) * 0x0101010101n >> 32n) & 0xFF;
  }

  //-------------------------------------------------------------------------

  /**
   * @param value
   * @return Number of bits required to cover integers from 0..value.
   * @java BitTwiddling.bitsRequired(int)
   */
  public static bitsRequired(value: number): number {
    return Math.ceil(Math.log(value + 1) / Math.log(2));
  }

  /**
   * @param numBits
   * @return Mask with specified number of bits [0..31] turned on.
   * @java BitTwiddling.maskI(int)
   */
  public static maskI(numBits: number): number {
    return (0x1 << numBits) - 1;
  }

  /**
   * @param numBits
   * @return Mask with specified number of bits [0..63] turned on.
   * @java BitTwiddling.maskL(int)
   */
  public static maskL(numBits: number): bigint {
    return (0x1n << BigInt(numBits)) - 1n;
  }

  /**
   * @param n
   * @return Lowest power of 2 >= n.
   * @java BitTwiddling.nextPowerOf2(int)
   */
  public static nextPowerOf2(n: number): number {
    if (n <= 1) return 1;
    return Math.pow(2, Math.ceil(Math.log(n) / Math.log(2))) | 0;
  }

  /**
   * @param n
   * @return Whether the specified value is a positive power of 2.
   * @java BitTwiddling.isPowerOf2(int)
   */
  public static isPowerOf2(n: number): boolean {
    return n > 0 && ((n & (n - 1)) === 0);
  }

  //-------------------------------------------------------------------------

  /**
   * @param x
   * @return Base-2 log of an integer x, rounded down
   * @java BitTwiddling.log2RoundDown(int)
   */
  public static log2RoundDown(x: number): number {
    return (32 - 1) - Math.clz32(x);
  }

  /**
   * @param x
   * @return Base-2 log of an integer x, rounded up
   * @java BitTwiddling.log2RoundUp(int)
   */
  public static log2RoundUp(x: number): number {
    return 32 - Math.clz32(x - 1);
  }

  //-------------------------------------------------------------------------
}
