/**
 * @java game/functions/region/sites/lineOfSight/SitesLineOfSight.java (Farthest case)
 *
 * (sites LineOfSight Farthest at:(from)) — returns, for each direction from
 * the source, the last empty cell before the first blocker (occupied cell)
 * or the end of the board.
 *
 * Java parity (SitesLineOfSight.eval, Farthest case):
 *   - Walk each radial from source
 *   - Track prevTo (last seen empty)
 *   - When a non-empty cell is found and prevTo != -1, add prevTo to results
 *   - When ray ends on empty, add it to results
 *
 * @java game/functions/region/sites/lineOfSight/SitesLineOfSight.java — eval(Farthest)
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { CellFlatRadials } from "../../../../../topology-radials.js";

export class SitesLineOfSightFarthest1to1 implements RegionFunction {
  /**
   * The source site. Defaults to context._evalFrom.
   * @java SitesLineOfSight.loc
   */

  public constructor() {
    // Source site = context._evalFrom (from the ForEachPiece iteration)
  }

  /**
   * @java game/functions/region/sites/lineOfSight/SitesLineOfSight.java — eval(Context)
   *
   * Returns the farthest empty site in each direction from _evalFrom.
   */
  public eval(ctx: Context): number[] {
    const from = ctx._evalFrom;
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const state = ctx.state;
    const result: number[] = [];
    const seen = new Set<number>();

    // Use all 8 directions (Adjacent) - walk both ray and opposite for each axis.
    for (const { ray, opposite } of cellRadials.axes) {
      // Walk the forward ray (starting at index 1, skipping the pivot).
      walkRay(ray, state, result, seen);
      // Walk the opposite ray.
      walkRay(opposite, state, result, seen);
    }

    return result;
  }
}

function walkRay(
  ray: readonly number[],
  state: { isEmptySite(i: number): boolean },
  result: number[],
  seen: Set<number>,
): void {
  // ray[0] = pivot (source site), ray[1..] = subsequent sites
  let prevTo = -1;

  for (let i = 1; i < ray.length; i++) {
    const to = ray[i];
    if (to === undefined) break;

    if (!state.isEmptySite(to)) {
      // Blocked: if we had an empty site before this, it's the farthest reachable.
      if (prevTo !== -1 && !seen.has(prevTo)) {
        result.push(prevTo);
        seen.add(prevTo);
      }
      break;
    }

    // Empty site: update prevTo.
    prevTo = to;

    // If this is the last site in the ray, add it.
    if (i === ray.length - 1) {
      if (!seen.has(to)) {
        result.push(to);
        seen.add(to);
      }
    }
  }
}
