// @java Core/src/game/functions/region/sites/hidden/SitesHiddenState.java

/**
 * Returns all the sites whose site state is hidden to a player on the board.
 *
 * @java game/functions/region/sites/hidden/SitesHiddenState.java
 *
 * Java parity: iterates topology elements, calls
 * ContainerState.isHiddenState(pid, site, 0, realType) and collects matches.
 *
 * TS parity: delegates to state.isHidden(who, site) — the single hidden flag.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * @java game.functions.region.sites.hidden.SitesHiddenState
 */
export class SitesHiddenState extends BaseRegionFunction {
  /** @java SitesHiddenState — private final IntFunction whoFn */
  private readonly whoFn: IntFunction;

  /**
   * @java SitesHiddenState(SiteType, Player, RoleType)
   * @param siteType Graph element type (null = game default).
   * @param whoFn    Player-index function.
   */
  public constructor(siteType: string | null, whoFn: IntFunction) {
    super();
    this.siteType = siteType;
    this.whoFn = whoFn;
  }

  /**
   * @java SitesHiddenState.eval(Context)
   * Returns sites where the site state is hidden to the specified player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const who = this.whoFn.eval(ctx);
    const sites: number[] = [];
    const n = ctx.state.cells.length;
    for (let i = 0; i < n; i++) {
      // @java ContainerState.isHiddenState(who, i, 0, realType)
      if (ctx.state.isHidden(who, i)) sites.push(i);
    }
    return sites;
  }
}
