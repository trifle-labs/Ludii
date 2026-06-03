// @java Core/src/game/functions/region/RegionConstant.java

/**
 * A fixed region of sites that does not change during the game.
 *
 * @java game/functions/region/RegionConstant.java
 *
 * Java parity: RegionConstant holds a constant Region (set of site indices)
 * and eval() simply returns that Region. isStatic() returns true.
 *
 * TS parity: The Java Region class is a wrapper for an int[]; here we store a
 * plain number[] and return it directly. The reference is shared (immutable by
 * convention — callers should not modify the returned array).
 */

import type { Context } from "../../../../context.js";
import type { EvalScratch } from "../../../base.js";
import { BaseRegionFunction } from "./BaseRegionFunction.js";

/**
 * @java game.functions.region.RegionConstant
 */
export class RegionConstant extends BaseRegionFunction {
  /** @java RegionConstant — private final Region region */
  private readonly region: readonly number[];

  /**
   * @java RegionConstant(Region region)
   * @param region The constant region (array of site indices).
   */
  public constructor(region: readonly number[]) {
    super();
    this.region = region;
  }

  /**
   * @java RegionConstant.eval(Context) — returns the stored constant region.
   */
  public override eval(_ctx: Context & EvalScratch): number[] {
    return [...this.region];
  }

  /**
   * @java RegionConstant.isStatic() — always true.
   */
  public override isStatic(): boolean {
    return true;
  }
}
