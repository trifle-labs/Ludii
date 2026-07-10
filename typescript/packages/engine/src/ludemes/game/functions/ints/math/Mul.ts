// @java Core/src/game/functions/ints/math/Mul.java

/**
 * Returns the product of two values, or of an array of values.
 *
 * @java game/functions/ints/math/Mul.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import { IntArrayConstant } from "../../intArray/IntArrayConstant.js";

const UNDEFINED = -1;

/** Mulimal IntArrayFunction shape (eval → number[]). */
interface IntArrayLike { eval(ctx: Context): number[] }

export class Mul extends BaseIntFunction {
  /** @java Mul.array — IntArrayConstant([valueA, valueB]) for the two-value ctor */
  private readonly array: IntArrayLike;

  /**
   * @java Mul(IntFunction valueA, IntFunction valueB)
   * @java Mul(IntArrayFunction array)
   * Both Java ctors funnel into the array form, exactly like Java's
   * `array = new IntArrayConstant(new IntFunction[]{ valueA, valueB })`.
   */
  public constructor(a: JavaIntFunction | IntArrayLike | null = null, b: JavaIntFunction | null = null) {
    super();
    // @java Mul has two ctors — Mul(valueA, valueB) and Mul(IntArrayFunction).
    // Both funnel into the array form. The reflection compiler may place a lone
    // (sizes …)/array argument in EITHER slot (it arrived as Mul(null, array) for
    // `(* (sizes Group Mover))`), so treat null/undefined in a slot as absent and
    // use the array form whenever fewer than two real operands are present.
    const aPresent = a != null;
    const bPresent = b != null;
    if (aPresent && bPresent) {
      const valueA = a as JavaIntFunction;
      const valueB = b;
      this.array = { eval: (ctx: Context) => [valueA.eval(ctx), valueB.eval(ctx)] };
    } else {
      const lone = (aPresent ? a : b) as IntArrayLike | JavaIntFunction[];
      // @java Mul(@Or IntFunction[] list, @Or IntArrayFunction array):
      //   this.array = (array != null) ? array : new IntArrayConstant(list);
      // The reflection compiler binds the `list` @Or param as a raw IntFunction[]
      // (e.g. `(* {3 #1 #1})` in Coil's corner setup), which has no .eval — Java
      // wraps it in an IntArrayConstant. A lone `array` @Or already implements eval.
      this.array = Array.isArray(lone)
        ? new IntArrayConstant(lone as unknown as JavaIntFunction[])
        : (lone as IntArrayLike);
    }
  }

  /** @java Mul.eval(Context) */
  public override eval(context: Context): number {
    const values = this.array.eval(context);
    if (values.length === 0) return 0;
    let product = 1;
    for (const v of values) product *= v;
    return product;
  }

  /** @java Mul.isStatic() */
  public isStatic(): boolean { return false; }
}
