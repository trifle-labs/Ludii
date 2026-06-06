// @java Core/src/game/functions/region/sites/simple/SitesConcaveCorners.java

/**
 * Returns all the concave corners sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesConcaveCorners.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { SitesConcaveCorners1to1 } from "./SitesConcaveConvexCorners1to1.js";

/**
 * Returns all the concave corners sites of the board.
 *
 * @java game/functions/region/sites/simple/SitesConcaveCorners.java
 *
 * Java parity: eval delegates to graph.cornersConcave(realType).
 * TS: delegates to SitesConcaveCorners1to1 for graph boards.
 *     For square boards: square boards have no concave corners.
 */
export class SitesConcaveCorners extends BaseRegionFunction {
  /** @java SitesConcaveCorners — delegate 1:1 implementation */
  private readonly delegate: SitesConcaveCorners1to1;

  /**
   * @param siteType The graph element type (Cell/Edge/Vertex) or null for default.
   * @java SitesConcaveCorners constructor
   */
  public constructor(siteType: string | null = null) {
    super();
    this.siteType = siteType;
    this.delegate = new SitesConcaveCorners1to1();
  }

  /**
   * Returns all the concave corners sites of the board.
   *
   * @java SitesConcaveCorners.eval(Context)
   *
   * Java parity: graph.cornersConcave(realType) — concave corners.
   * TS: use the graph trajectory cornersFromPerimeter analysis.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      return this.delegate.eval(ctx);
    }
    // @java SitesConcaveCorners — square boards have no concave corners
    return [];
  }

  /** @java SitesConcaveCorners.isStatic() — always true (board geometry is fixed) */
  public override isStatic(): boolean {
    return true;
  }

  /** @java SitesConcaveCorners.toString() */
  public override toString(): string {
    return "ConcaveCorners()";
  }
}
