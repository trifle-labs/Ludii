// @java Core/src/game/functions/booleans/math/NotEqual.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (!= <intA> <intB>)
 * @java game/functions/booleans/math/NotEqual.java  (alias "!=")
 */
export class NotEqual1to1 implements BooleanFunction {
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

registerBool1to1("!=", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const a = compileInt1to1(positional[0]);
  const b = compileInt1to1(positional[1]);
  return new NotEqual1to1(a, b);
});
