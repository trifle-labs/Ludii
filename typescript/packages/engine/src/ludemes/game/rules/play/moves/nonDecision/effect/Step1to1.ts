/**
 * @java game/rules/play/moves/nonDecision/effect/Step.java (simplified)
 *
 * Steps a piece one step in the given direction(s) to a cell matching the
 * `to` condition. The default condition is (is Empty (to)).
 *
 * Java parity (simplified): step from context._evalFrom (set by ForEachPiece)
 * one step in each direction, applying the toCondition.
 *
 * @java game/rules/play/moves/nonDecision/effect/Step.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** Simple "is Empty" condition for default StepToEmpty behaviour. */
class IsEmptyTo implements BooleanFunction {
  public eval(ctx: Context): boolean {
    return ctx.state.isEmptySite(ctx._evalTo ?? -1);
  }
}

const DEFAULT_TO_COND = new IsEmptyTo();

export class Step1to1 implements MovesFunction {
  /**
   * Direction name (e.g. "Orthogonal", "Adjacent", "Diagonal").
   * @java Step.dirnChoice
   */
  private readonly dirnName: string;

  /**
   * Condition on the target cell. Default: is Empty.
   * @java Step.rule (toRule condition)
   */
  private readonly toCondition: BooleanFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — constructor
   * @param dirnName  Direction constraint (defaults to "Adjacent")
   * @param toCond    Condition on the to-site (defaults to is Empty)
   */
  public constructor(
    dirnName = "Adjacent",
    toCondition: BooleanFunction = DEFAULT_TO_COND,
  ) {
    this.dirnName = dirnName;
    this.toCondition = toCondition;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — eval(Context)
   *
   * from = context._evalFrom (set by ForEachPiece1to1)
   * For each adjacent site in dirnName, if toCondition holds, emit a move.
   */
  public eval(ctx: Context): LudiiMove[] {
    const from = ctx._evalFrom;
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const state = ctx.state;
    const mover = state.mover;
    const moves: LudiiMove[] = [];
    const seen = new Set<number>();

    const axes = radialsForDirection(cellRadials, this.dirnName);

    for (const { ray, opposite } of axes) {
      // Step 1 in "ray" direction (index 1 from pivot = index 0)
      const toRay = ray[1];
      if (toRay !== undefined && !seen.has(toRay)) {
        seen.add(toRay);
        ctx._evalTo = toRay;
        if (this.toCondition.eval(ctx)) {
          moves.push(makeMoveAction(from, toRay, mover));
        }
      }
      // Step 1 in "opposite" direction
      const toOpp = opposite[1];
      if (toOpp !== undefined && !seen.has(toOpp)) {
        seen.add(toOpp);
        ctx._evalTo = toOpp;
        if (this.toCondition.eval(ctx)) {
          moves.push(makeMoveAction(from, toOpp, mover));
        }
      }
    }

    // Restore _evalTo
    ctx._evalTo = -1;

    return moves;
  }
}

function makeMoveAction(from: number, to: number, mover: number): LudiiMove {
  const action = new ActionMove({ from, to });
  return new LudiiMove({
    id: `step:${mover}:${from}:${to}`,
    label: `Step(${from}→${to})`,
    siteIndices: [from, to],
    mover,
    placedOwner: mover,
    actions: [action],
  });
}
