/**
 * If1to1.ts
 * @java game/functions/intArray/math/If.java
 *
 * (if <cond> <ok> [<notOk>]) — returns ok-array when condition is true, notOk otherwise.
 */

import type { Context } from "../../../../../context.js";
import type { IntArrayFunction, BooleanFunction } from "../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";

export class If1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/math/If.java — eval(Context) */
  constructor(
    private readonly condition: BooleanFunction,
    private readonly ok: IntArrayFunction,
    private readonly notOk: IntArrayFunction,
  ) {}

  public eval(ctx: Context): number[] {
    // @java If.java:60-65
    if (this.condition.eval(ctx)) {
      return this.ok.eval(ctx);
    } else {
      return this.notOk.eval(ctx);
    }
  }
}

