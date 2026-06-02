/**
 * @java game/functions/region/sites/index/SitesEmpty.java SitesEmpty
 *
 * Returns the set of empty sites on the board.
 *
 * Java parity: SitesEmpty.eval(context) iterates over all cell indices and
 * returns those where ContainerState.isEmpty(site) is true — i.e. where
 * `what(site) == 0` (no component placed).
 *
 * In the TS 1:1 path: State.isEmptySite(i) mirrors Java's isEmpty check.
 */

import type { Context } from "../../../../../context.js";
import type { RegionFunction } from "../../../../base.js";

export class SitesEmpty implements RegionFunction {
  // No constructor parameters for the default (sites Empty) form.

  /**
   * @java game/functions/region/sites/index/SitesEmpty.java — eval()
   * Returns all empty cell indices.
   */
  public eval(ctx: Context): number[] {
    const state = ctx.state;
    // (sites Empty) defaults to the BOARD container — iterate only board sites
    // (0..numSites-1), NOT hand/store slots (which live at higher indices). On a
    // board with hands, including empty hand slots would offer spurious placements
    // onto the hand. @java SitesEmpty: ContainerState of the board container only.
    const boardN = (ctx.game as unknown as { equipment?: { board?: { numSites?: number } } })
      .equipment?.board?.numSites;
    const n = (boardN !== undefined && boardN > 0) ? boardN : state.cells.length;
    const result: number[] = [];
    for (let i = 0; i < n; i++) {
      if (state.isEmptySite(i)) {
        result.push(i);
      }
    }
    return result;
  }
}
