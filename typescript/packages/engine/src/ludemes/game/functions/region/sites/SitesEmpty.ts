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
    const n = state.cells.length;
    const result: number[] = [];
    for (let i = 0; i < n; i++) {
      if (state.isEmptySite(i)) {
        result.push(i);
      }
    }
    return result;
  }
}
