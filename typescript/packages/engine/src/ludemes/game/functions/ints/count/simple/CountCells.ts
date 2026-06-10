// @java Core/src/game/functions/ints/count/simple/CountCells.java


import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Game } from "../../../../../Game.js";
import type { Rules } from "../../../../rules/Rules.js";

export class CountCells implements IntFunction {
  /**
   * @java game/functions/ints/count/simple/CountCells.java — eval(Context)
   * Returns context.game().board().topology().cells().size() — i.e. board numSites.
   */
  public eval(ctx: Context): number {
    return (ctx.game as unknown as Game).equipment.board.numSites;
  }
}
