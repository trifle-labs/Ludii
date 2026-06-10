/**
 * SizesGroup1to1.ts
 * @java game/functions/intArray/sizes/group/SizesGroup.java
 * @java game/functions/intArray/sizes/Sizes.java
 *
 * (sizes Group [<directions>] [<role>] [of:<int>] [If:<bool>] [min:<int>])
 * Returns an array of the sizes of all connected groups matching the given criteria.
 */

import type { Context } from "../../../../../context.js";
import type { EvalScratch } from "../../../../base.js";
import type { IntArrayFunction, BooleanFunction, IntFunction } from "../../../../base.js";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import { isIdent } from "@ludii/typescript-language";
import type { LudNode, LudList } from "@ludii/typescript-language";
import { registerIntArray1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import {
  compileBool1to1,
  compileInt1to1,
  parseArgs1to1,
} from "../../../../../compiler1to1.js";
import type { Game1to1 } from "../../../../Game1to1.js";

function getNeighbours(ctx: Context, site: number, dirName: string): number[] {
  const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
  const traj = ctxAny._trajectories;
  if (traj) {
    return traj.group(site, dirName);
  }
  // fallback: rectangular grid adjacency
  const g = ctx.game as unknown as Game1to1;
  const W = g.equipment.board.width;
  const H = g.equipment.board.height;
  const col = site % W;
  const row = Math.floor(site / W);
  const nb: number[] = [];
  // Orthogonal neighbours always
  if (col > 0) nb.push(site - 1);
  if (col < W - 1) nb.push(site + 1);
  if (row > 0) nb.push(site - W);
  if (row < H - 1) nb.push(site + W);
  // Diagonal neighbours for Adjacent/Diagonal
  if (dirName !== "Orthogonal") {
    if (col > 0 && row > 0) nb.push(site - W - 1);
    if (col < W - 1 && row > 0) nb.push(site - W + 1);
    if (col > 0 && row < H - 1) nb.push(site + W - 1);
    if (col < W - 1 && row < H - 1) nb.push(site + W + 1);
  }
  return nb;
}

export class SizesGroup1to1 implements IntArrayFunction {
  /** @java game/functions/intArray/sizes/group/SizesGroup.java — eval(Context) */
  constructor(
    private readonly whoFn: IntFunction,
    private readonly minFn: IntFunction,
    private readonly condition: BooleanFunction | null,
    private readonly allPieces: boolean,
    private readonly dirName: string,
  ) {}

  public eval(ctx: Context & EvalScratch): number[] {
    // @java SizesGroup.java:103-270 (simplified: no 3D visibility checks)
    const cells = ctx.state.cells;
    const g = ctx.game as unknown as Game1to1;
    const boardN = g.equipment ? g.equipment.board.numSites : cells.length;
    const who = this.whoFn.eval(ctx);
    const min = this.minFn.eval(ctx);

    const sizes: number[] = [];
    const sitesChecked = new Set<number>();

    // Collect candidate sites
    const sitesToCheck: number[] = [];
    if (this.allPieces) {
      for (let i = 0; i < boardN; i++) {
        if ((cells[i] ?? 0) !== 0) sitesToCheck.push(i);
      }
    } else {
      for (let i = 0; i < boardN; i++) {
        if ((cells[i] ?? 0) === who) sitesToCheck.push(i);
      }
    }

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;

    for (const from of sitesToCheck) {
      if (sitesChecked.has(from)) continue;

      ctx._evalFrom = from;

      const includeFrom = this.allPieces
        ? (cells[from] ?? 0) !== 0
        : (this.condition !== null
            ? this.condition.eval(ctx)
            : (cells[from] ?? 0) === who);

      if (!includeFrom) continue;

      // BFS to find connected group
      const groupSites: number[] = [from];
      const explored = new Set<number>([from]);
      let i = 0;
      while (i < groupSites.length) {
        const site = groupSites[i]!;
        ctx._evalFrom = site;
        const neighbours = getNeighbours(ctx, site, this.dirName);
        for (const nb of neighbours) {
          if (explored.has(nb)) continue;
          explored.add(nb);
          ctx._evalTo = nb;
          const includeNb = this.allPieces
            ? (cells[nb] ?? 0) !== 0
            : (this.condition !== null
                ? this.condition.eval(ctx)
                : (cells[nb] ?? 0) === who);
          if (includeNb) groupSites.push(nb);
        }
        i++;
      }

      if (groupSites.length >= min) {
        sizes.push(groupSites.length);
      }

      for (const s of groupSites) sitesChecked.add(s);
    }

    ctx._evalFrom = origFrom;
    ctx._evalTo = origTo;
    return sizes;
  }
}

