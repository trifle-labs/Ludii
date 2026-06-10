// @java Core/src/game/functions/booleans/math/Equals.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (= <intA> <intB>)
 * @java game/functions/booleans/math/Equals.java  (alias "=")
 */
export class Equals1to1 implements BooleanFunction {
  /** @java Equals.valueA */
  private readonly valueA: IntFunction;
  /** @java Equals.valueB */
  private readonly valueB: IntFunction;

  public constructor(valueA: IntFunction, valueB: IntFunction) {
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java Equals.eval(Context): valueA.eval(context) == valueB.eval(context) */
  public eval(ctx: Context): boolean {
    return this.valueA.eval(ctx) === this.valueB.eval(ctx);
  }
}

