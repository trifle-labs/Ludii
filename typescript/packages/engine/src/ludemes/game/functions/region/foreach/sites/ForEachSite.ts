// @java Core/src/game/functions/region/foreach/sites/ForEachSite.java

/**
 * Returns the sites from a region that satisfy a given condition.
 *
 * @java game/functions/region/foreach/sites/ForEachSite.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, RegionFunction, BooleanFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Filters a region by a boolean condition, setting context.site for each
 * site evaluation.
 * @java game.functions.region.foreach.sites.ForEachSite
 */
export class ForEachSite extends BaseRegionFunction {
  /** @java ForEachSite — private final RegionFunction region */
  private readonly region: RegionFunction;
  /** @java ForEachSite — private final BooleanFunction condition */
  private readonly condition: BooleanFunction;

  /**
   * @java ForEachSite(RegionFunction, BooleanFunction)
   * @param region    The original region to filter.
   * @param condition The condition each site must satisfy.
   */
  public constructor(region: RegionFunction, condition: BooleanFunction) {
    super();
    this.region = region;
    this.condition = condition;
  }

  /**
   * @java ForEachSite.eval(Context)
   * Evaluates the region, then filters sites by the condition (with context
   * site set to each candidate).
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java ForEachSite.java:57-58 — get original sites and save context site
    const originalSites = this.region.eval(ctx);
    const returnSites: number[] = [];
    const originSiteValue = ctx._evalSite ?? -1;

    // @java ForEachSite.java:60-65 — iterate and filter
    for (let i = 0; i < originalSites.length; i++) {
      const site = originalSites[i]!;
      ctx._evalSite = site;
      if (this.condition.eval(ctx)) {
        returnSites.push(site);
      }
    }

    // @java ForEachSite.java:67 — restore context site
    ctx._evalSite = originSiteValue;
    return returnSites;
  }

  /** @java ForEachSite.isStatic() */
  public override isStatic(): boolean {
    const condStatic = (this.condition as unknown as { isStatic?: () => boolean }).isStatic;
    const regStatic = (this.region as unknown as { isStatic?: () => boolean }).isStatic;
    return (typeof condStatic !== "function" || condStatic.call(this.condition)) &&
           (typeof regStatic !== "function" || regStatic.call(this.region));
  }
}
