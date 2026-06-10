// @java Core/src/game/functions/region/math/Difference.java

/**
 * Returns the sites of a region that are not in another region (or a single site).
 *
 * @java game/functions/region/math/Difference.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { RegionFunction } from "../../../../base.js";
import { BaseRegionFunction } from "../BaseRegionFunction.js";

interface IntLike { eval(ctx: Context): number }

export class Difference extends BaseRegionFunction {
  /** @java Difference.source */
  private readonly source: RegionFunction;
  /** @java Difference.subtraction */
  private readonly subtraction: RegionFunction | null;
  /** @java Difference.siteToRemove */
  private readonly siteToRemove: IntLike | null;

  /** @java Difference(RegionFunction source, @Or RegionFunction subtraction, @Or IntFunction siteToRemove) */
  public constructor(source: RegionFunction, subtraction: RegionFunction | null, siteToRemove: IntLike | null = null) {
    super();
    this.source = source;
    this.subtraction = subtraction;
    this.siteToRemove = siteToRemove;
  }

  /** @java Difference.eval(Context) — sites.remove(subtraction / siteToRemove) */
  public override eval(ctx: Context): number[] {
    const src = this.source.eval(ctx);
    if (this.siteToRemove !== null) {
      const site = this.siteToRemove.eval(ctx);
      return src.filter((s) => s !== site);
    }
    if (this.subtraction !== null) {
      const sub = new Set<number>(this.subtraction.eval(ctx));
      return src.filter((s) => !sub.has(s));
    }
    return [...src];
  }

  /** @java Difference.isStatic() */
  public override isStatic(): boolean { return false; }
}
