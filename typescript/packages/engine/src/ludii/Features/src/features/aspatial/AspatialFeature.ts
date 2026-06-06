// @java Features/src/features/aspatial/AspatialFeature.java

/**
 * An aspatial (i.e., not spatial) state-action feature. These features are not
 * necessarily binary, i.e. they can return floats.
 *
 * @java features/aspatial/AspatialFeature.java
 * @author Dennis Soemers
 */

/** @java other.state.State */
export type State = unknown;

/** @java other.move.Move */
export type Move = {
  isSwap(): boolean;
  isPass(): boolean;
  mover(): number;
};

/** @java game.Game */
export type Game = unknown;

/**
 * Abstract base for aspatial features.
 *
 * @java features.aspatial.AspatialFeature
 */
export abstract class AspatialFeature {

  //-------------------------------------------------------------------------

  /**
   * @param state
   * @param move
   * @return Feature value for given move in given state.
   * @java AspatialFeature.featureVal(State, Move)
   */
  public abstract featureVal(state: State, move: Move): number;

  //-------------------------------------------------------------------------

  public toString(): string {
    throw new Error("UnsupportedOperationException");
  }

  //-------------------------------------------------------------------------

  /**
   * @param game Game to visualise for
   * @return Tikz code to visualise this feature in a Tikz environment in LaTeX.
   * @java Feature.generateTikzCode(Game)
   */
  public abstract generateTikzCode(game: Game): string;

  //-------------------------------------------------------------------------
}
