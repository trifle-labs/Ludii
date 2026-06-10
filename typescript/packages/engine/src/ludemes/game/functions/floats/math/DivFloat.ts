// @java Core/src/game/functions/floats/math/Div.java

/**
 * Returns the quotient of two float values.
 *
 * @java game/functions/floats/math/Div.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";

interface FloatLike { eval(ctx: Context): number }

export class Div {
  /** @java Div.a */
  private readonly a: FloatLike;
  /** @java Div.b */
  private readonly b: FloatLike;

  /** @java Div(FloatFunction a, FloatFunction b) */
  public constructor(a: FloatLike, b: FloatLike) {
    this.a = a;
    this.b = b;
  }

  /** @java Div.eval(Context) */
  public eval(context: Context): number {
    return this.b.eval(context) === 0 ? 0 : this.a.eval(context) / this.b.eval(context);
  }

  /** @java Div.isStatic() */
  public isStatic(): boolean { return false; }
}
