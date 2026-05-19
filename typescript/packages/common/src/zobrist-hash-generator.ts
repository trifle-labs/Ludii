/**
 * TypeScript port of the Zobrist hash generator used by Ludii.
 *
 * Java source: `Core/src/other/state/zhash/ZobristHashGenerator.java`
 *
 * The upstream class extends Apache Commons RNG `SplitMix64`.  This port
 * inlines the SplitMix64 algorithm using JavaScript `BigInt` so the output
 * is bit-for-bit identical to the Java implementation (both treat the 64-bit
 * words as unsigned when computing the mixing, then hand back a signed Java
 * `long`-compatible value as a JavaScript `bigint`).
 *
 * Algorithm reference:
 *   Steele, G. L. & Vigna, S. (2021). LXM: better splittable pseudorandom
 *   number generators (and almost as fast). arXiv:2106.10907
 */

const MASK64 = (1n << 64n) - 1n;
const SIGN_BIT = 1n << 63n;

/** Additive constant (odd integer) — 2^64 / φ rounded down, then ORed odd. */
const GAMMA = 0x9e3779b97f4a7c15n;

/** SplitMix64 mixing constants */
const M1 = 0xbf58476d1ce4e5b9n;
const M2 = 0x94d049bb133111ebn;

/** Shared seed used by the Java implementation. */
const RNG_SEED = 3544273448235996400n;

function mix64(z: bigint): bigint {
  let v = z;
  v = ((v ^ (v >> 30n)) * M1) & MASK64;
  v = ((v ^ (v >> 27n)) * M2) & MASK64;
  return v ^ (v >> 31n);
}

/** Converts an unsigned 64-bit BigInt to a signed 64-bit BigInt (matching Java long). */
function toSigned64(v: bigint): bigint {
  const unsigned = v & MASK64;
  return unsigned >= SIGN_BIT ? unsigned - (1n << 64n) : unsigned;
}

/**
 * Deterministic 64-bit PRNG based on SplitMix64 seeded with the same
 * constant the Java `ZobristHashGenerator` uses.  Calling `next()` advances
 * the state and returns the next hash value.
 */
export class ZobristHashGenerator {
  private state: bigint;
  private counter = 0;

  /**
   * Creates a generator positioned at the start of the sequence.
   */
  public constructor();
  /**
   * Creates a generator positioned at `pos` in the sequence — useful for
   * serialisation / deserialisation where you prefer to trade file size for
   * CPU time.
   */
  public constructor(pos: number);
  public constructor(pos?: number) {
    this.state = RNG_SEED;
    if (pos !== undefined) {
      while (this.counter < pos) {
        this.next();
      }
    }
  }

  /**
   * Returns the next 64-bit value in the sequence and advances the generator.
   * The value is returned as a signed 64-bit BigInt (matching Java `long`).
   */
  public next(): bigint {
    this.state = (this.state + GAMMA) & MASK64;
    this.counter += 1;
    return toSigned64(mix64(this.state));
  }

  /**
   * Returns the number of times `next()` has been called on this instance.
   */
  public getSequencePosition(): number {
    return this.counter;
  }
}
