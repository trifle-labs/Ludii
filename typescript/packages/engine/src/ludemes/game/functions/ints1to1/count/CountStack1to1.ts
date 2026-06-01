/**
 * CountStack1to1.ts
 * @java game/functions/ints/count/stack/CountStack.java
 *
 * (count Stack to:<site>) — returns number of pieces in stack at site.
 * (count Cell at:<site>) — synonym, same logic.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../compiler1to1.js";

export class CountStack1to1 implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /**
   * @java game/functions/ints/count/stack/CountStack.java — eval
   * Returns state.countAtSite(site) which is stacking depth.
   */
  public eval(ctx: Context): number {
    const site = this.siteFn.eval(ctx);
    return ctx.state.countAtSite(site);
  }
}

registerInt1to1("count:stack", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const toNode = named.get("to") ?? named.get("at");
  if (toNode) {
    try {
      return new CountStack1to1(compileInt1to1(toNode));
    } catch { /* fall through */ }
  }
  return new CountStack1to1({ eval: (ctx: Context) => ctx._evalTo });
});

registerInt1to1("count:cell", (node: LudNode, _env: Compile1to1Env): IntFunction => {
  const { named } = parseArgs1to1((node as LudList).items);
  const atNode = named.get("at");
  if (atNode) {
    try {
      return new CountStack1to1(compileInt1to1(atNode));
    } catch { /* fall through */ }
  }
  return new CountStack1to1({ eval: (ctx: Context) => ctx._evalFrom });
});
