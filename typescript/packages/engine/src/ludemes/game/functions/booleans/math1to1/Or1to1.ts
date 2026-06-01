// @java Core/src/game/functions/booleans/math/Or.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isList, type LudList } from "@ludii/typescript-language";
import { compileBool1to1, parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

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

registerBool1to1("or", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const bools: BooleanFunction[] = [];
  for (const p of positional) {
    if (isList(p) && p.delimiter === "curly") {
      for (const child of p.items) {
        if (isList(child)) bools.push(compileBool1to1(child, env.numPlayers));
      }
    } else if (isList(p)) {
      bools.push(compileBool1to1(p, env.numPlayers));
    }
  }
  return new Or1to1(bools);
});
