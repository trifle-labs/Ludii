// @java Core/src/game/functions/booleans/is/simple/IsFull.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Game1to1 } from "../../../../../Game1to1.js";

/**
 * (is Full)
 * Checks if there are no empty cells on the board.
 * @java game/functions/booleans/is/simple/IsFull.java
 */
export class IsFull implements BooleanFunction {
  /**
   * @java IsFull.eval(Context):
   *   context.state().containerStates()[0].emptyRegion(…).sites().length == 0
   */
  public eval(ctx: Context): boolean {
    const g = ctx.game as unknown as Game1to1;
    const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
    for (let i = 0; i < boardN; i++) {
      if (ctx.state.isEmptySite(i)) return false;
    }
    return true;
  }
}

