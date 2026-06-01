/**
 * @java game/functions/ints/IntConstant.java IntConstant
 *
 * A constant integer function — wraps a literal value.
 * Java parity: IntConstant.eval(context) always returns the stored value.
 */

import type { Context } from "../../../../context.js";
import type { IntFunction } from "../../../base.js";

export class IntConstant implements IntFunction {
  private readonly value: number;

  public constructor(value: number) {
    this.value = value;
  }

  /** @java game/functions/ints/IntConstant.java — eval() */
  public eval(_ctx: Context): number {
    return this.value;
  }
}
