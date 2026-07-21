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
  /** @java SizeGroup.condition — group membership predicate (If:). */
  private readonly condition: { eval(ctx: Context): boolean } | null;

  public constructor(
    siteFn: IntFunction,
    dirName = "Adjacent",
    condition: { eval(ctx: Context): boolean } | null = null,
  ) {
    this.siteFn = siteFn;
    this.dirName = dirName;
    this.condition = condition;
  }

  /**
   * @java game/functions/ints/size/connection/SizeGroup.java — eval:
   * condition-seeded flood from the start site. The SEED joins when the If:
   * condition holds there (or unconditionally without If:); EXPANSION admits a
   * neighbour when the condition holds at it, or — without If: — when it holds
   * the same COMPONENT (what) as the start site. There is NO owner gate: Java
   * happily measures groups of NEUTRAL pieces (Flower Shop's stalk-plant
   * scoring flooded from a neutral stalk with if:(= (id "Disc0") (what
   * at:(to)))) — the old owner-based flood returned 0 there, collapsing every
   * byScore to 0/0.
   */
  public eval(ctx: Context): number {
    const from = this.siteFn.eval(ctx);
    if (from < 0) return 0;
    const scratch = ctx as Context & { _evalFrom?: number; _evalTo?: number };
    const origFrom = scratch._evalFrom;
    const origTo = scratch._evalTo;
    const state = ctx.state;
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;

    // @java SizeGroup.eval — context.setTo(from); seed iff condition holds.
    scratch._evalTo = from;
    const group: number[] = [];
    if (this.condition === null || this.condition.eval(ctx)) group.push(from);
    const what = state.whatAtSite(from);
    const inGroup = new Set<number>(group);

    if (group.length > 0) {
      // @java SizeGroup.eval — context.setFrom(from) during expansion.
      scratch._evalFrom = from;
      let i = 0;
      while (i < group.length) {
        const s = group[i]!;
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
          if (inGroup.has(nb)) continue;
          scratch._evalTo = nb;
          // @java condition==null ? what(to)==what(from) : condition.eval(ctx)
          const joins = this.condition === null
            ? state.whatAtSite(nb) === what
            : this.condition.eval(ctx);
          if (joins) {
            inGroup.add(nb);
            group.push(nb);
          }
        }
        i += 1;
      }
    }

    scratch._evalTo = origTo;
    scratch._evalFrom = origFrom;
    return group.length;
  }
}
