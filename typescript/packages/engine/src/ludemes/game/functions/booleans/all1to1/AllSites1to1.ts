// @java Core/src/game/functions/booleans/all/sites/AllSites.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (all Sites <region> if:<cond>)
 * True if ALL sites in region satisfy the condition.
 * @java game/functions/booleans/all/sites/AllSites.java
 */
export class AllSites1to1 implements BooleanFunction {
  /** @java AllSites.region */
  private readonly regionFn: RegionFunction;
  /** @java AllSites.condition */
  private readonly condFn: BooleanFunction;

  public constructor(regionFn: RegionFunction, condFn: BooleanFunction) {
    this.regionFn = regionFn;
    this.condFn = condFn;
  }

  /**
   * @java AllSites.eval(Context):
   *   for each site in region: setSite(site); if (!cond.eval) return false; return true
   */
  public eval(ctx: Context): boolean {
    const sites = this.regionFn.eval(ctx);
    const origSite = ctx._evalSite;
    for (const s of sites) {
      ctx._evalSite = s;
      if (!this.condFn.eval(ctx)) {
        ctx._evalSite = origSite;
        return false;
      }
    }
    ctx._evalSite = origSite;
    return true;
  }
}

