// @java Core/src/game/functions/ints/size/site/SizeStack.java

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import { compileFlags } from "../../../../../../ludii/compiler/compile-flags.js";

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
    // @java SizeStack.java:91 — gameFlags(game) unconditionally ORs in
    // GameType.Stacking; any ludeme that reads stack SIZE implies the game
    // IS a stacking game, independent of whether it also writes stacks via
    // Add/Place/Hop/Step/Slide/FromTo. The TS compile-flags accumulator
    // (compile-flags.ts) mirrors Java's per-ludeme gameFlags() OR-ing but
    // this class never set it, so a stacking game whose ONLY stack-aware
    // ludeme was (size Stack ...) compiled with state.stackingGame=false —
    // the very first Add onto an occupied site then took the flat
    // "overwrite" path (action-add.ts:146-169) instead of pushing a new
    // level (Adere: WINNER_MISMATCH @60).
    compileFlags.usesStacking = true;
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
