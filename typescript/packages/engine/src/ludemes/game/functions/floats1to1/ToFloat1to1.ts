/**
 * ToFloat1to1.ts
 * @java game/functions/floats/ToFloat.java
 *
 * (toFloat <boolFn|intFn>) — converts a BooleanFunction (true→1, false→0)
 * or an IntFunction to a float.
 */

import type { Context } from "../../../../context.js";
import type { FloatFunction, BooleanFunction, IntFunction } from "../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerFloat1to1, type Compile1to1Env } from "../../../registry1to1.js";
import { parseArgs1to1, compileFloat1to1, compileBool1to1, compileInt1to1 } from "../../../../compiler1to1.js";
import { isList } from "@ludii/typescript-language";

export class ToFloatBool1to1 implements FloatFunction {
  private readonly boolFn: BooleanFunction;

  public constructor(boolFn: BooleanFunction) {
    this.boolFn = boolFn;
  }

  /** @java game/functions/floats/ToFloat.java — eval: boolFn ? 1 : 0 */
  public eval(ctx: Context): number {
    return this.boolFn.eval(ctx) ? 1 : 0;
  }
}

export class ToFloatInt1to1 implements FloatFunction {
  private readonly intFn: IntFunction;

  public constructor(intFn: IntFunction) {
    this.intFn = intFn;
  }

  /** @java game/functions/floats/ToFloat.java — eval: (float) intFn.eval(context) */
  public eval(ctx: Context): number {
    return this.intFn.eval(ctx);
  }
}

