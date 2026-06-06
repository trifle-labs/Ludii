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
import type { BooleanFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import type { Action } from "../../../../../../../action/index.js";
import type { Trajectories } from "../../../../../../../eval/graph/trajectories.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** Default landing rule: the target square must be empty. */
class IsEmptyTo implements BooleanFunction {
  public eval(ctx: Context): boolean { return ctx.state.isEmptySite(ctx._evalTo ?? -1); }
}
const DEFAULT_TO_COND = new IsEmptyTo();

export class Slide1to1 implements MovesFunction {
  /**
   * Direction constraint (e.g. "Orthogonal", "Adjacent", "Diagonal").
   * Null means "Adjacent" (all 8).
   * @java Slide.dirnChoice
   */
  private readonly dirnName: string;
  /** Landing rule on the target square. Default: is Empty. @java Slide.toRule */
  private readonly toCondition: BooleanFunction;
  /** (to … (apply <effect>)) side-effect (e.g. capture). @java Slide.sideEffect */
  private readonly applyGen?: MovesFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Slide.java — constructor
   * @param dirnName Direction name (defaults to "Adjacent").
   * @param toCondition Landing rule (defaults to is Empty).
   * @param applyGen Optional capture side-effect.
   */
  public constructor(
    dirnName = "Adjacent",
    toCondition: BooleanFunction = DEFAULT_TO_COND,
    applyGen?: MovesFunction,
  ) {
    this.dirnName = dirnName;
    this.toCondition = toCondition;
    this.applyGen = applyGen;
  }

  /** Build a slide move from→to, chaining any `(apply ...)` capture actions. */
  private buildMove(ctx: Context, from: number, to: number, mover: number): LudiiMove {
    if (!this.applyGen) return makeMoveAction(from, to, mover);
    ctx._evalFrom = from;
    ctx._evalTo = to;
    let applyActions: Action[] = [];
    try { applyActions = this.applyGen.eval(ctx).flatMap(m => [...m.actions]); }
    catch { applyActions = []; }
    if (applyActions.length === 0) return makeMoveAction(from, to, mover);
    // @java Slide.java: action.setDecision(true) marks ActionMove as decision action
    // so Move.from()/to() reads from ActionMove, not the prepended capture ActionRemove.
    const moveAction = new ActionMove({ from, to });
    moveAction.setDecision(true);
    return new LudiiMove({
      id: `slide:${mover}:${from}:${to}`, label: `Slide(${from}→${to})`,
      siteIndices: [from, to], mover, placedOwner: mover,
      actions: [...applyActions, moveAction],
    });
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

    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[]; _trajectories?: Trajectories | null };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const state = ctx.state;
    const mover = state.mover;
    const moves: LudiiMove[] = [];

    // Graph-board (hex/tri/etc.) trajectories for direction-aware radial lookup.
    // For non-square boards, axis indices (0,1,2,3 = EW,NS,NESW,NWSE) do NOT apply.
    // @java Slide.java — dirnChoice.convertToAbsolute(context) + Radials lookup
    const traj = ctxAny._trajectories ?? null;

    // Select axes by direction, using trajectories when available for graph boards.
    // For specific compass directions (N/SW/etc.) on graph boards, use trajectory lookup only —
    // falling back to the index table gives wrong axes (the hex board's axis indices don't map
    // to compass headings). For group directions (Adjacent/Orthogonal/Diagonal), use the table.
    const GROUP_DIRS_SLIDE = new Set(["adjacent", "orthogonal", "diagonal", "all"]);
    let axes: readonly { ray: readonly number[]; opposite: readonly number[] }[];
    if (traj) {
      const distinct = traj.distinctRadialsByName(from, this.dirnName);
      if (distinct.length > 0) {
        axes = distinct.map(r => ({ ray: r.ray, opposite: r.opposites[0] ?? [from] }));
      } else if (!GROUP_DIRS_SLIDE.has(this.dirnName.toLowerCase())) {
        axes = []; // specific direction not available from this site on graph board
      } else {
        axes = radialsForDirection(cellRadials, this.dirnName);
      }
    } else {
      axes = radialsForDirection(cellRadials, this.dirnName);
    }

    // Walk a single ray: while intermediate squares are empty (go-rule), test the
    // landing rule at each square and emit a move if it passes; the FIRST occupied
    // square is the last candidate (an enemy capture) — then stop (can't pass it).
    // @java Slide.eval — goRule on `between`, toRule on `to`, sideEffect on landing.
    const walk = (ray: readonly number[]): void => {
      for (let i = 1; i < ray.length; i++) {
        const to = ray[i];
        if (to === undefined) break;
        const occupied = !state.isEmptySite(to);
        ctx._evalTo = to;
        if (this.toCondition.eval(ctx)) {
          moves.push(this.buildMove(ctx, from, to, mover));
        }
        if (occupied) break; // blocked — cannot slide beyond this square
      }
    };

    for (const { ray, opposite } of axes) {
      walk(ray);
      walk(opposite);
    }

    ctx._evalTo = -1;
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
