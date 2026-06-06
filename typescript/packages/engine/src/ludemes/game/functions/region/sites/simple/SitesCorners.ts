// @java Core/src/game/functions/region/sites/simple/SitesCorners.java

/**
 * Returns all the corner sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesCorners.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Minimal topology surface used here.
 * @java other/topology/Topology
 */
interface TopologyLike {
  corners(type: string | null): number[];
}

/**
 * Returns all the corner sites of the board.
 *
 * Java parity: eval delegates to graph.corners(realType).
 *
 * @java game.functions.region.sites.simple.SitesCorners
 */
export class SitesCorners extends BaseRegionFunction {
  /** @java SitesCorners — precomputedRegion */
  private precomputedRegion: number[] | null = null;

  /**
   * @param elementType Type of graph elements to return [Cell or Vertex], or null for default.
   * @java SitesCorners(SiteType)
   */
  public constructor(elementType: string | null = null) {
    super();
    this.siteType = elementType;
  }

  /**
   * @java SitesCorners.eval(Context)
   *
   * Returns the corner sites of the board topology for the given element type.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesCorners.java:47-48 — precomputed cache
    if (this.precomputedRegion !== null) {
      return this.precomputedRegion;
    }

    // @java SitesCorners.java:50-51 — realType
    const ctxAny = ctx as unknown as {
      board?: () => {
        defaultSite?: () => string;
        topology?: () => TopologyLike;
      };
      topology?: () => TopologyLike;
    };

    const realType: string =
      this.siteType ??
      ctxAny.board?.()?.defaultSite?.() ??
      "Cell";

    // @java SitesCorners.java:53-54 — graph.corners(realType)
    const topo: TopologyLike | undefined =
      ctxAny.board?.()?.topology?.() ?? ctxAny.topology?.();

    if (!topo) return [];

    return topo.corners(realType);
  }

  /** @java SitesCorners.isStatic() */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesCorners.toString() */
  public override toString(): string {
    return "Corners()";
  }

  /** @java SitesCorners.preprocess(Game) */
  public preprocess(game: unknown): void {
    // @java SitesCorners.java:105-107 — type = SiteType.use(type, game); precompute
    if (this.siteType === null) {
      const gameAny = game as unknown as { board?: () => { defaultSite?: () => string } };
      this.siteType = gameAny.board?.()?.defaultSite?.() ?? "Cell";
    }
    // @java SitesCorners.java:107 — precomputedRegion = eval(new Context(game, null));
    // Skipped: no Context(game, null) equivalent in TS; will be computed lazily.
  }

  /** @java SitesCorners.toEnglish(Game) */
  public toEnglish(_game: unknown): string {
    return "the corner sites of the board";
  }
}
