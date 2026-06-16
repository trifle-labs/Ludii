// @java Core/src/game/functions/region/sites/simple/SitesTop.java

/**
 * Returns all the top sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesTop.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

/**
 * Minimal interface for a TopologyElement that exposes index().
 * @java other.topology.TopologyElement
 */
interface TopologyElementLike {
  index(): number;
}

/**
 * Returns all the top sites of the board.
 *
 * @java game.functions.region.sites.simple.SitesTop
 */
export class SitesTop extends BaseRegionFunction {
  /** If we can, we'll precompute once and cache. @java SitesTop.precomputedRegion */
  private precomputedRegion: number[] | null = null;

  /**
   * @param elementType The graph element type [default SiteType of the board].
   * @java SitesTop(SiteType)
   */
  public constructor(elementType: string | null = null) {
    super();
    this.siteType = elementType;
  }

  /**
   * @java SitesTop.eval(Context)
   *
   * Returns all the top sites of the board for the given site type.
   * Java: graph.top(realType) — collects TopologyElement indices.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // Java: if (precomputedRegion != null) return precomputedRegion;
    if (this.precomputedRegion !== null)
      return this.precomputedRegion;

    const board = (ctx.game as unknown as Game).equipment.board;
    const traj = (ctx as unknown as { _trajectories?: Trajectories | null })._trajectories ?? board.trajectories;
    if (traj) {
      const type = this.siteType ?? (board.numSites === traj.numSites ? "Vertex" : "Cell");
      const sites = sitesWithMaxY(traj, type);
      if (sites.length > 0) return sites;
    }
    // @java SitesTop -> graph.top(type) == max-y elements (faithful primary;
    // heuristic fallback only when trajectories are unavailable).
    const mancalaTop = twoRowMancalaTop(board);
    if (mancalaTop !== null) return mancalaTop;

    // Java: final SiteType realType = (type != null) ? type : context.board().defaultSite();
    const realType: string = this.siteType ??
      ((ctx as unknown as { board?(): { defaultSite(): string } }).board?.()?.defaultSite() ?? "Cell");

    // Java: final other.topology.Topology graph = context.topology();
    // Java: return new Region(graph.top(realType));
    const topology = (ctx as unknown as {
      topology?(): {
        top(type: string): TopologyElementLike[];
      };
    }).topology?.();

    if (topology) {
      const elements = topology.top(realType);
      const sites = elements.map((e) => e.index());
      if (sites.length > 0) return sites;
    }

    // Fallback: square board — top row = (H-1)*W ... H*W-1
    const g = ctx.game as unknown as { equipment?: { board?: { width?: number; height?: number } } };
    const W = g.equipment?.board?.width ?? 0;
    const H = g.equipment?.board?.height ?? 0;
    if (W > 0 && H > 0) {
      const rowStart = (H - 1) * W;
      return Array.from({ length: W }, (_, i) => rowStart + i);
    }

    return [];
  }

  /** @java SitesTop.isStatic() */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesTop.toString() */
  public override toString(): string {
    return "Top()";
  }
}

function twoRowMancalaTop(board: {
  numSites: number;
  width?: number;
  height?: number;
  tracks?: () => readonly unknown[];
  getTracks?: () => readonly unknown[];
  getStoreType?: () => string;
}): number[] | null {
  const tracks = typeof board.tracks === "function"
    ? board.tracks()
    : (typeof board.getTracks === "function" ? board.getTracks() : []);
  if (tracks.length === 0 || board.numSites < 4 || board.numSites % 2 !== 0) return null;
  // @java graph.top(realType) — the LAST row only (four-row mancalas: width
  // holes per row, not numSites/2).
  if (board.getStoreType?.() === "None") {
    const holesPerRow = board.width && board.height && board.width * board.height === board.numSites
      ? board.width
      : board.numSites / 2;
    return Array.from({ length: holesPerRow }, (_, index) => board.numSites - holesPerRow + index);
  }
  // With stores the x-extent includes both stores, so derive holes-per-row
  // from the hole count and the row count (height).
  const rows = board.height && board.height >= 2 ? board.height : 2;
  const holes = (board.numSites - 2) / rows;
  if (!Number.isInteger(holes) || holes < 1) return null;
  return Array.from({ length: holes }, (_, index) => board.numSites - 1 - holes + index);
}

function sitesWithMaxY(traj: Trajectories, _type: string): number[] {
  // @java Topology.top(SiteType) — sites with maximum centroid y.
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
    if (y > best) best = y;
  }
  const tol = 0.001;
  const sites: number[] = [];
  for (let s = 0; s < n; s++) if (Math.abs(traj.yOf(s) - best) < tol) sites.push(s);
  return sites;
}
