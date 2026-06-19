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
  /** @java CountNumber.type — the SiteType this count is scoped to. */
  private readonly type: string | null;

  public constructor(regionFn: RegionFunction, type: string | null = null) {
    this.regionFn = regionFn;
    this.type = type;
  }

  /**
   * @java game/functions/ints/count/site/CountNumber.java — eval(Context)
   * For each site in region: sum state.countAtSite(site) (stack-depth / count field).
   * In non-stacking games: returns sum of count[site] values; in stacking: size of stack.
   */
  public eval(ctx: Context): number {
    const sites = this.regionFn.eval(ctx);
    // @java preprocess(): type = (type != null) ? type : game.board().defaultSite().
    const resolvedType = this.type ?? ctx.board().defaultSite();
    // @java ContainerFlatVertexState.countVertex(s) returns 0 for s beyond the
    // board's vertex/edge ChunkSet (i.e. hand/off-board container sites). On a
    // non-Cell board, (count at:<handSite>) therefore reads 0 — a sow capture
    // to hand (J'erin's (last To afterConsequence:True)) must not be re-counted
    // as a board pile. Cell boards keep the prior behaviour: Morris/Tapatan
    // legitimately count their hand via a bare (count at:<handSite>).
    const boardNumSites = ctx.board().numSites();
    let count = 0;
    for (const s of sites) {
      if (s < 0) continue;
      if (resolvedType !== "Cell" && s >= boardNumSites) continue;
      count += ctx.state.count(s);
    }
    return count;
  }
}
