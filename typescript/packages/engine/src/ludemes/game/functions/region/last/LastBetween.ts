// @java Core/src/game/functions/region/last/LastBetween.java

/**
 * Returns the "between" sites of the last move played.
 *
 * @java game/functions/region/last/LastBetween.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

/**
 * Returns the non-decision "between" sites of the last move (e.g. captured
 * sites in a hop move).
 * @java game.functions.region.last.LastBetween
 */
export class LastBetween extends BaseRegionFunction {
  /**
   * @java LastBetween()
   */
  public constructor() {
    super();
  }

  /**
   * @java LastBetween.eval(Context)
   * Returns the between sites of the last move, or empty if no move yet.
   *
   * Java: context.trial().lastMove().betweenNonDecision().toArray()
   * TS: accesses the `betweenNonDecision` property on the last move via
   * an escape hatch since the TS Move type does not declare it yet.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java LastBetween.java:33 — get last move from trial
    const move = ctx.trial.lastMove();
    if (move == null) return [];
    // @java LastBetween.java:35 — move.betweenNonDecision().toArray()
    const moveAny = move as unknown as { betweenNonDecision?: () => { toArray?: () => number[] } | number[] };
    const between = moveAny.betweenNonDecision?.();
    if (between == null) return [];
    if (Array.isArray(between)) return between;
    const arr = (between as { toArray?: () => number[] }).toArray?.();
    return arr ?? [];
  }

  /** @java LastBetween.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
