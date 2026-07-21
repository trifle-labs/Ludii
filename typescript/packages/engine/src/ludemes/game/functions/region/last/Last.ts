// @java Core/src/game/functions/region/last/Last.java

/**
 * Returns sites related to the last move.
 *
 * @java game/functions/region/last/Last.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch, RegionFunction } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";
import { LastBetween } from "./LastBetween.js";
import { LastRegionType } from "./LastRegionType.js";

/**
 * Factory class for Last region ludemes. The real constructor arms dispatch
 * to specialised subclasses (e.g. LastBetween).
 *
 * @java game.functions.region.last.Last
 */
export class Last extends BaseRegionFunction {
  /**
   * @java Last.construct(LastRegionType)
   * Factory method that returns the appropriate RegionFunction for the given type.
   */
  public static construct(regionType: LastRegionType): RegionFunction {
    switch (regionType) {
      case LastRegionType.Between:
        return new LastBetween();
      default:
        throw new Error(`Last.construct: LastRegionType not implemented: ${String(regionType)}`);
    }
  }

  /** Private — use {@link Last.construct} instead. */
  private constructor() {
    super();
  }

  /**
   * @java Last.eval(Context)
   * Should never be called; Last is a factory class only.
   */
  public override eval(_ctx: Context & EvalScratch): number[] {
    return [];
  }

  /** @java Last.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
