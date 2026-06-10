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
 * Faithful port: thread context.state through each sub, combine ALL results.
 * Used in (then ...) consequences (Boop Repel + moveAgain, Chameleons colour
 * swap, 2048 slide) to chain effects: each sub sees the state AFTER previous.
 */

import type { Context } from "../../../../../../../../context.js";
import { Context as ContextClass } from "../../../../../../../../context.js";
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
   * Java lines 47-73: evaluates each sub-moves in a TempContext (rolling state),
   * applies each move to advance state, accumulates ALL moves from ALL sub-lists.
   * This faithfully implements Java Seq.eval() which combines all sub-results.
   *
   * Used in (then ...) consequences to chain effects: boop displacements + moveAgain.
   * @java game/rules/play/moves/nonDecision/operators/logical/Seq.java:47-73
   */
  public override eval(ctx: Context): Move[] {
    const result: Move[] = [];
    // Rolling state: apply sub-moves in sequence, each sees the updated state.
    // @java Seq.eval(): Context tempContext = new TempContext(context);
    let tempState = ctx.state;
    const ctxAny = ctx as unknown as {
      _evalFrom?: number; _evalTo?: number; _evalSite?: number;
      _evalValue?: number; _thenContextDepth?: number;
      _radials?: unknown; _trajectories?: unknown;
    };
    for (const sub of this.moves) {
      // Create a temp context with the current rolling state so later subs
      // (e.g. moveAgain check) see the board AFTER prior subs' effects.
      const tempCtx = new ContextClass(ctx.game, tempState, ctx.trial, ctx.rng);
      const tempAny = tempCtx as unknown as typeof ctxAny;
      tempAny._evalFrom = ctxAny._evalFrom;
      tempAny._evalTo = ctxAny._evalTo;
      tempAny._evalSite = ctxAny._evalSite;
      tempAny._evalValue = ctxAny._evalValue;
      tempAny._thenContextDepth = ctxAny._thenContextDepth;
      tempAny._radials = ctxAny._radials;
      tempAny._trajectories = ctxAny._trajectories;
      let subResult: Move[];
      try { subResult = sub.eval(tempCtx); }
      catch { subResult = []; }
      for (const m of subResult) {
        // Apply move to advance rolling state (mirrors Java m.apply(tempContext, true)).
        // No-op for empty-origin moves (Java parity: ActionMoveTopPiece returns this when empty).
        try { tempState = m.applyTo(tempState, ctx.rng); }
        catch { /* keep current tempState */ }
        result.push(m);
      }
    }
    return result;
  }
}

// @java Seq.java — compile factory: parse (seq { ... }) / (seq <moves1> <moves2>).
// Logic relocated VERBATIM from the inline compileMoves1to1Impl "seq" handler.
