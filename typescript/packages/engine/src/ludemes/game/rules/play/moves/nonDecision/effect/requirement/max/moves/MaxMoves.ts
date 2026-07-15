// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java

/**
 * Filters a list of legal moves to keep only those allowing the maximum
 * number of sub-moves in a turn (e.g. International Draughts).
 *
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java
 *
 * Java parity (MaxMoves.eval):
 *   1. Evaluate each candidate move, apply it to a TempContext.
 *   2. Recursively count the total sub-moves reachable (getReplayCount).
 *   3. Keep only moves with the maximum replay-count.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../../../base.js";

/**
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java
 *
 * Java parity:
 *   public final class MaxMoves extends Effect
 *   eval(Context): filter to moves with maximum reachable sub-move depth.
 */
export class MaxMoves implements MovesFunction {
  /** The moves to maximise. @java MaxMoves.moves */
  private readonly moves: MovesFunction;

  /**
   * If true, sum piece values of captures instead of counting sub-moves.
   * @java MaxMoves.withValueFn
   */
  private readonly withValueFn: BooleanFunction;

  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java MaxMoves(BooleanFunction withValue, Moves moves, Then then)
   *
   * @param withValue   If true, maximise captured-piece value sums.
   * @param moves       Moves to filter.
   * @param thenMoves   Optional subsequent moves applied after this.
   */
  public constructor(
    withValue: BooleanFunction | null | undefined,
    moves: MovesFunction,
    thenMoves?: MovesFunction | null,
  ) {
    this.moves = moves;
    // Raw-literal rule: withValue:True reaches us as a raw boolean.
    this.withValueFn = typeof (withValue as unknown) === "boolean"
      ? { eval: () => withValue as unknown as boolean }
      : withValue ?? { eval: () => false };
    this.thenMoves = thenMoves ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.java — eval(Context)
   *
   * Java parity (MaxMoves.eval lines 67-128):
   *   1. Evaluate all candidates.
   *   2. Apply each to a TempContext; call getReplayCount recursively.
   *   3. Keep only those with the maximum count.
   */
  public eval(ctx: Context): Move[] {
    const returnMoves: Move[] = [];
    const movesToEval = this.moves.eval(ctx);
    if (process.env.TRACE_MAXMOVES) console.error("[MaxMoves] in:", movesToEval.map(m => `${m.from()}>${m.to()}`).join(" ") || "(none)");
    const withValue = this.withValueFn.eval(ctx);
    const replayCount: number[] = new Array(movesToEval.length).fill(0);
    const evalledMoves: Move[] = [];

    for (let i = 0; i < movesToEval.length; i++) {
      const m = movesToEval[i]!;
      // @java MaxMoves.java:84-85 — TempContext + game.apply: the FULL apply
      // (consequences, prev stamp, mover advance) so getReplayCount's
      // prev==mover moveAgain check sees the post-move turn state.
      const newCtx = ctx.game.apply(ctx, m) as Context;
      evalledMoves.push(m);

      if (!withValue) {
        replayCount[i] = this._getReplayCount(newCtx, 1, withValue);
      } else {
        // @java MaxMoves.java:91-104 — the OUTER eval sums the PER-LEVEL
        // value cs.value(site, LEVEL, type); NonApplied removes carry
        // levelTo=0 (oracle javap + action dump).
        let numCaptureWithValue = 0;
        for (const action of m.actions) {
          if (action.actionType() === "Remove") {
            const lvl = (action as { levelTo?: () => number }).levelTo?.() ?? 0;
            numCaptureWithValue += ctx.state.valueAtLevel(action.to(), lvl >= 0 ? lvl : 0);
          }
        }
        replayCount[i] = this._getReplayCount(newCtx, numCaptureWithValue, withValue);
      }
    }

    // Find the maximum replay count.
    let max = 0;
    for (const c of replayCount) {
      if (c > max) max = c;
    }

    // Keep only moves tied at the maximum.
    for (let i = 0; i < evalledMoves.length; i++) {
      if (replayCount[i] === max) {
        returnMoves.push(evalledMoves[i]!);
      }
    }

    if (process.env.TRACE_MAXMOVES) console.error("[MaxMoves] out:", returnMoves.map(m => `${m.from()}>${m.to()}`).join(" ") || "(none)", "counts:", JSON.stringify(replayCount));
    return returnMoves;
  }

  /**
   * Recursively count the maximum replay depth from a given context.
   *
   * @java MaxMoves.getReplayCount(Context contextCopy, int count, boolean withValue)
   *
   * Java parity (getReplayCount lines 138-186):
   *   - If prev != mover or trial is over: return count.
   *   - Otherwise: generate legal moves, recurse on each, return the max.
   */
  private _getReplayCount(ctx: Context, count: number, withValue: boolean): number {
    // Java: if prev != mover or trial over, stop recursing.
    const state = ctx.state as unknown as { mover: number; prev: number };
    if (process.env.TRACE_REPLAYCOUNT) console.error(`[grc] count=${count} prev=${state.prev} mover=${state.mover}${state.prev !== state.mover ? " STOP" : ""}`);
    if (state.prev !== state.mover) return count;
    if (ctx.trial.over) return count;

    // Java: contextCopy.game().moves(contextCopy)
    // @java MaxMoves.java:143 — contextCopy.game().moves(contextCopy); no
    // empty-list early return: Java falls through to max-of-children (0).
    // A synthetic forced-pass IS a legal move in Java too (it recurses one
    // level deeper through it, same as any other move) — do not special-case
    // it away here, doing so undercounts replay depth for games whose only
    // legal continuation at a given depth is a pass (e.g. Buffa de Baldrac).
    const legalMoves = ctx.game.moves(ctx) as readonly Move[];

    const replayCounts: number[] = new Array(legalMoves.length).fill(0);

    for (let i = 0; i < legalMoves.length; i++) {
      const nm = legalMoves[i]!;
      // @java MaxMoves.java:148-149 — TempContext + game.apply (see above).
      const newCtx = ctx.game.apply(ctx, nm) as Context;

      if (!withValue) {
        replayCounts[i] = this._getReplayCount(newCtx, count + 1, withValue);
      } else {
        // @java getReplayCount (RUNNING BINARY, javap-verified) — the
        // RECURSION reads the TWO-ARG cs.value(site, type) = TOP-of-stack
        // value; a stacked victim whose top was pushed valueless scores 0
        // here. This asymmetry vs the outer per-level read is what ranks
        // Fenix's 47>65 chain (6) above 47>29 (4) — replica-confirmed.
        let numCaptureWithValue = 0;
        for (const action of nm.actions) {
          if (action.actionType() === "Remove") {
            numCaptureWithValue += ctx.state.valueTop(action.to());
          }
        }
        replayCounts[i] = this._getReplayCount(newCtx, count + numCaptureWithValue, withValue);
        if (process.env.TRACE_REPLAYCOUNT) console.error(`[grc]  nm=${nm.from()}>${nm.to()} val=${numCaptureWithValue} -> ${replayCounts[i]}`);
      }
    }

    let maxReplay = 0;
    for (const n of replayCounts) {
      if (n > maxReplay) maxReplay = n;
    }
    return maxReplay;
  }

  /** @java MaxMoves.isStatic() → delegates */
  public isStatic(): boolean {
    return (this.moves as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java MaxMoves.toEnglish() */
  public toEnglish(): string {
    return "perform any of the following moves which has the most sub-moves";
  }
}
