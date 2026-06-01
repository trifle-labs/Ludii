/**
 * @java game/functions/booleans/is/integer/IsEven.java
 *
 * (is Even <intFn>) — tests whether the integer value is even.
 *
 * @java game/functions/booleans/is/integer/IsEven.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";

export class IsEven implements BooleanFunction {
  private readonly value: IntFunction;

  public constructor(value: IntFunction) {
    this.value = value;
  }

  /** Java: (resolvedValue & 1) == 0 */
  public eval(ctx: Context): boolean {
    return (this.value.eval(ctx) & 1) === 0;
  }
}
