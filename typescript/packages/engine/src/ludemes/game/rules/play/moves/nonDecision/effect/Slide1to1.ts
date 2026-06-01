/**
 * @java game/rules/play/moves/nonDecision/effect/Slide.java (simplified)
 *
 * Slides a piece from context._evalFrom (the current piece position set by
 * ForEachPiece) along each radial direction until blocked by a non-empty cell
 * or the board edge.  Each reachable empty cell is a valid landing site.
 *
 * Java parity (simplified): the default `(move Slide)` form with no
 * direction constraint (defaults to Adjacent = all 8 directions) and the
 * default go-rule (empty cells only: goRule = (is Empty (between))).
 *
 * Faithful to Java's Slide.eval lines 213–350 for the non-stacking,
 * non-track, non-limited, non-custom-stop case.
 *
 * @java game/rules/play/moves/nonDecision/effect/Slide.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

export class Slide1to1 implements MovesFunction {
  /**
   * Direction constraint (e.g. "Orthogonal", "Adjacent", "Diagonal").
   * Null means "Adjacent" (all 8).
   * @java Slide.dirnChoice
   */
  private readonly dirnName: string;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Slide.java — constructor
   * @param dirnName Direction name (defaults to "Adjacent").
   */
  public constructor(dirnName = "Adjacent") {
    this.dirnName = dirnName;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Slide.java — eval(Context)
   *
   * from = context._evalFrom (set by ForEachPiece1to1 before calling)
   * Walk each radial: skip pivot (step 0), add each step until blocked.
   * Blocking condition: cell is not empty (goRule = is Empty).
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
    const cells = state.cells;
    const mover = state.mover;
    const moves: LudiiMove[] = [];

    // Select axes by direction.
    const axes = radialsForDirection(cellRadials, this.dirnName);

    for (const { ray, opposite } of axes) {
      // Walk in the "ray" direction (from pivot outward)
      for (let i = 1; i < ray.length; i++) {
        const to = ray[i];
        if (to === undefined) break;
        if (!state.isEmptySite(to)) break; // Blocked
        // Empty cell: valid target
        moves.push(makeMoveAction(from, to, mover));
      }
      // Walk in the "opposite" direction
      for (let i = 1; i < opposite.length; i++) {
        const to = opposite[i];
        if (to === undefined) break;
        if (!state.isEmptySite(to)) break; // Blocked
        moves.push(makeMoveAction(from, to, mover));
      }
    }

    return moves;
  }
}

function makeMoveAction(from: number, to: number, mover: number): LudiiMove {
  const action = new ActionMove({ from, to });
  return new LudiiMove({
    id: `slide:${mover}:${from}:${to}`,
    label: `Slide(${from}→${to})`,
    siteIndices: [from, to],
    mover,
    placedOwner: mover,
    actions: [action],
  });
}
