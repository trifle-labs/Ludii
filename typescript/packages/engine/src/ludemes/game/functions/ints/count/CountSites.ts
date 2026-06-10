/**
 * CountSites.ts
 * @java game/functions/ints/count/site/CountSites.java
 *
 * (count Sites in:<region>) — returns the number of sites in the given region.
 * (count Sites at:<site>) — returns the container size for the named container.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";

export class CountSites implements IntFunction {
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

