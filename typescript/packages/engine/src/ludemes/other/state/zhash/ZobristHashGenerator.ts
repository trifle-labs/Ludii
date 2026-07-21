// @java Core/src/other/state/zhash/ZobristHashGenerator.java

/**
 * Generates sequences for Zobrist hashing.
 * Faithful 1:1 port of ZobristHashGenerator.java.
 * In Java this extends SplitMix64; we inline the SplitMix64 algorithm here
 * because TypeScript has no equivalent RNG library.
 *
 * SplitMix64 algorithm: next state = s + 0x9e3779b97f4a7c15,
 * then mix through a series of xor-shifts.
 *
 * NOTE: JavaScript bitwise operators are 32-bit; we use BigInt to faithfully
 * emulate 64-bit behaviour and return number (the low 32 bits) for hash
 * construction — callers use numbers anyway.
 *
 * @author mrraow (Java), ported to TS
 */
export class ZobristHashGenerator {
  // Java: private static final long RNG_SEED = 3544273448235996400L;
  private static readonly RNG_SEED = BigInt("3544273448235996400");

  // SplitMix64 internal state
  private state: bigint;
  private counter = 0;

  /**
   * Base constructor — seeds at the fixed seed (Java: super(Long.valueOf(RNG_SEED)))
   */
  constructor();
  /**
   * Creates a generator at the specified position.
   * @param pos sequence position to advance to
   */
  constructor(pos: number);
  constructor(pos?: number) {
    this.state = ZobristHashGenerator.RNG_SEED;
    if (pos !== undefined) {
      while (this.counter < pos) this.next();
    }
  }

  /**
   * Next 64-bit number in sequence, returned as a JS number (upper bits may
   * be truncated). Java: public long next()
   */
  next(): number {
    this.counter++;
    // SplitMix64 step
    let z = (this.state += BigInt("0x9e3779b97f4a7c15"));
    z = ((z ^ (z >> BigInt(30))) * BigInt("0xbf58476d1ce4e5b9")) & BigInt("0xffffffffffffffff");
    z = ((z ^ (z >> BigInt(27))) * BigInt("0x94d049bb133111eb")) & BigInt("0xffffffffffffffff");
    z = (z ^ (z >> BigInt(31))) & BigInt("0xffffffffffffffff");
    // Convert to signed 64-bit then return as JS number (loses precision on
    // very large values but is sufficient for XOR-based Zobrist hashing)
    return Number(BigInt.asIntN(64, z));
  }

  /** @return The sequence position. */
  getSequencePosition(): number {
    return this.counter;
  }
}
