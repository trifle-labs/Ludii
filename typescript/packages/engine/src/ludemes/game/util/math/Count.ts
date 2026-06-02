// @java Core/src/game/util/math/Count.java
//
// Associates an item (piece name) with a count.
// Used for lists of items with counts, such as (placeRandom ...).

import type { IntFunction } from "../../../base.js";

/**
 * Associates an item with a count.
 *
 * @java game.util.math.Count
 */
export class Count {
  /** Item description (piece name). @java Count.item */
  public readonly item: string;

  /** Number of items. @java Count.count */
  public readonly count: IntFunction;

  /**
   * @java Count(String item, IntFunction count)
   */
  public constructor(item: string, count: IntFunction) {
    this.item = item;
    this.count = count;
  }
}
