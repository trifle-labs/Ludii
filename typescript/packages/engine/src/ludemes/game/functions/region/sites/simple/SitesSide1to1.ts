/**
 * Simple board-side site functions for the 1:1 path.
 *
 * Implements (sites Top), (sites Bottom), (sites Left), (sites Right),
 * (sites Row N), (sites Column N), (sites Phase N), (sites Corners)
 * for flat square/rectangle boards.
 *
 * @java game/functions/region/sites/simple/SitesSide.java and related classes.
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction, IntFunction } from "../../../../../base.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

/** Returns all sites in the bottom row (row 0). */
export class SitesBottom implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    return Array.from({ length: W }, (_, i) => i);
  }
}

/** Returns all sites in the top row (row H-1). */
export class SitesTop implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
    const rowStart = (H - 1) * W;
    return Array.from({ length: W }, (_, i) => rowStart + i);
  }
}

/** Returns all sites in the left column (column 0). */
export class SitesLeft implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
    return Array.from({ length: H }, (_, i) => i * W);
  }
}

/** Returns all sites in the right column (column W-1). */
export class SitesRight implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
    return Array.from({ length: H }, (_, i) => i * W + (W - 1));
  }
}

/** Returns all sites in row N (0-based). */
export class SitesRow implements RegionFunction {
  private readonly rowFn: IntFunction;
  public constructor(rowFn: IntFunction) {
    this.rowFn = rowFn;
  }
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
    const row = this.rowFn.eval(ctx);
    if (row < 0 || row >= H) return [];
    const rowStart = row * W;
    return Array.from({ length: W }, (_, i) => rowStart + i);
  }
}

/** Returns all sites in column N (0-based). */
export class SitesColumn implements RegionFunction {
  private readonly colFn: IntFunction;
  public constructor(colFn: IntFunction) {
    this.colFn = colFn;
  }
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
    const col = this.colFn.eval(ctx);
    if (col < 0 || col >= W) return [];
    return Array.from({ length: H }, (_, i) => i * W + col);
  }
}

/**
 * Returns all sites of phase N (N=0 or N=1 for a bipartite board).
 * Phase is (col + row) % 2 for the standard alternating checkerboard pattern.
 * This matches Java's topology Phase 0/1 on square boards with diagonals.
 */
export class SitesPhase implements RegionFunction {
  private readonly phaseFn: IntFunction;
  public constructor(phaseFn: IntFunction) {
    this.phaseFn = phaseFn;
  }
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
    const phase = this.phaseFn.eval(ctx);
    const sites: number[] = [];
    for (let row = 0; row < H; row++) {
      for (let col = 0; col < W; col++) {
        if ((col + row) % 2 === phase) {
          sites.push(row * W + col);
        }
      }
    }
    return sites;
  }
}

/** Returns the 4 corner sites. */
export class SitesCorners implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game1to1;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
    if (W === 0 || H === 0) return [];
    const n = game.equipment.board.numSites;
    return [0, W - 1, n - W, n - 1].filter((v, i, a) => a.indexOf(v) === i);
  }
}

/** (union {r1 r2 ...}) — union of multiple regions. */
export class UnionRegion implements RegionFunction {
  private readonly regions: readonly RegionFunction[];
  public constructor(regions: readonly RegionFunction[]) {
    this.regions = regions;
  }
  public eval(ctx: Context): number[] {
    const seen = new Set<number>();
    const result: number[] = [];
    for (const r of this.regions) {
      for (const s of r.eval(ctx)) {
        if (!seen.has(s)) { seen.add(s); result.push(s); }
      }
    }
    return result;
  }
}

/** (intersection r1 r2) — intersection of two regions. */
export class IntersectionRegion implements RegionFunction {
  private readonly r1: RegionFunction;
  private readonly r2: RegionFunction;
  public constructor(r1: RegionFunction, r2: RegionFunction) {
    this.r1 = r1;
    this.r2 = r2;
  }
  public eval(ctx: Context): number[] {
    const s2 = new Set(this.r2.eval(ctx));
    return this.r1.eval(ctx).filter(s => s2.has(s));
  }
}

/** (difference r1 r2) — r1 minus r2. */
export class DifferenceRegion implements RegionFunction {
  private readonly r1: RegionFunction;
  private readonly r2: RegionFunction;
  public constructor(r1: RegionFunction, r2: RegionFunction) {
    this.r1 = r1;
    this.r2 = r2;
  }
  public eval(ctx: Context): number[] {
    const s2 = new Set(this.r2.eval(ctx));
    return this.r1.eval(ctx).filter(s => !s2.has(s));
  }
}
