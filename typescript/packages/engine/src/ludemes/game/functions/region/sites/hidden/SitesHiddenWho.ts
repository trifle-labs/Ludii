// @java Core/src/game/functions/region/sites/hidden/SitesHiddenWho.java

/**
 * Returns all the sites whose piece owner is hidden to a player on the board.
 *
 * @java game/functions/region/sites/hidden/SitesHiddenWho.java
 *
 * Java parity: iterates topology elements, calls
 * ContainerState.isHiddenWho(pid, site, 0, realType) and collects matches.
 *
 * TS parity: delegates to state.isHidden(who, site) — the single hidden flag.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * @java game.functions.region.sites.hidden.SitesHiddenWho
 */
export class SitesHiddenWho extends BaseRegionFunction {
  /** @java SitesHiddenWho — private final IntFunction whoFn */
  private readonly whoFn: IntFunction;

  /**
   * @java SitesHiddenWho(SiteType, Player, RoleType)
   * @param siteType Graph element type (null = game default).
   * @param whoFn    Player-index function.
   */
  public constructor(siteType: string | null, whoFn: IntFunction) {
    super();
    this.siteType = siteType;
    this.whoFn = whoFn;
  }

  /**
   * @java SitesHiddenWho.eval(Context)
   * Returns sites where the piece owner is hidden to the specified player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const who = this.whoFn.eval(ctx);
    const sites: number[] = [];
    const n = ctx.state.cells.length;
    for (let i = 0; i < n; i++) {
      // @java ContainerState.isHiddenWho(who, i, 0, realType)
      if (ctx.state.isHidden(who, i)) sites.push(i);
    }
    return sites;
  }
}
