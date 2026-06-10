// @java Core/src/game/functions/region/sites/simple/SitesBottom.java

/**
 * Returns all the bottom sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesBottom.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

/**
 * Returns all the bottom sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesBottom.java
 *
 * Java parity: eval delegates to graph.bottom(realType).
 * TS: for square boards returns bottom row cells (row 0, cells 0..W-1).
 *     For graph boards, uses trajectories to find the sites with minimum y.
 */
export class SitesBottom extends BaseRegionFunction {
  /**
   * @param siteType The graph element type (Cell/Edge/Vertex) or null for default.
   * @java SitesBottom constructor
   */
  public constructor(siteType: string | null = null) {
    super();
    this.siteType = siteType;
  }

  /**
   * Returns all the bottom sites of the board.
   *
   * @java SitesBottom.eval(Context)
   *
   * Java parity: graph.bottom(realType) — the topological bottom sites.
   * For square boards: row 0 cells (indices 0 .. W-1).
   * For graph boards: sites with minimum y coordinate.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesBottom — check graph board first
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const board = (ctx.game as unknown as Game).equipment.board;
    const mancalaBottom = twoRowMancalaBottom(board);
    if (mancalaBottom !== null) return mancalaBottom;
    const traj = ctxAny._trajectories ?? board.trajectories;
    if (traj) {
      const type = this.siteType ?? (board.numSites === traj.numSites ? "Vertex" : "Cell");
      const sites = sitesWithMinY(traj, type);
      if (sites.length > 0) return sites;
    }

    // @java SitesBottom — square board: bottom row = cells 0..W-1
    const W = board.width;
    return Array.from({ length: W }, (_, i) => i);
  }

  /** @java SitesBottom.isStatic() — always true (board geometry is fixed) */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesBottom.toString() */
  public override toString(): string {
    return "Bottom()";
  }
}

function twoRowMancalaBottom(board: {
  numSites: number;
  tracks?: () => readonly unknown[];
  getTracks?: () => readonly unknown[];
  getStoreType?: () => string;
}): number[] | null {
  const tracks = typeof board.tracks === "function"
    ? board.tracks()
    : (typeof board.getTracks === "function" ? board.getTracks() : []);
  if (tracks.length === 0 || board.numSites < 4 || board.numSites % 2 !== 0) return null;
  if (board.getStoreType?.() === "None") {
    const holes = board.numSites / 2;
    return Array.from({ length: holes }, (_, index) => index);
  }
  const holes = (board.numSites - 2) / 2;
  if (!Number.isInteger(holes) || holes < 1) return null;
  return Array.from({ length: holes }, (_, index) => index + 1);
}

/**
 * Returns the site indices with the minimum y coordinate from the trajectories.
 * @java Topology.bottom(SiteType) — sites with minimum centroid y.
 */
function sitesWithMinY(traj: Trajectories, _type: string): number[] {
  // @java Topology.bottom(SiteType) — sites with minimum centroid y.
  // Use the Trajectories play-site API (yOf over [0, numSites)) — the duck-typed
  // core.topo.elements(type) path is EMPTY on vertex-play graph boards (e.g. the
  // Alquerque hunt family: merge(square+wedge)), which fell through to the
  // rectangular bridge adapter and produced out-of-range sites (Adugo dogs on the
  // wedge). Same proven recipe as SitesLeft/SitesRight (xOf).
  const n = traj.numSites;
  if (n === 0) return [];
  let best = traj.yOf(0);
  for (let s = 1; s < n; s++) {
    const y = traj.yOf(s);
    if (y < best) best = y;
  }
  const tol = 0.001;
  const sites: number[] = [];
  for (let s = 0; s < n; s++) if (Math.abs(traj.yOf(s) - best) < tol) sites.push(s);
  return sites;
}
