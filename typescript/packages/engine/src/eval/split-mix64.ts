// @java Common/lib/Trove4j_ApacheCommonsRNG.jar
//       org.apache.commons.rng.core.source64.SplitMix64 (Apache Commons RNG)
//
// Port of the Java SplitMix64 PRNG used by Ludii's Context.rng().
//
// Key implementation notes:
//   - State is a single 64-bit integer (a Java `long`).
//   - The 8-byte "RNG internal state" in trial files is the SplitMix64 state
//     serialized by NumberFactory.makeByteArray(long): byte[i] = (state >>> (i*8)) & 0xFF,
//     i.e. LITTLE-ENDIAN (byte[0] is the LSB). Confirmed by javap bytecode inspection
//     of NumberFactory.class in Trove4j_ApacheCommonsRNG.jar.
//   - nextLong():   state += 0x9E3779B97F4A7C15L; then mix the state (64-bit)
//   - nextInt():    makeInt(nextLong()) = (int)(hi32 XOR lo32)
//   - nextInt(n):   Java BaseProvider rejection-sampling using nextInt() >>> 1
//
// All 64-bit arithmetic is performed with BigInt to avoid JS Number precision loss.

/** Mask to keep BigInt values in the unsigned 64-bit range [0, 2^64). */
const MASK64 = (1n << 64n) - 1n;

/** Mask for the lower 32 bits. */
const MASK32 = (1n << 32n) - 1n;

/** SplitMix64 increment: 0x9E3779B97F4A7C15 (signed Java long: -7046029254386353131). */
const INCREMENT = 0x9E3779B97F4A7C15n;

/** SplitMix64 mix multipliers. */
const MIX1 = 0xBF58476D1CE4E5B9n; // -4658895280553007687L
const MIX2 = 0x94D049BB133111EBn; // -7723592293110705685L

/**
 * SplitMix64 PRNG — exact Java parity for Ludii's Context.rng().
 *
 * Construct with fromBytes() using the 8 signed bytes from a trial file's
 * "RNG internal state=" line.
 */
export class SplitMix64 {
  /** Internal 64-bit state as an unsigned BigInt [0, 2^64). */
  private state: bigint;

  /**
   * Construct directly from an unsigned 64-bit BigInt state.
   * Use {@link fromBytes} for trial-file byte arrays.
   */
  public constructor(state: bigint) {
    this.state = state & MASK64;
  }

  /**
   * Construct from the 8 signed bytes stored in a Ludii trial file's
   * "RNG internal state=b0,b1,...,b7" line.
   *
   * NumberFactory.makeLong(byte[]) in Apache Commons RNG:
   *   for (i = 0; i < 8; i++) result |= (bytes[i] & 0xFF) << (i * 8)
   * This is little-endian: bytes[0] is the least-significant byte.
   */
  public static fromBytes(bytes: readonly number[]): SplitMix64 {
    if (bytes.length !== 8) {
      throw new Error(
        `SplitMix64.fromBytes: expected 8 bytes, got ${bytes.length}`,
      );
    }
    let state = 0n;
    for (let i = 0; i < 8; i++) {
      state |= BigInt(bytes[i]! & 0xff) << BigInt(i * 8);
    }
    return new SplitMix64(state & MASK64);
  }

  /**
   * Java parity: SplitMix64.next() / nextLong().
   *
   * state += 0x9E3779B97F4A7C15
   * z = state
   * z = (z ^ (z >>> 30)) * 0xBF58476D1CE4E5B9
   * z = (z ^ (z >>> 27)) * 0x94D049BB133111EB
   * return z ^ (z >>> 31)
   *
   * Returns a SIGNED 64-bit long as a BigInt in [-2^63, 2^63).
   */
  public nextLong(): bigint {
    // Advance state (unsigned 64-bit add with wrap)
    this.state = (this.state + INCREMENT) & MASK64;
    let z = this.state;

    // Mix
    z = (z ^ ((z >> 30n) & MASK64)) & MASK64;
    z = (z * MIX1) & MASK64;
    z = (z ^ ((z >> 27n) & MASK64)) & MASK64;
    z = (z * MIX2) & MASK64;
    z = (z ^ ((z >> 31n) & MASK64)) & MASK64;

    // Convert unsigned to signed 64-bit (Java long)
    return z >= (1n << 63n) ? z - (1n << 64n) : z;
  }

  /**
   * Java parity: LongProvider.nextInt() = NumberFactory.makeInt(nextLong()).
   *
   * makeInt(long v): return (int)(v >>> 32) ^ (int)(v)
   *
   * Returns a SIGNED 32-bit integer (JS number in [-2^31, 2^31)).
   */
  public nextInt(): number {
    const v = this.nextLong();
    // Interpret v as unsigned 64-bit for the shift
    const uv = v < 0n ? v + (1n << 64n) : v;
    const hi = Number((uv >> 32n) & MASK32); // upper 32 bits
    const lo = Number(uv & MASK32); // lower 32 bits
    // XOR and reinterpret as signed 32-bit
    return (hi ^ lo) | 0;
  }

  /**
   * Java parity: BaseProvider.nextInt(int n).
   *
   * Rejection sampling with nextInt() >>> 1 (unsigned 31-bit):
   *   if n is power of 2: return (int)((long)n * (nextInt() >>> 1) >> 31)
   *   else: loop { bits = nextInt() >>> 1; val = bits % n; if bits - val + (n-1) >= 0 return val }
   *
   * @param bound Exclusive upper bound, must be positive.
   */
  public nextIntBound(bound: number): number {
    if (!Number.isInteger(bound) || bound < 1) {
      throw new Error(`SplitMix64.nextIntBound: bound must be >= 1, got ${bound}`);
    }
    // Fast path: power of two
    if ((bound & (bound - 1)) === 0) {
      // Java: (int)((long)bound * (nextInt() >>> 1) >> 31)
      // nextInt() >>> 1 gives a 31-bit unsigned value [0, 2^31).
      // The product `bound * bits31` must be computed in >32-bit arithmetic
      // because Math.imul() truncates to 32 bits and corrupts the result.
      // For dice-game bounds (≤ 2^22) this is within Number.MAX_SAFE_INTEGER.
      const bits31 = (this.nextInt() >>> 1) & 0x7fffffff; // 31-bit unsigned
      return Math.trunc(bound * bits31 / 2147483648); // arithmetic >> 31
    }
    // General case: rejection sampling
    for (;;) {
      const bits = (this.nextInt() >>> 1) & 0x7fffffff; // unsigned 31-bit
      const val = bits % bound;
      if (bits - val + (bound - 1) >= 0) {
        return val;
      }
    }
  }

  /**
   * Clone this RNG so replay can snapshot/fork without consuming from the original.
   */
  public clone(): SplitMix64 {
    return new SplitMix64(this.state);
  }

  /** Expose raw state for serialization / debugging. */
  public getState(): bigint {
    return this.state;
  }
}
