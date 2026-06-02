/**
 * @java game/rules/play/moves/nonDecision/effect/Step.java
 *
 * Steps a piece one step in the given direction(s) to a cell matching the
 * `to` condition. The default condition is (is Empty (to)).
 *
 * Faithful behaviour:
 *  - resolves player-RELATIVE directions (Forwards/Backwards/Rightward/Leftward
 *    and the diagonal relatives) against the mover (P1 faces N, P2 faces S);
 *  - single directions (a specific compass, or a resolved relative) step ONE way
 *    (only the ray), NOT both ray+opposite — only the GROUP directions
 *    (Adjacent/Orthogonal/Diagonal/All) step every axis bidirectionally;
 *  - applies the `(to if:<cond>)` rule and chains the `(to ... (apply <effect>))`
 *    side-effect (e.g. a capture `(remove (to))`) onto each generated move.
 *
 * @java game/rules/play/moves/nonDecision/effect/Step.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import type { Action } from "../../../../../../../action/index.js";
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

/**
 * Resolve a player-RELATIVE direction name to an absolute compass name for the
 * given mover. P1 faces "up" the board (N); P2 faces down (S). For the common
 * 2-player orthogonal/diagonal case this matches Ludii's RelativeDirection.
 * Returns null if `dirName` is not a relative direction.
 * @java game/util/directions/RelativeDirection.java
 */
function resolveRelativeDir(dirName: string, mover: number): string | null {
  const p1 = mover === 1;
  switch (dirName.toLowerCase()) {
    case "forwards": case "forward": return p1 ? "N" : "S";
    case "backwards": case "backward": return p1 ? "S" : "N";
    case "rightward": case "right": return p1 ? "E" : "W";
    case "leftward": case "left": return p1 ? "W" : "E";
    case "forwardleft": case "fl": return p1 ? "NW" : "SE";
    case "forwardright": case "fr": return p1 ? "NE" : "SW";
    case "backwardleft": case "bl": return p1 ? "SW" : "NE";
    case "backwardright": case "br": return p1 ? "SE" : "NW";
    default: return null;
  }
}

/** True when the direction names a SINGLE compass heading (one ray), not a group. */
function isSingleDir(dirName: string): boolean {
  switch (dirName.toUpperCase()) {
    case "N": case "S": case "E": case "W":
    case "NE": case "NW": case "SE": case "SW":
    case "NORTH": case "SOUTH": case "EAST": case "WEST":
    case "NORTHEAST": case "NORTHWEST": case "SOUTHEAST": case "SOUTHWEST":
      return true;
    default:
      return false; // Adjacent / Orthogonal / Diagonal / All → bidirectional axes
  }
}

export class Step1to1 implements MovesFunction {
  private readonly dirnName: string;
  private readonly toCondition: BooleanFunction;
  /**
   * Optional `(to ... (apply <effect>))` side-effect generator. Evaluated with
   * `_evalTo` set to the destination; its actions are prepended to the
   * ActionMove so a capture removes the enemy at `to` before the piece lands.
   * @java Step.sideEffect = to.effect(); MoveUtilities.chainRuleWithAction(...)
   */
  private readonly applyGen?: MovesFunction;

  /**
   * @param dirnName  Direction constraint (defaults to "Adjacent")
   * @param toCondition  Condition on the to-site (defaults to is Empty)
   * @param applyGen  Optional (to ... (apply ...)) side-effect generator
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

  /** Build a step move from→to, chaining any `(apply ...)` side-effect actions. */
  private buildMove(ctx: Context, from: number, to: number, mover: number): LudiiMove {
    if (!this.applyGen) return makeMoveAction(from, to, mover);
    ctx._evalFrom = from;
    ctx._evalTo = to;
    let applyActions: Action[] = [];
    try {
      const effMoves = this.applyGen.eval(ctx);
      applyActions = effMoves.flatMap(m => [...m.actions]);
    } catch { applyActions = []; }
    if (applyActions.length === 0) return makeMoveAction(from, to, mover);
    return new LudiiMove({
      id: `step:${mover}:${from}:${to}`,
      label: `Step(${from}→${to})`,
      siteIndices: [from, to],
      mover,
      placedOwner: mover,
      actions: [...applyActions, new ActionMove({ from, to })],
    });
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — eval(Context)
   * from = context._evalFrom (set by ForEachPiece1to1).
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

    // Resolve player-relative direction (Forwards → N/S by mover), if any.
    const relative = resolveRelativeDir(this.dirnName, mover);
    const effDir = relative ?? this.dirnName;
    const single = isSingleDir(effDir);

    const moves: LudiiMove[] = [];
    const seen = new Set<number>();
    const axes = radialsForDirection(cellRadials, effDir);

    for (const { ray, opposite } of axes) {
      // Step 1 in the ray direction (index 1 = first cell out from the pivot).
      const toRay = ray[1];
      if (toRay !== undefined && !seen.has(toRay)) {
        seen.add(toRay);
        ctx._evalTo = toRay;
        if (this.toCondition.eval(ctx)) {
          moves.push(this.buildMove(ctx, from, toRay, mover));
        }
      }
      // Group directions (Adjacent/Orthogonal/Diagonal) also step the opposite
      // ray of each axis; a SINGLE direction does not (one-way only).
      if (!single) {
        const toOpp = opposite[1];
        if (toOpp !== undefined && !seen.has(toOpp)) {
          seen.add(toOpp);
          ctx._evalTo = toOpp;
          if (this.toCondition.eval(ctx)) {
            moves.push(this.buildMove(ctx, from, toOpp, mover));
          }
        }
      }
    }

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
