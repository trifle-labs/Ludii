/**
 * @java game/rules/play/moves/nonDecision/effect/Attract.java
 *
 * Attracts all pieces as close as possible to a given site.
 * In each radial direction from the from-site, collect all non-empty sites
 * in order, then re-place them compacted toward the origin.
 *
 * Java parity (Attract.eval lines 72-135):
 *   1. Resolve from = startLocationFn.eval(context)  [default: lastTo]
 *   2. For each radial direction, walk steps[1..]:
 *      - For each non-empty step: record what, emit ActionRemove.
 *   3. Then re-place them at steps[1..piecesInThisDirection.size()] (compact).
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry.
 *
 * @java game/rules/play/moves/nonDecision/effect/Attract.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { Move as LudiiMove } from "../../../../../../../move.js";
import type { ThenLike } from "../../Moves.js";
import type { From } from "../../../../../util/moves/From.js";
import { LAST_TO } from "./EffectCtorAdapters.js";

export class Attract implements MovesFunction {
  /**
   * Function evaluating the pivot/from-site (default: lastTo = ctx._evalTo).
   * @java Attract.startLocationFn
   */
  private readonly startLocationFn: IntFunction;

  /**
   * Direction name (e.g. "Adjacent", "Diagonal").
   * @java Attract.dirnChoice — defaults to Adjacent
   */
  private readonly dirnName: string;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Attract.java — constructor
   * @param from The data of the from location [(from (last To))].
   * @param dirn The specific direction [Adjacent].
   * @param then The moves applied after that move is applied.
   */
  public constructor(
    from?: From | null,
    dirn?: string | null,
    then?: ThenLike | null,
  ) {
    this.thenClause = then ?? null;
    this.startLocationFn = from?.loc() ?? LAST_TO;
    this.dirnName = dirn ?? "Adjacent";
  }

  /** @java Effect.then — consequence applied after this move. */
  private readonly thenClause: ThenLike | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Attract.java — eval(Context)
   *
   * For each direction radial: collect all piece-types in order (far to near),
   * remove them all, then re-place them compacted starting at step[1].
   */
  public eval(ctx: Context): Move[] {
    // @java Attract.java:79 — from = startLocationFn.eval(context)
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const state = ctx.state;
    const mover = state.mover;
    const allActions: import("../../../../../../../action/index.js").Action[] = [];

    // @java Attract.java:88-116 — dirnChoice.convertToAbsolute gives EVERY
    // adjacent direction (6 on a hex, 8 on a square), and the loop walks one
    // radial PER DIRECTION. Our `radialsForDirection(…, "Adjacent")` returns the
    // distinct AXES (3 on hex, 4 on square), each a {ray, opposite} pair — so we
    // must process BOTH ray and opposite to cover all directions. The original
    // port walked only `ray`, covering half the directions: ducks on the
    // opposite-pointing radials were never pulled in (Feed the Ducks left a duck
    // stranded at cell 0 instead of attracting it toward the breadcrumb).
    const axes = radialsForDirection(cellRadials, this.dirnName);

    for (const axis of axes) {
      for (const ray of [axis.ray, axis.opposite]) {
        // @java Attract.java:97-109 — collect pieces along this radial
        const piecesInThisDirection: number[] = [];

        for (let toIdx = 1; toIdx < ray.length; toIdx++) {
          const to = ray[toIdx]!;
          const what = state.whatAtSite(to);
          if (what !== 0) {
            piecesInThisDirection.push(what);
            // @java Attract.java:105 — removeAction for this piece
            allActions.push(new ActionRemove({ to }));
          }
        }

        // @java Attract.java:111-118 — re-place pieces compacted toward pivot
        for (let toIdx = 1; toIdx <= piecesInThisDirection.length; toIdx++) {
          const to = ray[toIdx]!;
          if (to === undefined) break;
          const what = piecesInThisDirection[toIdx - 1]!;
          allActions.push(new ActionAdd({ to, what, owner: mover }));
        }
      }
    }

    if (allActions.length === 0) return [];

    return [new LudiiMove({
      id: `attract:${mover}:${from}`,
      label: `Attract(from=${from})`,
      siteIndices: [from],
      mover,
      placedOwner: mover,
      actions: allActions,
      deferredThens: this.thenClause != null
        ? [{ eval: (c: Context): Move[] => {
            const r = (this.thenClause!.moves() as unknown as { eval(c: Context): Move[] | { moves(): Move[] } }).eval(c);
            return Array.isArray(r) ? r : r.moves();
          } }]
        : [],
    })];
  }
}
