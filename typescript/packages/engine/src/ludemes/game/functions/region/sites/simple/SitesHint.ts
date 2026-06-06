// @java Core/src/game/functions/region/sites/simple/SitesHint.java

/**
 * Returns the hint region stored in the context.
 *
 * @java game/functions/region/sites/simple/SitesHint.java
 * @author Eric.Piette and cambolbro
 *
 * @remarks Rename from Hint ludeme to avoid compiler confusion.
 * Used on deduction puzzles to return the hint region.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, RegionFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns the hint region stored in the context.
 *
 * @java game/functions/region/sites/simple/SitesHint.java
 *
 * Java parity: eval returns context.hintRegion().eval(context).
 * TS: accesses hintRegion via escape hatch on the context.
 */
export class SitesHint extends BaseRegionFunction {
  /**
   * @java SitesHint constructor — nothing to initialise.
   */
  public constructor() {
    super();
  }

  /**
   * Returns the hint region stored in the context.
   *
   * @java SitesHint.eval(Context)
   *
   * Java parity: return context.hintRegion().eval(context).
   * TS: access hintRegion via escape hatch (deduction-puzzle context extension).
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java context.hintRegion().eval(context)
    const ctxAny = ctx as unknown as { hintRegion?(): RegionFunction | null };
    const hintRegionFn = typeof ctxAny.hintRegion === "function" ? ctxAny.hintRegion() : null;
    if (hintRegionFn !== null && hintRegionFn !== undefined) {
      return hintRegionFn.eval(ctx);
    }
    return [];
  }

  /** @java SitesHint.isStatic() — always false (depends on context state) */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesHint.toString() */
  public override toString(): string {
    return "Hint()";
  }
}
