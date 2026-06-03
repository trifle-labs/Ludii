// @java Core/src/game/functions/region/sites/hidden/SitesHiddenValue.java

/**
 * Returns all the sites whose piece value is hidden to a player on the board.
 *
 * @java game/functions/region/sites/hidden/SitesHiddenValue.java
 *
 * Java parity: iterates topology elements, calls
 * ContainerState.isHiddenValue(pid, site, 0, realType) and collects matches.
 *
 * TS parity: delegates to state.isHidden(who, site) — the single hidden flag.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * @java game.functions.region.sites.hidden.SitesHiddenValue
 */
export class SitesHiddenValue extends BaseRegionFunction {
  /** @java SitesHiddenValue — private final IntFunction whoFn */
  private readonly whoFn: IntFunction;

  /**
   * @java SitesHiddenValue(SiteType, Player, RoleType)
   * @param siteType Graph element type (null = game default).
   * @param whoFn    Player-index function.
   */
  public constructor(siteType: string | null, whoFn: IntFunction) {
    super();
    this.siteType = siteType;
    this.whoFn = whoFn;
  }

  /**
   * @java SitesHiddenValue.eval(Context)
   * Returns sites where the piece value is hidden to the specified player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const who = this.whoFn.eval(ctx);
    const sites: number[] = [];
    const n = ctx.state.cells.length;
    for (let i = 0; i < n; i++) {
      // @java ContainerState.isHiddenValue(who, i, 0, realType)
      if (ctx.state.isHidden(who, i)) sites.push(i);
    }
    return sites;
  }
}
