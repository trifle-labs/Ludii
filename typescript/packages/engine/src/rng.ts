/**
 * Java parity:
 * - Core/src/main/RandomProviderState.java (Apache Commons RNG state)
 * - org.apache.commons.rng.simple.JDKRandomBridge usage in Trial
 *
 * A small seeded RNG so playouts and Trial replay can be deterministic
 * without dragging in commons-rng. Uses xorshift32, which is enough
 * for game-tree sampling but not for crypto.
 *
 * The state is a single 32-bit integer; clone()/snapshot() return a
 * shallow copy so callers can fork a generator without leaking
 * mutations back to the source.
 */

export class SeededRng {
  private seed: number;

  public constructor(seed: number) {
    if (!Number.isInteger(seed) || seed === 0) {
      throw new Error(`Seed must be a non-zero integer; got ${seed}.`);
    }
    this.seed = seed >>> 0;
  }

  /** Next 32-bit unsigned integer. */
  public nextUInt32(): number {
    let x = this.seed | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed;
  }

  /** Next integer in [0, bound). */
  public nextInt(bound: number): number {
    if (!Number.isInteger(bound) || bound < 1) {
      throw new Error(`bound must be a positive integer; got ${bound}.`);
    }
    return this.nextUInt32() % bound;
  }

  /** Next number in [0, 1). */
  public nextFloat(): number {
    return this.nextUInt32() / 0x1_0000_0000;
  }

  /** Java parity: `RandomProviderState` snapshot. */
  public snapshot(): number {
    return this.seed;
  }

  /** Java parity: clone of the generator with the same state. */
  public clone(): SeededRng {
    return new SeededRng(this.seed === 0 ? 1 : this.seed);
  }

  /** Restore a previously-captured snapshot. */
  public restore(snapshot: number): void {
    if (!Number.isInteger(snapshot) || snapshot === 0) {
      throw new Error(`snapshot must be a non-zero integer; got ${snapshot}.`);
    }
    this.seed = snapshot >>> 0;
  }
}
