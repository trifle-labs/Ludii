// @java Core/src/game/functions/booleans/is/integer/IsVisited.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Visited <site>)
 * Returns true if a site was already visited during the current player's sequence of moves.
 * @java game/functions/booleans/is/integer/IsVisited.java
 */
export class IsVisited1to1 implements BooleanFunction {
  /** @java IsVisited.siteId */
  private readonly siteId: IntFunction;

  public constructor(siteId: IntFunction) {
    this.siteId = siteId;
  }

  /**
   * @java game/functions/booleans/is/integer/IsVisited.java — eval(Context):
   *   context.state().isVisited(siteId.eval(context))
   */
  public eval(ctx: Context): boolean {
    const site = this.siteId.eval(ctx);
    const state = ctx.state as unknown as { isVisited?: (s: number) => boolean; visited?: Set<number> };
    if (state.isVisited) return state.isVisited(site);
    if (state.visited) return state.visited.has(site);
    return false;
  }
}

registerBool1to1("is:visited", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional } = parseArgs1to1((node as LudList).items);
  const siteNode = positional[1];
  if (!siteNode) {
    // Default: check _evalTo
    return { eval(ctx: Context): boolean {
      const s = ctx._evalTo;
      const state = ctx.state as unknown as { isVisited?: (s: number) => boolean; visited?: Set<number> };
      if (state.isVisited) return state.isVisited(s);
      if (state.visited) return state.visited.has(s);
      return false;
    }};
  }
  const siteFn = compileInt1to1(siteNode);
  return new IsVisited1to1(siteFn);
});
