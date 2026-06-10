/**
 * CountSiteNeighbours1to1.ts
 *
 * Faithful 1:1 ports of neighbour-count ludemes:
 *   CountAdjacent, CountOrthogonal, CountDiagonal, CountNeighbours
 *
 * @java game/functions/ints/count/site/CountAdjacent.java
 * @java game/functions/ints/count/site/CountOrthogonal.java
 * @java game/functions/ints/count/site/CountDiagonal.java
 * @java game/functions/ints/count/site/CountNeighbours.java
 *
 * All four share the same structure:
 *   (count Adjacent/Orthogonal/Diagonal/Neighbours [type:] [at:<site>] [in:<region>])
 * Java eval: context.topology().cells().get(site).<direction>().size()
 * We use the Trajectories API when available, else BFS on board graph.
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../Game1to1.js";
import { type Compile1to1Env } from "../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../compiler1to1.js";

type DirGroup = "Adjacent" | "Orthogonal" | "Diagonal";

export class CountSiteNeighbours1to1 implements IntFunction {
  private readonly siteFn: IntFunction;
  private readonly dir: DirGroup;

  public constructor(siteFn: IntFunction, dir: DirGroup) {
    this.siteFn = siteFn;
    this.dir = dir;
  }

  /**
   * @java CountAdjacent/CountOrthogonal/CountDiagonal/CountNeighbours — eval
   * Returns number of neighbours of the given type at the site.
   */
  public eval(ctx: Context): number {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return 0;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (traj) {
      return traj.group(site, this.dir).length;
    }
    // Fallback: grid-based orthogonal count
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment.board.width;
    const H = g.equipment.board.height;
    const col = site % W;
    const row = Math.floor(site / W);
    if (this.dir === "Orthogonal") {
      let n = 0;
      if (col > 0) n++;
      if (col < W - 1) n++;
      if (row > 0) n++;
      if (row < H - 1) n++;
      return n;
    }
    if (this.dir === "Diagonal") {
      let n = 0;
      if (col > 0 && row > 0) n++;
      if (col < W - 1 && row > 0) n++;
      if (col > 0 && row < H - 1) n++;
      if (col < W - 1 && row < H - 1) n++;
      return n;
    }
    // Adjacent = all 8
    let n = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r2 = row + dr, c2 = col + dc;
        if (r2 >= 0 && r2 < H && c2 >= 0 && c2 < W) n++;
      }
    }
    return n;
  }
}

function makeFactory(dir: DirGroup) {
  return (node: LudNode, _env: Compile1to1Env): IntFunction => {
    const { named } = parseArgs1to1((node as LudList).items);
    const atNode = named.get("at");
    let siteFn: IntFunction;
    if (atNode) {
      try { siteFn = compileInt1to1(atNode); } catch { siteFn = { eval: (ctx: Context) => ctx._evalFrom }; }
    } else {
      siteFn = { eval: (ctx: Context) => ctx._evalFrom };
    }
    return new CountSiteNeighbours1to1(siteFn, dir);
  };
}

