// @java Core/src/game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxCaptures.java

/**
 * Filters a list of moves to keep only those doing the maximum possible
 * number of captures (or maximum value of captured pieces when withValue=true).
 *
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxCaptures.java
 *
 * Java parity (MaxCaptures.eval):
 *   1. Evaluate all candidate moves.
 *   2. For each move, count ActionType.Remove actions (or sum their values
 *      if withValue=true).
 *   3. Keep only moves tied at the maximum count.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../../../base.js";

/**
 * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxCaptures.java
 *
 * Java parity:
 *   public final class MaxCaptures extends Effect
 *   eval(Context): filter to moves with maximum Remove-action count (or value).
 */
export class MaxCaptures implements MovesFunction {
  /** The moves to maximise. @java MaxCaptures.moves */
  private readonly moves: MovesFunction;

  /**
   * If true, sum the piece values instead of simply counting captures.
   * @java MaxCaptures.withValueFn
   */
  private readonly withValueFn: BooleanFunction;

  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java MaxCaptures(BooleanFunction withValue, Moves moves, Then then)
   *
   * @param moves       Moves to filter.
   * @param withValueFn If true, maximise the sum of captured-piece values.
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
   * @java game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxCaptures.java — eval(Context)
   *
   * Java parity (MaxCaptures.eval lines 65-131):
   *   1. Evaluate candidates.
   *   2. Count Remove-type actions per move (or sum their .value() if withValue).
   *   3. Find the maximum.
   *   4. Keep only moves with that maximum.
   */
  public eval(ctx: Context): Move[] {
    const returnMoves: Move[] = [];
    const movesToEval = this.moves.eval(ctx);
    const withValue = this.withValueFn.eval(ctx);

    // Count captures (or summed values) for each move.
    const numCaptureByMove: number[] = [];
    for (const m of movesToEval) {
      let numCapture = 0;
      for (const action of m.actions) {
        if (action.actionType() === "Remove") {
          if (!withValue) {
            numCapture++;
          } else {
            // Java: cs.value(site, type) — use action.value() as the piece value.
            numCapture += action.value();
          }
        }
      }
      numCaptureByMove.push(numCapture);
    }

    // Find the maximum.
    let maxCapture = 0;
    for (const n of numCaptureByMove) {
      if (n > maxCapture) maxCapture = n;
    }

    // Keep only moves with the maximum capture count.
    for (let i = 0; i < numCaptureByMove.length; i++) {
      if (numCaptureByMove[i] === maxCapture) {
        returnMoves.push(movesToEval[i]!);
      }
    }

    return returnMoves;
  }

  /** @java MaxCaptures.isStatic() → delegates */
  public isStatic(): boolean {
    return (this.moves as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java MaxCaptures.toEnglish() */
  public toEnglish(): string {
    return "perform any of the following moves which captures the most pieces";
  }
}
