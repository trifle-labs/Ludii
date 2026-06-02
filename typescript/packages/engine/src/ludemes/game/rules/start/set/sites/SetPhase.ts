/**
 * Sets the phase of graph element(s) at given sites.
 *
 * @java game/rules/start/set/sites/SetPhase.java — eval(Context)
 *
 * DEFERRED: Java ActionSetPhase modifies the topology graph element phase.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * The compile1to1 path skips (set Phase …) start rules entirely.
 * This class is a faithful data-holder but cannot apply its phase mutation
 * until Game1to1.start() exposes a phaseAt[] array.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { StartRule } from "../../StartRule.js";

/**
 * @java game/rules/start/set/sites/SetPhase.java
 *
 * Mirrors the Java SetPhase structure. applyToInitialState is currently a no-op
 * because the interface does not expose a per-site phase array for the board
 * topology (distinct from the per-player phases in State.phases[]).
 */
export class SetPhase1to1 implements StartRule {
  /** Site indices where phase will be set. */
  private readonly sites: readonly number[];

  /** The phase value to set. */
  private readonly phase: number;

  /**
   * @param sites  site indices (pre-evaluated region)
   * @param phase  phase value (pre-evaluated IntFunction)
   */
  public constructor(sites: readonly number[], phase: number) {
    this.sites = sites;
    this.phase = phase;
  }

  /**
   * @java game/rules/start/set/sites/SetPhase.java — eval(Context)
   *
   * Java: for each loc in region, new ActionSetPhase(type, loc, phaseFn.eval(context)).apply(context)
   * TS-deferred: per-site topology phase not accessible via applyToInitialState interface.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: per-site topology phase array not available in applyToInitialState.
    // Java: ActionSetPhase(type, loc, phaseFn.eval(context)) for each loc in region.
    void this.sites;
    void this.phase;
  }
}
