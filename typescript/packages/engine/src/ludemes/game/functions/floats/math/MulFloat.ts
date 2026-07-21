// @java Core/src/game/functions/floats/math/Mul.java

/**
 * Returns the product of two float values, or of a list.
 *
 * @java game/functions/floats/math/Mul.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";

interface FloatLike { eval(ctx: Context): number }

export class Mul {
  /** @java Mul.list */
  private readonly list: FloatLike[];

  /**
   * @java Mul(FloatFunction a, FloatFunction b)
   * @java Mul(FloatFunction[] list)
   */
  public constructor(a: FloatLike | FloatLike[], b: FloatLike | null = null) {
    this.list = Array.isArray(a) ? a : (b !== null ? [a, b] : [a]);
  }

  /** @java Mul.eval(Context) */
  public eval(context: Context): number {
    let product = 1;
    for (const fn of this.list) product *= fn.eval(context);
    return product;
  }

  /** @java Mul.isStatic() */
  public isStatic(): boolean { return false; }
}
