// @java Core/src/game/functions/ints/math/Sub.java

/**
 * Returns the difference of two values (valueA - valueB); unary form negates.
 *
 * @java game/functions/ints/math/Sub.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Sub extends BaseIntFunction {
  /** @java Sub.valueA — IntConstant(0) when the unary form (- b) is used */
  private readonly valueA: JavaIntFunction;
  /** @java Sub.valueB */
  private readonly valueB: JavaIntFunction;

  /** @java Sub(@Opt IntFunction valueA, IntFunction valueB) */
  public constructor(valueA: JavaIntFunction | null, valueB: JavaIntFunction) {
    super();
    this.valueA = valueA ?? ({ eval: () => 0 } as unknown as JavaIntFunction);
    this.valueB = valueB;
  }

  /** @java Sub.eval(Context) — valueA.eval - valueB.eval */
  public override eval(context: Context): number {
    return this.valueA.eval(context) - this.valueB.eval(context);
  }

  /** @java Sub.isStatic() */
  public isStatic(): boolean { return false; }
}
