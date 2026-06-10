// @java Core/src/game/functions/ints/math/Div.java

/**
 * Returns the (integer) division of two values.
 *
 * @java game/functions/ints/math/Div.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Div extends BaseIntFunction {
  /** @java Div.a */
  private readonly a: JavaIntFunction;
  /** @java Div.b */
  private readonly b: JavaIntFunction;

  /** @java Div(IntFunction a, IntFunction b) */
  public constructor(a: JavaIntFunction, b: JavaIntFunction) {
    super();
    this.a = a;
    this.b = b;
  }

  /**
   * @java Div.eval(Context) — Java int division truncates toward zero.
   * (Java throws on /0 upstream via willCrash; mirror with a 0 guard.)
   */
  public override eval(context: Context): number {
    const divisor = this.b.eval(context);
    if (divisor === 0) return 0;
    return Math.trunc(this.a.eval(context) / divisor);
  }

  /** @java Div.isStatic() */
  public isStatic(): boolean { return false; }
}
