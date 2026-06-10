/**
 * CountLiberties1to1.ts
 * @java game/functions/ints/count/liberties/CountLiberties.java
 *
 * (count Liberties [at:<site>] [if:<cond>]) — returns the number of empty
 * adjacent sites around the group connected to `at` (the liberties in Go).
 *
 * Java eval logic:
 *   1. Start from `startLocation` (default: last-to site).
 *   2. BFS-flood fill across same-owner/same-what sites where condition holds.
 *   3. Collect all adjacent EMPTY sites around the group — those are the liberties.
 *   4. Return liberty count (bit-set cardinality).
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, BooleanFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import type { EvalScratch } from "../../../../base.js";

export class CountLiberties1to1 implements IntFunction {
  /** @java CountLiberties.startLocationFn — default LastTo */
  private readonly startLocationFn: IntFunction;
  /** @java CountLiberties.condition — optional condition on group membership */
  private readonly condition: BooleanFunction | null;

  public constructor(startLocationFn: IntFunction, condition: BooleanFunction | null) {
    this.startLocationFn = startLocationFn;
    this.condition = condition;
  }

  /**
   * @java game/functions/ints/count/liberties/CountLiberties.java — eval(Context)
   * BFS flood-fill from start site across same-what cells; count empty adjacent sites.
   */
  public eval(ctx: Context & EvalScratch): number {
    const cells = ctx.state.cells;
    const g = ctx.game as unknown as Game1to1;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;

    const from = this.startLocationFn.eval(ctx);
    if (from < 0 || from >= boardN) {
      ctx._evalFrom = origFrom;
      ctx._evalTo = origTo;
      return 0;
    }

    const what = (ctx.state as unknown as { whats?: readonly number[] }).whats?.[from] ?? (cells[from] ?? 0);
    if (what === 0) {
      ctx._evalFrom = origFrom;
      ctx._evalTo = origTo;
      return 0;
    }

    // BFS group flood-fill — mirror Java logic
    const groupVisited = new Uint8Array(boardN);
    const groupSites: number[] = [];

    ctx._evalTo = from;
    if (this.condition === null || this.condition.eval(ctx)) {
      groupVisited[from] = 1;
      groupSites.push(from);
    }

    ctx._evalFrom = from;
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
        if (nb < 0 || nb >= boardN || groupVisited[nb]) continue;
        const nbWhat = (ctx.state as unknown as { whats?: readonly number[] }).whats?.[nb] ?? (cells[nb] ?? 0);
        if (nbWhat === what) {
          ctx._evalTo = nb;
          if (this.condition === null || this.condition.eval(ctx)) {
            groupVisited[nb] = 1;
            groupSites.push(nb);
          }
        }
      }
      i++;
    }

    ctx._evalTo = origTo;
    ctx._evalFrom = origFrom;

    // Count empty adjacent sites around the group (liberties)
    const libertySet = new Uint8Array(boardN);
    for (const s of groupSites) {
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
        if (nb >= 0 && nb < boardN && !groupVisited[nb] && (cells[nb] ?? 0) === 0) {
          libertySet[nb] = 1;
        }
      }
    }

    let libertyCount = 0;
    for (let j = 0; j < boardN; j++) { if (libertySet[j]) libertyCount++; }
    return libertyCount;
  }
}

