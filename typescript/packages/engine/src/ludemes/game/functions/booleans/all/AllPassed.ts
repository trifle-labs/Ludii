// @java Core/src/game/functions/booleans/all/simple/AllPassed.java

import { compileFlags } from "../../../../../ludii/compiler/compile-flags.js";
import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";

/**
 * (all Passed)
 * True if all players passed in the previous consecutive turns.
 * @java game/functions/booleans/all/simple/AllPassed.java
 */
export class AllPassed implements BooleanFunction {
  /** @java AllPassed.gameFlags() = GameType.NotAllPass (unconditional, no player
   * count check) — the game tests all-passed itself, so the engine's all-pass-draw
   * fallback must never fire for it regardless of player count. */
  public constructor() {
    compileFlags.usesUnconditionalNotAllPass = true;
  }

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

