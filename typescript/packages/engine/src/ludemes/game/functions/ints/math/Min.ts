// @java Core/src/game/functions/ints/math/Min.java

/**
 * Returns the minimum of two values, or of an array of values.
 *
 * @java game/functions/ints/math/Min.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

const UNDEFINED = -1;

/** Minimal IntArrayFunction shape (eval → number[]). */
interface IntArrayLike { eval(ctx: Context): number[] }

export class Min extends BaseIntFunction {
  /** @java Min.array — IntArrayConstant([valueA, valueB]) for the two-value ctor */
  private readonly array: IntArrayLike;

  /**
   * @java Min(IntFunction valueA, IntFunction valueB)
   * @java Min(IntArrayFunction array)
   * Both Java ctors funnel into the array form, exactly like Java's
   * `array = new IntArrayConstant(new IntFunction[]{ valueA, valueB })`.
   */
  public constructor(a: JavaIntFunction | IntArrayLike | null = null, b: JavaIntFunction | null = null) {
    super();
    // @java two ctors (valueA,valueB) and (IntArrayFunction) both funnel into
    // the array form. The reflection compiler may deliver a lone array arg in
    // EITHER slot, so treat null/undefined as absent and use the array form
    // whenever fewer than two real operands are present (see Mul).
    const aPresent = a != null;
    const bPresent = b != null;
    if (aPresent && bPresent) {
      const valueA = a as JavaIntFunction;
      const valueB = b;
      this.array = { eval: (ctx: Context) => [valueA.eval(ctx), valueB.eval(ctx)] };
    } else {
      this.array = (aPresent ? a : b) as IntArrayLike;
    }
  }

  /** @java Min.eval(Context) */
  public override eval(context: Context): number {
    const values = this.array.eval(context);
    if (values.length === 0) return UNDEFINED;
    let min = values[0]!;
    for (let i = 1; i < values.length; i++) min = Math.min(min, values[i]!);
    return min;
  }

  /** @java Min.isStatic() */
  public isStatic(): boolean { return false; }
}
