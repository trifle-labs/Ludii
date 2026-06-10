// @java Core/src/game/functions/booleans/math/Or.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isList, type LudList } from "@ludii/typescript-language";

/**
 * (or <bool1> <bool2>) or (or { <bool1> ... })
 * Short-circuit: returns true as soon as any sub-function returns true.
 * @java game/functions/booleans/math/Or.java
 */
export class Or1to1 implements BooleanFunction {
  /** @java Or.list */
  private readonly list: readonly BooleanFunction[];

  public constructor(list: readonly BooleanFunction[]) {
    this.list = list;
  }

  /** @java game/functions/booleans/math/Or.java — eval(Context): short-circuit true */
  public eval(ctx: Context): boolean {
    for (const fn of this.list) {
      if (fn.eval(ctx)) return true;
    }
    return false;
  }
}

