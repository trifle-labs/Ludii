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
 * until Game1to1.start() exposes the costAt array.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/sites/SetCost.java
 *
 * Mirrors the Java SetCost structure. applyToInitialState is currently a no-op
 * because the interface does not expose the costAt[] array that Java's
 * ActionSetCost writes to.
 */
export class SetCost1to1 implements StartRule {
  /** Site indices where cost will be set. */
  private readonly sites: readonly number[];

  /** The cost value to set. */
  private readonly cost: number;

  /**
   * @param sites  site indices (pre-evaluated region)
   * @param cost   cost value (pre-evaluated IntFunction)
   */
  public constructor(sites: readonly number[], cost: number) {
    this.sites = sites;
    this.cost = cost;
  }

  /**
   * @java game/rules/start/set/sites/SetCost.java — eval(Context)
   *
   * Java: for each loc in region, new ActionSetCost(type, loc, cost).apply(context)
   * TS-deferred: costAt[] not accessible via applyToInitialState interface.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: costAt[] not available in applyToInitialState signature.
    // Java: ActionSetCost(type, loc, costFn.eval(context)) for each loc in region.
    // this.sites and this.cost are correctly stored for future use.
    void this.sites;
    void this.cost;
  }
}
