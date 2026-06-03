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
 * Registered via registerMoves1to1("seq", ...) — logic relocated VERBATIM
 * from the inline compileMoves1to1Impl handler (shadows the inline branch).
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Operator1to1 } from "../../operator/Operator1to1.js";
import { registerMoves1to1, type Compile1to1Env } from "../../../../../../../registry1to1.js";
import { parseArgs1to1, flattenMovesList } from "../../../../../../../../compiler1to1.js";
import { type LudList, type LudNode } from "@ludii/typescript-language";

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

// @java Seq.java — compile factory: parse (seq { ... }) / (seq <moves1> <moves2>).
// Logic relocated VERBATIM from the inline compileMoves1to1Impl "seq" handler.
registerMoves1to1("seq", (node: LudNode, env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const subMoves = flattenMovesList(positional, env.equipment as Parameters<typeof flattenMovesList>[1]);
  return new Seq1to1(subMoves);
});
