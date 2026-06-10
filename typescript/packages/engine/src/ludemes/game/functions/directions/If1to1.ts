/**
 * If1to1.ts
 * @java Core/src/game/functions/directions/If.java
 *
 * (if <condition> <directionsOk> <directionsNotOk>) — conditional direction choice.
 *
 * Returns the first directions set when condition is true, else the second.
 *
 * @java Core/src/game/functions/directions/If.java — convertToAbsolute
 */

import type { Context } from "../../../../context.js";
import type { BooleanFunction, DirectionsFunction } from "../../../base.js";
import type { LudList, LudNode } from "@ludii/typescript-language";

export class If1to1 implements DirectionsFunction {
  private readonly condition: BooleanFunction;
  private readonly dirOk: DirectionsFunction;
  private readonly dirNotOk: DirectionsFunction;

  /**
   * @java If.java — constructor(BooleanFunction condition, Direction directionsOk, Direction directionsNotOk)
   */
  public constructor(
    condition: BooleanFunction,
    dirOk: DirectionsFunction,
    dirNotOk: DirectionsFunction,
  ) {
    this.condition = condition;
    this.dirOk     = dirOk;
    this.dirNotOk  = dirNotOk;
  }

  /**
   * @java If.java — convertToAbsolute: delegate to the branch matching condition.eval(context)
   */
  public eval(ctx: Context): string[] {
    if (this.condition.eval(ctx)) {
      return this.dirOk.eval(ctx);
    }
    return this.dirNotOk.eval(ctx);
  }
}

