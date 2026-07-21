// @java Features/src/features/aspatial/SwapMoveFeature.java

/**
 * Binary feature that has a value of 1.0 for any move that is a swap move.
 *
 * @java features/aspatial/SwapMoveFeature.java
 * @author Dennis Soemers
 */

import { AspatialFeature } from "./AspatialFeature.js";
import type { State, Move, Game } from "./AspatialFeature.js";

/**
 * Binary feature that has a value of 1.0 for any move that is a swap move.
 *
 * @java features.aspatial.SwapMoveFeature
 */
export class SwapMoveFeature extends AspatialFeature {

  //-------------------------------------------------------------------------

  /** The singleton instance */
  private static readonly INSTANCE: SwapMoveFeature = new SwapMoveFeature();

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
   * @java SwapMoveFeature.featureVal(State, Move)
   */
  public featureVal(_state: State, move: Move): number {
    if (move.isSwap())
      return 1.0;
    else
      return 0.0;
  }

  //-------------------------------------------------------------------------

  public override toString(): string {
    return "SwapMove";
  }

  //-------------------------------------------------------------------------

  /**
   * @java SwapMoveFeature.generateTikzCode(Game)
   */
  public generateTikzCode(_game: Game): string {
    return "\\node[rectangle,draw{,REL_POS}] ({LABEL}) {Swap};";
  }

  //-------------------------------------------------------------------------

  /**
   * @return The singleton instance
   * @java SwapMoveFeature.instance()
   */
  public static instance(): SwapMoveFeature {
    return SwapMoveFeature.INSTANCE;
  }

  //-------------------------------------------------------------------------
}
