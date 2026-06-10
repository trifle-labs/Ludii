// @java Core/src/game/functions/range/RangeFunction.java

/**
 * Interface mirroring Java's RangeFunction — the Java-mirrored home for the
 * interface formerly hosted by Range1to1.ts (item-3 de-contamination).
 *
 * @java game/functions/range/RangeFunction.java
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";
import type { IntFunction } from "../../../base.js";

/** Result type returned by RangeFunction.eval(). */
export interface RangeResult {
  readonly min: number;
  readonly max: number;
}

/**
 * @java game/functions/range/RangeFunction.java
 */
export interface RangeFunction {
  eval(ctx: Context & EvalScratch): RangeResult;
  readonly minFn: IntFunction;
  readonly maxFn: IntFunction;
}
