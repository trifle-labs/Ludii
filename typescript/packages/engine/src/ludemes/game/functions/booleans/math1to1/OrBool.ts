/**
 * @java game/functions/booleans/math/Or.java
 *
 * (or <bool1> <bool2>) or (or { <bool1> <bool2> ... })
 *
 * Short-circuit: returns true as soon as any sub-function returns true.
 *
 * @java game/functions/booleans/math/Or.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";

export class OrBool implements BooleanFunction {
  /** Sub-boolean-functions. @java Or.list */
  private readonly list: readonly BooleanFunction[];

  public constructor(list: readonly BooleanFunction[]) {
    this.list = list;
  }

  /**
   * @java game/functions/booleans/math/Or.java — eval(Context)
   * Short-circuit: return true on first true sub-result.
   */
  public eval(ctx: Context): boolean {
    for (const fn of this.list) {
      if (fn.eval(ctx)) return true;
    }
    return false;
  }
}
