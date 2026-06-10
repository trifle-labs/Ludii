// @java Core/src/game/functions/booleans/math/NotEqual.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (!= <intA> <intB>)
 * @java game/functions/booleans/math/NotEqual.java  (alias "!=")
 */
export class NotEqual implements BooleanFunction {
  /** @java NotEqual.valueA */
  private readonly valueA: IntFunction;
  /** @java NotEqual.valueB */
  private readonly valueB: IntFunction;

  public constructor(valueA: IntFunction, valueB: IntFunction) {
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java NotEqual.eval(Context): valueA.eval(context) != valueB.eval(context) */
  public eval(ctx: Context): boolean {
    return this.valueA.eval(ctx) !== this.valueB.eval(ctx);
  }
}

