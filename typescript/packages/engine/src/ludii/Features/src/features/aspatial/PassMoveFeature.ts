// @java Features/src/features/aspatial/PassMoveFeature.java

/**
 * Binary feature that has a value of 1.0 for any move that is a pass move.
 *
 * @java features/aspatial/PassMoveFeature.java
 * @author Dennis Soemers
 */

import { AspatialFeature } from "./AspatialFeature.js";
import type { State, Move, Game } from "./AspatialFeature.js";

/**
 * Binary feature that has a value of 1.0 for any move that is a pass move.
 *
 * @java features.aspatial.PassMoveFeature
 */
export class PassMoveFeature extends AspatialFeature {

  //-------------------------------------------------------------------------

  /** The singleton instance */
  private static readonly INSTANCE: PassMoveFeature = new PassMoveFeature();

  //-------------------------------------------------------------------------

  /**
   * Private: singleton
   */
  private constructor() {
    super();
    // Do nothing
  }

  //-------------------------------------------------------------------------

  /**
   * @java PassMoveFeature.featureVal(State, Move)
   */
  public featureVal(_state: State, move: Move): number {
    if (move.isPass())
      return 1.0;
    else
      return 0.0;
  }

  //-------------------------------------------------------------------------

  public override toString(): string {
    return "PassMove";
  }

  //-------------------------------------------------------------------------

  /**
   * @java PassMoveFeature.generateTikzCode(Game)
   */
  public generateTikzCode(_game: Game): string {
    return "\\node[rectangle,draw{,REL_POS}] ({LABEL}) {Pass};";
  }

  //-------------------------------------------------------------------------

  /**
   * @return The singleton instance
   * @java PassMoveFeature.instance()
   */
  public static instance(): PassMoveFeature {
    return PassMoveFeature.INSTANCE;
  }

  //-------------------------------------------------------------------------
}
