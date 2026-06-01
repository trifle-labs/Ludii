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
import type { Rules1to1 } from "../../../rules/Rules1to1.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";

// ---------------------------------------------------------------------------
// CountCells
// ---------------------------------------------------------------------------
export class CountCells1to1 implements IntFunction {
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
    const rules = (ctx.game as unknown as Game1to1).rules as unknown as Rules1to1;
    return rules.phases?.length ?? 1;
  }
}

// ---------------------------------------------------------------------------
// CountNumber
// ---------------------------------------------------------------------------
export class CountNumber1to1 implements IntFunction {
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

registerInt1to1("count:cells", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  void _node; void _env;
  return new CountCells1to1();
});

registerInt1to1("count:phases", (_node: LudNode, _env: Compile1to1Env): IntFunction => {
  void _node; void _env;
  return new CountPhases1to1();
});

registerInt1to1("count:number", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  // (count Number in:<region>) or (count Number at:<site>)
  const inNode = named.get("in");
  const atNode = named.get("at");

  let regionFn: RegionFunction;
  if (inNode) {
    try { regionFn = compileRegion1to1(inNode); }
    catch {
      try {
        const siteFn = compileInt1to1(inNode);
        regionFn = { eval: (ctx: Context) => { const s = siteFn.eval(ctx); return s >= 0 ? [s] : []; } };
      } catch { regionFn = { eval: (_ctx: Context) => [] }; }
    }
  } else if (atNode) {
    try {
      const siteFn = compileInt1to1(atNode);
      regionFn = { eval: (ctx: Context) => { const s = siteFn.eval(ctx); return s >= 0 ? [s] : []; } };
    } catch { regionFn = { eval: (_ctx: Context) => [] }; }
  } else {
    // Default: last-to site (mirrors Java's LastTo default in CountNumber)
    regionFn = { eval: (ctx: Context) => { const s = ctx._evalTo; return s >= 0 ? [s] : []; } };
  }

  return new CountNumber1to1(regionFn);
});
