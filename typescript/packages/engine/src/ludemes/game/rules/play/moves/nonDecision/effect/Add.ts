/**
 * @java game/rules/play/moves/nonDecision/effect/Add.java Add
 *
 * Places one or more component(s) at a collection of sites (or one site).
 *
 * Java parity: Add.eval(context) iterates every site in the `to` region,
 * emitting one Move(ActionAdd) per site. The default component is determined
 * by the mover and the equipment's component list.
 *
 * Supports both:
 *   (move Add (to (sites Empty)))
 *     — mover's own piece (what = mover index, owner = mover)
 *   (move Add (piece "Square0") (to (sites Empty)))
 *     — a specific named piece (what = piece.index, owner = piece.owner)
 *
 * @java game/rules/play/moves/nonDecision/effect/Add.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { Move } from "../../../../../../../move.js";
import type { IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";

export class Add implements MovesFunction {
  /**
   * The region of target sites (e.g. SitesEmpty).
   * @java Add.java — `region` field
   */
  private readonly toRegion: RegionFunction;

  /**
   * Optional: specific piece component index to place.
   * When non-null, this is called to get the `what` (component index) and
   * `owner` for the ActionAdd, rather than using `mover`.
   *
   * @java Add.java — piece.component().index() / piece.owner()
   */
  private readonly pieceFn: { what: IntFunction; owner: number } | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Add.java — constructor
   *
   * @param toRegion  The region of valid target sites
   * @param pieceFn   Optional specific piece to place (what + owner)
   */
  public constructor(
    toRegion: RegionFunction,
    pieceFn: { what: IntFunction; owner: number } | null = null,
  ) {
    this.toRegion = toRegion;
    this.pieceFn = pieceFn;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Add.java — eval(Context context)
   *
   * For each site in the region, emit one Move with an ActionAdd.
   * If pieceFn is provided, uses the specified piece; otherwise uses mover's piece.
   *
   * Java lines 263-300: `for (int toSite = ...) { ActionAdd action = ... }`
   */
  public eval(ctx: Context): Move[] {
    const mover = ctx.state.mover;
    const sites = this.toRegion.eval(ctx);
    const moves: Move[] = [];

    // Resolve what (component index) and owner
    let what: number;
    let owner: number;
    let placedOwner: number;
    if (this.pieceFn) {
      what = this.pieceFn.what.eval(ctx);
      // owner = -1 means "use mover" (e.g. (piece (mover)))
      owner = this.pieceFn.owner < 0 ? mover : this.pieceFn.owner;
      // For neutral pieces (owner=0), move is attributed to the mover
      placedOwner = owner > 0 ? owner : mover;
    } else {
      // Default: mover's own piece
      // @java Add.java:263 — ActionAdd(to, what, who, ...)
      // For the mover's piece: what = mover (component index for 1-per-player games)
      what = mover;
      owner = mover;
      placedOwner = mover;
    }

    for (const site of sites) {
      if (site < 0) continue;

      const action = new ActionAdd({ to: site, what, owner });

      moves.push(new Move({
        id: `add:${mover}:${site}`,
        label: `Add(${site})`,
        siteIndices: [site],
        mover,
        placedOwner,
        actions: [action],
      }));
    }

    return moves;
  }
}
