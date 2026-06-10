// @java Core/src/game/functions/ints/math/Abs.java

/**
 * Returns the absolute value.
 *
 * @java game/functions/ints/math/Abs.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Abs extends BaseIntFunction {
  /** @java Abs.value */
  private readonly value: JavaIntFunction;

  /** @java Abs(IntFunction value) */
  public constructor(value: JavaIntFunction) {
    super();
    this.value = value;
  }

  /** @java Abs.eval(Context) — Math.abs(value.eval(context)) */
  public override eval(context: Context): number {
    return Math.abs(this.value.eval(context));
  }

  /** @java Abs.isStatic() */
  public isStatic(): boolean { return false; }
}
