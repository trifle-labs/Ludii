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
 * Java eval (stepMove != null path):
 *   BFS that only traverses sites satisfying stepMove.goRule() — e.g. only
 *   through empty cells when stepMove has (to if:(is Empty (to))).
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../base.js";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game } from "../../../../Game.js";

const INFINITY = 999999;

export class CountSteps implements IntFunction {
  /** @java CountSteps.site1Fn */
  private readonly site1Fn: IntFunction;
  /** @java CountSteps.region2 — the target region */
  private readonly region2Fn: RegionFunction;

  /** @java CountSteps.relation — BFS adjacency relation (default Adjacent). */
  private readonly relation: string;

  /**
   * @java CountSteps.stepMove.goRule() — optional step condition.
   * When non-null, the BFS only traverses neighbours where this condition
   * evaluates to true (with _evalTo set to the candidate neighbour and
   * _evalFrom set to the current BFS site, mirroring CountSteps.java's
   * stepMove() helper which calls context.setFrom/setTo before goRule.eval).
   */
  private readonly stepConditionFn: BooleanFunction | null;

  public constructor(
    site1Fn: IntFunction,
    region2Fn: RegionFunction,
    relation: string | null = null,
    stepConditionFn: BooleanFunction | null = null,
  ) {
    this.site1Fn = site1Fn;
    this.region2Fn = region2Fn;
    this.relation = relation ?? "Adjacent";
    this.stepConditionFn = stepConditionFn;
  }

  /**
   * @java game/functions/ints/count/steps/CountSteps.java — eval(Context)
   * BFS from site1, find min steps to any site in region2.
   *
   * When stepConditionFn is null: mirrors the non-stepMove path using the
   * topology distance table / simple BFS.
   * When stepConditionFn is non-null: mirrors the stepMove path — BFS only
   * through neighbours where the step condition is satisfied (e.g. empty cells).
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
    const g = ctx.game as unknown as Game;
    const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;

    const targets = new Set(region2.filter(s => s >= 0));

    // BFS from site1
    const dist = new Int32Array(boardN).fill(-1);
    dist[site1] = 0;
    const queue: number[] = [site1];
    let minDist = INFINITY;

    // Save context eval variables so we can temporarily set them for step-condition checks.
    const origEvalTo = ctx._evalTo;
    const origEvalFrom = ctx._evalFrom;

    let head = 0;
    while (head < queue.length) {
      const s = queue[head++]!;
      const d = dist[s]!;
      if (d >= minDist) continue;

      let neighbours: number[];
      if (traj) {
        // @java GameType.Step<relation>Distance — the distance table is built
        // with the declared relation (All includes diagonals).
        neighbours = traj.group(s, this.relation);
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
        if (this.relation === "All" || this.relation === "Diagonal") {
          if (col > 0 && row > 0) neighbours.push(s - W - 1);
          if (col < W - 1 && row > 0) neighbours.push(s - W + 1);
          if (col > 0 && row < H - 1) neighbours.push(s + W - 1);
          if (col < W - 1 && row < H - 1) neighbours.push(s + W + 1);
        }
      }

      for (const nb of neighbours) {
        if (nb < 0 || nb >= boardN) continue;
        if (dist[nb] !== -1) continue;

        // @java CountSteps.java — stepMove path: evaluate goRule at the
        // candidate `to` site (with from=s, to=nb) before queueing.
        // Only empty cells (or whatever the step condition specifies) are
        // traversable. Mirrors CountSteps.java stepMove() helper lines 356-391.
        if (this.stepConditionFn !== null) {
          ctx._evalFrom = s;
          ctx._evalTo = nb;
          const allowed = this.stepConditionFn.eval(ctx);
          if (!allowed) continue;
        }

        dist[nb] = d + 1;
        if (targets.has(nb) && dist[nb]! < minDist) {
          minDist = dist[nb]!;
        }
        if (dist[nb]! < minDist) queue.push(nb);
      }
    }

    // Restore context eval variables.
    ctx._evalTo = origEvalTo;
    ctx._evalFrom = origEvalFrom;

    return minDist === INFINITY ? INFINITY : minDist;
  }
}

