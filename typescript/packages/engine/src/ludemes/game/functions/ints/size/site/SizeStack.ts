// @java Core/src/game/functions/ints/size/site/SizeStack.java

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";

/**
 * Returns the size of a stack — at a single site (`at:`) or summed over a
 * region (`in:`).
 *
 * @java game/functions/ints/size/site/SizeStack.java
 * @author Eric.Piette
 */
export class SizeStack implements IntFunction {
  // @java SizeStack.region — IntArrayFromRegion: prefer the `in:` region; else the `at:` site.
  private readonly atFn: IntFunction | null;
  private readonly inFn: RegionFunction | null;

  /**
   * @param atFn The `at:` location (IntFunction), or a fallback LastTo.
   * @param inFn The `in:` region (RegionFunction), or null.
   * @java SizeStack(SiteType type, @Or2 @Name RegionFunction in, @Or2 @Name IntFunction at)
   */
  public constructor(atFn: IntFunction | null, inFn: RegionFunction | null = null) {
    // Java: region = new IntArrayFromRegion(
    //   (in == null && at != null ? at : in == null ? new LastTo(null) : null),
    //   (in != null) ? in : null);
    this.atFn = inFn === null ? atFn : null;
    this.inFn = inFn;
  }

  /** @java SizeStack.eval — sum state.sizeStack(site) over every site in the region. */
  public eval(ctx: Context): number {
    const sites = this.inFn !== null
      ? this.inFn.eval(ctx as never)
      : this.atFn !== null
        ? [this.atFn.eval(ctx as never)]
        : [];
    let count = 0;
    for (const site of sites) {
      if (site < 0) continue;
      // @java BaseContainerStateStacking.sizeStack(site, type)
      count += ctx.state.stackSize(site);
    }
    return count;
  }
}
