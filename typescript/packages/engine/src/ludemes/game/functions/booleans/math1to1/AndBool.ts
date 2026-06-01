/**
 * @java game/functions/booleans/math/And.java
 *
 * (and <bool1> <bool2>) or (and { <bool1> <bool2> ... })
 *
 * Short-circuit: returns false as soon as any sub-function returns false.
 *
 * @java game/functions/booleans/math/And.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";

export class AndBool implements BooleanFunction {
  private readonly list: readonly BooleanFunction[];

  public constructor(list: readonly BooleanFunction[]) {
    this.list = list;
  }

  /**
   * @java game/functions/booleans/math/And.java — eval(Context)
   * Short-circuit: return false on first false sub-result.
   */
  public eval(ctx: Context): boolean {
    for (const fn of this.list) {
      if (!fn.eval(ctx)) return false;
    }
    return true;
  }
}
