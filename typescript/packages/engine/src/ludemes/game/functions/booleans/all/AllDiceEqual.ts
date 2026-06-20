// @java Core/src/game/functions/booleans/all/simple/AllDiceEqual.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (all DiceEqual)
 * True if all dice show the same face value (doubles).
 * @java game/functions/booleans/all/simple/AllDiceEqual.java
 */
export class AllDiceEqual implements BooleanFunction {
  /**
   * @java AllDiceEqual.eval(Context):
   *   Checks that all die faces show the same value.
   */
  public eval(ctx: Context): boolean {
    // @java AllDiceEqual.java — `return context.state().isDiceAllEqual()`.
    // Read the flag set at roll time (ActionSetDiceAllEqual), NOT a recompute
    // from the live pip values: consumed dice are zeroed (ActionUseDie), so
    // recomputing from [4,0] (or [0,0] once all are used) wrongly reports
    // "equal" and fires a spurious (moveAgain), desyncing the mover.
    return (ctx.state as unknown as { diceAllEqual?: boolean }).diceAllEqual ?? false;
  }
}

