// @java Core/src/game/functions/booleans/all/sites/AllDifferent.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileBool1to1, compileRegion1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (all Different <region> if:<cond>)
 * Returns true if all sites in the region pass the condition AND have distinct
 * piece indices (what values). Sites that do not pass the condition short-circuit
 * to false immediately.
 * @java game/functions/booleans/all/sites/AllDifferent.java
 */
export class AllDifferent1to1 implements BooleanFunction {
  /** @java AllDifferent.region */
  private readonly regionFn: RegionFunction;
  /** @java AllDifferent.condition */
  private readonly condFn: BooleanFunction;

  public constructor(regionFn: RegionFunction, condFn: BooleanFunction) {
    this.regionFn = regionFn;
    this.condFn = condFn;
  }

  /**
   * @java AllDifferent.eval(Context):
   *   for each site in region:
   *     setSite(site); if (!condition.eval) return false;
   *     else: what = cs.what(site,type); if whats contains what return false; else add
   *   return true
   */
  public eval(ctx: Context): boolean {
    const sites = this.regionFn.eval(ctx);
    const origSite = ctx._evalSite;
    const seen = new Set<number>();

    for (const site of sites) {
      ctx._evalSite = site;
      if (!this.condFn.eval(ctx)) {
        ctx._evalSite = origSite;
        return false;
      }
      // Java: cs.what(site, type) — component index at site
      const what = ctx.state.whatAtSite(site);
      if (seen.has(what)) {
        ctx._evalSite = origSite;
        return false;
      }
      seen.add(what);
    }

    ctx._evalSite = origSite;
    return true;
  }
}

registerBool1to1("all:different", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  // node = (all Different <region> if:<cond>)
  // positional[0] = "Different", positional[1] = region node
  const { positional, named } = parseArgs1to1((node as LudList).items);
  const regionNode = positional[1];
  const ifNode = named.get("if");

  if (!regionNode || !ifNode) {
    throw new Error("compiler1to1: (all Different <region> if:<cond>) — missing args");
  }

  const regionFn = compileRegion1to1(regionNode);
  const condFn = compileBool1to1(ifNode, env.numPlayers);
  return new AllDifferent1to1(regionFn, condFn);
});
