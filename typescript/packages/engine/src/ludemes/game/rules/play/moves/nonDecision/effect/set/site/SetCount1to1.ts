/**
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetCount.java
 *
 * Sets the count of pieces at a given site to the given value.
 *
 * Java parity (SetCount.eval lines 69-88):
 *   1. Evaluate loc = locationFunction.eval(context)
 *   2. Evaluate count = newCount.eval(context)
 *   3. Emit ActionSetCount(type, loc, what, count)
 *
 * NOTE: coverage-only transliteration; NOT registered in the 1:1 moves registry.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/site/SetCount.java — eval(Context)
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetCount } from "../../../../../../../../../action/action-set-count.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

export class SetCount1to1 implements MovesFunction {
  /**
   * Evaluates to the site index whose count is modified.
   * @java SetCount.locationFunction
   */
  private readonly locationFunction: IntFunction;

  /**
   * Evaluates to the new count value.
   * @java SetCount.newCount
   */
  private readonly newCount: IntFunction;

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/site/SetCount.java — constructor
   * @param locationFunction  The site to modify
   * @param newCount          The new count value
   */
  public constructor(locationFunction: IntFunction, newCount: IntFunction) {
    this.locationFunction = locationFunction;
    this.newCount = newCount;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/site/SetCount.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    // @java SetCount.java:73 — loc = locationFunction.eval(context)
    const loc = this.locationFunction.eval(ctx);
    if (loc < 0) return [];

    // @java SetCount.java:74 — count = newCount.eval(context)
    const count = this.newCount.eval(ctx);

    const mover = ctx.state.mover;

    // @java SetCount.java:76-77 — ActionSetCount(type, loc, what, count)
    // In the 1:1 path we don't pass `what` (handled by ActionSetCount internally)
    const action = new ActionSetCount({ to: loc, count });

    return [new LudiiMove({
      id: `setcount:${mover}:${loc}:${count}`,
      label: `SetCount(site=${loc}, count=${count})`,
      siteIndices: [loc],
      mover,
      placedOwner: mover,
      actions: [action],
    })];
  }
}
