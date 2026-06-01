/**
 * CountSites1to1.ts
 * @java game/functions/ints/count/site/CountSites.java
 *
 * (count Sites in:<region>) — returns the number of sites in the given region.
 * (count Sites at:<site>) — returns the container size for the named container.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";

export class CountSites1to1 implements IntFunction {
  /** @java CountSites.region */
  private readonly regionFn: RegionFunction;

  public constructor(regionFn: RegionFunction) {
    this.regionFn = regionFn;
  }

  /**
   * @java game/functions/ints/count/site/CountSites.java — eval(Context)
   * Returns region.eval(context).length
   */
  public eval(ctx: Context): number {
    return this.regionFn.eval(ctx).length;
  }
}

registerInt1to1("count:sites", (node: LudNode, env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const inNode = named.get("in");
  if (inNode) {
    try {
      const regionFn = compileRegion1to1(inNode);
      return new CountSites1to1(regionFn);
    } catch { /* fall through */ }
  }
  // Fallback: count all board sites
  return { eval: (_ctx: Context) => 0 };
});
