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
import type { TrackType } from "../../types/board/TrackType.js";
import type { RoleTypeFull } from "../../types/play/RoleType.js";
import type { Result } from "./Result.js";
import { EndRule } from "./EndRule.js";

/** Role type string used in forEach iteration. */
export type ForEachRoleType = RoleTypeFull;

/**
 * @java game/rules/end/ForEach.java — extends BaseEndRule
 */
export class ForEach extends EndRule implements EndRuleFunction {
  /** Role to iterate. @java ForEach.type */
  private readonly roleType: string;
  /** Track type to iterate. @java ForEach.trackType */
  private readonly trackType: TrackType | null;
  /** Condition evaluated per player. @java ForEach.cond */
  private readonly cond: BooleanFunction;
  /** Result to apply when condition fires. @java ForEach (via BaseEndRule.result) */
  private readonly endResult: Result;

  /**
   * @java game/rules/end/ForEach.java — constructor(RoleType, TrackType, BooleanFunction, Result)
   *
   * Java signature:
   *   ForEach(@Opt @Or RoleType type, @Opt @Or TrackType trackType, @Name BooleanFunction If, Result result)
   *
   * @param type        Role type to iterate.
   * @param trackType   Track type to iterate, mutually exclusive with roleType.
   * @param If          Condition evaluated for each player.
   * @param result      Result to apply when cond fires.
   */
  public constructor(
    type: ForEachRoleType | null,
    trackType: TrackType | null,
    If: BooleanFunction,
    result: Result,
  ) {
    super(result);
    if (type != null && trackType != null) {
      throw new Error("ForEach(): one of RoleType or trackType has to be null.");
    }

    this.roleType = (type ?? "Shared").toLowerCase();
    this.trackType = trackType;
    this.cond = If;
    this.endResult = result;
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
    if (this.trackType != null) return null;

    const n = ctx.numPlayers();
    const mover = ctx.state.mover;
    const origPlayer = ctx._evalPlayer;

    // @java a per-player (result Player Loss) is NOT terminal on the first loss in an
    // n>2 game — Java ranks the loser and continues, ending only when <=1 active player
    // remains. Count the players currently satisfying the condition; with more than one
    // survivor the rule is non-decisive (return null so a later (result … Win) rule can
    // fire — Ishighan's HyenaPhaseDone win was masked by an early Loss-as-draw). With
    // <=1 survivor the game ends and the survivor wins (draw if none). (no Pieces Player)
    // -style conditions re-evaluate every turn, so the current count IS the terminal state.
    if (this.endResult.result === "Loss" && n > 2) {
      const losers: number[] = [];
      for (let pid = 1; pid <= n; pid++) {
        if (this.roleType === "nonmover" && pid === mover) continue;
        if (this.roleType === "mover" && pid !== mover) continue;
        ctx._evalPlayer = pid;
        if (this.cond.eval(ctx)) losers.push(pid);
      }
      ctx._evalPlayer = origPlayer;
      if (losers.length === 0) return null;
      if (n - losers.length > 1) {
        // @java End.java:249 — the game CONTINUES (>1 survivor) but each loser
        // must be marked inactive so the mover rotation skips them
        // (Game.java:3210-3215; Quendo/Mwendo/Thaayam advanced INTO the
        // eliminated player and diverged). Report only NEWLY eliminated
        // players; conditions like (no Pieces Player) stay true every turn
        // for already-inactive players.
        const stActive = (ctx.state as unknown as { activePlayer?: (p: number) => boolean });
        const fresh = losers.filter((l) => stActive.activePlayer?.(l) ?? true);
        return fresh.length > 0 ? { winner: 0, over: false, eliminated: fresh } : null;
      }
      const ranking = new Array<number>(n + 1).fill(0);
      for (const l of losers) ranking[l] = n;
      let winner = 0;
      for (let p = 1; p <= n; p++) {
        if (!losers.includes(p)) { ranking[p] = 1.0; winner = winner === 0 ? p : 0; }
      }
      return { winner, over: true, ranking };
    }

    for (let pid = 1; pid <= n; pid++) {
      // @java ForEach.eval:100-105 — skip mover when NonMover
      if (this.roleType === "nonmover" && pid === mover) continue;
      // @java ForEach.eval — skip non-mover when Mover
      if (this.roleType === "mover" && pid !== mover) continue;

      // @java ForEach.eval:107-109 — skip inactive players ("Do nothing if
      // the player is not active."). Without this, an already-eliminated
      // player (e.g. lost earlier via a (result Player Loss) rule) is still
      // treated as eligible to satisfy a later globally-true
      // (result Player Win) condition, so the loop picks the eliminated
      // player (lowest pid) instead of the lowest ACTIVE pid as winner.
      const stActive = (ctx.state as unknown as { activePlayer?: (p: number) => boolean });
      if (!(stActive.activePlayer?.(pid) ?? true)) continue;

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
