/**
 * CountGroups.ts
 * @java game/functions/ints/count/groups/CountGroups.java
 *
 * (count Groups [if:<cond>] [min:<int>]) — returns the number of connected
 * groups on the board that satisfy `condition` and have size >= `min`.
 *
 * Java eval logic:
 *   1. Collect all occupied sites (sites where condition is true).
 *   2. BFS-flood from each unchecked seed; expand to neighbours where condition holds.
 *   3. If group size >= min, increment count.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game } from "../../../../Game.js";
import type { EvalScratch } from "../../../../base.js";

export class CountGroups implements IntFunction {
  /** @java CountGroups.condition — IsOccupied by default */
  private readonly condition: BooleanFunction | null;
  /** @java CountGroups.minFn — minimum group size (default 0) */
  private readonly minFn: IntFunction;

  public constructor(condition: BooleanFunction | null, minFn: IntFunction) {
    this.condition = condition;
    this.minFn = minFn;
  }

  /**
   * @java game/functions/ints/count/groups/CountGroups.java — eval(Context)
   * BFS-flood fill across adjacent occupied sites; count groups >= min size.
   */
  public eval(ctx: Context & EvalScratch): number {
    const cells = ctx.state.cells;
    const g = ctx.game as unknown as Game;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    const min = this.minFn.eval(ctx);

    // Save and restore context.to scratch
    const origTo = ctx._evalTo;

    // Collect all sites where condition holds
    const sitesToCheck: number[] = [];
    for (let site = 0; site < boardN; site++) {
      if (this.condition !== null) {
        ctx._evalTo = site;
        if (this.condition.eval(ctx)) sitesToCheck.push(site);
      } else {
        // default: IsOccupied — site has a non-zero owner
        if ((cells[site] ?? 0) !== 0) sitesToCheck.push(site);
      }
    }

    ctx._evalTo = origTo;

    // BFS across adjacent same-condition sites
    const visited = new Uint8Array(boardN);
    let count = 0;

    for (const seed of sitesToCheck) {
      if (visited[seed]) continue;

      const groupSites: number[] = [seed];
      visited[seed] = 1;
      let i = 0;

      while (i < groupSites.length) {
        const s = groupSites[i]!;
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
          if (nb < 0 || nb >= boardN || visited[nb]) continue;
          if (this.condition !== null) {
            ctx._evalTo = nb;
            if (!this.condition.eval(ctx)) continue;
          } else {
            if ((cells[nb] ?? 0) === 0) continue;
          }
          visited[nb] = 1;
          groupSites.push(nb);
        }
        i++;
      }

      ctx._evalTo = origTo;

      if (groupSites.length >= min) count++;
    }

    ctx._evalTo = origTo;
    return count;
  }
}

