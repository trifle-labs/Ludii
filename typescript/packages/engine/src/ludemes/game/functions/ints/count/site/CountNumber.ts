// @java Core/src/game/functions/ints/count/site/CountNumber.java


import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Game } from "../../../../../Game.js";
import type { Rules } from "../../../../rules/Rules.js";

export class CountNumber implements IntFunction {
  /** @java CountNumber.region */
  private readonly regionFn: RegionFunction;

  public constructor(regionFn: RegionFunction) {
    this.regionFn = regionFn;
  }

  /**
   * @java game/functions/ints/count/site/CountNumber.java — eval(Context)
   * For each site in region: sum state.countAtSite(site) (stack-depth / count field).
   * In non-stacking games: returns sum of count[site] values; in stacking: size of stack.
   */
  public eval(ctx: Context): number {
    const sites = this.regionFn.eval(ctx);
    let count = 0;
    for (const s of sites) {
      if (s < 0) continue;
      count += ctx.state.count(s);
    }
    return count;
  }
}
