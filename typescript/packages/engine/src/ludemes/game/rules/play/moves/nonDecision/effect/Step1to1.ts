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
import type { Trajectories } from "../../../../../../../eval/graph/trajectories.js";
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

/** Compass names indexed by 45°-unit direction (0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW). */
const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
/** Map a compass name to its 45°-unit index. */
const COMPASS_IDX: Record<string, number> = {
  N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7,
  NORTH: 0, NORTHEAST: 1, EAST: 2, SOUTHEAST: 3, SOUTH: 4, SOUTHWEST: 5, WEST: 6, NORTHWEST: 7,
};

/**
 * Resolve a player-RELATIVE direction name to absolute compass names for the
 * given mover. Default: P1 faces N, P2 faces S. When the game supplies
 * per-player facing directions via `_playerDirs`, those override the default.
 * Returns null if `dirName` is not a relative direction.
 *
 * "Forwards" / "Backwards" are GROUP directions (3 compass headings):
 *   Forwards = [d-1, d, d+1] (forward-left, forward, forward-right)
 *   Backwards = the opposite 3
 *
 * "Forward" (singular, no "s") = SINGLE direction (just the primary facing direction).
 *   This is different from "Forwards" which includes diagonals.
 *
 * @java game/util/directions/RelativeDirection.java
 */
