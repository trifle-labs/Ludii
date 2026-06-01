// @java Core/src/game/functions/booleans/is/integer/IsEven.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Even <intFn>)
 * Tests if an integer value is even.
 * @java game/functions/booleans/is/integer/IsEven.java
 */
export class IsEven1to1 implements BooleanFunction {
  /** @java IsEven.value */
  private readonly value: IntFunction;

  public constructor(value: IntFunction) {
    this.value = value;
  }

  /** @java IsEven.eval(Context): (value.eval(context) & 1) == 0 */
  public eval(ctx: Context): boolean {
    return (this.value.eval(ctx) & 1) === 0;
  }
}

registerBool1to1("is:even", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const valNode = positional[1];
  if (!valNode) {
    return { eval(_ctx: Context): boolean { return false; } };
  }
  const val = compileInt1to1(valNode);
  return new IsEven1to1(val);
});
