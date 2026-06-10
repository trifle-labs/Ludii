/**
 * SitesPerimeter.ts
 * @java game/functions/region/sites/simple/SitesPerimeter.java
 *
 * (sites Perimeter) — returns all perimeter (outer boundary) sites of the board.
 *
 * Java parity: SitesPerimeter.eval(context) returns graph.perimeter(realType).
 * For square boards this matches the outer row/column cells (= Outer).
 * For graph boards, uses trajectories.perimeterSites().
 */

import type { Context } from "../../../../../../context.js";
import type { RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { Game1to1 } from "../../../../../Game1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

export class SitesPerimeter implements RegionFunction {
  /** @java game/functions/region/sites/simple/SitesPerimeter.java — eval(Context) */
  public eval(ctx: Context): number[] {
    // @java graph.perimeter(realType)
    const ctxT = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxT._trajectories;
    if (traj) {
      return traj.perimeterSites();
    }
    // Square board fallback: all cells on the boundary rows/columns
    const g = ctx.game as unknown as Game1to1;
    const W = g.equipment.board.width;
    const H = g.equipment.board.height;
    const sites = new Set<number>();
    for (let c = 0; c < W; c++) {
      sites.add(c);             // bottom row
      sites.add((H - 1) * W + c); // top row
    }
    for (let r = 0; r < H; r++) {
      sites.add(r * W);         // left column
      sites.add(r * W + (W - 1)); // right column
    }
    return [...sites].sort((a, b) => a - b);
  }
}

