// @java AI/src/utils/data_structures/ScoredIndex.java

/**
 * Simple wrapper for score + index, used for sorting indices
 * (usually move indices) based on scores. Almost identical to ScoredMove.
 *
 * @java utils.data_structures.ScoredIndex
 * @author cyprien
 */
export class ScoredIndex {

  /** The index. @java ScoredIndex.index */
  public readonly index: number;

  /** The index's score. @java ScoredIndex.score */
  public readonly score: number;

  /**
   * Constructor.
   * @param index
   * @param score
   * @java ScoredIndex(int, float)
   */
  constructor(index: number, score: number) {
    this.index = index;
    this.score = score;
  }

  /**
   * Sorts in descending order by score (higher score comes first).
   * @java ScoredIndex.compareTo(ScoredIndex)
   */
  compareTo(other: ScoredIndex): number {
    const delta = other.score - this.score;
    if (delta < 0.0) return -1;
    else if (delta > 0.0) return 1;
    else return 0;
  }
}
