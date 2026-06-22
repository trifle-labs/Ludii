/**
 * CountSizeBiggestGroup.ts
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
import type { Game } from "../../../../Game.js";
import type { EvalScratch } from "../../../../base.js";

export class CountSizeBiggestGroup implements IntFunction {
  /** @java CountSizeBiggestGroup.condition — default IsOccupied */
  private readonly condition: BooleanFunction | null;
  /**
   * @java CountSizeBiggestGroup.dirnChoice — direction for BFS connectivity.
   * Java default: AbsoluteDirection.Adjacent.
   * Previously hardcoded to "Adjacent"; now threaded from Count.constructGroups.
   */
  private readonly direction: string;
  /**
   * @java CountSizeBiggestGroup.isVisibleFn — visibility filter for 3D/pyramidal
   * boards (e.g. Spaiji/Pylos). Java checks centroid3D to detect covered pieces.
   * TS flat-state substrate has no 3D topology → stored but NOT applied.
   */
  private readonly isVisibleFn: BooleanFunction | null;
  /**
   * @java type — SiteType; flat-state substrate, see pattern #5.
   * Stored but eval behaviour is substrate-independent in the flat state.
   */
  private readonly siteType: string | null;

  public constructor(
    condition: BooleanFunction | null,
    direction: string = "Adjacent",
    isVisibleFn: BooleanFunction | null = null,
    siteType: string | null = null,
  ) {
    this.condition = condition;
    this.direction = direction;
    this.isVisibleFn = isVisibleFn;
    this.siteType = siteType;
  }

  /**
   * @java game/functions/ints/count/sizeBiggestGroup/CountSizeBiggestGroup.java — eval(Context)
   * BFS flood-fill across adjacent occupied sites; return size of largest group.
   */
  public eval(ctx: Context & EvalScratch): number {
    const cells = ctx.state.cells;
    const g = ctx.game as unknown as Game;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;

    const origTo = ctx._evalTo;

    // @java CountSizeBiggestGroup.java:142-153,176-186 — isVisible filter.
    // When (isVisible:True), a piece that is COVERED by another piece directly
    // above it (an occupied Upward neighbour — Java's centroid3D same-(x,y),
    // higher-index check / AbsoluteDirection.Upward step) is not counted: only
    // the visible top of each pyramidal column contributes (Spaiji's end rule
    // compares the biggest *visible* group). On a flat board steps(_,Upward)
    // is empty, so this is a no-op and isVisible-less games are unaffected.
    const isVisActive = this.isVisibleFn !== null && this.isVisibleFn.eval(ctx);
    const covered = (site: number): boolean => {
      if (!isVisActive || !traj || typeof traj.steps !== "function") return false;
      for (const up of traj.steps(site, "Upward")) {
        if (up >= 0 && !ctx.state.isEmptySite(up)) return true;
      }
      return false;
    };

    // Collect seeds: sites where condition holds
    const sitesToCheck: number[] = [];
    for (let site = 0; site < boardN; site++) {
      if (this.condition !== null) {
        ctx._evalTo = site;
        if (this.condition.eval(ctx) && !covered(site)) sitesToCheck.push(site);
      } else {
        if ((cells[site] ?? 0) !== 0 && !covered(site)) sitesToCheck.push(site);
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
          // @java dirnChoice.convertToAbsolute — use the threaded direction
          neighbours = traj.group(s, this.direction);
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
          // Include diagonals when direction is All or Diagonal
          if (this.direction === "All" || this.direction === "Diagonal") {
            if (col > 0 && row > 0) neighbours.push(s - W - 1);
            if (col < W - 1 && row > 0) neighbours.push(s - W + 1);
            if (col > 0 && row < H - 1) neighbours.push(s + W - 1);
            if (col < W - 1 && row < H - 1) neighbours.push(s + W + 1);
          }
        }

        for (const nb of neighbours) {
          if (nb < 0 || nb >= boardN || visited[nb]) continue;
          if (this.condition !== null) {
            ctx._evalTo = nb;
            if (!this.condition.eval(ctx)) continue;
          } else {
            if ((cells[nb] ?? 0) === 0) continue;
          }
          // @java covered pieces (occupied Upward neighbour) are not part of
          // the visible group.
          if (covered(nb)) continue;
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

