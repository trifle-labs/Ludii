// @java Core/src/game/util/equipment/Region.java
//
// Faithful port of Region. Java uses a ChunkSet (sparse bitset); here we use
// a plain Set<number> which gives the same logical interface: O(1) add/remove/
// contains, iteratable sites, union/intersection/difference.
// The expand() static methods are NOT ported here — they depend on Topology
// which lives in eval/graph (already ported). Callers that need expand() should
// use the Trajectories API on ctx._trajectories directly.

/**
 * Defines a region of sites within a container.
 * Backed by a Set<number> rather than Java's ChunkSet — same public contract.
 *
 * @java game.util.equipment.Region
 */
export class Region {
  /** Backing site-index set. @java Region.bitSet (ChunkSet) */
  private readonly bits: Set<number>;

  /** Optional human-readable name. @java Region.name */
  public readonly name: string;

  // ---------------------------------------------------------------------------
  // Constructors
  // ---------------------------------------------------------------------------

  /**
   * Empty region.
   * @java Region()
   */
  public constructor();

  /**
   * Region from a count: sets bits 0..count-1.
   * @java Region(int count)
   */
  public constructor(count: number);

  /**
   * Region from an array of site indices.
   * @java Region(int[] bitsToSet)
   */
  public constructor(sites: readonly number[]);

  /**
   * Named empty region.
   * @java (internal usage)
   */
  public constructor(name: string);

  /**
   * Copy constructor.
   * @java Region(Region other)
   */
  public constructor(other: Region);

  public constructor(arg?: number | readonly number[] | string | Region) {
    if (arg === undefined) {
      this.bits = new Set();
      this.name = "?";
    } else if (arg instanceof Region) {
      this.bits = new Set(arg.bits);
      this.name = "?";
    } else if (typeof arg === "string") {
      this.bits = new Set();
      this.name = arg;
    } else if (typeof arg === "number") {
      // count constructor — set bits 0..count-1
      this.bits = new Set();
      for (let i = 0; i < arg; i += 1) this.bits.add(i);
      this.name = "?";
    } else {
      // int[] constructor
      this.bits = new Set(arg);
      this.name = "?";
    }
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /** @java Region.count() */
  public count(): number { return this.bits.size; }

  /** @java Region.isEmpty() */
  public isEmpty(): boolean { return this.bits.size === 0; }

  /** @java Region.contains(int loc) */
  public contains(loc: number): boolean { return this.bits.has(loc); }

  /**
   * @java Region.sites() — array of set indices in ascending order.
   */
  public sites(): number[] {
    const arr = Array.from(this.bits);
    arr.sort((a, b) => a - b);
    return arr;
  }

  /**
   * @java Region.nthValue(int n) — the n-th set bit (0-based), in ascending order.
   */
  public nthValue(n: number): number {
    const sorted = this.sites();
    return sorted[n] ?? -1;
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /** @java Region.add(int val) */
  public add(val: number): void { this.bits.add(val); }

  /** @java Region.remove(int val) */
  public remove(val: number): void { this.bits.delete(val); }

  /** @java Region.removeNth(int n) */
  public removeNth(n: number): void { this.remove(this.nthValue(n)); }

  /**
   * Replace contents with bits 0..newCount-1.
   * @java Region.set(int newCount)
   */
  public setCount(newCount: number): void {
    this.bits.clear();
    for (let i = 0; i < newCount; i += 1) this.bits.add(i);
  }

  /**
   * Replace contents with the sites of another region.
   * @java Region.set(Region other)
   */
  public setRegion(other: Region): void {
    this.bits.clear();
    for (const s of other.bits) this.bits.add(s);
  }

  // ---------------------------------------------------------------------------
  // Set operations (mutating in-place, matching Java semantics)
  // ---------------------------------------------------------------------------

  /** @java Region.union(Region other) — logical OR in-place. */
  public union(other: Region): void {
    for (const s of other.bits) this.bits.add(s);
  }

  /** @java Region.intersection(Region other) — logical AND in-place. */
  public intersection(other: Region): void {
    for (const s of this.bits) {
      if (!other.bits.has(s)) this.bits.delete(s);
    }
  }

  /** @java Region.remove(Region other) — logical AND-NOT in-place. */
  public removeRegion(other: Region): void {
    for (const s of other.bits) this.bits.delete(s);
  }

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  /** @java Region.hashCode() / equals() */
  public equals(other: Region): boolean {
    if (this.bits.size !== other.bits.size) return false;
    for (const s of this.bits) if (!other.bits.has(s)) return false;
    return true;
  }

  /** @java Region.toString() */
  public toString(): string {
    const sorted = this.sites();
    return "[" + sorted.join(",") + "]";
  }
}
