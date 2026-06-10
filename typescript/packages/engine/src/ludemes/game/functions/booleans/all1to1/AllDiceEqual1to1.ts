// @java Core/src/game/functions/booleans/all/simple/AllDiceEqual.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (all DiceEqual)
 * True if all dice show the same face value (doubles).
 * @java game/functions/booleans/all/simple/AllDiceEqual.java
 */
export class AllDiceEqual1to1 implements BooleanFunction {
  /**
   * @java AllDiceEqual.eval(Context):
   *   Checks that all die faces show the same value.
   */
  public eval(ctx: Context): boolean {
    const dice = ctx.state.diceValues;
    if (!dice || dice.length === 0) return false;
    const first = dice[0] ?? 0;
    return dice.every(v => v === first);
  }
}

