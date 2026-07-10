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
  /** Item description (piece name). @java Count.item (package-private field) */
  private readonly _item: string;

  /** Number of items. @java Count.count (package-private field) */
  private readonly _count: IntFunction;

  /**
   * @java Count(String item, IntFunction count)
   */
  public constructor(item: string, count: IntFunction) {
    this._item = item;
    this._count = count;
  }

  /**
   * @java Count.item() — public accessor. Consumers (PlaceRandom, Place) and the
   * PlaceRandom Count[]-ctor dispatch guard call item()/count() as methods, exactly
   * as Java does; exposing these as plain fields made `(place Random { (count ...) })`
   * (Chex) fail the Count[] guard and fall through to the wrong ctor overload.
   */
  public item(): string {
    return this._item;
  }

  /** @java Count.count() — public accessor for the IntFunction count. */
  public count(): IntFunction {
    return this._count;
  }
}
