/**
 * Applies end condition to each player of a certain type.
 *
 * @java game/rules/end/ForEach.java
 *
 * Java: ForEach extends BaseEndRule. eval(context) iterates players (or tracks)
 * of the given RoleType, sets context.player(pid), evaluates the condition, and
 * calls End.applyResult() if the condition fires.
 *
 * In the 1:1 TS path we cannot call End.applyResult() mid-evaluation (it is
 * imperative Java state mutation). Instead, faithful to the Java iteration loop,
 * we set ctx._evalPlayer = pid, evaluate the condition, and, on the first
 * matching player, compute and return the EndResult.
 *
 * Track-based iteration (trackType) requires a track API absent from the 1:1
 * path and is deferred (returns null).
 *
 * @java game/rules/end/ForEach.java — eval(Context context)
 */

import type { Context } from "../../../../context.js";
import type { BooleanFunction, EndResult, EndRuleFunction } from "../../../base.js";
import type { Result } from "./Result.js";
import { EndRule } from "./EndRule.js";

/** Role type string used in forEach iteration. */
export type ForEachRoleType =
  | "player" | "mover" | "nonmover" | "each" | "shared" | "all"
  | string;   // P1, P2, … resolved at runtime

/**
 * @java game/rules/end/ForEach.java — extends BaseEndRule
 */
export class ForEach extends EndRule implements EndRuleFunction {
  /** Role to iterate. @java ForEach.type */
  private readonly roleType: ForEachRoleType;
  /** Condition evaluated per player. @java ForEach.cond */
  private readonly cond: BooleanFunction;
  /** Result to apply when condition fires. @java ForEach (via BaseEndRule.result) */
  private readonly endResult: Result;
  /** Number of players. */
  private readonly numPlayers: number;

  /**
   * @java game/rules/end/ForEach.java — constructor(RoleType, TrackType, BooleanFunction, Result)
   *
   * @param roleType    Role type to iterate (lowercase, e.g. "player", "nonmover").
   * @param cond        Condition evaluated for each player.
   * @param result      Result to apply when cond fires.
   * @param numPlayers  Number of players in the game.
   */
  public constructor(
    roleType: ForEachRoleType,
    cond: BooleanFunction,
    result: Result,
    numPlayers: number,
  ) {
    super(result);
    this.roleType = roleType;
    this.cond = cond;
    this.endResult = result;
    this.numPlayers = numPlayers;
  }

  /**
   * @java game/rules/end/ForEach.java — eval(Context context)
   *
   * Iterates players of the given role type. For each relevant player, sets
   * ctx._evalPlayer = pid, evaluates the condition, and on the first match
   * returns a resolved EndResult.
   *
   * Java iterates ALL players and calls End.applyResult for each match — this
   * means multiple results can fire in one turn. In the 1:1 TS path (which
   * returns a single EndResult | null), we return the FIRST matching player's
   * result (faithful to the first-match semantics used by the inline compiler).
   */
  public eval(ctx: Context): EndResult | null {
    const n = this.numPlayers;
    const mover = ctx.state.mover;
    const origPlayer = ctx._evalPlayer;

    for (let pid = 1; pid <= n; pid++) {
      // @java ForEach.eval:100-105 — skip mover when NonMover
      if (this.roleType === "nonmover" && pid === mover) continue;
      // @java ForEach.eval — skip non-mover when Mover
      if (this.roleType === "mover" && pid !== mover) continue;

      // @java ForEach.eval:107-108 — skip inactive players
      // (1:1 path has no per-player active flags — skip this check for now)

      // @java ForEach.eval:112 — context.setPlayer(pid)
      ctx._evalPlayer = pid;

      if (this.cond.eval(ctx)) {
        ctx._evalPlayer = origPlayer;

        const who = this.endResult.who;
        const resultType = this.endResult.result;

        // Resolve who → concrete player id.
        // "Player" role refers to the current iteration player (pid).
        let winner: number;
        if ((who as string) === "Player") {
          winner = pid;
        } else if (who === "All") {
          winner = 0;
        } else {
          winner = this.endResult.resolveWho(mover, n, ctx);
        }

        const ranking = new Array<number>(n + 1).fill(0);

        if (resultType === "Win") {
          if (winner === 0) {
            // All win → draw
            const drawRank = (n + 1) / 2;
            for (let p = 1; p <= n; p++) ranking[p] = drawRank;
            return { winner: 0, over: true, ranking };
          }
          ranking[winner] = 1.0;
          for (let p = 1; p <= n; p++) if (p !== winner) ranking[p] = 2.0;
          return { winner, over: true, ranking };
        }

        if (resultType === "Loss") {
          // pid loses; other player wins (2-player: the other is winner)
          ranking[pid] = n;
          for (let p = 1; p <= n; p++) if (p !== pid) ranking[p] = 1.0;
          const w = n === 2 ? (pid === 1 ? 2 : 1) : 0;
          return { winner: w, over: true, ranking };
        }

        if (resultType === "Draw") {
          const drawRank = (n + 1) / 2;
          for (let p = 1; p <= n; p++) ranking[p] = drawRank;
          return { winner: 0, over: true, ranking };
        }

        return null;
      }
    }

    ctx._evalPlayer = origPlayer;
    return null;
  }
}
