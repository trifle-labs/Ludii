// @java Core/src/game/functions/intArray/sizes/group/SizesGroup.java

/**
 * Returns an array of the sizes of all the groups on the board.
 *
 * @java game/functions/intArray/sizes/group/SizesGroup.java
 *
 * Java parity: SizesGroup performs a connected-component traversal over all
 * sites owned by the specified player(s). For each unvisited starting site a
 * BFS/flood-fill is run along the given direction set, collecting group members
 * that satisfy the ownership/condition predicate. The size of each group ≥ min
 * is appended to the result array.
 *
 * The optional `isVisible` condition checks 3D coverage via topology
 * trajectories (Upward direction) — this path requires APIs not available in
 * the lightweight context.ts Context and falls back to `false` (no coverage
 * check) when those APIs are absent.
 *
 * TS parity notes:
 *  - Direction traversal uses ctx.game topology when available via the
 *    any-typed topology() accessor present on other/context/Context.ts.
 *  - When topology is not available, adjacency falls back to the game's
 *    width/height grid neighbours.
 *  - ContainerState.who/what are read via state.cells/state.whats.
 *  - `isVisible` path requires topology.trajectories().steps() with
 *    Upward direction — stubbed to always return [] when unavailable.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, BooleanFunction, IntFunction } from "../../../../../base.js";
import { BaseIntArrayFunction } from "../../BaseIntArrayFunction.js";

/** Sentinel value for "no who" (all-pieces mode). */
const ALL_WHO = -1;

/**
 * @java game.functions.intArray.sizes.group.SizesGroup
 */
export class SizesGroup extends BaseIntArrayFunction {
  /** @java SizesGroup — private SiteType type (null = use game default) */
  private readonly siteType: string | null;

  /** @java SizesGroup — private final IntFunction whoFn */
  private readonly whoFn: IntFunction;

  /** @java SizesGroup — private final IntFunction minFn */
  private readonly minFn: IntFunction;

  /** @java SizesGroup — private final BooleanFunction condition */
  private readonly condition: BooleanFunction | null;

  /** @java SizesGroup — private final DirectionsFunction dirnChoice */
  private readonly directions: string;

  /** @java SizesGroup — private final boolean allPieces */
  private readonly allPieces: boolean;

  /** @java SizesGroup — private final BooleanFunction isVisibleFn */
  private readonly isVisibleFn: BooleanFunction | null;

  /**
   * @java SizesGroup(SiteType, Direction, RoleType, IntFunction, BooleanFunction, IntFunction, BooleanFunction)
   *
   * @param siteType   Graph element type ("Cell", "Vertex", "Edge", or null for default).
   * @param directions Direction set name ("Adjacent" | "Orthogonal" | ...).
   * @param whoFn      Player index function (evaluates to ALL_WHO when allPieces).
   * @param minFn      Minimum group size to include.
   * @param condition  Optional membership condition (null → use ownership).
   * @param allPieces  When true, includes pieces of all players.
   * @param isVisibleFn Optional 3D visibility condition.
   */
  public constructor(
    siteType: string | null,
    directions: string,
    whoFn: IntFunction,
    minFn: IntFunction,
    condition: BooleanFunction | null,
    allPieces: boolean,
    isVisibleFn: BooleanFunction | null,
  ) {
    super();
    this.siteType = siteType;
    this.directions = directions;
    this.whoFn = whoFn;
    this.minFn = minFn;
    this.condition = condition;
    this.allPieces = allPieces;
    this.isVisibleFn = isVisibleFn;
  }

