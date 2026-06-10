/**
 * CountSteps.ts
 * @java game/functions/ints/count/steps/CountSteps.java
 *
 * (count Steps <site1> <region2>) — returns the minimum BFS distance (in
 * steps) from site1 to the nearest site in region2 using adjacent topology.
 *
 * Java eval (stepMove == null path — most common case):
 *   min(distancesToOtherSite[site1][s] for s in region2)
 *
 * The stepMove path requires a full Step move generator which is not available
 * in the 1:1 context, so only the distance-table / BFS path is ported.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../Game1to1.js";

const INFINITY = 999999;

export class CountSteps implements IntFunction {
  /** @java CountSteps.site1Fn */
  private readonly site1Fn: IntFunction;
  /** @java CountSteps.region2 — the target region */
  private readonly region2Fn: RegionFunction;

  public constructor(site1Fn: IntFunction, region2Fn: RegionFunction) {
    this.site1Fn = site1Fn;
    this.region2Fn = region2Fn;
  }

  /**
   * @java game/functions/ints/count/steps/CountSteps.java — eval(Context)
   * BFS from site1, find min steps to any site in region2.
   * Mirrors the non-stepMove path: context.board().topology().distancesToOtherSite(realType)[site1][target]
   */
  public eval(ctx: Context): number {
    const site1 = this.site1Fn.eval(ctx);
    if (site1 < 0) return 0;

    const region2 = this.region2Fn.eval(ctx);
    if (region2.length === 0) return 0;

    // If site1 is already in region2, distance is 0
    if (region2.includes(site1)) return 0;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    const g = ctx.game as unknown as Game1to1;
    const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;

    const targets = new Set(region2.filter(s => s >= 0));

    // BFS from site1
    const dist = new Int32Array(boardN).fill(-1);
    dist[site1] = 0;
    const queue: number[] = [site1];
    let minDist = INFINITY;

    let head = 0;
    while (head < queue.length) {
      const s = queue[head++]!;
      const d = dist[s]!;
      if (d >= minDist) continue;

      let neighbours: number[];
      if (traj) {
        neighbours = traj.group(s, "Adjacent");
      } else {
        const W = g.equipment.board.width;
        const H = g.equipment.board.height;
        const col = s % W;
        const row = Math.floor(s / W);
        neighbours = [];
        if (col > 0) neighbours.push(s - 1);
        if (col < W - 1) neighbours.push(s + 1);
        if (row > 0) neighbours.push(s - W);
        if (row < H - 1) neighbours.push(s + W);
      }

      for (const nb of neighbours) {
        if (nb < 0 || nb >= boardN) continue;
        if (dist[nb] !== -1) continue;
        dist[nb] = d + 1;
        if (targets.has(nb) && dist[nb]! < minDist) {
          minDist = dist[nb]!;
        }
        if (dist[nb]! < minDist) queue.push(nb);
      }
    }

    return minDist === INFINITY ? INFINITY : minDist;
  }
}

