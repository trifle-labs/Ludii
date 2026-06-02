/**
 * Values1to1.ts
 * @java game/util/equipment/Values.java
 *
 * Defines the set of values of a graph variable in a deduction puzzle.
 * Holds a SiteType and a range [min, max].
 *
 * This is a data class — no eval(ctx).
 */

import type { SiteType1to1 } from "../moves/From1to1.js";

/**
 * Defines the set of values of a graph variable in a deduction puzzle.
 * @java game/util/equipment/Values.java
 */
export class Values1to1 {
  /** @java Values.type — the graph element type. */
  private readonly siteType: SiteType1to1;

  /**
   * @java Values.range — the range of the values.
   * Stored as [min, max] plain numbers.
   */
  private readonly rangeMin: number;
  private readonly rangeMax: number;

  /**
   * @java game/util/equipment/Values.java — constructor(SiteType type, Range range)
   */
  public constructor(siteType: SiteType1to1, rangeMin: number, rangeMax: number) {
    this.siteType = siteType;
    this.rangeMin = rangeMin;
    this.rangeMax = rangeMax;
  }

  /** @java Values.type() */
  public type(): SiteType1to1 {
    return this.siteType;
  }

  /** @java Values.range() — min of the range. */
  public min(): number {
    return this.rangeMin;
  }

  /** @java Values.range() — max of the range. */
  public max(): number {
    return this.rangeMax;
  }
}
