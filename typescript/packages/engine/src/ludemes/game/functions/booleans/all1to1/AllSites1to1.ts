// @java Core/src/game/functions/booleans/all/sites/AllSites.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileBool1to1, compileRegion1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

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

registerBool1to1("all:sites", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  // node = (all Sites <region> if:<cond>)
  // After parseArgs1to1 (startFrom=1): positional[0]="Sites", positional[1]=region
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Sites" ident, positional[1] = region node
  const regionNode = positional[1];
  const ifNode = named.get("if");

  if (!regionNode || !ifNode) {
    throw new Error("compiler1to1: (all Sites <region> if:<cond>) — missing args");
  }

  const regionFn = compileRegion1to1(regionNode);
  const condFn = compileBool1to1(ifNode, env.numPlayers);
  return new AllSites1to1(regionFn, condFn);
});
