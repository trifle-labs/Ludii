// @java Core/src/game/functions/region/sites/hidden/SitesHiddenWhat.java

/**
 * Returns all the sites whose piece index is hidden to a player on the board.
 *
 * @java game/functions/region/sites/hidden/SitesHiddenWhat.java
 *
 * Java parity: iterates topology elements, calls
 * ContainerState.isHiddenWhat(pid, site, 0, realType) and collects matches.
 *
 * TS parity: delegates to state.isHidden(who, site) — the single hidden flag.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * @java game.functions.region.sites.hidden.SitesHiddenWhat
 */
export class SitesHiddenWhat extends BaseRegionFunction {
  /** @java SitesHiddenWhat — private final IntFunction whoFn */
  private readonly whoFn: IntFunction;

  /**
   * @java SitesHiddenWhat(SiteType, Player, RoleType)
   * @param siteType Graph element type (null = game default).
   * @param whoFn    Player-index function.
   */
  public constructor(siteType: string | null, whoFn: IntFunction) {
    super();
    this.siteType = siteType;
    this.whoFn = whoFn;
  }

  /**
   * @java SitesHiddenWhat.eval(Context)
   * Returns sites where the piece index is hidden to the specified player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const who = this.whoFn.eval(ctx);
    const sites: number[] = [];
    const n = ctx.state.cells.length;
    for (let i = 0; i < n; i++) {
      // @java ContainerState.isHiddenWhat(who, i, 0, realType)
      if (ctx.state.isHidden(who, i)) sites.push(i);
    }
    return sites;
  }
}
