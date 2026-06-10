/**
 * CountMoves1to1.ts
 * @java game/functions/ints/count/simple/CountMoves.java
 *
 * (count Moves) — returns context.trial().moveNumber()
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";

export class CountMoves1to1 implements IntFunction {
  /** @java game/functions/ints/count/simple/CountMoves.java — eval(Context) */
  public eval(ctx: Context): number {
    // @java context.trial().moveNumber()
    return ctx.trial.moves.length;
  }
}

