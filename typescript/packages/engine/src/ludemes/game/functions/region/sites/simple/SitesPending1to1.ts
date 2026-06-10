/**
 * SitesPending1to1.ts
 * @java game/functions/region/sites/simple/SitesPending.java
 *
 * (sites Pending) — returns all sites with a non-zero pending value
 * in the current game state.
 *
 * Java parity: SitesPending.eval(context) returns context.state().pendingValues()
 * which is the pending set.
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

export class SitesPending1to1 implements RegionFunction {
  /** @java game/functions/region/sites/simple/SitesPending.java — eval(Context) */
  public eval(ctx: Context): number[] {
    // @java context.state().pendingValues().toArray()
    return [...ctx.state.pending];
  }
}

