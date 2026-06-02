// @java Core/src/game/util/graph/ItemScore.java
//
// Helper class for reordering graph elements by a numeric score.
// Comparable by score (then by id for stability).

/**
 * Helper class for reordering graph elements.
 *
 * @java game.util.graph.ItemScore
 */
export class ItemScore {
  /** The element index. @java ItemScore.id */
  public readonly id: number;

  /** The sort score. @java ItemScore.score */
  public readonly score: number;

  /**
   * @java ItemScore(int id, double score)
   */
  public constructor(id: number, score: number) {
    this.id = id;
    this.score = score;
  }

  /**
   * @java ItemScore.compareTo(ItemScore other)
   * Returns negative if this < other, 0 if equal, positive if this > other.
   */
  public compareTo(other: ItemScore): number {
    if (this.score === other.score) return 0;
    return this.score < other.score ? -1 : 1;
  }
}
