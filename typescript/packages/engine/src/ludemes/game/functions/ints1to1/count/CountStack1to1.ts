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

