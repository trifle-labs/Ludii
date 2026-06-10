/**
 * @java game/rules/start/forEach/value/ForEachValue.java
 *
 * Applies a start rule for each integer value in the inclusive range [min, max].
 *
 * Java eval() sets context.setValue(to) before calling startRule.eval().
 * The inner start rule is invoked via applyToInitialState; inner rules that
 * read (value) via ctx._evalValue are documented as a deferred limitation.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { IntFunction } from "../../../../../base.js";
import type { StartRule } from "../../StartRule.js";
import type { Context } from "../../../../../../context.js";

/**
 * @java game/rules/start/forEach/value/ForEachValue.java
 */
export class ForEachValue1to1 implements StartRule {
  /** @java ForEachValue.minFn */
  private readonly minFn: IntFunction;

  /** @java ForEachValue.maxFn */
  private readonly maxFn: IntFunction;

  /** @java ForEachValue.startRule */
  private readonly startRule: StartRule;

  /**
   * @java ForEachValue(IntFunction min, IntFunction max, StartRule startRule)
   * @param min       Minimum value (inclusive).
   * @param max       Maximum value (inclusive).
   * @param startRule The rule to apply per value.
   */
  public constructor(min: IntFunction, max: IntFunction, startRule: StartRule) {
    this.minFn = min;
    this.maxFn = max;
    this.startRule = startRule;
  }

  /**
   * @java ForEachValue.eval(Context)
   *
   * Evaluates min and max, then iterates to in [min..max] (inclusive).
   * For each step, sets _evalValue on a fake context (Java: context.setValue(to))
   * and invokes the inner start rule.
   */
  /**
   * @java ForEachValue.eval(Context)
   *
   * Java: min/max evaluated on the context, then for each `to` in [min..max]:
   *   context.setValue(to); startRule.eval(context);
   * and finally context.setValue(savedValue).
   */
  public eval(ctx: Context): void {
    let min: number;
    let max: number;
    try {
      min = this.minFn.eval(ctx);
      max = this.maxFn.eval(ctx);
    } catch {
      return;
    }

    const scratch = ctx as Context & { _evalValue?: number };
    const saved = scratch._evalValue;
    for (let to = min; to <= max; to++) {
      // @java context.setValue(to)
      scratch._evalValue = to;
      if (typeof this.startRule.eval === "function") {
        this.startRule.eval(ctx);
      } else {
        // TRANSITION: array-shaped child (PlaceItem1to1) — feed it the bridge arrays.
        const a = (ctx as unknown as {
          _startArrays?: { cells: number[]; whats: number[]; countAt: number[]; stateAt: number[]; valueAt: number[] };
        })._startArrays;
        const g = ctx.game as unknown as { equipment: Equipment1to1; numPlayers: number };
        if (a) this.startRule.applyToInitialState?.(a.cells, a.whats, a.countAt, g.equipment, g.numPlayers, a.stateAt, a.valueAt, ctx);
      }
    }
    // @java context.setValue(savedValue)
    scratch._evalValue = saved as number;
  }
}


