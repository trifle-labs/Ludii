// @java Core/src/game/functions/directions/Union.java

import type { Context } from "../../../../context.js";
import type { DirectionsFunction } from "../../../base.js";
import { directionsFunction } from "../../rules/play/moves/nonDecision/effect/EffectCtorAdapters.js";
import type { AbsoluteDirection } from "../../../../eval/graph/trajectory/absolute-direction.js";
import type { TopologyElement, RelationType, DirectionFacing } from "../../../other/topology/TopologyElement.js";
import type { SiteType } from "../../../other/topology/TopologyElement.js";

/**
 * Returns the union of two sets of directions.
 *
 * Java parity: Union extends DirectionsFunction, holds two DirectionsFunction
 * references, and merges their convertToAbsolute results (deduplicating).
 *
 * @java game.functions.directions.Union
 * @author Eric.Piette
 */
export class Union implements DirectionsFunction {
  /** The first set of directions. @java Union.directionSet1 */
  private readonly directionSet1: DirectionsFunction;

  /** The second set of directions. @java Union.directionSet2 */
  private readonly directionSet2: DirectionsFunction;

  /**
   * @java Union(Direction directions, Direction directionsToAdd)
   */
  public constructor(directionSet1: DirectionsFunction, directionSet2: DirectionsFunction) {
    // @java Union.java — directions.directionsFunctions(); coerce raw enums.
    this.directionSet1 = directionsFunction(directionSet1 as never);
    this.directionSet2 = directionsFunction(directionSet2 as never);
  }

  /**
   * Returns the union of both direction name sets.
   * @java Union.convertToAbsolute — merges both sets, deduplicating.
   */
  public eval(ctx: Context): string[] {
    const names1 = this.directionSet1.eval(ctx);
    const names2 = this.directionSet2.eval(ctx);
    const seen = new Set<string>(names1);
    const result = [...names1];
    for (const n of names2) {
      if (!seen.has(n)) {
        seen.add(n);
        result.push(n);
      }
    }
    return result;
  }

  /** @java Union.isStatic */
  public isStatic(): boolean {
    return false;
  }

  /** @java Union.toString */
  public toString(): string {
    return "";
  }
}
