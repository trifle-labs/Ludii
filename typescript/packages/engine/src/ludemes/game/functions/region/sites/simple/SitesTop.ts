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
import type { Game1to1 } from "../../../../../Game1to1.js";
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

    const board = (ctx.game as unknown as Game1to1).equipment.board;
    const mancalaTop = twoRowMancalaTop(board);
    if (mancalaTop !== null) return mancalaTop;
    const traj = (ctx as unknown as { _trajectories?: Trajectories | null })._trajectories ?? board.trajectories;
    if (traj) {
      const type = this.siteType ?? (board.numSites === traj.numSites ? "Vertex" : "Cell");
      const sites = sitesWithMaxY(traj, type);
      if (sites.length > 0) return sites;
    }

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
    return Array.from({ length: holes }, (_, index) => holes + index);
  }
  const holes = (board.numSites - 2) / 2;
  if (!Number.isInteger(holes) || holes < 1) return null;
  return Array.from({ length: holes }, (_, index) => holes + index + 1);
}

function sitesWithMaxY(traj: Trajectories, type: string): number[] {
  const core = (traj as unknown as {
    core?: { topo?: { elements?(type: string): Array<{ id: number; centroid?(): { x: number; y: number } }> } }
  }).core;
  const elements = core?.topo?.elements?.(type);
  if (!elements || elements.length === 0) return [];

  let maxY = -Infinity;
  for (const el of elements) {
    const c = el.centroid?.();
    if (c && c.y > maxY) maxY = c.y;
  }
  const tol = 0.001;
  return elements
    .filter((el) => { const c = el.centroid?.(); return c !== undefined && Math.abs(c.y - maxY) < tol; })
    .map((el) => el.id)
    .sort((a, b) => a - b);
}
