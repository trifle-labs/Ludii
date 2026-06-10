// @java Core/src/game/functions/ints/size/connection/SizeGroup.java

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game } from "../../../../../Game.js";

export class SizeGroup implements IntFunction {
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
        const g = ctx.game as unknown as Game;
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
