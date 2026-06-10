// @java Core/src/game/util/equipment/Values.java
//
// Defines the set of values of a graph variable in a deduction puzzle.
// Holds the SiteType (Vertex/Edge/Cell) and the range of valid values.

import type { RangeFunction1to1 } from "../../functions/range/Range1to1.js";

/** Graph element types — mirrors Java's SiteType ordinals. */
export type UtilSiteType = "Vertex" | "Edge" | "Cell";

/**
 * Defines the set of values of a graph variable in a deduction puzzle.
 *
 * @java game.util.equipment.Values
 */
export class Values {
  /** The graph element type. @java Values.type */
  private readonly _type: UtilSiteType;

  /** The range of valid values. @java Values.range */
  private readonly _range: RangeFunction1to1;

  /**
   * @java Values(SiteType type, Range range)
   *
   * @param type  The graph element type.
   * @param range The range of valid values.
   */
  public constructor(type: UtilSiteType, range: RangeFunction1to1) {
    this._type = type;
    this._range = range;
  }

  /** @java Values.type() */
  public type(): UtilSiteType { return this._type; }

  /** @java Values.range() */
  public range(): RangeFunction1to1 { return this._range; }
}
