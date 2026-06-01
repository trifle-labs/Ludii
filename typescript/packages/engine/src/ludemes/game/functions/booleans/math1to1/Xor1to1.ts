// @java Core/src/game/functions/booleans/math/Xor.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isList, type LudList } from "@ludii/typescript-language";
import { compileBool1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (xor <bool1> <bool2>)
 * True if exactly one of the two conditions is true.
 * @java game/functions/booleans/math/Xor.java
 */
export class Xor1to1 implements BooleanFunction {
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

registerBool1to1("xor", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const a = compileBool1to1(positional[0], env.numPlayers);
  const b = compileBool1to1(positional[1], env.numPlayers);
  return new Xor1to1(a, b);
});
