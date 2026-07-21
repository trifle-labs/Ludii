// @java Core/src/game/functions/region/sites/simple/SitesCentre.java

/**
 * Returns all the centre sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesCentre.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

/**
 * Returns all the centre sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesCentre.java
 *
 * Java parity: eval delegates to graph.centre(realType).
 * TS: for square boards returns the cell(s) nearest to the geometric centre.
 *     For graph boards, uses trajectories to find cells nearest to centroid.
 */
export class SitesCentre extends BaseRegionFunction {
  /**
   * @param siteType The graph element type (Cell/Edge/Vertex) or null for default.
   * @java SitesCentre constructor
   */
  public constructor(siteType: string | null = null) {
    super();
    this.siteType = siteType;
  }

  /**
   * Returns all the centre sites of the board.
   *
   * @java SitesCentre.eval(Context)
   *
   * Java parity: graph.centre(realType) — the topological centre sites.
   * For square boards: the cells nearest to (W/2, H/2).
   * For graph boards: cells nearest to the board centroid.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesCentre — check graph board first
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      const sites = graphCentreSites(traj);
      if (sites.length > 0) return sites;
    }

    // @java SitesCentre — square board: find cells nearest to (cx, cy)
    const g = ctx.game as unknown as Game;
    const W = g.equipment.board.width;
    const H = g.equipment.board.height;

    // @java SitesCentre — centre cells (up to 4 for even-dimensioned boards)
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H / 2);
    const sites: number[] = [];
    for (let dy = 0; dy <= (H % 2 === 0 ? 1 : 0); dy++) {
      for (let dx = 0; dx <= (W % 2 === 0 ? 1 : 0); dx++) {
        const s = (cy - dy) * W + (cx - dx);
        if (s >= 0 && s < W * H) sites.push(s);
      }
    }
    return [...new Set(sites)].sort((a, b) => a - b);
  }

  /** @java SitesCentre.isStatic() — always true (board geometry is fixed) */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesCentre.toString() */
  public override toString(): string {
    return "Centre()";
  }
}

/**
 * Returns the site indices nearest to the board centroid (for graph boards).
 * @java Topology.centre(SiteType) — sites with minimum distance to board centroid.
 */
function graphCentreSites(traj: Trajectories): number[] {
  const trajAny = traj as unknown as {
    core?: { topo?: { elements?(type: string): Array<{ id: number; centroid?(): { x: number; y: number } }> } };
    playType?: string;
  };
  const core = trajAny.core;
  // @java graph.centre(realType) — the PLAY type's elements, not Cell:
  // on a use:Vertex wheel board (Gioco dell'Orso) the Cell list is the faces
  // and their nearest-centroid id leaked out as a vertex site (bear at 12,
  // Java places it at the hub vertex 0). Trajectories caches the play-type
  // element list as `els`.
  const elements = (trajAny as unknown as { els?: Array<{ id: number; centroid?(): { x: number; y: number }; pt?: { x: number; y: number } }> }).els
    ?? core?.topo?.elements?.("Cell");
  if (!elements || elements.length === 0) return [];

  const coordOf = (el: { centroid?(): { x: number; y: number }; pt?: { x: number; y: number } }):
    { x: number; y: number } | undefined => el.centroid?.() ?? el.pt;
  // Compute board centroid
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const el of elements) {
    const c = coordOf(el);
    if (c) { sumX += c.x; sumY += c.y; count++; }
  }
  if (count === 0) return [];
  const cx = sumX / count;
  const cy = sumY / count;

  // Find min distance to centroid
  let minDist = Infinity;
  for (const el of elements) {
    const c = coordOf(el);
    if (c) {
      const d = Math.hypot(c.x - cx, c.y - cy);
      if (d < minDist) minDist = d;
    }
  }
  const tol = 0.001;
  return elements
    .filter((el) => {
      const c = coordOf(el);
      return c !== undefined && Math.abs(Math.hypot(c.x - cx, c.y - cy) - minDist) < tol;
    })
    .map((el) => el.id)
    .sort((a, b) => a - b);
}
