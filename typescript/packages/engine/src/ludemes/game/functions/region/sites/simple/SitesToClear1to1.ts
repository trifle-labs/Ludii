/**
 * SitesToClear1to1.ts
 * @java game/functions/region/sites/simple/SitesToClear.java
 *
 * (sites ToClear) — returns the sites scheduled for removal at end of
 * a capture sequence (deferred-removal draughts-family games).
 *
 * Java parity: SitesToClear.eval(context) returns context.state().regionToRemove()
 * which is the sitesToRemove list (sequence-capture queue).
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";

export class SitesToClear1to1 implements RegionFunction {
  /** @java game/functions/region/sites/simple/SitesToClear.java — eval(Context) */
  public eval(ctx: Context): number[] {
    // @java context.state().regionToRemove() → sitesToRemove list
    return [...ctx.state.sitesToRemove];
  }
}

