/**
 * @java game/rules/play/moves/nonDecision/effect/Push.java
 *
 * Pushes all pieces from a site in one direction: the piece at `from` is
 * removed, then pieces along the radial are shifted forward by one step.
 *
 * Java parity (Push.eval lines 72-135):
 *   1. Resolve from = startLocationFn.eval(context)  [default: lastTo]
 *   2. Get radial in the given direction from fromV
 *   3. Remove piece at step[0] (from). Track currentPiece = what(step[0]).
 *   4. Walk steps[1..]: if step occupied, remove it, add currentPiece, track
 *      new currentPiece. If step empty, add currentPiece and stop.
 *
 * NOTE: this class is NOT registered in the 1:1 moves registry (coverage-only
 * transliteration — registering would override the inline handler, risking
 * regression). Instantiate directly from a factory if needed.
 *
 * @java game/rules/play/moves/nonDecision/effect/Push.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

export class Push1to1 implements MovesFunction {
  /**
   * Function to evaluate the from-site (default: (last To) = ctx._evalTo).
   * @java Push.startLocationFn
   */
  private readonly startLocationFn: IntFunction;

  /**
   * Direction name (e.g. "E", "N", "Orthogonal").
   * @java Push.dirnChoice
   */
  private readonly dirnName: string;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Push.java — constructor
   * @param startLocationFn  Evaluates to the from-site (default: lastTo = _evalTo)
   * @param dirnName         Direction to push along (e.g. "E")
   */
  public constructor(
    startLocationFn: IntFunction,
    dirnName = "E",
  ) {
    this.startLocationFn = startLocationFn;
    this.dirnName = dirnName;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Push.java — eval(Context)
   *
   * Walk the radial in dirnName from the from-site.
   * Piece at from is removed. Pieces along the ray are shifted forward.
   */
  public eval(ctx: Context): Move[] {
    // @java Push.java:76 — from = startLocationFn.eval(context)
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const state = ctx.state;
    const mover = state.mover;
    const moves: LudiiMove[] = [];

    // @java Push.java:90 — radials(type, fromV.index(), directions.get(0))
    // We use only the first radial in the chosen direction (the "push" direction).
    const axes = radialsForDirection(cellRadials, this.dirnName);
    if (axes.length === 0) return [];

    // Use first axis, ray direction (not opposite)
    const firstAxis = axes[0]!;
    const ray = firstAxis.ray; // ray[0] = from, ray[1..] = ahead

    // @java Push.java:94 — int currentPiece = cs.what(radial.steps()[0].id(), realType)
    let currentPiece = state.whatAtSite(from);
    if (currentPiece === 0) return [];

    const actions: import("../../../../../../../action/index.js").Action[] = [];

    // @java Push.java:96 — remove piece at from
    actions.push(new ActionRemove({ to: from }));

    // @java Push.java:99-121 — walk steps[1..]
    for (let toIdx = 1; toIdx < ray.length; toIdx++) {
      const to = ray[toIdx]!;
      const what = state.whatAtSite(to);

      if (what !== 0) {
        // @java Push.java:101-108 — occupied: remove it, add currentPiece, track new current
        actions.push(new ActionRemove({ to }));
        actions.push(new ActionAdd({ to, what: currentPiece, owner: mover }));
        currentPiece = what;
      } else {
        // @java Push.java:113-118 — empty: add currentPiece and break
        actions.push(new ActionAdd({ to, what: currentPiece, owner: mover }));
        break;
      }
    }

    if (actions.length === 0) return [];

    moves.push(new LudiiMove({
      id: `push:${mover}:${from}:${this.dirnName}`,
      label: `Push(${from}→${this.dirnName})`,
      siteIndices: [from],
      mover,
      placedOwner: mover,
      actions,
    }));

    return moves;
  }
}
