// @java Features/src/features/aspatial/InterceptFeature.java

/**
 * Intercept feature (always a value of 1.0)
 *
 * @java features/aspatial/InterceptFeature.java
 * @author Dennis Soemers
 */

import { AspatialFeature } from "./AspatialFeature.js";
import type { State, Move, Game } from "./AspatialFeature.js";

/**
 * Intercept feature (always a value of 1.0)
 *
 * @java features.aspatial.InterceptFeature
 */
export class InterceptFeature extends AspatialFeature {

  //-------------------------------------------------------------------------

  /** The singleton instance */
  private static readonly INSTANCE: InterceptFeature = new InterceptFeature();

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
   * @java InterceptFeature.featureVal(State, Move)
   */
  public featureVal(_state: State, _move: Move): number {
    return 1.0;
  }

  //-------------------------------------------------------------------------

  public override toString(): string {
    return "Intercept";
  }

  //-------------------------------------------------------------------------

  /**
   * @java InterceptFeature.generateTikzCode(Game)
   */
  public generateTikzCode(_game: Game): string {
    return "\\node[rectangle,draw{,REL_POS}] ({LABEL}) {Intercept};";
  }

  //-------------------------------------------------------------------------

  /**
   * @return The singleton instance
   * @java InterceptFeature.instance()
   */
  public static instance(): InterceptFeature {
    return InterceptFeature.INSTANCE;
  }

  //-------------------------------------------------------------------------
}
