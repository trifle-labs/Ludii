// @java Core/src/game/functions/ints/math/If.java

/**
 * Returns one of two int values depending on a condition.
 *
 * @java game/functions/ints/math/If.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class If extends BaseIntFunction {
  /** @java If.cond */
  private readonly cond: BooleanFunction;
  /** @java If.valueA */
  private readonly valueA: JavaIntFunction;
  /** @java If.valueB */
  private readonly valueB: JavaIntFunction;

  /** @java If(BooleanFunction cond, IntFunction valueA, IntFunction valueB) */
  public constructor(cond: BooleanFunction, valueA: JavaIntFunction, valueB: JavaIntFunction) {
    super();
    this.cond = cond;
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java If.eval(Context) — cond ? valueA : valueB */
  public override eval(context: Context): number {
    return this.cond.eval(context) ? this.valueA.eval(context) : this.valueB.eval(context);
  }

  /** @java If.isStatic() */
  public isStatic(): boolean { return false; }
}
