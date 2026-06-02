/**
 * Exact1to1.ts
 * @java game/functions/range/math/Exact.java
 *
 * Returns a range of exactly one value (min == max == value).
 * NOT registered in any 1:1 registry — wired structurally by callers.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import type { IntFunction } from "../../../../base.js";
import type { RangeFunction1to1, RangeResult } from "../Range1to1.js";

export class Exact1to1 implements RangeFunction1to1 {
  public readonly minFn: IntFunction;
  public readonly maxFn: IntFunction;

  /**
   * @java game/functions/range/math/Exact.java — constructor(value)
   * The exact value is both the minimum and maximum.
   */
  constructor(value: IntFunction) {
    this.minFn = value;
    this.maxFn = value;
  }

  /** @java game/functions/range/math/Exact.java — eval(Context) */
  public eval(ctx: Context & EvalScratch): RangeResult {
    const v = this.minFn.eval(ctx);
    return { min: v, max: v };
  }
}
