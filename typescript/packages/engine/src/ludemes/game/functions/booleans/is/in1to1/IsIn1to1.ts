// @java Core/src/game/functions/booleans/is/in/IsIn.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, compileRegion1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is In <site> <region>)
 * Tests if a site (or set of sites) is in a region.
 * Default site = context._evalTo if omitted.
 * @java game/functions/booleans/is/in/IsIn.java
 */
export class IsIn1to1 implements BooleanFunction {
  /** @java IsIn.sites — site(s) to check */
  private readonly siteFn: IntFunction;
  /** @java IsIn.region */
  private readonly regionFn: RegionFunction;

  public constructor(siteFn: IntFunction, regionFn: RegionFunction) {
    this.siteFn = siteFn;
    this.regionFn = regionFn;
  }

  /**
   * @java IsIn (InSingleSite) eval(Context):
   *   location = site.eval(ctx); location != OFF && region.eval(ctx).bitSet().get(location)
   */
  public eval(ctx: Context): boolean {
    const location = this.siteFn.eval(ctx);
    if (location < 0) return false; // Constants.OFF
    const sites = this.regionFn.eval(ctx);
    return sites.includes(location);
  }
}

registerBool1to1("is:in", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  // positional[0] = "In", positional[1] = site, positional[2] = region
  const siteNode = positional[1];
  const regionNode = positional[2];

  if (!siteNode || !regionNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }

  const siteFn = compileInt1to1(siteNode);
  const regionFn = compileRegion1to1(regionNode);
  return new IsIn1to1(siteFn, regionFn);
});
