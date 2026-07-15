// @java Core/src/game/functions/region/math/Intersection.java

/**
 * Returns the intersection of two regions, or of many regions.
 *
 * @java game/functions/region/math/Intersection.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { RegionFunction } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

export class Intersection extends BaseRegionFunction {
  /** @java Intersection.region1 */
  private readonly region1: RegionFunction | null;
  /** @java Intersection.region2 */
  private readonly region2: RegionFunction | null;
  /** @java Intersection.regions */
  private readonly regions: readonly RegionFunction[] | null;

  /**
   * @java Intersection(RegionFunction region1, RegionFunction region2)
   * @java Intersection(RegionFunction[] regions)
   */
  public constructor(a: RegionFunction | readonly RegionFunction[], b: RegionFunction | null = null) {
    super();
    if (Array.isArray(a)) {
      this.region1 = null;
      this.region2 = null;
      this.regions = a as readonly RegionFunction[];
    } else {
      this.region1 = a as RegionFunction;
      this.region2 = b;
      this.regions = null;
    }
  }

  /** @java Intersection.eval(Context) — sites.and(region2) / chained and over regions */
  public override eval(ctx: Context): number[] {
    // @java Core/src/game/util/equipment/Region.java:198-202,319-321 — Java's
    // Region is BitSet-backed; sites() walks nextSetBit() so intersection
    // output is ALWAYS ascending. Order matters downstream: FromTo.eval
    // (FromTo.java:195,210) draws context.rng() once per candidate in
    // iteration order, so Shogun's (apply (set Value … (value Random …)))
    // baked different RNG values per piece when TS preserved the first
    // operand's arbitrary order.
    if (this.regions !== null) {
      if (this.regions.length === 0) return [];
      let acc = new Set<number>(this.regions[0]!.eval(ctx));
      for (let i = 1; i < this.regions.length; i++) {
        const next = new Set<number>(this.regions[i]!.eval(ctx));
        acc = new Set<number>([...acc].filter((site) => next.has(site)));
      }
      return [...acc].sort((a, b) => a - b);
    }
    // Dedup the first operand (@java both operands are BitSet Regions) —
    // matches the multi-region branch above.
    const first = Array.from(new Set(this.region1!.eval(ctx)));
    const second = new Set(this.region2!.eval(ctx));
    return first.filter((s) => second.has(s)).sort((a, b) => a - b);
  }

  /** @java Intersection.isStatic() */
  public override isStatic(): boolean { return false; }
}
