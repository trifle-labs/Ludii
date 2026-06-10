/**
 * Sets the phase of graph element(s) at given sites.
 *
 * @java game/rules/start/set/sites/SetPhase.java — eval(Context)
 *
 * DEFERRED: Java ActionSetPhase modifies the topology graph element phase.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * The compile1to1 path skips (set Phase …) start rules entirely.
 * This class is a faithful data-holder but cannot apply its phase mutation
 * until Game.start() exposes a phaseAt[] array.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { Context } from "../../../../../../context.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/sites/SetPhase.java
 *
 * Mirrors the Java SetPhase structure. applyToInitialState is currently a no-op
 * because the interface does not expose a per-site phase array for the board
 * topology (distinct from the per-player phases in State.phases[]).
 */
export class SetPhase implements StartRule {
  /** The phase value function. */
  private readonly phaseFn: IntFunction;

  /** Type of graph element to set. */
  private readonly type: SiteType | null;

  /** The single site to set, if the @Or site argument was used. */
  private readonly site: IntFunction | null;

  /** The region to set, if the @Or region argument was used. */
  private readonly region: RegionFunction | null;

  /**
   * @java public SetPhase(IntFunction phase, @Opt SiteType type, @Or IntFunction site, @Or RegionFunction region)
   *
   * @param phase  The new phase.
   * @param type   The type of the graph element.
   * @param site   The site to set.
   * @param region The region to set.
   */
  public constructor(
    phase: IntFunction,
    type: SiteType | null | undefined,
    site: IntFunction | null | undefined,
    region: RegionFunction | null | undefined,
  ) {
    this.phaseFn = phase;
    this.type = type ?? null;
    this.site = site ?? null;
    this.region = region ?? null;
  }

  /**
   * @java game/rules/start/set/sites/SetPhase.java — eval(Context)
   *
   * Java: for each loc in region, new ActionSetPhase(type, loc, phaseFn.eval(context)).apply(context)
   * TS-deferred: per-site topology phase not accessible via applyToInitialState interface.
   */
  public eval(_ctx: Context): void {
    // Deferred until State convergence: per-site topology phase is not yet part of the
    // engine state. Java applies an action through Context here.
    void this.site;
  }
}
