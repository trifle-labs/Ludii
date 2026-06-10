/**
 * @java game/rules/play/moves/nonDecision/operators/logical/If.java
 *
 * Moves — conditional move-generator.
 *
 * If cond.eval(context) is true, returns thenMoves.eval(context);
 * else returns elseMoves.eval(context) (or empty list if no else branch).
 *
 * Java parity (If.eval lines 119-145):
 *   if (cond.eval(context)) return list.eval(context);
 *   else if (elseList != null) return elseList.eval(context);
 *   else return new BaseMoves(super.then());
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/If.java — eval(Context)
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../base.js";
import { applyPostStateThen, type Then } from "../../effect/Then.js";

export class IfMoves implements MovesFunction {
  /** The condition. @java If.cond */
  private readonly cond: BooleanFunction;
  /** Then branch. @java If.list */
  private readonly thenMoves: MovesFunction;
  /** Optional else branch. @java If.elseList */
  private readonly elseMoves: MovesFunction | null;
  /** Optional subsequent moves. @java Operator.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/If.java — constructor
   */
  public constructor(
    cond: BooleanFunction,
    list: MovesFunction,
    elseList?: MovesFunction | null,
    then?: Then | null,
  ) {
    this.cond = cond;
    this.thenMoves = list;
    this.elseMoves = elseList ?? null;
    this.thenClause = then ?? null;
  }

  /** @java Operator.then() */
  public then(): Then | null {
    return this.thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/If.java — eval(Context)
   *
   * Java lines 119-145.
   */
  public eval(ctx: Context): Move[] {
    // @java If.java: if (then() != null) moves.moves().get(j).then().add(then().moves());
    // Java evaluates the then AFTER the chosen move applies; applyPostStateThen bakes the
    // post-state consequence actions into each generated move (same recipe as the effect
    // classes — e.g. El Perro's play-level (then (if (not (can Move …)) (set Value P2 …)))).
    if (this.cond.eval(ctx)) {
      const moves = this.thenMoves.eval(ctx);
      if (this.thenClause !== null) return moves.map(m => applyPostStateThen(this.thenClause, ctx, m));
      return moves;
    }
    if (this.elseMoves !== null) {
      const moves = this.elseMoves.eval(ctx);
      if (this.thenClause !== null) return moves.map(m => applyPostStateThen(this.thenClause, ctx, m));
      return moves;
    }
    return [];
  }
}
