/**
 * Count1to1.ts
 * @java game/util/math/Count.java
 *
 * Associates an item (piece name string) with a count (IntFunction).
 * Used for lists of items with counts, e.g. (placeRandom ...).
 *
 * This is a data class — no eval(ctx).
 */

import type { IntFunction } from "../../../base.js";

/**
 * Associates an item with a count.
 * @java game/util/math/Count.java
 * @remarks Used for lists of items with counts, such as (placeRandom ...).
 */
export class Count1to1 {
  /** @java Count.item — item description (piece name). */
  private readonly itemName: string;

  /** @java Count.count — number of items. */
  private readonly countFn: IntFunction;

  /**
   * @java game/util/math/Count.java — constructor(String item, IntFunction count)
   */
  public constructor(item: string, count: IntFunction) {
    this.itemName = item;
    this.countFn = count;
  }

  /** @java Count.item() */
  public item(): string {
    return this.itemName;
  }

  /** @java Count.count() */
  public count(): IntFunction {
    return this.countFn;
  }
}
