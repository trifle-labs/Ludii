/**
 * And1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/And.java
 *
 * Moves all the moves in the list (union of sub-move lists).
 *
 * Java eval (lines 146-160):
 *   final Moves moves = new BaseMoves(super.then());
 *   for (int i = 0; i < list.length; ++i)
 *     moves.moves().addAll(list[i].eval(context).moves());
 *   if (then() != null)
 *     for (int j = 0; j < moves.moves().size(); j++)
 *       moves.moves().get(j).then().add(then().moves());
 *   return moves;
 *
 * Registered via registerMoves1to1("and", ...) — logic relocated VERBATIM
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
 * @java game/rules/play/moves/nonDecision/operators/logical/And.java
 *
 * Union of sub-move-lists. eval() concatenates all sub-lists in order.
 *
 * Java:
 *   public final class And extends Operator
 *   final Moves[] list;
 */
export class And1to1 extends Operator1to1 {
  /**
   * Sub-move-generators. @java And.list
   */
  private readonly list: readonly MovesFunction[];

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/And.java — constructor(Moves[], Then)
   * @param list Array of sub-move-generators whose moves are concatenated.
   */
  public constructor(
    list: readonly MovesFunction[] | MovesFunction,
    movesB: MovesFunction | null = null,
  ) {
    super();
    this.list = Array.isArray(list) ? list : (movesB === null ? [list] : [list, movesB]);
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/And.java — eval(Context)
   *
   * Java lines 146-160:
   *   for (int i = 0; i < list.length; ++i)
   *     moves.moves().addAll(list[i].eval(context).moves());
   */
  public override eval(ctx: Context): Move[] {
    const result: Move[] = [];
    for (const sub of this.list) {
      const subMoves = sub.eval(ctx);
      for (const m of subMoves) result.push(m);
    }
    return result;
  }
}

// @java And.java — compile factory: parse (and { ... }) / (and <moves1> <moves2>).
// Logic relocated VERBATIM from the inline compileMoves1to1Impl "and" handler.
registerMoves1to1("and", (node: LudNode, env: Compile1to1Env): MovesFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const subMoves = flattenMovesList(positional, env.equipment as Parameters<typeof flattenMovesList>[1]);
  return new And1to1(subMoves);
});
