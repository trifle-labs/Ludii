// @java Core/src/game/functions/booleans/all/simple/AllDiceUsed.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (all DiceUsed)
 * True if all dice have been used (dice values == 0 in state).
 * @java game/functions/booleans/all/simple/AllDiceUsed.java
 */
export class AllDiceUsed1to1 implements BooleanFunction {
  /**
   * @java AllDiceUsed.eval(Context):
   *   All dice have value 0 (all used).
   */
  public eval(ctx: Context): boolean {
    const dice = ctx.state.diceValues;
    if (!dice || dice.length === 0) return true;
    return dice.every(v => v === 0);
  }
}

