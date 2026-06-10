// @java Core/src/game/functions/ints/size/site/SizeStack.java

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game } from "../../../../../Game.js";

export class SizeStack implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /** @java game/functions/ints/size/site/SizeStack.java — eval: state.stateStack(site).size() */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return 0;
    // stackSize returns the true stack height (max of stacks[s].length, countAt[s], 1 if occupied)
    // @java ContainerState.sizeStack(site) — used by (size Stack at:site)
    return ctx.state.stackSize(s);
  }
}
