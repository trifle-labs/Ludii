// @java Core/src/game/functions/region/sites/simple/SitesRight.java

/**
 * Returns all the right sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesRight.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

/**
 * Returns all the right sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesRight.java
 *
 * Java parity: eval delegates to graph.right(realType).
 * TS: for square boards returns right column (column W-1).
 *     For graph boards, uses trajectories to find sites with maximum x.
 */
export class SitesRight extends BaseRegionFunction {
  /**
   * @param siteType The graph element type (Cell/Edge/Vertex) or null for default.
   * @java SitesRight constructor
   */
  public constructor(siteType: string | null = null) {
    super();
    this.siteType = siteType;
  }

  /**
   * Returns all the right sites of the board.
   *
   * @java SitesRight.eval(Context)
   *
   * Java parity: graph.right(realType) — the topological right-column sites.
   * For square boards: column W-1 cells (indices W-1, 2W-1, ...).
   * For graph boards: sites with maximum x coordinate.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesRight — check graph board first
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      return sitesWithMaxX(traj);
    }

    // @java SitesRight — square board: right column = cells W-1, 2W-1, ...
    const g = ctx.game as unknown as Game;
    const W = g.equipment.board.width;
    const H = g.equipment.board.height;
    return Array.from({ length: H }, (_, i) => i * W + (W - 1));
  }

  /** @java SitesRight.isStatic() — always true (board geometry is fixed) */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesRight.toString() */
  public override toString(): string {
    return "Right()";
  }
}

/**
 * Returns the site indices with the maximum x coordinate from the trajectories.
 * @java Topology.right(SiteType) — sites with maximum centroid x.
 */
function sitesWithMaxX(traj: Trajectories): number[] {
  // @java Topology — max-x play-sites. Use the Trajectories play-site API directly
  // (xOf over [0, numSites)); the old duck-typed core.topo.elements("Cell") path was
  // empty on vertex-play boards (e.g. 5x5 Alquerque hunts), returning [].
  const n = traj.numSites;
  if (n === 0) return [];
  let best = traj.xOf(0);
  for (let s = 1; s < n; s++) {
    const x = traj.xOf(s);
    if (x > best) best = x;
  }
  const tol = 0.001;
  const sites: number[] = [];
  for (let s = 0; s < n; s++) if (Math.abs(traj.xOf(s) - best) < tol) sites.push(s);
  return sites;
}
