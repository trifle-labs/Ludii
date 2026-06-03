// @java Core/src/game/functions/region/RegionFunction.java

/**
 * Returns a region (collection of sites) within a container.
 *
 * @java game/functions/region/RegionFunction.java
 *
 * Java parity: RegionFunction is an interface extending GameType. In the TS
 * 1:1 port this becomes a TypeScript interface. The canonical RegionFunction
 * interface is already exported from base.ts; this module re-declares it in
 * its own file for Java-source traceability WITHOUT re-exporting a clashing
 * symbol (to avoid duplicate-identifier errors with base.ts).
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";

/**
 * Region-valued ludeme interface.
 * @java game.functions.region.RegionFunction
 * NOTE: the canonical engine-wide export lives in src/ludemes/base.ts.
 * This declaration mirrors the Java source without clashing with that export.
 */
export interface RegionFunction {
  /** @java RegionFunction.eval(Context) */
  eval(ctx: Context & EvalScratch): number[];

  /**
   * @java RegionFunction.contains(Context, int)
   * Returns true iff the region evaluated in the given context contains the
   * given location. Default: delegate to eval().
   */
  contains?(ctx: Context & EvalScratch, location: number): boolean;

  /** @java RegionFunction.isHand() — true for hand-container regions. */
  isHand?(): boolean;
}
