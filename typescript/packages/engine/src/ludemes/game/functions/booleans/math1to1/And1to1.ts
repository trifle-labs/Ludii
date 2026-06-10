// @java Core/src/game/functions/booleans/math/And.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isList, type LudList } from "@ludii/typescript-language";

/**
 * (and <bool1> <bool2>) or (and { <bool1> ... })
 * Short-circuit: returns false as soon as any sub-function returns false.
 * @java game/functions/booleans/math/And.java
 */
export class And1to1 implements BooleanFunction {
  /** @java And.list */
  private readonly list: readonly BooleanFunction[];

  public constructor(list: readonly BooleanFunction[]) {
    this.list = list;
  }

  /** @java game/functions/booleans/math/And.java — eval(Context): short-circuit false */
  public eval(ctx: Context): boolean {
    for (const fn of this.list) {
      if (!fn.eval(ctx)) return false;
    }
    return true;
  }
}

