/**
 * FloatConstant1to1.ts
 * @java game/functions/floats/FloatConstant.java
 *
 * (float <value>) — returns a constant float value.
 * In .lud ASTs a bare number node (e.g. 5.5) is handled directly by
 * compileFloat1to1; this class handles the explicit (float N) form.
 */

import type { Context } from "../../../../context.js";
import type { FloatFunction } from "../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerFloat1to1, type Compile1to1Env } from "../../../registry1to1.js";
import { parseArgs1to1 } from "../../../../compiler1to1.js";
import { isNumber } from "@ludii/typescript-language";

export class FloatConstant1to1 implements FloatFunction {
  private readonly a: number;

  public constructor(a: number) {
    this.a = a;
  }

  /** @java game/functions/floats/FloatConstant.java — eval(Context) */
  public eval(_ctx: Context): number {
    return this.a;
  }
}

registerFloat1to1("float", (node: LudNode, _env: Compile1to1Env): FloatFunction => {
  const { positional } = parseArgs1to1((node as import("@ludii/typescript-language").LudList).items);
  const valNode = positional[0];
  if (valNode && isNumber(valNode)) return new FloatConstant1to1(valNode.value);
  return new FloatConstant1to1(0);
});
