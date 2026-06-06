// @java Core/src/game/functions/region/sites/simple/SitesLeft.java

/**
 * Returns all the left sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesLeft.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game1to1 } from "../../../../../Game1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

/**
 * Returns all the left sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesLeft.java
 *
 * Java parity: eval delegates to graph.left(realType).
 * TS: for square boards returns left column (column 0).
 *     For graph boards, uses trajectories to find sites with minimum x.
 */
export class SitesLeft extends BaseRegionFunction {
  /**
   * @param siteType The graph element type (Cell/Edge/Vertex) or null for default.
   * @java SitesLeft constructor
   */
  public constructor(siteType: string | null = null) {
    super();
    this.siteType = siteType;
  }

  /**
   * Returns all the left sites of the board.
   *
   * @java SitesLeft.eval(Context)
   *
   * Java parity: graph.left(realType) — the topological left-column sites.
   * For square boards: column 0 cells (indices 0, W, 2W, ...).
   * For graph boards: sites with minimum x coordinate.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesLeft — check graph board first
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      return sitesWithMinX(traj);
    }

    // @java SitesLeft — square board: left column = cells 0, W, 2W, ...
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment.board.width;
    const H = g.equipment.board.height;
    return Array.from({ length: H }, (_, i) => i * W);
  }

  /** @java SitesLeft.isStatic() — always true (board geometry is fixed) */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesLeft.toString() */
  public override toString(): string {
    return "Left()";
  }
}

/**
 * Returns the site indices with the minimum x coordinate from the trajectories.
 * @java Topology.left(SiteType) — sites with minimum centroid x.
 */
function sitesWithMinX(traj: Trajectories): number[] {
  const core = (traj as unknown as {
    core?: { topo?: { elements?(type: string): Array<{ id: number; centroid?(): { x: number; y: number } }> } }
  }).core;
  const elements = core?.topo?.elements?.("Cell");
  if (!elements || elements.length === 0) return [];

  let minX = Infinity;
  for (const el of elements) {
    const c = el.centroid?.();
    if (c && c.x < minX) minX = c.x;
  }
  const tol = 0.001;
  return elements
    .filter((el) => { const c = el.centroid?.(); return c !== undefined && Math.abs(c.x - minX) < tol; })
    .map((el) => el.id)
    .sort((a, b) => a - b);
}
