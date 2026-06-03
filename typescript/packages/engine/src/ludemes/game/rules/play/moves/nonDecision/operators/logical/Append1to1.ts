/**
 * Append1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Append.java
 *
 * Appends a list of moves to each move in a list — combining all sub-moves
 * into one compound move (a Move composed of multiple sub-actions).
 *
 * Java eval (lines 53-77):
 *   final FastArrayList<Move> evaluated = list.eval(context).moves();
 *   for (final Move m : evaluated) m.setDecision(true);
 *   if (evaluated.size() == 0) return moves;
 *   final Move newMove = new Move(evaluated);
 *   newMove.setMover(context.state().mover());
 *   moves.moves().add(newMove);
 *   if (then() != null) newMove.then().add(then().moves());
 *   return moves;
 *
 * The TS 1:1 approximation: collect all sub-moves into a flat list,
 * because the TS Move type does not have an "action-sequence" constructor
 * that merges multiple moves into one compound move.
 *
 * Registered via registerMoves1to1("append", ...) — logic relocated VERBATIM
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
 * @java game/rules/play/moves/nonDecision/operators/logical/Append.java
 *
 * Appends sub-move-lists, returning a flat union (TS approximation of the
 * Java compound-Move construction).
 *
 * Java:
 *   public final class Append extends Operator
 *   private final Moves list;
 */
export class Append1to1 extends Operator1to1 {
  /**
   * The sub-move generator whose moves are collected. @java Append.list
   */
  private readonly list: MovesFunction;

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Append.java — constructor(NonDecision, Then)
   * @param list The sub-moves to collect.
   */
  public constructor(list: MovesFunction) {
    super();
    this.list = list;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Append.java — eval(Context)
   *
   * Java lines 53-77 (simplified):
   *   evaluated = list.eval(context).moves()
   *   if empty → return empty
   *   newMove = new Move(evaluated)   // compound
   *   newMove.setMover(mover)
   *   moves.add(newMove)
   *
   * TS approximation: return the flat sub-moves list.
   * Full compound-move merging requires Move constructor features not yet
   * in the TS port (new Move(FastArrayList<Move>)); this is the closest
   * faithful implementation without that constructor.
   */
  public override eval(ctx: Context): Move[] {
    // @java Append: final FastArrayList<Move> evaluated = list.eval(context).moves();
    return this.list.eval(ctx);
  }
}

// @java Append.java — compile factory: parse (append { ... }) / (append <moves1> <moves2>).
// Logic relocated VERBATIM from the inline compileMoves1to1Impl "append" handler.
registerMoves1to1("append", (node: LudNode, env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const subMoves = flattenMovesList(positional, env.equipment as Parameters<typeof flattenMovesList>[1]);
  return {
    eval(ctx: Context): Move[] {
      const all: Move[] = [];
      for (const sub of subMoves) {
        for (const m of sub.eval(ctx)) all.push(m);
      }
      return all;
    }
  };
});
