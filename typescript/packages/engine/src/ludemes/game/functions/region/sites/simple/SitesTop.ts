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
      return elements.map((e) => e.index());
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
