/**
 * @java game/rules/end/If.java If
 *
 * An end rule that fires when a boolean condition is true, producing a Result.
 *
 * Java parity: If.eval(context) evaluates the condition; if true, resolves the
 * result (Win/Loss/Draw for the given role) and returns it; otherwise null.
 *
 * @java game/rules/end/If.java — eval(Context context)
 */

import type { Context } from "../../../../context.js";
import type { BooleanFunction, EndRuleFunction, EndResult } from "../../../base.js";
import type { Result } from "./Result.js";

export class If implements EndRuleFunction {
  private readonly condition: BooleanFunction;
  private readonly result: Result;
  private readonly numPlayers: number;

  /**
   * @java game/rules/end/If.java — constructor
   *
   * @param condition  The boolean test (e.g. IsLine)
   * @param result     The result to apply when the condition fires
   * @param numPlayers Number of players (needed for "Next" role resolution)
   */
  public constructor(condition: BooleanFunction, result: Result, numPlayers: number) {
    this.condition = condition;
    this.result = result;
    this.numPlayers = numPlayers;
  }

  /**
   * @java game/rules/end/If.java — eval(Context context)
   * If condition.eval(context) is true, return an EndResult; else null.
   */
  public eval(ctx: Context): EndResult | null {
    if (!this.condition.eval(ctx)) return null;

    const mover = ctx.state.mover;
    // @java game/functions/ints/board/Id.java:122 — case Next uses state.next()
    const who = this.result.resolveWho(mover, this.numPlayers, ctx);
    const resultType = this.result.result;

    // Build rankings array: [0, rank_p1, rank_p2, ...]
    // Java parity: winner gets 1.0, loser gets numPlayers+1 rank (worst),
    // draw gives all players (numPlayers+1)/2.
    const n = this.numPlayers;
    const ranking = new Array<number>(n + 1).fill(0);
    ranking[0] = 0; // unused slot

    if (resultType === "Win") {
      // Winner = who, all others lose (or draw among themselves)
      if (who === 0) {
        // "All" win = draw for all
        const drawRank = (n + 1) / 2;
        for (let p = 1; p <= n; p++) ranking[p] = drawRank;
        return { winner: 0, over: true, ranking };
      }
      // One winner
      for (let p = 1; p <= n; p++) {
        ranking[p] = p === who ? 1.0 : n + 1 - (n === 1 ? 0 : 0); // simplify: losers at 2 for 2p
      }
      // Java parity: for 2-player, winner=1, loser=2
      for (let p = 1; p <= n; p++) {
        if (p !== who) ranking[p] = 2.0;
      }
      ranking[who] = 1.0;
      return { winner: who, over: true, ranking };
    }

    if (resultType === "Loss") {
      // Loser = who, all others win
      const winner = n === 2 ? (who === 1 ? 2 : 1) : 0;
      for (let p = 1; p <= n; p++) {
        ranking[p] = p === who ? n : 1.0;
      }
      return { winner, over: true, ranking };
    }

    if (resultType === "Draw") {
      // Draw for all
      const drawRank = (n + 1) / 2;
      for (let p = 1; p <= n; p++) ranking[p] = drawRank;
      return { winner: 0, over: true, ranking };
    }

    return null;
  }
}
