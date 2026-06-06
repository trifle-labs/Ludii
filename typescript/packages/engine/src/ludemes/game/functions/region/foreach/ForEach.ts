// @java Core/src/game/functions/region/foreach/ForEach.java

/**
 * Returns a region filtering with a condition or built according to different
 * player/team/level indices. This class is a dispatch facade — it should never
 * be eval()‑ed directly; only its static construct() results are used.
 *
 * @java game/functions/region/foreach/ForEach.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

/**
 * Dispatch-only class. In Java the static construct() overloads select a
 * concrete subclass (ForEachLevel, ForEachTeam, ForEachSite,
 * ForEachSiteInRegion, ForEachPlayer). This TS version mirrors that: the class
 * itself throws on eval() and every static factory returns the matching
 * subclass instance.
 *
 * @java game.functions.region.foreach.ForEach
 */
export class ForEach extends BaseRegionFunction {
  private constructor() {
    super();
  }

  /**
   * @java ForEach.eval(Context)
   * Should never be called — ForEach is a pure dispatch class.
   */
  public override eval(_ctx: Context & EvalScratch): number[] {
    // @java ForEach.java:139-141 — throw if called directly
    throw new Error("ForEach.eval(): Should never be called directly.");
  }

  /** @java ForEach.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
