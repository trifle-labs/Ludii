/**
 * Size1to1.ts
 *
 * Faithful 1:1 ports of size int ludemes:
 *   SizeGroup, SizeStack (SizeArray), SizeBoard
 *
 * @java game/functions/ints/size/connection/SizeGroup.java
 * @java game/functions/ints/size/site/SizeStack.java
 * @java game/functions/ints/size/array/SizeArray.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import { registerInt1to1, type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1 } from "../../../../../compiler1to1.js";

// ---------------------------------------------------------------------------
// SizeGroup
// ---------------------------------------------------------------------------
export class SizeGroup1to1 implements IntFunction {
  private readonly siteFn: IntFunction;
  private readonly dirName: string;

  public constructor(siteFn: IntFunction, dirName = "Adjacent") {
    this.siteFn = siteFn;
    this.dirName = dirName;
  }

  /**
   * @java game/functions/ints/size/connection/SizeGroup.java — eval:
   * BFS flood-fill of same-owner pieces from start site.
   */
  public eval(ctx: Context): number {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return 0;
    const cells = ctx.state.cells;
    const owner = cells[site] ?? 0;
    if (owner === 0) return 0;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    const visited = new Set<number>([site]);
    const stack = [site];
    while (stack.length > 0) {
      const s = stack.pop()!;
      let neighbours: number[];
      if (traj) {
        neighbours = traj.group(s, this.dirName);
      } else {
        const g = ctx.game as unknown as Game1to1;
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
        if (!visited.has(nb) && (cells[nb] ?? 0) === owner) {
          visited.add(nb);
          stack.push(nb);
        }
      }
    }
    return visited.size;
  }
}

// ---------------------------------------------------------------------------
// SizeStack  (stack depth at site)
// ---------------------------------------------------------------------------
export class SizeStack1to1 implements IntFunction {
  private readonly siteFn: IntFunction;

  public constructor(siteFn: IntFunction) {
    this.siteFn = siteFn;
  }

  /** @java game/functions/ints/size/site/SizeStack.java — eval: state.stateStack(site).size() */
  public eval(ctx: Context): number {
    const s = this.siteFn.eval(ctx);
    if (s < 0) return 0;
    // stackSize returns the true stack height (max of stacks[s].length, countAt[s], 1 if occupied)
    // @java ContainerState.sizeStack(site) — used by (size Stack at:site)
    return ctx.state.stackSize(s);
  }
}

// ---------------------------------------------------------------------------
// SizeArray  (size of a region/array)
// ---------------------------------------------------------------------------
export class SizeArray1to1 implements IntFunction {
  private readonly regionFn: RegionFunction;

  public constructor(regionFn: RegionFunction) {
    this.regionFn = regionFn;
  }

  /** @java game/functions/ints/size/array/SizeArray.java — eval: array.eval(context).length */
  public eval(ctx: Context): number {
    return this.regionFn.eval(ctx).length;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

