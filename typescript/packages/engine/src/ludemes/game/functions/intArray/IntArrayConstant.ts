// @java Core/src/game/functions/intArray/IntArrayConstant.java

/**
 * Sets a constant array of int values.
 *
 * @java game/functions/intArray/IntArrayConstant.java
 *
 * Java parity: IntArrayConstant holds an IntFunction[] and eval() calls each
 * one in order, returning the resulting int[].
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../base.js";
import { BaseIntArrayFunction } from "./BaseIntArrayFunction.js";

/**
 * A constant int-array ludeme built from an array of IntFunction values.
 * @java game.functions.intArray.IntArrayConstant
 */
export class IntArrayConstant extends BaseIntArrayFunction {
  /** @java IntArrayConstant — private final IntFunction[] ints */
  private readonly ints: IntFunction[];

  /**
   * @java IntArrayConstant(IntFunction[] ints)
   * @param ints The values of the array.
   */
  public constructor(ints: IntFunction[]) {
    super();
    this.ints = ints;
  }

  /**
   * @java IntArrayConstant.eval(Context)
   * Evaluates each IntFunction in order and returns the resulting int[].
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const result: number[] = new Array(this.ints.length);
    for (let i = 0; i < this.ints.length; i++) {
      const fn = this.ints[i];
      result[i] = fn !== undefined ? fn.eval(ctx) : 0;
    }
    return result;
  }

  public override toString(): string {
    let sb = "[";
    for (let i = 0; i < this.ints.length; i++) {
      if (i > 0) sb += ",";
      sb += String(this.ints[i]);
    }
    sb += "]";
    return sb;
  }
}
