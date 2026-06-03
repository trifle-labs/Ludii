// @java Core/src/game/functions/directions/Difference.java

import type { Context } from "../../../../context.js";
import type { DirectionsFunction } from "../../../base.js";

/**
 * Returns the difference of two direction sets (directions in the original
 * set that are NOT in the removed set).
 *
 * Java parity: Difference extends DirectionsFunction. It holds originalDirection
 * and removedDirection. convertToAbsolute expands both sets (resolving group
 * names to compass names) and returns originalAfterConv minus removedAfterConv.
 *
 * @java game.functions.directions.Difference
 * @author Eric.Piette
 */
export class Difference implements DirectionsFunction {
  /** The original set of directions. @java Difference.originalDirection */
  private readonly originalDirection: DirectionsFunction;

  /** The directions to remove. @java Difference.removedDirection */
  private readonly removedDirection: DirectionsFunction;

  /**
   * @java Difference(Direction directions, Direction directionsToRemove)
   */
  public constructor(
    originalDirection: DirectionsFunction,
    removedDirection: DirectionsFunction,
  ) {
    this.originalDirection = originalDirection;
    this.removedDirection = removedDirection;
  }

  /**
   * Returns original direction names minus removed direction names.
   * @java Difference.convertToAbsolute — originalAfterConv minus removedAfterConv.
   */
  public eval(ctx: Context): string[] {
    const origNames = this.originalDirection.eval(ctx);
    const remNames = this.removedDirection.eval(ctx);
    const removeSet = new Set<string>(remNames);
    const result: string[] = [];
    const seen = new Set<string>();
    for (const n of origNames) {
      if (!removeSet.has(n) && !seen.has(n)) {
        seen.add(n);
        result.push(n);
      }
    }
    return result;
  }

  /** @java Difference.isStatic */
  public isStatic(): boolean {
    return false;
  }

  /** @java Difference.toString */
  public toString(): string {
    return "";
  }
}
