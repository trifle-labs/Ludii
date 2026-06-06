/**
 * CountPieces1to1.ts
 * @java game/functions/ints/count/component/CountPieces.java
 *
 * (count Pieces [role] [of:<int>] [name:<string>] [in:<region>])
 * Returns the number of pieces owned by a player (board + hand containers).
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent } from "@ludii/typescript-language";
import type { Game1to1 } from "../../../../Game1to1.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";

export class CountPieces1to1 implements IntFunction {
  /** @java CountPieces.whoFn */
  private readonly whoFn: IntFunction;
  /** @java CountPieces.whereFn */
  private readonly whereFn: RegionFunction | null;
  /** @java CountPieces.name */
  private readonly pieceName: string | null;
  /** @java CountPieces.role — used to distinguish "All" from specific player */
  private readonly isAll: boolean;

  public constructor(
    whoFn: IntFunction,
    whereFn: RegionFunction | null,
    pieceName: string | null,
    isAll: boolean,
  ) {
    this.whoFn = whoFn;
    this.whereFn = whereFn;
    this.pieceName = pieceName;
    this.isAll = isAll;
  }

  /**
   * @java game/functions/ints/count/component/CountPieces.java — eval(Context)
   * Counts pieces on board sites + hand slots.
   * For stacking games: counts all pieces across all stack levels.
   * @java CountPieces.java — for stacking games, iterates cs.sizeStack(site) levels.
   */
  public eval(ctx: Context): number {
    const cells = ctx.state.cells;
    const stacks = ctx.state.stacks;
    const countAt = ctx.state.countAt;
    const g = ctx.game as unknown as Game1to1;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
    const totalN = cells.length;

    // Resolve optional region filter
    let allowedSites: Set<number> | null = null;
    if (this.whereFn) {
      allowedSites = new Set(this.whereFn.eval(ctx));
    }

    if (this.isAll) {
      // Count all pieces — board seeds (countAt, owner 0 for Shared) + owned
      // single pieces + hand-slot stacks.
      // For stacking games, sum all non-zero stack levels.
      let total = 0;
      for (let i = 0; i < totalN; i++) {
        if (allowedSites && !allowedSites.has(i)) continue;
        if (i < boardN) {
          const stack = stacks[i];
          if (stack && stack.length > 0) {
            total += stack.filter(o => o !== 0).length;
          } else {
            const c = countAt[i] ?? 0;
            if (c > 0) total += c;
            else if ((cells[i] ?? 0) !== 0) total++;
          }
        } else {
          // Hand slot: countAt[i] pieces
          const c = countAt[i] ?? 0;
          if (c > 0) total += c;
          else if ((cells[i] ?? 0) !== 0) total++;
        }
      }
      return total;
    }

    const pid = this.whoFn.eval(ctx);
    let n = 0;
    for (let i = 0; i < totalN; i++) {
      if (allowedSites && !allowedSites.has(i)) continue;
      if (i < boardN) {
        // Board site: count all stack levels owned by pid
        // @java CountPieces: for stacking games, iterates all levels via cs.sizeStack(site)
        const stack = stacks[i];
        if (stack && stack.length > 0) {
          for (const owner of stack) {
            if (owner === pid) n++;
          }
        } else {
          // Non-stacking or non-materialized: use cells + countAt
          if (cells[i] === pid) {
            const c = countAt[i] ?? 0;
            n += c > 0 ? c : 1;
          }
        }
      } else {
        // Hand slot: countAt[i] pieces if owned by pid
        if (cells[i] === pid) {
          n += countAt[i] ?? 0;
        }
      }
    }
    return n;
  }
}

registerInt1to1("count:pieces", (node: LudNode, env: Compile1to1Env): IntFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Pieces", positional[1] = optional role ident
  const roleNode = positional[1];
  const roleName = (roleNode && isIdent(roleNode)) ? roleNode.name.toLowerCase() : "all";

  let whoFn: IntFunction;
  let isAll = false;

  if (roleName === "all" || roleName === "any" || roleName === "each") {
    isAll = true;
    whoFn = { eval: (ctx: Context) => ctx.state.mover };
  } else if (roleName === "mover") {
    whoFn = { eval: (ctx: Context) => ctx.state.mover };
  } else if (roleName === "next") {
    whoFn = { eval: (ctx: Context) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
  } else if (roleName === "prev") {
    whoFn = { eval: (ctx: Context) => {
      const n = ctx.game.numPlayers;
      return ((ctx.state.mover - 2 + n) % n) + 1;
    }};
  } else if (roleName.startsWith("p") && !isNaN(parseInt(roleName.slice(1), 10))) {
    const pid = parseInt(roleName.slice(1), 10);
    whoFn = { eval: (_ctx: Context) => pid };
  } else {
    // Try to compile as int expression
    try { whoFn = compileInt1to1(roleNode); } catch { whoFn = { eval: (_ctx: Context) => 0 }; }
  }

  const ofNode = named.get("of");
  if (ofNode) {
    try { whoFn = compileInt1to1(ofNode); isAll = false; } catch { /* keep existing */ }
  }

  let whereFn: RegionFunction | null = null;
  const inNode = named.get("in");
  if (inNode) {
    try { whereFn = compileRegion1to1(inNode); } catch { /* skip */ }
  }

  return new CountPieces1to1(whoFn, whereFn, null, isAll);
});
