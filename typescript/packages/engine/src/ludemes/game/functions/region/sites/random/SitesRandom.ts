// @java Core/src/game/functions/region/sites/random/SitesRandom.java

/**
 * Returns a list of random sites in a region.
 *
 * @java game/functions/region/sites/random/SitesRandom.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction, RegionFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns a list of random sites in a region.
 *
 * @java game/functions/region/sites/random/SitesRandom.java
 */
export class SitesRandom extends BaseRegionFunction {
  /** @java SitesRandom — region (the region to pick from) */
  private readonly region: RegionFunction;

  /** @java SitesRandom — numSitesFn (number of sites to return) */
  private readonly numSitesFn: IntFunction;

  /**
   * @param region     The region to pick from.
   * @param numSitesFn The number of sites to return randomly [default 1].
   * @java SitesRandom constructor
   */
  public constructor(region: RegionFunction, numSitesFn: IntFunction) {
    super();
    this.region = region;
    this.numSitesFn = numSitesFn;
  }

  /**
   * Returns a random subset of the region sites.
   *
   * @java SitesRandom.eval(Context)
   *
   * Java parity:
   *   1. Get all sites in the region.
   *   2. Clamp numSites to regionSites.length.
   *   3. Randomly pick unique sites until we have numSites.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const sites: number[] = [];
    const regionSites = this.region.eval(ctx);
    let numSites = this.numSitesFn.eval(ctx);

    // @java SitesRandom — clamp to available sites
    if (numSites > regionSites.length) {
      numSites = regionSites.length;
    }

    // @java SitesRandom — randomly pick unique sites
    while (sites.length !== numSites) {
      if (regionSites.length === 0) break;
      // @java context.rng().nextInt(regionSites.length)
      const rng = ctx.rng;
      const idx = rng.nextInt(regionSites.length);
      const site = regionSites[idx] ?? regionSites[0]!;
      if (!sites.includes(site)) {
        sites.push(site);
      }
    }

    return sites;
  }

  /** @java SitesRandom.isStatic() — always false (stochastic) */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesRandom.toString() */
  public override toString(): string {
    return "SitesRandom()";
  }
}
