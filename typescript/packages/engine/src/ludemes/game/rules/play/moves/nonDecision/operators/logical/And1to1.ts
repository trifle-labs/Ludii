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
 * NOTE: NOT registered — the inline compileMoves1to1Impl handles "and".
 * This is a faithful coverage class only.
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import { Operator1to1 } from "../../operator/Operator1to1.js";

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
  public constructor(list: readonly MovesFunction[]) {
    super();
    this.list = list;
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
