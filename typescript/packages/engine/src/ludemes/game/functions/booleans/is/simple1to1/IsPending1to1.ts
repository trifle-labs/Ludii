// @java Core/src/game/functions/booleans/is/simple/IsPending.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Pending)
 * Checks if the current game state is a pending state (any value is on the pending list).
 * @java game/functions/booleans/is/simple/IsPending.java
 */
export class IsPending1to1 implements BooleanFunction {
  /**
   * @java IsPending.eval(Context): context.state().isPending()
   */
  public eval(ctx: Context): boolean {
    // @java IsPending.eval: context.state().isPending() — true when ANY value is
    // on the pending list (non-empty pending set). Note state.isPending(site)
    // takes a site argument, so check the set's size directly.
    const state = ctx.state as unknown as { pending?: ReadonlySet<number> };
    return (state.pending?.size ?? 0) > 0;
  }
}

