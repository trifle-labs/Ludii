/**
 * @java game/rules/play/moves/nonDecision/effect/Add.java Add
 *
 * Places one or more component(s) at a collection of sites (or one site).
 *
 * Java parity: Add.eval(context) iterates every site in the `to` region,
 * emitting one Move(ActionAdd) per site. The default component is determined
 * by the mover and the equipment's component list.
 *
 * For the TTT 1:1 path this implements the simplest case:
 *   (move Add (to (sites Empty)))
 * where the component is implicitly the mover's piece (what = mover index).
 *
 * @java game/rules/play/moves/nonDecision/effect/Add.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { Move } from "../../../../../../../move.js";
import type { MovesFunction, RegionFunction } from "../../../../../../base.js";

export class Add implements MovesFunction {
  /**
   * The region of target sites (e.g. SitesEmpty).
   * @java Add.java — `region` field
   */
  private readonly toRegion: RegionFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Add.java — constructor
   *
   * @param toRegion The region of valid target sites
   */
  public constructor(toRegion: RegionFunction) {
    this.toRegion = toRegion;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Add.java — eval(Context context)
   *
   * For each site in the region, emit one Move with an ActionAdd.
   * The component `what` = mover index (faithful for single-component-per-player).
   *
   * Java lines 263-300: `for (int toSite = ...) { ActionAdd action = ... }`
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const sites = this.toRegion.eval(ctx);
    const moves: Move[] = [];

    for (const site of sites) {
      if (site < 0) continue;

      // @java Add.java:263 — ActionAdd(to, what, who, ...)
      // For the mover's piece: what = mover (component index for 1-per-player games)
      const action = new ActionAdd({ to: site, what: mover, owner: mover });

      moves.push(new Move({
        id: `add:${mover}:${site}`,
        label: `Add(${site})`,
        siteIndices: [site],
        mover,
        placedOwner: mover,
        actions: [action],
      }));
    }

    return moves;
  }
}
