// @java Core/src/game/functions/region/sites/simple/SitesConvexCorners.java

/**
 * Returns all the convex corners sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesConvexCorners.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game1to1 } from "../../../../../Game1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { SitesConvexCorners1to1 } from "./SitesConcaveConvexCorners1to1.js";

/**
 * Returns all the convex corners sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesConvexCorners.java
 *
 * Java parity: eval delegates to graph.cornersConvex(realType).
 * TS: delegates to SitesConvexCorners1to1 for graph boards.
 *     For square boards: returns the four corner cells.
 */
export class SitesConvexCorners extends BaseRegionFunction {
  /** @java SitesConvexCorners — delegate 1:1 implementation */
  private readonly delegate: SitesConvexCorners1to1;

  /**
   * @param siteType The graph element type (Cell/Edge/Vertex) or null for default.
   * @java SitesConvexCorners constructor
   */
  public constructor(siteType: string | null = null) {
    super();
    this.siteType = siteType;
    this.delegate = new SitesConvexCorners1to1();
  }

  /**
   * Returns all the convex corners sites of the board.
   *
   * @java SitesConvexCorners.eval(Context)
   *
   * Java parity: graph.cornersConvex(realType) — convex corners.
   * TS: use the graph trajectory cornersFromPerimeter analysis.
   *     Square board fallback: four physical corners.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      return this.delegate.eval(ctx);
    }

    // @java SitesConvexCorners — square board: four physical corners
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment.board.width;
    const H = g.equipment.board.height;
    if (W === 0 || H === 0) return [];
    const n = g.equipment.board.numSites;
    return [...new Set([0, W - 1, n - W, n - 1])].sort((a, b) => a - b);
  }

  /** @java SitesConvexCorners.isStatic() — always true (board geometry is fixed) */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesConvexCorners.toString() */
  public override toString(): string {
    return "ConvexCorners()";
  }
}
