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
registerInt1to1("wherelevel", (node: LudNode, env: Compile1to1Env): IntFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);

  // at:<site> is required
  const atNode = named.get("at") ?? positional.find((_n, i) => i > 0);
  const siteFn: IntFunction = atNode
    ? (() => { try { return compileInt1to1(atNode); } catch { return { eval: (ctx: Context) => ctx._evalFrom }; } })()
    : { eval: (ctx: Context) => ctx._evalFrom };

  // fromTop:<bool> optional, default true
  const fromTopNode = named.get("fromtop");
  const fromTopFn: BooleanFunction = fromTopNode
    ? (() => { try { return compileBool1to1(fromTopNode, env.numPlayers); } catch { return { eval: () => true }; } })()
    : { eval: () => true };

  // First positional: either a what:<int> or a piece name string + role
  // Java: (whereLevel "PieceName" <role> at:<site> [fromTop:<bool>])
  //   or: (whereLevel <what> at:<site> [fromTop:<bool>])
  const firstPos = positional[0];

  // what:<int> named arg
  const whatNamedNode = named.get("what");
  if (whatNamedNode) {
    let whatFn: IntFunction;
    try { whatFn = compileInt1to1(whatNamedNode); } catch { whatFn = { eval: () => 0 }; }
    return new WhereLevel1to1(siteFn, whatFn, null, fromTopFn);
  }

  // First positional is an int expression (what index)?
  if (firstPos && !isIdent(firstPos)) {
    try {
      const whatFn = compileInt1to1(firstPos);
      return new WhereLevel1to1(siteFn, whatFn, null, fromTopFn);
    } catch { /* fall through */ }
  }

  // Player/role form
  if (firstPos && isIdent(firstPos)) {
    const roleName = firstPos.name.toLowerCase();
    let playerFn: IntFunction;
    if (roleName === "mover") {
      playerFn = { eval: (ctx: Context) => ctx.state.mover };
    } else if (roleName === "next") {
      playerFn = { eval: (ctx: Context) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
    } else if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
      const pid = parseInt(roleName.slice(1), 10);
      playerFn = { eval: () => pid };
    } else {
      try { playerFn = compileInt1to1(firstPos); } catch { playerFn = { eval: (ctx: Context) => ctx.state.mover }; }
    }
    return new WhereLevel1to1(siteFn, null, playerFn, fromTopFn);
  }

  // Try compiling first positional as an int (what index)
  if (firstPos) {
    try {
      const whatFn = compileInt1to1(firstPos);
      return new WhereLevel1to1(siteFn, whatFn, null, fromTopFn);
    } catch { /* fall through */ }
  }

  // Fallback: scan by mover
  return new WhereLevel1to1(siteFn, null, { eval: (ctx: Context) => ctx.state.mover }, fromTopFn);
});
