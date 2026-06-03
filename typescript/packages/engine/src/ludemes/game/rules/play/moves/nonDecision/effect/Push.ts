// @java Core/src/game/rules/play/moves/nonDecision/effect/Push.java

/**
 * Pushes all the pieces from a site in one direction.
 *
 * @java game/rules/play/moves/nonDecision/effect/Push.java
 *
 * Java: public final class Push extends Effect
 *   - startLocationFn: IntFunction — location of the piece to push
 *   - dirnChoice: DirectionsFunction — direction to push
 *   - type: SiteType
 *
 * eval(): removes piece at `from`, then shifts each piece in the radial
 * along by one step (each displaced piece shifts the next one outward,
 * until an empty cell is found).
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import type { IntFunction, DirectionsFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";

/**
 * Push effect — shifts pieces along a radial ray.
 *
 * @java game/rules/play/moves/nonDecision/effect/Push.java
 */
export class Push extends Effect {
  /** @java Push.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Push.dirnChoice */
  private readonly dirnChoice: DirectionsFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Push.java — constructor
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
   * @java game/rules/play/moves/nonDecision/effect/Push.java — eval(Context)
   *
   * Java lines 72-136:
   *   1. Resolve from site and direction.
   *   2. Get the radials from the topology.
   *   3. For each radial:
   *      - Remove piece at from.
   *      - Walk steps[1..]: if a piece is there, shift it (remove + add),
   *        until an empty slot is found where the displaced piece is placed.
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    // Access radials via context topology
    const ctxAny = ctx as unknown as {
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
      state?: { whatAtSite?: (s: number) => number; mover?: number };
    };

    const radials = ctxAny._radials;
    if (!radials) {
      // Cannot perform push without topology — return empty per Java pattern
      throw new Error("not yet wired: Push.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;
    const directions = this.dirnChoice.eval(ctx);
    const dirName = directions[0] ?? "N";

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const dirsForCell = cellRadials[dirName] ?? [];
    if (dirsForCell.length === 0) return [];

    const result: Move[] = [];

    for (const { ray } of dirsForCell) {
      if (ray.length < 2) continue;

      const actions: import("../../../../../../../action/index.js").Action[] = [];

      // @java Push.java:96 — currentPiece = cs.what(steps[0], type)
      let currentPiece = state.whatAtSite(from);

      // @java Push.java:98 — remove from start
      actions.push(new ActionRemove({ to: from }));

      // @java Push.java:99-120 — walk the radial
      for (let toIdx = 1; toIdx < ray.length; toIdx++) {
        const to = ray[toIdx]!;
        const what = state.whatAtSite(to);
        if (what !== 0) {
          // @java: site occupied — remove its piece and place currentPiece there
          actions.push(new ActionRemove({ to }));
          actions.push(new ActionMove({ from, to }));
          currentPiece = what;
        } else {
          // @java: empty site — place currentPiece and stop
          actions.push(new ActionMove({ from, to }));
          break;
        }
      }

      if (actions.length > 0) {
        result.push(new Move({
          id: `push:${mover}:${from}:${dirName}`,
          label: `Push(from=${from},dir=${dirName})`,
          siteIndices: [from],
          mover,
          placedOwner: mover,
          actions,
        }));
      }
    }

    return result;
  }

  // -------------------------------------------------------------------------

  /** @java Push.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