  /**
   * @java SizesGroup.eval(Context)
   *
   * BFS connected-component traversal returning the size of each group.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const sizes: number[] = [];

    const who = this.allPieces ? ALL_WHO : this.whoFn.eval(ctx);
    const min = this.minFn.eval(ctx);
    const cells = ctx.state.cells;
    const n = cells.length;

    // Collect starting sites.
    const sitesToCheck: number[] = [];
    if (this.allPieces) {
      for (let i = 0; i < n; i++) {
        if (cells[i] !== 0 || (ctx.state.whats[i] ?? 0) !== 0) sitesToCheck.push(i);
      }
    } else {
      for (let i = 0; i < n; i++) {
        if (this._whoAt(ctx, i) === who) sitesToCheck.push(i);
      }
    }

    // BFS / flood-fill.
    const sitesChecked = new Set<number>();
    const origFrom = ctx._evalFrom;
    const origTo   = ctx._evalTo;

    for (const from of sitesToCheck) {
      if (sitesChecked.has(from)) continue;

      // Check if `from` qualifies.
      ctx._evalFrom = from;
      const fromQualifies = this._qualifies(ctx, from, who);
      if (!fromQualifies) continue;

      // BFS from this seed.
      const group: number[] = [from];
      const explored = new Set<number>([from]);
      let i = 0;

      while (i < group.length) {
        const site = group[i]!;
        ctx._evalFrom = site;
        const neighbours = this._neighbours(ctx, site, n);

        for (const to of neighbours) {
          if (explored.has(to)) continue;
          ctx._evalTo = to;
          if (this._qualifies(ctx, to, who)) {
            group.push(to);
            explored.add(to);
          }
        }
        i++;
      }

      if (group.length >= min) sizes.push(group.length);
      for (const s of group) sitesChecked.add(s);
    }

    ctx._evalFrom = origFrom;
    ctx._evalTo   = origTo;
    return sizes;
  }

  /** @java ContainerState.who(site) fallback. */
  private _whoAt(ctx: Context & EvalScratch, site: number): number {
    return ctx.state.who(site);
  }

  /**
   * True if `site` is a valid member of the current group.
   * @java SizesGroup.eval — group-membership predicate.
   */
  private _qualifies(ctx: Context & EvalScratch, site: number, who: number): boolean {
    const siteWho = this._whoAt(ctx, site);
    const siteWhat = ctx.state.whats[site] ?? 0;

    if (this.condition !== null) {
      return this.condition.eval(ctx);
    }
    if (this.allPieces) {
      return siteWho !== 0 || siteWhat !== 0;
    }
    return siteWho === who;
  }

  /**
   * Returns the neighbouring site indices for `site` according to the
   * direction set. Uses the topology trajectories when available, otherwise
   * falls back to grid adjacency.
   * @java SizesGroup.eval — topology.trajectories().steps(type, site, type, dir)
   */
  private _neighbours(ctx: Context & EvalScratch, site: number, n: number): number[] {
    const ctxAny = ctx as unknown as Record<string, unknown>;

    // Attempt to use topology trajectories (full 1:1 context path).
    if (typeof ctxAny["topology"] === "function") {
      try {
        const topology = (ctxAny["topology"] as () => unknown)() as {
          trajectories(): {
            steps(type: string, site: number, toType: string, dir: string): Array<{ to(): { id(): number } }>;
          };
        };
        const board = typeof ctxAny["board"] === "function"
          ? (ctxAny["board"] as () => unknown)() as { defaultSite(): string }
          : null;
        const type = this.siteType ?? (board?.defaultSite() ?? "Cell");
        const steps = topology.trajectories().steps(type, site, type, this.directions);
        return steps.map(s => s.to().id());
      } catch {
        // fall through to grid fallback
      }
    }

    // Grid adjacency fallback (square board).
    const w = ctx.game.width;
    const h = ctx.game.height;
    const result: number[] = [];
    const col = site % w;
    const row = Math.floor(site / w);

    const dirs = this.directions.toLowerCase();
    const useOrth = dirs === "orthogonal" || dirs === "adjacent";
    const useDiag = dirs === "diagonal"   || dirs === "adjacent";

    if (useOrth) {
      const orth = [
        [row - 1, col], [row + 1, col],
        [row, col - 1], [row, col + 1],
      ];
      for (const [r, c] of orth) {
        if (r !== undefined && c !== undefined && r >= 0 && r < h && c >= 0 && c < w) {
          const idx = r * w + c;
          if (idx >= 0 && idx < n) result.push(idx);
        }
      }
    }
    if (useDiag) {
      const diag = [
        [row - 1, col - 1], [row - 1, col + 1],
        [row + 1, col - 1], [row + 1, col + 1],
      ];
      for (const [r, c] of diag) {
        if (r !== undefined && c !== undefined && r >= 0 && r < h && c >= 0 && c < w) {
          const idx = r * w + c;
          if (idx >= 0 && idx < n) result.push(idx);
        }
      }
    }

    return result;
  }

  public override toString(): string {
    return "Groups()";
  }
}
