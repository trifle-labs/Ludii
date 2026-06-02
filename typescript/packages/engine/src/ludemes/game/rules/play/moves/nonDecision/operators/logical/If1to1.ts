/**
 * If1to1.ts
 *
 * @java game/rules/play/moves/nonDecision/operators/logical/If.java
 *
 * Conditional move generator — returns thenMoves if condition is true,
 * elseMoves (or empty) otherwise.
 *
 * Java eval (lines 119-145):
 *   if (cond.eval(context))
 *     return list.eval(context);
 *   else if (elseList != null)
 *     return elseList.eval(context);
 *   else
 *     return new BaseMoves(super.then());
 *
 * NOTE: IfMoves.ts already exists at this directory (not a 1to1 name).
 * This If1to1.ts is the canonical faithful 1to1 port.
 * NOT registered — the inline compileMoves1to1Impl handles "if" via IfMoves.
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../base.js";
import { Operator1to1 } from "../../operator/Operator1to1.js";

/**
 * @java game/rules/play/moves/nonDecision/operators/logical/If.java
 *
 * Conditional move generator.
 *
 * Java:
 *   public final class If extends Operator
 *   final BooleanFunction cond;
 *   final Moves list;
 *   final Moves elseList;
 */
export class If1to1 extends Operator1to1 {
  /**
   * The condition. @java If.cond
   */
  private readonly cond: BooleanFunction;

  /**
   * Then-branch (if condition is true). @java If.list
   */
  private readonly list: MovesFunction;

  /**
   * Optional else-branch (if condition is false). @java If.elseList
   */
  private readonly elseList: MovesFunction | null;

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/If.java — constructor
   * @param cond     The condition.
   * @param list     The then-branch moves.
   * @param elseList The else-branch moves (optional).
   */
  public constructor(
    cond: BooleanFunction,
    list: MovesFunction,
    elseList: MovesFunction | null = null,
  ) {
    super();
    this.cond = cond;
    this.list = list;
    this.elseList = elseList;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/logical/If.java — eval(Context)
   *
   * Java lines 119-145:
   *   if (cond.eval(context)) return list.eval(context);
   *   else if (elseList != null) return elseList.eval(context);
   *   else return new BaseMoves(super.then());
   */
  public override eval(ctx: Context): Move[] {
    if (this.cond.eval(ctx)) {
      return this.list.eval(ctx);
    }
    if (this.elseList !== null) {
      return this.elseList.eval(ctx);
    }
    return [];
  }
}
