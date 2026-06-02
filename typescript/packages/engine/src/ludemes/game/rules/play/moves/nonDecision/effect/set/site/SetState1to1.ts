/**
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java
 *
 * Sets the local state of a location (e.g. piece orientation) to the given value.
 *
 * Java parity (SetState.eval lines 75-117):
 *   1. Evaluate stateValue = state.eval(context)
 *   2. Evaluate site = siteFn.eval(context)
 *   3. If site < 0 or stateValue < 0, return empty
 *   4. Emit ActionSetState(realType, site, level, stateValue)
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java — eval(Context)
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetState } from "../../../../../../../../../action/action-set-state.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

export class SetState1to1 implements MovesFunction {
  /**
   * Evaluates to the site index whose state is modified.
   * @java SetState.siteFn
   */
  private readonly siteFn: IntFunction;

  /**
   * Evaluates to the new state value.
   * @java SetState.state
   */
  private readonly stateFn: IntFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java — constructor
   * @param siteFn   The site to modify (named arg `site:` in Java)
   * @param stateFn  The new local state value
   */
  public constructor(siteFn: IntFunction, stateFn: IntFunction) {
    this.siteFn = siteFn;
    this.stateFn = stateFn;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/site/SetState.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    // @java SetState.java:78 — stateValue = state.eval(context)
    const stateValue = this.stateFn.eval(ctx);
    if (stateValue < 0) return [];

    // @java SetState.java:83 — site = siteFn.eval(context)
    const site = this.siteFn.eval(ctx);
    if (site < 0) return [];

    const mover = ctx.state.mover;

    // @java SetState.java:105 — ActionSetState(realType, site, level, stateValue)
    // level is omitted (UNDEFINED) in the flat 1:1 path
    const action = new ActionSetState({ to: site, state: stateValue });

    return [new LudiiMove({
      id: `setstate:${mover}:${site}:${stateValue}`,
      label: `SetState(site=${site}, state=${stateValue})`,
      siteIndices: [site],
      mover,
      placedOwner: mover,
      actions: [action],
    })];
  }
}
