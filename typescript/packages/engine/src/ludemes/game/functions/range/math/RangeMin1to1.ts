/**
 * RangeMin1to1.ts
 * @java game/functions/range/math/Min.java
 *
 * Returns a range with a specified minimum (inclusive) and unbounded maximum
 * (Java Constants.INFINITY = 1_000_000_000).
 * NOT registered in any 1:1 registry — wired structurally by callers.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../base.js";
import type { RangeFunction1to1, RangeResult } from "../Range1to1.js";
import { IntConstant } from "../../ints/IntConstant.js";

/** Java Constants.INFINITY = 1_000_000_000 */
const INFINITY = 1_000_000_000;

export class RangeMin1to1 implements RangeFunction1to1 {
  public readonly minFn: IntFunction;
  public readonly maxFn: IntFunction;

  /**
   * @java game/functions/range/math/Min.java — constructor(min)
   * max is set to Constants.INFINITY (1_000_000_000).
   */
  constructor(min: IntFunction) {
    this.minFn = min;
    this.maxFn = new IntConstant(INFINITY);
  }

  /** @java game/functions/range/math/Min.java — eval(Context) */
  public eval(ctx: Context & EvalScratch): RangeResult {
    return { min: this.minFn.eval(ctx), max: this.maxFn.eval(ctx) };
  }
}
