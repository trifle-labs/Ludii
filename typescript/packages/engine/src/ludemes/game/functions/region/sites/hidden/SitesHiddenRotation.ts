// @java Core/src/game/functions/region/sites/hidden/SitesHiddenRotation.java

/**
 * Returns all the sites whose rotation is hidden to a player on the board.
 *
 * @java game/functions/region/sites/hidden/SitesHiddenRotation.java
 *
 * Java parity: SitesHiddenRotation iterates all topology elements of the
 * given SiteType, calls ContainerState.isHiddenRotation(pid, site, 0, type)
 * and collects matching sites. When roleType has many IDs, iterates over all
 * real players for that role.
 *
 * TS parity: The TS State exposes only a single isHidden(pid, site) method.
 * Per-field hidden-info flags (isHiddenRotation etc.) are not separately
 * modelled; this class delegates to state.isHidden() as the closest available
 * parity. The site count comes from state.cells.length.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * @java game.functions.region.sites.hidden.SitesHiddenRotation
 */
export class SitesHiddenRotation extends BaseRegionFunction {
  /** @java SitesHiddenRotation — private final IntFunction whoFn */
  private readonly whoFn: IntFunction;

  /**
   * @java SitesHiddenRotation(SiteType, Player, RoleType)
   * @param siteType Graph element type (null = game default).
   * @param whoFn    Player-index function resolving to the target player.
   */
  public constructor(siteType: string | null, whoFn: IntFunction) {
    super();
    this.siteType = siteType;
    this.whoFn = whoFn;
  }

  /**
   * @java SitesHiddenRotation.eval(Context)
   * Returns sites where the rotation is hidden to the specified player.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const who = this.whoFn.eval(ctx);
    const sites: number[] = [];
    const n = ctx.state.cells.length;
    for (let i = 0; i < n; i++) {
      // @java ContainerState.isHiddenRotation(who, i, 0, realType)
      if (ctx.state.isHidden(who, i)) sites.push(i);
    }
    return sites;
  }
}
