// @java Core/src/game/functions/floats/math/Sub.java

/**
 * Returns the difference of two float values.
 *
 * @java game/functions/floats/math/Sub.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";

interface FloatLike { eval(ctx: Context): number }

export class Sub {
  /** @java Sub.valueA */
  private readonly valueA: FloatLike;
  /** @java Sub.valueB */
  private readonly valueB: FloatLike;

  /** @java Sub(FloatFunction valueA, FloatFunction valueB) */
  public constructor(valueA: FloatLike, valueB: FloatLike) {
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java Sub.eval(Context) */
  public eval(context: Context): number {
    return this.valueA.eval(context) - this.valueB.eval(context);
  }

  /** @java Sub.isStatic() */
  public isStatic(): boolean { return false; }
}
