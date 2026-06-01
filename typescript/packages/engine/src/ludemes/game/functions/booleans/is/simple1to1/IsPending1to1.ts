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
    const state = ctx.state as unknown as { isPending?: () => boolean; pending?: boolean };
    if (state.isPending) return state.isPending();
    if (state.pending !== undefined) return state.pending;
    return false;
  }
}

registerBool1to1("is:pending", (_node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  return new IsPending1to1();
});
