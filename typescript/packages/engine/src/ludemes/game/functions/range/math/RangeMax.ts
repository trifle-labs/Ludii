/**
 * RangeMax.ts
 * @java game/functions/range/math/Max.java
 *
 * Returns a range with a specified maximum (inclusive) and undefined minimum
 * (Java Constants.UNDEFINED = -1).
 * NOT registered in any 1:1 registry — wired structurally by callers.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../base.js";
import type { RangeFunction1to1, RangeResult } from "../Range1to1.js";
import { IntConstant } from "../../ints/IntConstant.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class RangeMax implements RangeFunction1to1 {
  public readonly minFn: IntFunction;
  public readonly maxFn: IntFunction;

  /**
   * @java game/functions/range/math/Max.java — constructor(max)
   * min is set to Constants.UNDEFINED (-1).
   */
  constructor(max: IntFunction) {
    this.minFn = new IntConstant(UNDEFINED);
    this.maxFn = max;
  }

  /** @java game/functions/range/math/Max.java — eval(Context) */
  public eval(ctx: Context & EvalScratch): RangeResult {
    return { min: this.minFn.eval(ctx), max: this.maxFn.eval(ctx) };
  }
}
