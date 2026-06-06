// @java Core/src/game/functions/directions/DirectionsFunction.java

/**
 * Provides common functionality for direction functions.
 *
 * Java parity: DirectionsFunction extends BaseLudeme implements Direction.
 * This abstract class is the base for all concrete direction-function ludemes
 * (e.g. Difference, Union, If). Concrete subclasses must implement:
 *   - eval(ctx): string[]         ← Java convertToAbsolute(...)
 *   - gameFlags(game): bigint     ← Java long gameFlags(Game)
 *   - isStatic(): boolean
 *   - preprocess(game): void
 *
 * @java game/functions/directions/DirectionsFunction.java
 * @author Eric.Piette and cambolbro
 */

import type { Context } from "../../../../context.js";
import type { DirectionsFunction as IDirectionsFunction } from "../../../base.js";
import { BaseLudeme } from "../../../other/other/BaseLudeme.js";
import type { RelativeDirection } from "../../util/directions/RelativeDirection.js";

/**
 * Abstract base class for all DirectionsFunction ludemes.
 *
 * Implements the DirectionsFunction interface (eval returns direction name list)
 * and extends BaseLudeme for standard Ludeme bookkeeping.
 *
 * @java game.functions.directions.DirectionsFunction
 */
export abstract class DirectionsFunction extends BaseLudeme implements IDirectionsFunction {

  /**
   * Returns the relative directions described by this function, or null if
   * this is an absolute-direction function.
   *
   * Java parity: concrete default returns null.
   * @java DirectionsFunction.getRelativeDirections()
   */
  public getRelativeDirections(): RelativeDirection[] | null {
    return null;
  }

  /**
   * Converts this direction specification to a list of absolute direction
   * name strings understood by the Trajectories/Topology API.
   *
   * In Java this is `convertToAbsolute(SiteType, TopologyElement, Component,
   * DirectionFacing, Integer, Context) → List<AbsoluteDirection>`.
   * In the TS 1:1 port the context carries all required state, so the
   * signature collapses to eval(ctx) returning direction name strings.
   *
   * @java DirectionsFunction.convertToAbsolute(SiteType, TopologyElement, Component, DirectionFacing, Integer, Context)
   */
  public abstract eval(ctx: Context): string[];

  /**
   * Returns the accumulated game flags for this direction function.
   * @java DirectionsFunction.gameFlags(Game)
   */
  public abstract gameFlags(game: unknown): bigint;

  /**
   * Returns true if this function is immutable (context-independent),
   * allowing extra optimisations.
   * @java DirectionsFunction.isStatic()
   */
  public abstract isStatic(): boolean;

  /**
   * Called once after the Game object has been created. Allows for any
   * game-specific pre-processing (e.g. caching static results).
   * @java DirectionsFunction.preprocess(Game)
   */
  public abstract preprocess(game: unknown): void;

  /**
   * Returns this object as a DirectionsFunction (part of the Direction
   * interface contract).
   *
   * Java parity: Direction.directionsFunctions() → DirectionsFunction.
   * @java DirectionsFunction.directionsFunctions()
   */
  public directionsFunctions(): DirectionsFunction {
    return this;
  }
}
