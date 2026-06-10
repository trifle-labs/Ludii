// @java Core/src/game/functions/booleans/math/Not.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isList, type LudList } from "@ludii/typescript-language";

/**
 * (not <bool>)
 * @java game/functions/booleans/math/Not.java
 */
export class Not1to1 implements BooleanFunction {
  /** @java Not.a */
  private readonly a: BooleanFunction;

  public constructor(a: BooleanFunction) {
    this.a = a;
  }

  /** @java game/functions/booleans/math/Not.java — eval(Context): !a.eval(context) */
  public eval(ctx: Context): boolean {
    return !this.a.eval(ctx);
  }
}

