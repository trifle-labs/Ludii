// @java Core/src/game/functions/booleans/is/integer/IsAnyDie.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is AnyDie <value>)
 * Returns true if any die shows the given value.
 * @java game/functions/booleans/is/integer/IsAnyDie.java
 */
export class IsAnyDie1to1 implements BooleanFunction {
  /** @java IsAnyDie.valueFn */
  private readonly valueFn: IntFunction;

  public constructor(valueFn: IntFunction) {
    this.valueFn = valueFn;
  }

  /**
   * @java IsAnyDie.eval(Context):
   *   value = valueFn.eval(context);
   *   for (dieValue : context.state().currentDice(0))
   *     if (value == dieValue) return true;
   *   return false;
   */
  public eval(ctx: Context): boolean {
    const value = this.valueFn.eval(ctx);
    const diceValues = ctx.state.diceValues;
    if (!diceValues || diceValues.length === 0) return false;
    for (const dieValue of diceValues) {
      if (value === dieValue) return true;
    }
    return false;
  }
}

