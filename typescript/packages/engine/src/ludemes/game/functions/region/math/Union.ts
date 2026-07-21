// @java Core/src/game/functions/region/math/Union.java

/**
 * Returns the union of two regions, or of many regions.
 *
 * @java game/functions/region/math/Union.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { RegionFunction } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

export class Union extends BaseRegionFunction {
  /** @java Union.region1 */
  private readonly region1: RegionFunction | null;
  /** @java Union.region2 */
  private readonly region2: RegionFunction | null;
  /** @java Union.regions */
  private readonly regions: readonly RegionFunction[] | null;

  /**
   * @java Union(RegionFunction region1, RegionFunction region2)
   * @java Union(RegionFunction[] regions)
   */
  public constructor(a: RegionFunction | readonly RegionFunction[], b: RegionFunction | null = null) {
    super();
    if (Array.isArray(a)) {
      this.region1 = null;
      this.region2 = null;
      this.regions = a as readonly RegionFunction[];
    } else {
      this.region1 = a as RegionFunction;
      this.region2 = b;
      this.regions = null;
    }
  }

  /** @java Union.eval(Context) — sites.union(...) */
  public override eval(ctx: Context): number[] {
    const out = new Set<number>();
    if (this.regions !== null) {
      for (const r of this.regions) for (const s of r.eval(ctx)) out.add(s);
    } else {
      for (const s of this.region1!.eval(ctx)) out.add(s);
      if (this.region2) for (const s of this.region2.eval(ctx)) out.add(s);
    }
    return [...out];
  }

  /** @java Union.isStatic() */
  public override isStatic(): boolean { return false; }
}
