/**
 * CountSizeBiggestGroup1to1.ts
 * @java game/functions/ints/count/sizeBiggestGroup/CountSizeBiggestGroup.java
 *
 * (count SizeBiggestGroup [if:<cond>]) — returns the size of the largest
 * connected group of occupied sites on the board.
 *
 * Java eval:
 *   1. Collect all sites where condition is true.
 *   2. BFS-flood fill from each unchecked seed site.
 *   3. Track the maximum group size found.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import type { EvalScratch } from "../../../../base.js";

export class CountSizeBiggestGroup1to1 implements IntFunction {
  /** @java CountSizeBiggestGroup.condition — default IsOccupied */
  private readonly condition: BooleanFunction | null;

  public constructor(condition: BooleanFunction | null) {
    this.condition = condition;
  }

  /**
   * @java game/functions/ints/count/sizeBiggestGroup/CountSizeBiggestGroup.java — eval(Context)
   * BFS flood-fill across adjacent occupied sites; return size of largest group.
   */
  public eval(ctx: Context & EvalScratch): number {
    const cells = ctx.state.cells;
    const g = ctx.game as unknown as Game1to1;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;

    const origTo = ctx._evalTo;

    // Collect seeds: sites where condition holds
    const sitesToCheck: number[] = [];
    for (let site = 0; site < boardN; site++) {
      if (this.condition !== null) {
        ctx._evalTo = site;
        if (this.condition.eval(ctx)) sitesToCheck.push(site);
      } else {
        if ((cells[site] ?? 0) !== 0) sitesToCheck.push(site);
      }
    }

    ctx._evalTo = origTo;

    const visited = new Uint8Array(boardN);
    let biggest = 0;

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

      if (groupSites.length > biggest) biggest = groupSites.length;
    }

    ctx._evalTo = origTo;
    return biggest;
  }
}

