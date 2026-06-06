// @java Core/src/game/functions/region/sites/context/SitesContext.java

/**
 * Returns the sites iterated in ForEach Moves (the context region).
 *
 * @java game/functions/region/sites/context/SitesContext.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, RegionFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns the region currently set in the context (the "sites" context value
 * used by forEach moves iteration).
 *
 * @java game.functions.region.sites.context.SitesContext
 */
export class SitesContext extends BaseRegionFunction {
  /**
   * @java SitesContext()
   */
  public constructor() {
    super();
  }

  /**
   * @java SitesContext.eval(Context)
   * Returns context.region() — the current iteration region.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesContext.java:33 — return context.region()
    const ctxAny = ctx as unknown as {
      region?: () => RegionFunction | number[] | null;
      _evalRegion?: number[];
    };
    // Try context.region() first (Java API)
    if (typeof ctxAny.region === "function") {
      const r = ctxAny.region();
      if (r != null) {
        if (Array.isArray(r)) return r;
        // RegionFunction with eval
        const rf = r as RegionFunction;
        if (typeof rf.eval === "function") return rf.eval(ctx);
      }
    }
    // Fallback: _evalRegion scratch field
    if (Array.isArray(ctxAny._evalRegion)) return ctxAny._evalRegion;
    return [];
  }

  /** @java SitesContext.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
