// @java Core/src/game/functions/region/foreach/sites/ForEachSiteInRegion.java

/**
 * Returns the sites of a region evaluated while iterating another region.
 * For each site in `ofRegion`, sets context.site and collects unique sites
 * from `region`.
 *
 * @java game/functions/region/foreach/sites/ForEachSiteInRegion.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, RegionFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Iterates through sites of one region, evaluating another region for each,
 * collecting unique sites from the inner region.
 * @java game.functions.region.foreach.sites.ForEachSiteInRegion
 */
export class ForEachSiteInRegion extends BaseRegionFunction {
  /** @java ForEachSiteInRegion — private final RegionFunction ofRegion */
  private readonly ofRegion: RegionFunction;
  /** @java ForEachSiteInRegion — private final RegionFunction region */
  private readonly region: RegionFunction;

  /**
   * @java ForEachSiteInRegion(RegionFunction, RegionFunction)
   * @param ofRegion The region of sites to iterate.
   * @param region   The region to compute with each iterated site.
   */
  public constructor(ofRegion: RegionFunction, region: RegionFunction) {
    super();
    this.ofRegion = ofRegion;
    this.region = region;
  }

  /**
   * @java ForEachSiteInRegion.eval(Context)
   * Iterates the ofRegion, sets context.site for each, then collects unique
   * sites from region.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java ForEachSiteInRegion.java:55-56 — get iterated sites, save context site
    const iteratedSites = this.ofRegion.eval(ctx);
    const returnSites: number[] = [];
    const originSiteValue = ctx._evalSite ?? -1;

    // @java ForEachSiteInRegion.java:58-70 — iterate and collect unique sites
    for (let i = 0; i < iteratedSites.length; i++) {
      const iteratedSite = iteratedSites[i]!;
      ctx._evalSite = iteratedSite;
      const sites = this.region.eval(ctx);
      for (let j = 0; j < sites.length; j++) {
        const site = sites[j]!;
        if (!returnSites.includes(site)) {
          returnSites.push(site);
        }
      }
    }

    // @java ForEachSiteInRegion.java:72 — restore context site
    ctx._evalSite = originSiteValue;
    return returnSites;
  }

  /** @java ForEachSiteInRegion.isStatic() */
  public override isStatic(): boolean {
    const ofStatic = (this.ofRegion as unknown as { isStatic?: () => boolean }).isStatic;
    const regStatic = (this.region as unknown as { isStatic?: () => boolean }).isStatic;
    return (typeof ofStatic !== "function" || ofStatic.call(this.ofRegion)) &&
           (typeof regStatic !== "function" || regStatic.call(this.region));
  }
}
