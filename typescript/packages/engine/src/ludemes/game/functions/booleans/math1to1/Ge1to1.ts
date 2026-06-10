// @java Core/src/game/functions/booleans/math/Ge.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (>= <intA> <intB>)
 * @java game/functions/booleans/math/Ge.java  (alias ">=")
 */
export class Ge1to1 implements BooleanFunction {
  private readonly valueA: IntFunction;
  private readonly valueB: IntFunction;

  public constructor(valueA: IntFunction, valueB: IntFunction) {
    this.valueA = valueA;
    this.valueB = valueB;
  }

  /** @java Ge.eval(Context): valueA.eval(context) >= valueB.eval(context) */
  public eval(ctx: Context): boolean {
    return this.valueA.eval(ctx) >= this.valueB.eval(ctx);
  }
}

