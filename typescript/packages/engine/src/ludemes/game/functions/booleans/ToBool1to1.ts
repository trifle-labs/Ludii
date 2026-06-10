// @java Core/src/game/functions/booleans/ToBool.java

import type { Context } from "../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (toBool <intFn>)
 * Converts an integer function to boolean: false if 0, true otherwise.
 * @java game/functions/booleans/ToBool.java
 */
export class ToBool1to1 implements BooleanFunction {
  /** @java ToBool.intFn */
  private readonly intFn: IntFunction;

  public constructor(intFn: IntFunction) {
    this.intFn = intFn;
  }

  /**
   * @java ToBool.eval(Context):
   *   if (intFn != null) return intFn.eval(context) != 0;
   */
  public eval(ctx: Context): boolean {
    return this.intFn.eval(ctx) !== 0;
  }
}

