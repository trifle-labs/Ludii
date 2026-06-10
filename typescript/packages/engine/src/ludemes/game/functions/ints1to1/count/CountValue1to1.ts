/**
 * CountValue1to1.ts
 * @java game/functions/ints/count/value/CountValue.java
 *
 * (count Value of:<int> in:<intArray>) — returns the number of entries in
 * the array that equal the given value.
 *
 * Java eval (CountValue.java:47-59):
 *   final int value = valueFn.eval(context);
 *   final int[] array = arrayFn.eval(context);
 *   int count = 0;
 *   for (final int v : array)
 *     if (v == value) count++;
 *   return count;
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, IntArrayFunction, EvalScratch } from "../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";

/**
 * Returns the count of entries equal to `valueFn` in the array `arrayFn`.
 * @java game/functions/ints/count/value/CountValue.java
 */
export class CountValue1to1 implements IntFunction {
  /** @java CountValue.valueFn */
  private readonly valueFn: IntFunction;
  /** @java CountValue.arrayFn */
  private readonly arrayFn: IntArrayFunction;

  public constructor(valueFn: IntFunction, arrayFn: IntArrayFunction) {
    this.valueFn = valueFn;
    this.arrayFn = arrayFn;
  }

  /**
   * @java game/functions/ints/count/value/CountValue.java — eval(Context)
   * Mirror Java line-by-line:
   *   value = valueFn.eval(context)
   *   array = arrayFn.eval(context)
   *   count entries in array equal to value
   */
  public eval(ctx: Context & EvalScratch): number {
    // @java CountValue.java:47: final int value = valueFn.eval(context);
    const value = this.valueFn.eval(ctx);
    // @java CountValue.java:48: final int[] array = arrayFn.eval(context);
    const array = this.arrayFn.eval(ctx);
    // @java CountValue.java:49-53: for(final int v: array) if(v == value) count++;
    let count = 0;
    for (const v of array) {
      if (v === value) count++;
    }
    return count;
  }
}

/**
 * Factory for (count Value of:<int> in:<intArray>).
 * Positional layout: [0]="Value", [1]=of-int (fallback), [2]=in-array (fallback)
 * Named: of:<int>, in:<intArray>
 */
