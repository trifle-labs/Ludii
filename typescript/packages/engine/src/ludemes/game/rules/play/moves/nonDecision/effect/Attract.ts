// @java Core/src/game/rules/play/moves/nonDecision/effect/Attract.java

/**
 * Is used to attract all the pieces as close as possible to a site.
 *
 * @java game/rules/play/moves/nonDecision/effect/Attract.java
 *
 * Java: public final class Attract extends Effect
 *   - startLocationFn: IntFunction — pivot/from location (default: lastTo)
 *   - dirnChoice: Directions — directions to attract along (default: Adjacent)
 *   - type: SiteType
 *
 * eval(): for each direction radial, collect all pieces along the ray in order,
 * remove them, then re-place them compacted toward the pivot.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import type { IntFunction, DirectionsFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";

/**
 * Attract effect — pulls pieces closer to a pivot site.
 *
 * @java game/rules/play/moves/nonDecision/effect/Attract.java
 */
export class Attract extends Effect {
  /** @java Attract.startLocationFn — default: lastTo */
  private readonly startLocationFn: IntFunction;

  /** @java Attract.dirnChoice — default: Adjacent */
  private readonly dirnChoice: DirectionsFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Attract.java — constructor
   */
  public constructor(
    startLocationFn: IntFunction,
    dirnChoice: DirectionsFunction,
    then: ThenLike | null = null,
  ) {
    super(then);
    this.startLocationFn = startLocationFn;
    this.dirnChoice = dirnChoice;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Attract.java — eval(Context)
   *
   * Java lines 74-135:
   *   1. Resolve from = startLocationFn.eval(context)
   *   2. For each direction, walk the radial outward:
   *      - For each non-empty step: record what, emit ActionRemove.
   *   3. Re-place them compacted toward pivot: at steps[1..piecesCount].
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Attract.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;
    const directions = this.dirnChoice.eval(ctx);
    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const allActions: Action[] = [];

    for (const dirName of directions) {
      const dirsForCell = cellRadials[dirName] ?? [];

      for (const { ray } of dirsForCell) {
        // @java Attract.java:97-109 — collect pieces along radial
        const piecesInThisDirection: number[] = [];

        for (let toIdx = 1; toIdx < ray.length; toIdx++) {
          const to = ray[toIdx]!;
          const what = state.whatAtSite(to);
          if (what !== 0) {
            piecesInThisDirection.push(what);
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

    return [new Move({
      id: `attract:${mover}:${from}`,
      label: `Attract(from=${from})`,
      siteIndices: [from],
      mover,
      placedOwner: mover,
      actions: allActions,
    })];
  }

  // -------------------------------------------------------------------------

  /** @java Attract.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
