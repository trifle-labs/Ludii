// @java Core/src/game/functions/booleans/math/Not.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isList, type LudList } from "@ludii/typescript-language";
import { compileBool1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

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

registerBool1to1("not", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const sub = compileBool1to1(positional[0], env.numPlayers);
  return new Not1to1(sub);
});
