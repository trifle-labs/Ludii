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
import type { Game } from "../../../../../Game.js";

/** Returns all sites in the bottom row (row 0). */
export class SitesBottom implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game;
    const board = game.equipment.board;
    const traj = board.trajectories;
    // Graph boards: iterate all sites, find min-y, return those matching it.
    // @java other/topology/Topology.java — bottom(SiteType) via Properties.BOTTOM
    if (traj !== null) {
      const n = board.numSites;
      let minY = Number.POSITIVE_INFINITY;
      for (let s = 0; s < n; s++) {
        const y = traj.yOf(s);
        if (y < minY) minY = y;
      }
      const result: number[] = [];
      for (let s = 0; s < n; s++) {
        if (Math.abs(traj.yOf(s) - minY) < 0.001) result.push(s);
      }
      return result;
    }
    // Rectangular path: row 0 sites are indices 0..W-1.
    const W = board.width;
    if (board.height === 2 && board.numSites === W * board.height + 2) {
      return Array.from({ length: W }, (_, i) => i + 1);
    }
    return Array.from({ length: W }, (_, i) => i);
  }
}

/** Returns all sites in the top row (row H-1). */
export class SitesTop implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game;
    const board = game.equipment.board;
    const traj = board.trajectories;
    // Graph boards: iterate all sites, find max-y, return those matching it.
    // @java other/topology/Topology.java — top(SiteType) via Properties.TOP
    if (traj !== null) {
      const n = board.numSites;
      let maxY = Number.NEGATIVE_INFINITY;
      for (let s = 0; s < n; s++) {
        const y = traj.yOf(s);
        if (y > maxY) maxY = y;
      }
      const result: number[] = [];
      for (let s = 0; s < n; s++) {
        if (Math.abs(traj.yOf(s) - maxY) < 0.001) result.push(s);
      }
      return result;
    }
    // Rectangular path: top row starts at (H-1)*W.
    const W = board.width;
    const H = board.height;
    if (H === 2 && board.numSites === W * H + 2) {
      return Array.from({ length: W }, (_, i) => W + 1 + i);
    }
    const rowStart = (H - 1) * W;
    return Array.from({ length: W }, (_, i) => rowStart + i);
  }
}

/** Returns all sites in the left column (column 0). */
export class SitesLeft implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game;
    const board = game.equipment.board;
    const traj = board.trajectories;
    // Graph boards: iterate all sites, find min-x, return those matching it.
    // @java other/topology/Topology.java — left(SiteType) via Properties.LEFT
    if (traj !== null) {
      const n = board.numSites;
      let minX = Number.POSITIVE_INFINITY;
      for (let s = 0; s < n; s++) {
        const x = traj.xOf(s);
        if (x < minX) minX = x;
      }
      const result: number[] = [];
      for (let s = 0; s < n; s++) {
        if (Math.abs(traj.xOf(s) - minX) < 0.001) result.push(s);
      }
      return result;
    }
    // Rectangular path: left column has x=0, indices i*W for i in 0..H-1.
    const W = board.width;
    const H = board.height;
    return Array.from({ length: H }, (_, i) => i * W);
  }
}

