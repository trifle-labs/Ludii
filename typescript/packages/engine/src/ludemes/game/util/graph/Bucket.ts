// @java Core/src/game/util/graph/Bucket.java
//
// Bucket for sorting coordinates along a dimension.
// Holds a list of ItemScore items and computes the mean score.

import { ItemScore } from "./ItemScore.js";

/**
 * Bucket for sorting coordinates along a dimension.
 *
 * @java game.util.graph.Bucket
 */
export class Bucket {
  /** @java Bucket.items (unmodifiable list) */
  private readonly _items: ItemScore[] = [];

  /** @java Bucket.total — running sum of scores */
  private _total = 0;

  /**
   * @java Bucket.items() — unmodifiable view of items.
   */
  public items(): readonly ItemScore[] {
    return this._items;
  }

  /**
   * @java Bucket.mean() — mean score of all items.
   */
  public mean(): number {
    return this._items.length === 0 ? 0 : this._total / this._items.length;
  }

  /**
   * @java Bucket.addItem(ItemScore item)
   */
  public addItem(item: ItemScore): void {
    this._items.push(item);
    this._total += item.score;
  }
}
