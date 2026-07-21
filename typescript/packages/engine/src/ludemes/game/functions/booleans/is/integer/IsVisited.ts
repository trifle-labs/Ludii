// @java Core/src/game/functions/booleans/is/integer/IsVisited.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { type LudList } from "@ludii/typescript-language";

/**
 * (is Visited <site>)
 * Returns true if a site was already visited during the current player's sequence of moves.
 * @java game/functions/booleans/is/integer/IsVisited.java
 */
export class IsVisited implements BooleanFunction {
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

