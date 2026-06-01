/**
 * @java game/rules/play/moves/nonDecision/operators/logical/Or.java
 *
 * Moves — union of sub-move-lists.
 *
 * eval(context) calls eval() on every sub-MovesFunction and concatenates the
 * resulting Move arrays into one flat list, exactly as Java's Or.eval does:
 *   for (int i = 0; i < list.length; ++i)
 *     moves.moves().addAll(list[i].eval(context).moves());
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/Or.java — eval(Context)
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";

export class OrMoves implements MovesFunction {
  /** Sub-move-generators. @java Or.list */
  private readonly list: readonly MovesFunction[];

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Or.java — constructor
   * @param list Array of sub-move-generators whose moves are unioned.
   */
  public constructor(list: readonly MovesFunction[]) {
    this.list = list;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/Or.java — eval(Context)
   *
   * Java lines 148-160:
   *   for (int i = 0; i < list.length; ++i)
   *     moves.moves().addAll(list[i].eval(context).moves());
   */
  public eval(ctx: Context): Move[] {
    const result: Move[] = [];
    for (const sub of this.list) {
      const subMoves = sub.eval(ctx);
      for (const m of subMoves) result.push(m);
    }
    return result;
  }
}
