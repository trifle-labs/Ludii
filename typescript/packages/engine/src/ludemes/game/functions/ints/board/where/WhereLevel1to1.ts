/**
 * WhereLevel1to1.ts
 *
 * Faithful 1:1 port of WhereLevel.
 *
 * @java game/functions/ints/board/where/WhereLevel.java
 *
 * Returns the level of a piece in a stack at the given site, or -1 (OFF)
 * if the piece is not found at that site.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, BooleanFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent } from "@ludii/typescript-language";
import { registerInt1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileBool1to1 } from "../../../../../../compiler1to1.js";

// ---------------------------------------------------------------------------
// WhereLevel
// ---------------------------------------------------------------------------
export class WhereLevel1to1 implements IntFunction {
  /** site to check */
  private readonly siteFn: IntFunction;
  /** what component index to look for (or null to look by owner) */
  private readonly whatFn: IntFunction | null;
  /** owner player id (used when whatFn is null) */
  private readonly playerFn: IntFunction | null;
  /** if true, scan from the top of the stack down */
  private readonly fromTopFn: BooleanFunction;

  public constructor(
    siteFn: IntFunction,
    whatFn: IntFunction | null,
    playerFn: IntFunction | null,
    fromTopFn: BooleanFunction,
  ) {
    this.siteFn = siteFn;
    this.whatFn = whatFn;
    this.playerFn = playerFn;
    this.fromTopFn = fromTopFn;
  }

  /**
   * @java game/functions/ints/board/where/WhereLevel.java — eval(Context)
   *
   * Java logic:
   *   site = siteFn.eval(ctx)
   *   if site out-of-range return Constants.OFF (-1)
   *   stackSize = cs.sizeStack(site, type) - 1  (topLevel)
   *   scan levels (from top or bottom):
   *     if cs.what(site, level, type) == what => return level
   *   return Constants.OFF (-1)
   */
  public eval(ctx: Context): number {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return -1;

    const numSite = ctx.state.cells.length;
    if (site >= numSite) return -1;

    const fromTop = this.fromTopFn.eval(ctx);

    // Determine what component index to find
    let what: number;
    if (this.whatFn !== null) {
      what = this.whatFn.eval(ctx);
      if (what <= 0) return -1; // Constants.NO_PIECE = 0, OFF = -1
    } else {
      // find by owner
      if (this.playerFn === null) return -1;
      const playerId = this.playerFn.eval(ctx);
      // Walk the stack to find the first occurrence belonging to this player
      const topLevel = ctx.state.stackSize(site) - 1;
      if (topLevel < 0) return -1;
      if (fromTop) {
        for (let level = topLevel; level >= 0; level--) {
          if (ctx.state.whoAtSiteLevel(site, level) === playerId) return level;
        }
      } else {
        for (let level = 0; level <= topLevel; level++) {
          if (ctx.state.whoAtSiteLevel(site, level) === playerId) return level;
        }
      }
      return -1;
    }

    const topLevel = ctx.state.stackSize(site) - 1;
    if (topLevel < 0) return -1;

    if (fromTop) {
      for (let level = topLevel; level >= 0; level--) {
        if (ctx.state.whatAtSiteLevel(site, level) === what) return level;
      }
    } else {
      for (let level = 0; level <= topLevel; level++) {
        if (ctx.state.whatAtSiteLevel(site, level) === what) return level;
      }
    }
    return -1;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/** @java game/functions/ints/board/where/WhereLevel.java — key "wherelevel" */
