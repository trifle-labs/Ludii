// @java Core/src/game/functions/booleans/math/Xor.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isList, type LudList } from "@ludii/typescript-language";

/**
 * (xor <bool1> <bool2>)
 * True if exactly one of the two conditions is true.
 * @java game/functions/booleans/math/Xor.java
 */
export class Xor implements BooleanFunction {
  /** @java Xor.a */
  private readonly a: BooleanFunction;
  /** @java Xor.b */
  private readonly b: BooleanFunction;

  public constructor(a: BooleanFunction, b: BooleanFunction) {
    this.a = a;
    this.b = b;
  }

  /**
   * @java game/functions/booleans/math/Xor.java — eval(Context):
   *   return a.eval(context) ^ b.eval(context)
   */
  public eval(ctx: Context): boolean {
    return this.a.eval(ctx) !== this.b.eval(ctx);
  }
}