export function resolveRelativeDir(
  dirName: string,
  mover: number,
  playerDirs?: Map<number, number>,
): string | string[] | null {
  // Determine the mover's facing direction (in 45°-units: 0=N … 7=NW).
  // Default: P1=N(0), P2=S(4). Override with per-player dirs when available.
  let facingDir: number;
  if (playerDirs) {
    const pd = playerDirs.get(mover);
    if (pd !== undefined) {
      facingDir = pd;
    } else {
      // Default for players not in the map
      facingDir = (mover === 1) ? 0 : 4;
    }
  } else {
    facingDir = (mover === 1) ? 0 : 4;
  }
  const dn = dirName.toLowerCase();
  switch (dn) {
    // GROUP directions (3 compass headings in the forward half-plane).
    // @java RelativeDirection.Forwards (with 's') = forward half-plane = 3 compass dirs.
    // @java RelativeDirection.Forward  (no 's')   = primary facing direction = 1 compass dir.
    case "forwards":
      // "Forwards" (plural) covers d-1, d, d+1 (the 3 forward-ish dirs) for custom player dirs.
      if (playerDirs && playerDirs.has(mover)) {
        return [
          COMPASS[(facingDir + 7) % 8]!,  // forward-left
          COMPASS[facingDir]!,              // primary forward
          COMPASS[(facingDir + 1) % 8]!,  // forward-right
        ];
      }
      // Default 2-player case (P1=N, P2=S): return 3 directions.
      return [
        COMPASS[(facingDir + 7) % 8]!,
        COMPASS[facingDir]!,
        COMPASS[(facingDir + 1) % 8]!,
      ];
    case "forward":
      // "Forward" (singular) = exactly the primary facing direction (no diagonals).
      // @java RelativeDirection.Forward.convertToAbsolute(playerDir) = single compass dir
      return COMPASS[facingDir % 8]!;
    case "backwards":
      // "Backwards" (plural) = backward half-plane = 3 dirs.
      if (playerDirs && playerDirs.has(mover)) {
        const back = (facingDir + 4) % 8;
        return [
          COMPASS[(back + 7) % 8]!,
          COMPASS[back]!,
          COMPASS[(back + 1) % 8]!,
        ];
      }
      return [
        COMPASS[(facingDir + 4 + 7) % 8]!,
        COMPASS[(facingDir + 4) % 8]!,
        COMPASS[(facingDir + 4 + 1) % 8]!,
      ];
    case "backward":
      // "Backward" (singular) = single backward direction.
      return COMPASS[(facingDir + 4) % 8]!;
    case "rightward": case "right":      return COMPASS[(facingDir + 2) % 8]!;
    case "leftward": case "left":        return COMPASS[(facingDir + 6) % 8]!;
    case "forwardleft": case "fl":       return COMPASS[(facingDir + 7) % 8]!;
    case "forwardright": case "fr":      return COMPASS[(facingDir + 1) % 8]!;
    case "backwardleft": case "bl":      return COMPASS[(facingDir + 5) % 8]!;
    case "backwardright": case "br":     return COMPASS[(facingDir + 3) % 8]!;
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
    // @java Step.java line 207-208: action.setDecision(true) marks the ActionMove as decision
    // so Move.from()/to() reads from the ActionMove (not the prepended capture ActionRemove).
    const moveAction = new ActionMove({ from, to });
    moveAction.setDecision(true);
    return new LudiiMove({
      id: `step:${mover}:${from}:${to}`,
      label: `Step(${from}→${to})`,
      siteIndices: [from, to],
      mover,
      placedOwner: mover,
      actions: [...applyActions, moveAction],
    });
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Step.java — eval(Context)
   * from = context._evalFrom (set by ForEachPiece1to1).
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

    // Resolve player-relative direction (Forwards → N/S by mover), if any.
    // Use per-player facing directions from game._playerDirs when available.
    // @java RelativeDirection.toAbsoluteDirection(context) — uses player.direction()
    const playerDirs = (ctx.game as unknown as { _playerDirs?: Map<number, number> })._playerDirs;
    const relative = resolveRelativeDir(this.dirnName, mover, playerDirs);

    // Graph-board (hex/tri/etc.) trajectories for direction-aware radial lookup.
    // @java other/topology/Topology.java — preGenerateDirection(game): uses graph adjacency,
    // not a fixed axis-index mapping. For non-square boards, we MUST query trajectories
    // by name; the CellFlatRadials axis indices (0,1,2,3 = EW,NS,NESW,NWSE) only apply
    // to square boards built by buildFlatRadials.
    const traj = ctxAny._trajectories ?? null;

    /**
     * Get the {ray, opposite} pairs for a single absolute compass direction,
     * using trajectories when available (graph boards) or falling back to the
     * index-based table (square boards).
     * @java Step.java — dirnChoice.convertToAbsolute(context) + Radials lookup
     */
    const GROUP_DIRS = new Set(["adjacent", "orthogonal", "diagonal", "all"]);
    const axesForDir = (dir: string): readonly { ray: readonly number[]; opposite: readonly number[] }[] => {
      if (traj) {
        // Graph board: use direction-aware trajectory lookup.
        // distinctRadialsByName returns {ray, opposites[]} for each distinct radial in this direction.
        const distinct = traj.distinctRadialsByName(from, dir);
        if (distinct.length > 0) {
          return distinct.map(r => ({
            ray: r.ray,
            opposite: r.opposites[0] ?? [from],
          }));
        }
        // For a SPECIFIC compass direction on a graph board (e.g., SW on a hex board that has no SW
        // neighbors), an empty result means no moves in that direction — return empty, do NOT fall
        // back to the index-based table (which would give a wrong axis).
        // For GROUP directions (Adjacent/Orthogonal/Diagonal), fall back to the index table since
        // distinctRadialsByName(Adjacent) returns ALL adjacent radials correctly.
        if (!GROUP_DIRS.has(dir.toLowerCase())) {
          return []; // specific direction with no neighbors in this direction → no moves
        }
      }
      return radialsForDirection(cellRadials, dir);
    };

    // When "Forwards"/"Backwards" resolves to multiple compass directions, generate
    // one-step moves to every adjacent site that lies in the forward hemisphere.
    //
    // On a graph board (hex/tri/rotated): the 8-compass names ["NW","N","NE"] may not
    // correspond to any actual trajectory direction (a 30°-rotated hex uses WSW/S/ESE
    // rather than SW/S/SE). Instead we find ALL adjacent sites and keep those whose
    // geometric angle from `from` is within ±90° of the player's facing direction.
    // @java RelativeDirection.Forwards.convertToAbsolute(context) — forward half-plane filter
    if (Array.isArray(relative)) {
      const allMoves: LudiiMove[] = [];

      if (traj) {
        // Graph-board path: angular half-plane filter on adjacency.
        // The player's "facing angle" in radians (standard math: E=0, N=π/2, W=π, S=3π/2).
        // COMPASS array: N(0)=90°, NE(1)=45°, E(2)=0°, SE(3)=315°, S(4)=270°, SW(5)=225°, W(6)=180°, NW(7)=135°.
        // playerDirs gives the mover's facing index in the 8-compass system.
        const pd = playerDirs ? playerDirs.get(mover) : undefined;
        const facingIdx = pd !== undefined ? pd : (mover === 1 ? 0 : 4);
        // Convert 8-compass index to standard angle in radians: N=90°, E=0°, etc.
        const facingAngleRad = ((2 - facingIdx) * Math.PI) / 4; // idx 0=N→π/2, idx 1=NE→π/4...

        // Get all adjacent neighbors via trajectory.
        const adjSteps = traj.steps(from, "Adjacent");
        const fx = traj.xOf(from);
        const fy = traj.yOf(from);
        const seen = new Set<number>();
        for (const toSite of adjSteps) {
          const dx = traj.xOf(toSite) - fx;
          const dy = traj.yOf(toSite) - fy;
          const angle = Math.atan2(dy, dx); // standard math angle (-π to π)
          // Compute angular difference between neighbor direction and facing direction.
          let diff = angle - facingAngleRad;
          while (diff > Math.PI) diff -= 2 * Math.PI;
          while (diff < -Math.PI) diff += 2 * Math.PI;
          // Within ±90° of facing direction → forward hemisphere.
          if (Math.abs(diff) <= Math.PI / 2 + 1e-6 && !seen.has(toSite)) {
            seen.add(toSite);
            ctx._evalTo = toSite;
            if (this.toCondition.eval(ctx)) {
              allMoves.push(this.buildMove(ctx, from, toSite, mover));
            }
          }
        }
      } else {
        // Square-board path: use exact 8-compass direction lookup (original behaviour).
        for (const dir of relative) {
          const subAxes = axesForDir(dir);
          for (const { ray } of subAxes) {
            const toSite = ray[1];
            if (toSite !== undefined) {
              ctx._evalTo = toSite;
              if (this.toCondition.eval(ctx)) {
                allMoves.push(this.buildMove(ctx, from, toSite, mover));
              }
            }
          }
        }
      }

      ctx._evalTo = -1;
      return allMoves;
    }

    const effDir = relative ?? this.dirnName;
    const single = isSingleDir(effDir);

    const moves: LudiiMove[] = [];
    const seen = new Set<number>();
    const axes = axesForDir(effDir);

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
