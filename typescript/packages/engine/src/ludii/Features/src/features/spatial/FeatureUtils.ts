// @java Features/src/features/spatial/FeatureUtils.java

/**
 * Some utility methods related to features.
 *
 * @java features.spatial.FeatureUtils
 * @author Dennis Soemers
 */

//-----------------------------------------------------------------------------
// Escape-hatch interface for Move

/** @java other.move.Move */
export interface Move {
  isPass(): boolean;
  fromNonDecision(): number;
  toNonDecision(): number;
}

//-----------------------------------------------------------------------------

/**
 * Utility methods related to features.
 *
 * @java features.spatial.FeatureUtils
 */
export class FeatureUtils {

  //-------------------------------------------------------------------------

  /**
   * Private constructor, should not use
   * @java FeatureUtils()
   */
  private constructor() {
    // should not instantiate
  }

  //-------------------------------------------------------------------------

  /**
   * @param move
   * @return Extracts a from-position from an action
   * @java FeatureUtils.fromPos(Move)
   */
  public static fromPos(move: Move | null): number {
    if (move === null || move.isPass()) {
      return -1;
    }

    let fromPos = move.fromNonDecision();

    if (fromPos === move.toNonDecision()) {
      fromPos = -1;
    }

    return fromPos;
  }

  /**
   * @param move
   * @return Extracts a to-position from an action
   * @java FeatureUtils.toPos(Move)
   */
  public static toPos(move: Move | null): number {
    if (move === null || move.isPass()) {
      return -1;
    }

    return move.toNonDecision();
  }

  //-------------------------------------------------------------------------
}
