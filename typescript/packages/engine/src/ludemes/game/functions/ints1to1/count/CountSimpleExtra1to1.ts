/**
 * CountSimpleExtra1to1.ts
 *
 * Faithful 1:1 ports of simple board-topology count ludemes not already
 * in the exclusion list:
 *   CountCells, CountPhases, CountNumber
 *
 * @java game/functions/ints/count/simple/CountCells.java
 * @java game/functions/ints/count/simple/CountPhases.java
 * @java game/functions/ints/count/site/CountNumber.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Game1to1 } from "../../../../Game1to1.js";
import type { Rules } from "../../../rules/Rules.js";

// ---------------------------------------------------------------------------
// CountCells
// ---------------------------------------------------------------------------
export class CountCells implements IntFunction {
  /**
   * @java game/functions/ints/count/simple/CountCells.java — eval(Context)
   * Returns context.game().board().topology().cells().size() — i.e. board numSites.
   */
  public eval(ctx: Context): number {
    return (ctx.game as unknown as Game1to1).equipment.board.numSites;
  }
}

// ---------------------------------------------------------------------------
// CountPhases
// ---------------------------------------------------------------------------
export class CountPhases1to1 implements IntFunction {
  /**
   * @java game/functions/ints/count/simple/CountPhases.java — eval(Context)
   * Returns context.game().rules().phases().length — number of game phases.
   */
  public eval(ctx: Context): number {
    const rules = (ctx.game as unknown as Game1to1).rules as unknown as Rules;
    return rules.phases?.length ?? 1;
  }
}

// ---------------------------------------------------------------------------
// CountNumber
// ---------------------------------------------------------------------------
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
      count += ctx.state.countAtSite(s);
    }
    return count;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

