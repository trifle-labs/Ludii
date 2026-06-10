// @java Core/src/game/functions/booleans/is/integer/IsOdd.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Odd <intFn>)
 * Tests if an integer value is odd.
 * @java game/functions/booleans/is/integer/IsOdd.java
 */
export class IsOdd1to1 implements BooleanFunction {
  /** @java IsOdd.value */
  private readonly value: IntFunction;

  public constructor(value: IntFunction) {
    this.value = value;
  }

  /** @java IsOdd.eval(Context): (value.eval(context) & 1) == 1 */
  public eval(ctx: Context): boolean {
    return (this.value.eval(ctx) & 1) === 1;
  }
}

