/**
 * Seq1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java
 *
 * Applies a sequence of moves one by one. Each move uses the new (temporary)
 * state/context created by the previous move applied in the sequence.
 *
 * Java eval (lines 47-73):
 *   Context tempContext = new TempContext(context);
 *   for (int i = 0; i < moves.length; i++) {
 *     final Moves movesToApply = moves[i];
 *     for (final Move m : movesToApply.eval(tempContext).moves()) {
 *       final Move appliedMove = (Move) m.apply(tempContext, true);
 *       result.moves().add(appliedMove);
 *     }
 *   }
 *
 * TS approximation: since the 1:1 path does not support TempContext (state
 * mutation would affect the live state), this implementation returns the
 * moves from the first non-empty sub-list (matching the inline seq handler
 * in compileMoves1to1Impl). Full sequential application deferred.
 *
 * NOTE: NOT registered — the inline compileMoves1to1Impl handles "seq".
 * This is a faithful coverage class for structural completeness.
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Operator1to1 } from "../../operator/Operator1to1.js";

/**
 * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java
 *
 * Sequential application of sub-move-lists.
 *
 * Java:
 *   public final class Seq extends Effect
 *   final Moves[] moves;
 */
export class Seq1to1 extends Operator1to1 {
  /**
   * The sequence of move generators. @java Seq.moves
   */
  private readonly moves: readonly MovesFunction[];

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java — constructor(Moves[])
   * @param moves The sub-moves to apply in sequence.
   */
  public constructor(moves: readonly MovesFunction[]) {
    super();
    this.moves = moves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java — eval(Context)
   *
   * Java lines 47-73: applies each sub-list to a TempContext.
   * TS approximation: returns the first non-empty sub-list (TempContext not available).
   * Full sequential application with state mutation deferred.
   */
  public override eval(ctx: Context): Move[] {
    // @java Seq: Context tempContext = new TempContext(context); then apply each.
    // TS: TempContext (state-forking) not available; return first non-empty sub-list.
    for (const sub of this.moves) {
      const ms = sub.eval(ctx);
      if (ms.length > 0) return ms;
    }
    return [];
  }
}
