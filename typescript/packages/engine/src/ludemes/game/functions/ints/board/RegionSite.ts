// @java Core/src/game/functions/ints/board/RegionSite.java

/**
 * Returns the site of a region at a given index.
 *
 * @java game/functions/ints/board/RegionSite.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { RegionFunction } from "../../../../base.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

const OFF = -1;

export class RegionSite extends BaseIntFunction {
  /** @java RegionSite.region */
  private readonly region: RegionFunction;
  /** @java RegionSite.index */
  private readonly index: JavaIntFunction;

  /** @java RegionSite(RegionFunction region, @Name IntFunction index) */
  public constructor(region: RegionFunction, index: JavaIntFunction) {
    super();
    this.region = region;
    this.index = index;
  }

  /** @java RegionSite.eval(Context) — region.eval(context).sites()[index], OFF when out of range */
  public override eval(context: Context): number {
    const sites = this.region.eval(context as never);
    const i = this.index.eval(context);
    if (i < 0 || i >= sites.length) return OFF;
    return sites[i]!;
  }

  /** @java RegionSite.isStatic() */
  public isStatic(): boolean { return false; }
}
