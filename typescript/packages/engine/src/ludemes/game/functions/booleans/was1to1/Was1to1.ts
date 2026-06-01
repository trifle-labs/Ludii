// @java Core/src/game/functions/booleans/was/Was.java

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../registry1to1.js";

/**
 * (was Last In) / (was Last To) / (was Last From)
 * Checks if the last action placed a piece at the current "to" site.
 * @java game/functions/booleans/was/Was.java
 */
export class Was1to1 implements BooleanFunction {
  /**
   * @java Was.eval(Context):
   *   Simplified: context._evalTo >= 0 (a "to" site is set)
   */
  public eval(ctx: Context): boolean {
    return ctx._evalTo >= 0;
  }
}

registerBool1to1("was", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const typeNode = positional[0];
  if (typeNode && isIdent(typeNode)) {
    const typeName = typeNode.name.toLowerCase();
    if (typeName === "last") {
      // (was Last In/To/From) — check last move site
      return new Was1to1();
    }
  }
  return { eval(_ctx: Context): boolean { return false; } };
});
