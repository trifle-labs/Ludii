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

    // @java CountSizeBiggestGroup.java:142-153,225-236 — isVisible covered
    // check: a piece is COVERED (invisible) iff some HIGHER-INDEXED site with
    // the SAME centroid (x, y) is occupied — the ball directly above in the
    // same vertical column of the pyramid (two layers up on Shibumi), NOT any
    // occupied Upward pocket-neighbour. The old Upward-step check excluded a
    // ball as soon as ANY ball rested on one of its four pockets, so Spaiji /
    // Spaji visible-group sizes were wrong. On flat boards no two sites share
    // a centroid, so this is a no-op for isVisible-less games.
    const isVisActive = this.isVisibleFn !== null && this.isVisibleFn.eval(ctx);
    const EPS = 1e-9;
    const covered = (site: number): boolean => {
      if (!isVisActive || !traj) return false;
      const sx = traj.xOf(site);
      const sy = traj.yOf(site);
      for (let t = site + 1; t < boardN; t += 1) {
        if (ctx.state.whatAtSite(t) === 0) continue;
        if (Math.abs(traj.xOf(t) - sx) < EPS && Math.abs(traj.yOf(t) - sy) < EPS) return true;
      }
      return false;
    };
    // @java CountSizeBiggestGroup.java:172-217,237 — the VISUAL-CONNECTION
    // blocker: expanding from `s` to `nb` is skipped when the two sites share
    // >= 2 occupied Upward-step neighbours (a pair of balls sitting across the
    // seam hides the connection between the two balls below).
    const occupiedUpward = (site: number): number[] => {
      if (!isVisActive || !traj || typeof traj.steps !== "function") return [];
      const out: number[] = [];
      for (const up of traj.steps(site, "Upward")) {
        if (up >= 0 && ctx.state.whatAtSite(up) !== 0) out.push(up);
      }
      return out;
    };
    const connectionHidden = (a: number, b: number): boolean => {
      if (!isVisActive) return false;
      const upA = occupiedUpward(a);
      if (upA.length < 2) return false;
      const upB = occupiedUpward(b);
      let shared = 0;
      for (const u of upB) if (upA.includes(u)) shared += 1;
      return shared >= 2;
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
          // @java CountSizeBiggestGroup.java:225-241 — covered pieces are not
          // part of the visible group, and a connection whose seam is hidden
          // by >= 2 shared occupied Upward neighbours does not link the group.
          if (covered(nb)) continue;
          if (connectionHidden(s, nb)) continue;
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

