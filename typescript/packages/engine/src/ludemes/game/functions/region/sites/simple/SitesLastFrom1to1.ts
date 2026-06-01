/**
 * SitesLastFrom1to1.ts
 * @java game/functions/region/sites/simple/SitesLastFrom.java
 *
 * (sites LastFrom) — returns all "from" positions of the last move.
 *
 * Java parity: SitesLastFrom.eval(context) reads lastMove.fromNonDecision()
 * plus all action.from() values that are on-board.
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

export class SitesLastFrom1to1 implements RegionFunction {
  /** @java game/functions/region/sites/simple/SitesLastFrom.java — eval(Context) */
  public eval(ctx: Context): number[] {
    // @java context.trial().lastMove() → lastMove.fromNonDecision() + action.from()
    const moves = ctx.trial.moves;
    if (moves.length === 0) {
      const f = ctx._evalFrom;
      return f >= 0 ? [f] : [];
    }
    const lastMove = moves[moves.length - 1]!;
    const seen = new Set<number>();
    const result: number[] = [];

    const fromMain = lastMove.fromNonDecision();
    if (fromMain >= 0 && !seen.has(fromMain)) {
      seen.add(fromMain);
      result.push(fromMain);
    }
    // Java also iterates action.from() for each action in the move
    const boardN = ctx.state.cells.length;
    if ((lastMove as unknown as { actions?: Array<{ from(): number }> }).actions) {
      for (const action of (lastMove as unknown as { actions: Array<{ from(): number }> }).actions) {
        const f = action.from();
        if (f >= 0 && f < boardN && !seen.has(f)) {
          seen.add(f);
          result.push(f);
        }
      }
    }
    if (result.length === 0) {
      const f2 = lastMove.fromNonDecision() >= 0 ? lastMove.fromNonDecision() : ctx._evalFrom;
      if (f2 >= 0) return [f2];
    }
    return result;
  }
}

registerRegion1to1("sites:lastfrom", (_node: LudNode, _env: Compile1to1Env): RegionFunction => {
  void _node; void _env;
  return new SitesLastFrom1to1();
});
