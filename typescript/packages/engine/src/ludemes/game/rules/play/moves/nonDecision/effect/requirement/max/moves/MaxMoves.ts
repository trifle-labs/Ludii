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

import { Context } from "../../../../../../../../../../context.js";
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
   * @param moves       Moves to filter.
   * @param withValueFn If true, maximise captured-piece value sums.
   * @param thenMoves   Optional subsequent moves applied after this.
   */
  public constructor(
    moves: MovesFunction,
    withValueFn: BooleanFunction = { eval: () => false },
    thenMoves: MovesFunction | null = null,
  ) {
    this.moves = moves;
    this.withValueFn = withValueFn;
    this.thenMoves = thenMoves;
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
    const withValue = this.withValueFn.eval(ctx);
    const replayCount: number[] = new Array(movesToEval.length).fill(0);
    const evalledMoves: Move[] = [];

    for (let i = 0; i < movesToEval.length; i++) {
      const m = movesToEval[i]!;
      const newState = m.applyTo(ctx.state);
      const newCtx = new Context(ctx.game, newState, ctx.trial, ctx.rng);
      evalledMoves.push(m);

      if (!withValue) {
        replayCount[i] = this._getReplayCount(newCtx, 1, withValue);
      } else {
        // Java parity: numCaptureWithValue computed from move actions.
        let numCaptureWithValue = 0;
        for (const action of m.actions) {
          if (action.actionType() === "Remove") {
            numCaptureWithValue += action.value();
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
    if (state.prev !== state.mover) return count;
    if (ctx.trial.over) return count;

    // Java: contextCopy.game().moves(contextCopy)
    const legalMoves = this.moves.eval(ctx);
    if (legalMoves.length === 0) return count;

    const replayCounts: number[] = new Array(legalMoves.length).fill(0);

    for (let i = 0; i < legalMoves.length; i++) {
      const nm = legalMoves[i]!;
      const newState = nm.applyTo(ctx.state);
      const newCtx = new Context(ctx.game, newState, ctx.trial, ctx.rng);

      if (!withValue) {
        replayCounts[i] = this._getReplayCount(newCtx, count + 1, withValue);
      } else {
        let numCaptureWithValue = 0;
        for (const action of nm.actions) {
          if (action.actionType() === "Remove") {
            numCaptureWithValue += action.value();
          }
        }
        replayCounts[i] = this._getReplayCount(newCtx, count + numCaptureWithValue, withValue);
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
