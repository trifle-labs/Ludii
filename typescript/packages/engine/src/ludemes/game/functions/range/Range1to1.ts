/**
 * Range1to1.ts
 * @java game/functions/range/Range.java
 * @java game/functions/range/RangeFunction.java
 * @java game/functions/range/BaseRangeFunction.java
 *
 * Faithful 1:1 port of Java RangeFunction / Range.
 *
 * Java Range.eval(context) returns itself (the Range object acts as its own
 * result). In TS we eagerly evaluate min/max to produce a plain {min, max}
 * record. NOT registered in any 1:1 registry — wired structurally by callers.
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";
import type { IntFunction } from "../../../base.js";

/** Result type returned by RangeFunction1to1.eval(). */
export interface RangeResult {
  readonly min: number;
  readonly max: number;
}

/**
 * Interface mirroring Java's RangeFunction.
 * @java game/functions/range/RangeFunction.java
 */
export interface RangeFunction1to1 {
  eval(ctx: Context & EvalScratch): RangeResult;
  readonly minFn: IntFunction;
  readonly maxFn: IntFunction;
}

/**
 * Returns a range of values (inclusive) according to specified min/max.
 * @java game/functions/range/Range.java
 */
export class Range1to1 implements RangeFunction1to1 {
  public readonly minFn: IntFunction;
  public readonly maxFn: IntFunction;

  /**
   * @java game/functions/range/Range.java — constructor(min, max?)
   * @param min Lower extent of range (inclusive).
   * @param max Upper extent of range (inclusive); defaults to min if omitted.
   */
  constructor(min: IntFunction, max?: IntFunction) {
    this.minFn = min;
    this.maxFn = max ?? min;
  }

  /** @java game/functions/range/Range.java — eval(Context) */
  public eval(ctx: Context & EvalScratch): RangeResult {
    return { min: this.minFn.eval(ctx), max: this.maxFn.eval(ctx) };
  }
}
