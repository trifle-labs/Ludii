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
  private readonly subconditions: readonly If[] | null;
  private readonly defaultResult: Result | null;

  /**
   * @java game/rules/end/If.java — constructor
   *
   * @param test   Condition to end the game.
   * @param sub    Sub-condition to check.
   * @param subs   Sub-conditions to check.
   * @param result Default result to return if no sub-condition is satisfied.
   */
  public constructor(
    test: BooleanFunction,
    sub: If | null = null,
    subs: readonly If[] | null = null,
    result: Result | null = null,
  ) {
    let numNonNull = 0;
    if (sub !== null) numNonNull++;
    if (subs !== null) numNonNull++;

    if (numNonNull > 1) {
      throw new Error("Can't have more than one non-null Or parameter.");
    }

    this.condition = test;
    this.subconditions = subs !== null ? subs : sub !== null ? [sub] : null;
    this.defaultResult = result;
  }

  /**
   * @java game/rules/end/If.java — eval(Context context)
   * If condition.eval(context) is true, return an EndResult; else null.
   */
  public eval(ctx: Context): EndResult | null {
    if (!this.condition.eval(ctx)) return null;

    if (this.subconditions !== null) {
      for (const sub of this.subconditions) {
        const subResult = sub.eval(ctx);
        if (subResult !== null) return subResult;
      }
    }

    if (this.defaultResult === null) return null;
    const defaultAsRule = this.defaultResult as unknown as { eval?: (ctx: Context) => EndResult | null };
    if (typeof defaultAsRule.eval === "function") {
      return defaultAsRule.eval(ctx);
    }

    const mover = ctx.state.mover;
    // @java game/functions/ints/board/Id.java:122 — case Next uses state.next()
    const n = ctx.game.numPlayers;
    const who = this.defaultResult.resolveWho(mover, n, ctx);
    const resultType = this.defaultResult.result;

    // @java End.java:139 — a Team* result role ranks the WHOLE team, not a
    // single player. (result TeamMover Win) gives every team member rank 1 and
    // the others the next rank; the reported winner is the lowest member pid
    // (Java sets the trial status to the lowest winning pid). Nebakuthana's
    // team win was previously credited to the mover alone (wrong winner).
    const whoRole = String((this.defaultResult as unknown as { who?: unknown }).who ?? "");
    if (whoRole.includes("Team") && resultType === "Win") {
      const baseP = whoRole === "TeamNext" ? (mover % n) + 1 : mover;
      const teamOf = (ctx.game as unknown as { teamOf?: readonly number[] }).teamOf ?? [];
      const team = teamOf[baseP] ?? 0;
      const members: number[] = [];
      if (team > 0) {
        for (let p = 1; p <= n; p++) if (teamOf[p] === team) members.push(p);
      }
      if (members.length === 0) members.push(baseP);
      const ranking = new Array<number>(n + 1).fill(0);
      for (let p = 1; p <= n; p++) ranking[p] = members.includes(p) ? 1.0 : members.length + 1;
      return { winner: members[0]!, over: true, ranking };
    }

    // Build rankings array: [0, rank_p1, rank_p2, ...]
    // Java parity: winner gets 1.0, loser gets numPlayers+1 rank (worst),
    // draw gives all players (numPlayers+1)/2.
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
      // @java End.java:222-243 — (result All Loss): EVERY yet-unranked player
      // gets rank numPlayers (shared last), all inactive, trial status 0 (no
      // winner). The single-loser fallthrough below wrongly crowned the other
      // player (Safe Passage's cooperative "All Loss" reported tsWinner=1
      // instead of the recorded winner=0 / rankings 2.0,2.0).
      if (whoRole === "All") {
        if (n > 1) {
          for (let p = 1; p <= n; p++) ranking[p] = n;
        } else {
          ranking[1] = 0.0;
        }
        return { winner: 0, over: true, ranking };
      }
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
