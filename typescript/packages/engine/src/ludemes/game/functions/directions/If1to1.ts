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
import {
  registerDirections1to1,
  type Compile1to1Env,
} from "../../../registry1to1.js";
import {
  parseArgs1to1,
  compileBool1to1,
  compileDirections1to1,
} from "../../../../compiler1to1.js";

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

registerDirections1to1(
  "if",
  (node: LudNode, env: Compile1to1Env): DirectionsFunction => {
    const { positional } = parseArgs1to1((node as LudList).items);
    const cond    = compileBool1to1(positional[0], env.numPlayers);
    const dirOk   = compileDirections1to1(positional[1]);
    const dirNot  = compileDirections1to1(positional[2]);
    return new If1to1(cond, dirOk, dirNot);
  },
);