/** Returns all sites in the right column (column W-1). */
export class SitesRight implements RegionFunction {
  public eval(ctx: Context): number[] {
    const game = ctx.game as unknown as Game;
    const board = game.equipment.board;
    const traj = board.trajectories;
    // Graph boards: iterate all sites, find max-x, return those matching it.
    // @java other/topology/Topology.java — right(SiteType) via Properties.RIGHT
    if (traj !== null) {
      const n = board.numSites;
      let maxX = Number.NEGATIVE_INFINITY;
      for (let s = 0; s < n; s++) {
        const x = traj.xOf(s);
        if (x > maxX) maxX = x;
      }
      const result: number[] = [];
      for (let s = 0; s < n; s++) {
        if (Math.abs(traj.xOf(s) - maxX) < 0.001) result.push(s);
      }
      return result;
    }
    // Rectangular path: right column has x=W-1, indices i*W+(W-1) for i in 0..H-1.
    const W = board.width;
    const H = board.height;
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
    const game = ctx.game as unknown as Game;
    const board = game.equipment.board;
    const row = this.rowFn.eval(ctx);
    // Graph boards: use trajectory y-coordinates to identify sites in the row.
    // Row N is the N-th distinct y-level (0-based from bottom), matching Java's
    // Topology.rows() which groups sites by unique y-coordinate values.
    // @java other/topology/Topology.java — row(SiteType) via Properties.ROW
    const traj = board.trajectories;
    if (traj !== null) {
      const n = board.numSites;
      // Collect all distinct y-values, sorted ascending (bottom-first).
      const ys: number[] = [];
      for (let s = 0; s < n; s++) ys.push(traj.yOf(s));
      // Deduplicate with tolerance.
      const uniqueYs: number[] = [];
      for (const y of ys) {
        if (!uniqueYs.some(uy => Math.abs(uy - y) < 0.1)) uniqueYs.push(y);
      }
      uniqueYs.sort((a, b) => a - b);
      // Row N = the N-th unique y-level.
      if (row < 0 || row >= uniqueYs.length) return [];
      const targetY = uniqueYs[row]!;
      const result: number[] = [];
      for (let s = 0; s < n; s++) {
        if (Math.abs(traj.yOf(s) - targetY) < 0.1) result.push(s);
      }
      return result;
    }
    // Rectangular path: row N = sites N*W .. N*W+W-1.
    const W = board.width;
    const H = board.height;
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
    const game = ctx.game as unknown as Game;
    const board = game.equipment.board;
    const col = this.colFn.eval(ctx);
    // Graph boards: use trajectory x-coordinates to identify sites in the column.
    // Column N is the N-th distinct x-level (0-based from left), matching Java's
    // Topology.columns() which groups sites by unique x-coordinate values.
    // @java other/topology/Topology.java — column(SiteType) via Properties.COLUMN
    const traj = board.trajectories;
    if (traj !== null) {
      const n = board.numSites;
      // Collect all distinct x-values, sorted ascending (left-first).
      const xs: number[] = [];
      for (let s = 0; s < n; s++) xs.push(traj.xOf(s));
      const uniqueXs: number[] = [];
      for (const x of xs) {
        if (!uniqueXs.some(ux => Math.abs(ux - x) < 0.1)) uniqueXs.push(x);
      }
      uniqueXs.sort((a, b) => a - b);
      if (col < 0 || col >= uniqueXs.length) return [];
      const targetX = uniqueXs[col]!;
      const result: number[] = [];
      for (let s = 0; s < n; s++) {
        if (Math.abs(traj.xOf(s) - targetX) < 0.1) result.push(s);
      }
      return result;
    }
    // Rectangular path: column N = sites i*W+N for i in 0..H-1.
    const W = board.width;
    const H = board.height;
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
    const phase = this.phaseFn.eval(ctx);
    // @java SitesPhase reads Topology.phases(type) — the graph colouring
    // computed by the phase BFS. The width-arithmetic fallback below assumes
    // a plain rectangular indexing; on Catapult's (rotate 45 (square 8))
    // board width is meaningless there, so it degraded to site%2 and the
    // checkerboard start filter kept the wrong squares.
    const topo = (ctx as unknown as {
      topology?(): { phases?(t: string): Array<Array<{ index(): number }>> };
    }).topology?.();
    const playT = (ctx as unknown as { board?(): { defaultSite?(): string } }).board?.()?.defaultSite?.() ?? "Cell";
    const lists = topo?.phases?.(playT);
    if (lists && lists.some((l) => l && l.length > 0)) {
      return (lists[phase] ?? []).map((e) => e.index());
    }
    const game = ctx.game as unknown as Game;
    const W = game.equipment.board.width;
    const H = game.equipment.board.height;
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
    const game = ctx.game as unknown as Game;
    const board = game.equipment.board;
    // For graph boards (non-rectangular): corners are the sites at extreme
    // positions — minimum/maximum x and y coordinates. Returns up to 4 sites
    // (one per corner of the bounding box).
    // @java other/topology/Topology.java — corners(SiteType) via Properties.CORNER
    const traj = board.trajectories;
    if (traj !== null) {
      const n = board.numSites;
      if (n === 0) return [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let s = 0; s < n; s++) {
        const x = traj.xOf(s), y = traj.yOf(s);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      const TOL = 0.5;
      const corners: number[] = [];
      const seen = new Set<number>();
      for (let s = 0; s < n; s++) {
        const x = traj.xOf(s), y = traj.yOf(s);
        if (
          (Math.abs(x - minX) < TOL || Math.abs(x - maxX) < TOL) &&
          (Math.abs(y - minY) < TOL || Math.abs(y - maxY) < TOL)
        ) {
          if (!seen.has(s)) { seen.add(s); corners.push(s); }
        }
      }
      return corners;
    }
    // Rectangular path: corners are site 0, W-1, n-W, n-1.
    const W = board.width;
    const H = board.height;
    if (W === 0 || H === 0) return [];
    const n = board.numSites;
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
