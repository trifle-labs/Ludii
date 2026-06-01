// @java Core/src/game/functions/booleans/all/simple/AllPassed.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (all Passed)
 * True if all players passed in the previous consecutive turns.
 * @java game/functions/booleans/all/simple/AllPassed.java
 */
export class AllPassed1to1 implements BooleanFunction {
  /**
   * @java AllPassed.eval(Context):
   *   trial.moveNumber() >= players.count() && context.allPass()
   *   Java checks the last N moves (where N = numPlayers) are all passes.
   */
  public eval(ctx: Context): boolean {
    const g = ctx.game;
    const moveNum = ctx.trial.moves.length;
    if (moveNum < g.numPlayers) return false;
    const lastN = ctx.trial.moves.slice(-g.numPlayers);
    return lastN.every(m => m && m.isPass());
  }
}

registerBool1to1("all:passed", (_node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  return new AllPassed1to1();
});
