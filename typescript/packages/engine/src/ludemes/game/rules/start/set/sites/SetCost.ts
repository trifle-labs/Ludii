/**
 * Sets the cost of graph element(s) at given sites.
 *
 * @java game/rules/start/set/sites/SetCost.java — eval(Context)
 *
 * DEFERRED: Java ActionSetCost modifies the topology graph element cost,
 * which is stored in State.costAt[] in this TS port. The applyToInitialState
 * interface only provides cells/whats/countAt arrays; costAt is not accessible.
 * The compile1to1 path skips (set Cost …) start rules entirely.
 * This class is a faithful data-holder but cannot apply its cost mutation
 * until Game.start() exposes the costAt array.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { Context } from "../../../../../../context.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/sites/SetCost.java
 *
 * Mirrors the Java SetCost structure. applyToInitialState is currently a no-op
 * because the interface does not expose the costAt[] array that Java's
 * ActionSetCost writes to.
 */
export class SetCost implements StartRule {
  /** The cost value function. */
  private readonly costFn: IntFunction;

  /** Type of graph element to set. */
  private readonly type: SiteType | null;

  /** The single site to set, if the @Or site argument was used. */
  private readonly site: IntFunction | null;

  /** The region to set, if the @Or region argument was used. */
  private readonly region: RegionFunction | null;

  /**
   * @java public SetCost(IntFunction cost, @Opt SiteType type, @Or IntFunction site, @Or RegionFunction region)
   *
   * @param cost   The new cost.
   * @param type   The type of the graph element.
   * @param site   The site to set.
   * @param region The region to set.
   */
  public constructor(
    cost: IntFunction,
    type: SiteType | null | undefined,
    site: IntFunction | null | undefined,
    region: RegionFunction | null | undefined,
  ) {
    this.costFn = cost;
    this.type = type ?? null;
    this.site = site ?? null;
    this.region = region ?? null;
  }

  /**
   * @java game/rules/start/set/sites/SetCost.java — eval(Context)
   *
   * Java: for each loc in region, new ActionSetCost(type, loc, cost).apply(context)
   * TS-deferred: costAt[] not accessible via applyToInitialState interface.
   */
  public eval(_ctx: Context): void {
    // Deferred until State convergence: costAt[] is not yet part of the
    // engine state. Java applies an action through Context here.
    void this.site;
  }
}
