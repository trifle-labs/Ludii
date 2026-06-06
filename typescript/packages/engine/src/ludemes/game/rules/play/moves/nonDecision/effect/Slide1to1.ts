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
import { resolveRelativeDir } from "./Step1to1.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** Default go-rule: the between square must be empty. */
class IsEmptyBetween implements BooleanFunction {
  public eval(ctx: Context): boolean { return ctx.state.isEmptySite(ctx._evalBetween ?? -1); }
}
const DEFAULT_GO_RULE = new IsEmptyBetween();

export class Slide1to1 implements MovesFunction {
  /**
   * Direction constraint (e.g. "Orthogonal", "Adjacent", "Diagonal").
   * Null means "Adjacent" (all 8).
   * @java Slide.dirnChoice
   */
  private readonly dirnName: string;
  /**
   * Stop rule (to.cond): when non-null, checked first at each step.
   * null = no to-condition (Java stopRule = null): never stops via this rule.
   * @java Slide.stopRule = to.cond() (null when (to ...) omitted)
   */
  private readonly toCondition: BooleanFunction | null;
  /** (to … (apply <effect>)) side-effect (e.g. capture). @java Slide.sideEffect */
  private readonly applyGen?: MovesFunction;
  /**
   * Go-rule: condition on between sites (must be true to continue sliding).
   * @java Slide.goRule = between.condition() (default: is in empty sites)
   */
  private readonly goRule: BooleanFunction;
  /**
   * Minimum distance constraint from (between (exact N)) or similar.
   * -1 = UNDEFINED (no minimum → always satisfied). Default: -1.
   * @java Slide.min = minFn.eval(context) (default: Constants.UNDEFINED = -1)
   */
  private readonly minDist: number;
  /**
   * Maximum path length from (between (exact N)) or (between range).
   * 1000 = MAX_DISTANCE (unlimited). Default: 1000.
   * @java Slide.limit = between.range().maxFn() (default: Constants.MAX_DISTANCE)
   */
  private readonly maxDist: number;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Slide.java — constructor
   * @param dirnName Direction name (defaults to "Adjacent").
   * @param toCondition Stop rule (null = no to-condition = unlimited slide). [stopRule in Java]
   * @param applyGen Optional capture side-effect.
   * @param goRule Between go-condition (defaults to is Empty between). [goRule in Java]
   * @param minDist Minimum distance (-1 = no min). [min in Java]
   * @param maxDist Maximum distance (1000 = unlimited). [limit in Java]
   */
  public constructor(
    dirnName = "Adjacent",
    toCondition: BooleanFunction | null = null,
    applyGen?: MovesFunction,
    goRule: BooleanFunction = DEFAULT_GO_RULE,
    minDist = -1,
    maxDist = 1000,
  ) {
    this.dirnName = dirnName;
    this.toCondition = toCondition;
    this.applyGen = applyGen;
    this.goRule = goRule;
    this.minDist = minDist;
    this.maxDist = maxDist;
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
   * Faithful port of Java Slide.eval() for the non-track, non-stack case.
   *
   * Java walk logic (per step toIdx from 1 to maxPathLength):
   *   1. Check stopRule (to.cond): if true AND min<=toIdx → emit+break;
   *      if true AND min>toIdx → fall through (do NOT break early).
   *   2. Check goRule (between.condition): if false → break.
   *   3. If min<=toIdx → emit intermediate move (slide continues).
   *   4. Add site to betweenSites; continue.
   *
   * Key: stopRule true but min not yet reached = fall through (unlike old logic).
   * This enables DoubleStepForwardToEmpty: step1 is empty (stopRule=true, min not
   * reached → fall through), step2 is empty (stopRule=true, min=2 reached → emit).
   *
   * @java Slide.java eval(), lines 221-375
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
    const min = this.minDist;       // -1 = UNDEFINED (always satisfied)
    const maxLen = this.maxDist;    // 1000 = unlimited

    // Graph-board (hex/tri/etc.) trajectories for direction-aware radial lookup.
    // For non-square boards, axis indices (0,1,2,3 = EW,NS,NESW,NWSE) do NOT apply.
    // @java Slide.java — dirnChoice.convertToAbsolute(context) + Radials lookup
    const traj = ctxAny._trajectories ?? null;

    // Resolve player-relative direction (Forward/Backward/etc.) to absolute compass name(s).
    // @java Slide.java — dirnChoice.convertToAbsolute(context): RelativeDirection → AbsoluteDirection
    const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
    const relative = resolveRelativeDir(this.dirnName, mover, playerDirs);

    // Select axes by direction, using trajectories when available for graph boards.
    // For specific compass directions (N/SW/etc.) on graph boards, use trajectory lookup only —
    // falling back to the index table gives wrong axes (the hex board's axis indices don't map
    // to compass headings). For group directions (Adjacent/Orthogonal/Diagonal), use the table.
    const GROUP_DIRS_SLIDE = new Set(["adjacent", "orthogonal", "diagonal", "all"]);

    /**
     * Get axes (ray/opposite pairs) for a single resolved direction name.
     * Uses trajectories for graph boards; falls back to index table for square boards.
     */
    const axesForDir = (dirName: string): readonly { ray: readonly number[]; opposite: readonly number[] }[] => {
      if (traj) {
        const distinct = traj.distinctRadialsByName(from, dirName);
        if (distinct.length > 0) {
          return distinct.map(r => ({ ray: r.ray, opposite: r.opposites[0] ?? [from] }));
        }
        if (!GROUP_DIRS_SLIDE.has(dirName.toLowerCase())) {
          return []; // specific direction not available from this site on graph board
        }
      }
      return radialsForDirection(cellRadials, dirName);
    };

    // Build the set of axes to walk.
    // For a single absolute/compass direction, only walk the RAY (not the opposite).
    // For group directions (Adjacent/Orthogonal/etc.) walk both ray and opposite.
    // @java Slide.java — generates moves in each AbsoluteDirection from dirnChoice
    let axesToWalk: Array<{ ray: readonly number[]; opposite: readonly number[]; onlyRay?: boolean }>;
    if (relative !== null) {
      // Relative direction resolved to one or more absolute directions.
      const resolved = Array.isArray(relative) ? relative : [relative];
      axesToWalk = resolved.flatMap(r => {
        // For a single compass direction from a relative, only walk the ray (forward only).
        const ax = axesForDir(r);
        return ax.map(a => ({ ray: a.ray, opposite: a.opposite, onlyRay: true }));
      });
    } else {
      // Absolute direction name — use existing logic.
      const ax = axesForDir(this.dirnName);
      // Single specific compass directions: only walk the ray.
      const isSingle = !GROUP_DIRS_SLIDE.has(this.dirnName.toLowerCase());
      axesToWalk = ax.map(a => ({ ray: a.ray, opposite: a.opposite, onlyRay: isSingle }));
    }

    /**
     * Walk a single ray faithfully to Java Slide.eval:
     *
     * For each step toIdx (1..maxLen):
     *   • Set ctx._evalTo = to (for stopRule / toRule checks)
     *   • stopRule (to.cond): if true AND min<=toIdx → emit+break
     *                         if true AND min>toIdx → fall through (no break)
     *   • Set ctx._evalBetween = to (for goRule check)
     *   • goRule: if false → break (blocked)
     *   • if min<=toIdx → emit intermediate move (don't break; slide continues)
     *   • add to betweenSites (track)
     *
     * @java Slide.java lines 221-375
     */
    const walk = (ray: readonly number[]): void => {
      for (let toIdx = 1; toIdx < ray.length && toIdx <= maxLen; toIdx++) {
        const to = ray[toIdx];
        if (to === undefined) break;

        // --- stopRule check (to.cond) ---
        // Only checked when a (to if:...) clause was provided; null = no stopRule (Java default).
        // @java Slide.java lines 226-298: if (stopRule != null && stopRule.eval(context)) { ... }
        ctx._evalTo = to;
        if (this.toCondition !== null) {
          const stopHit = this.toCondition.eval(ctx);
          if (stopHit) {
            if (min <= toIdx) {
              // Emit move and stop (Java: emit + break inside inner if)
              moves.push(this.buildMove(ctx, from, to, mover));
              break;
            }
            // stopRule true but min not reached → fall through (no break here!)
            // @java Slide.java: the inner "if (min <= toIdx)" block exits with break;
            // when it's false we fall through past the outer if to the goRule check.
          }
        }

        // --- goRule check (between.condition) ---
        ctx._evalBetween = to;
        if (!this.goRule.eval(ctx)) {
          break; // blocked — cannot slide beyond this square
        }

        // --- emit intermediate move if min reached ---
        if (min <= toIdx) {
          // Intermediate landing (for unlimited slide like rook/bishop/queen)
          moves.push(this.buildMove(ctx, from, to, mover));
          // Do NOT break — slide continues past this square
        }
        // continue to next step
      }
    };

    for (const { ray, opposite, onlyRay } of axesToWalk) {
      walk(ray);
      if (!onlyRay) walk(opposite);
    }

    ctx._evalTo = -1;
    ctx._evalBetween = -1;
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
