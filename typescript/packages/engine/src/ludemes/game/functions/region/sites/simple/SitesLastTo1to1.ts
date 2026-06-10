/**
 * SitesLastTo1to1.ts
 * @java game/functions/region/sites/simple/SitesLastTo.java
 *
 * (sites LastTo) — returns the set of "to" positions of the last move.
 *
 * Java parity: SitesLastTo.eval(context) reads lastMove.toNonDecision()
 * plus all action.to() values that are on-board.
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

export class SitesLastTo1to1 implements RegionFunction {
  /** @java game/functions/region/sites/simple/SitesLastTo.java — eval(Context) */
  public eval(ctx: Context): number[] {
    // @java context.trial().lastMove() → lastMove.toNonDecision() + action.to()
    const moves = ctx.trial.moves;
    if (moves.length === 0) {
      const t = ctx._evalTo;
      return t >= 0 ? [t] : [];
    }
    const lastMove = moves[moves.length - 1]!;
    const seen = new Set<number>();
    const result: number[] = [];

    const toMain = lastMove.toNonDecision();
    if (toMain >= 0 && !seen.has(toMain)) {
      seen.add(toMain);
      result.push(toMain);
    }
    // Java also iterates action.to() for each action in the move
    const boardN = ctx.state.cells.length;
    if ((lastMove as unknown as { actions?: Array<{ to(): number }> }).actions) {
      for (const action of (lastMove as unknown as { actions: Array<{ to(): number }> }).actions) {
        const t = action.to();
        if (t >= 0 && t < boardN && !seen.has(t)) {
          seen.add(t);
          result.push(t);
        }
      }
    }
    if (result.length === 0) {
      const t2 = lastMove.toNonDecision() >= 0 ? lastMove.toNonDecision() : ctx._evalTo;
      if (t2 >= 0) return [t2];
    }
    return result;
  }
}

